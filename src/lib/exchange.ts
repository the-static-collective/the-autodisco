import { PAIR_LISTEN_VERSION } from "./pairListen";
import { parseLedgerEventId } from "./stationPacket";

export const EXCHANGE_VERSION = "autodisco-exchange/0.1" as const;

export type ExchangeFirstResponse = {
  receipt_uri: string;
  session_id: string;
  listener_slot: "A" | "B";
  listener_label: string;
  text: string;
  mode: "INTERPRETATION";
  sealed: true;
  station_receipt_uri: string;
  station_packet_hash: string;
};

export type ExchangeDescriptor = {
  version: typeof EXCHANGE_VERSION;
  pair_ready_receipt_uri: string;
  pair_event_id: string;
  station_parent_event_id: string;
  first_responses: [ExchangeFirstResponse, ExchangeFirstResponse];
  broadcast_status: "NOT_BROADCAST";
};

export type ExchangeValidation =
  | { state: "REFUSED"; errors: string[]; descriptor: null }
  | { state: "OPENABLE"; errors: []; descriptor: ExchangeDescriptor };

type LedgerEventLike = {
  id?: unknown;
  content?: unknown;
  metadata?: unknown;
};

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseFirstResponse(event: LedgerEventLike, pairEventId: string): ExchangeFirstResponse | null {
  const id = nonEmptyString(event?.id);
  const content = record(event?.content);
  const metadata = record(event?.metadata);

  if (
    !id ||
    content?.kind !== "AUTODISCO_FIRST_RESPONSE_SEALED" ||
    content?.mode !== "INTERPRETATION" ||
    content?.sealed !== true ||
    content?.broadcast_status !== "NOT_BROADCAST" ||
    metadata?.source !== "autodisco_pair_listen" ||
    metadata?.pair_listen_version !== PAIR_LISTEN_VERSION ||
    metadata?.parent_event_id !== pairEventId
  ) {
    return null;
  }

  const sessionId = nonEmptyString(content.session_id);
  const slot = content.listener_slot;
  const label = nonEmptyString(content.listener_label);
  const text = nonEmptyString(content.text);
  const stationReceiptUri = nonEmptyString(content.station_receipt_uri);
  const stationPacketHash = nonEmptyString(content.station_packet_hash);

  if (
    !sessionId ||
    (slot !== "A" && slot !== "B") ||
    !label ||
    !text ||
    !stationReceiptUri ||
    !parseLedgerEventId(stationReceiptUri) ||
    !stationPacketHash ||
    !/^[0-9a-f]{64}$/i.test(stationPacketHash)
  ) {
    return null;
  }

  return {
    receipt_uri: `ledger://events/${id}`,
    session_id: sessionId,
    listener_slot: slot,
    listener_label: label,
    text,
    mode: "INTERPRETATION",
    sealed: true,
    station_receipt_uri: stationReceiptUri,
    station_packet_hash: stationPacketHash.toLowerCase(),
  };
}

export function validateExchangeSource(
  readyEvent: LedgerEventLike,
  firstResponseEvents: LedgerEventLike[],
): ExchangeValidation {
  const errors: string[] = [];
  const readyId = nonEmptyString(readyEvent?.id);
  const content = record(readyEvent?.content);
  const metadata = record(readyEvent?.metadata);

  if (!readyId) errors.push("pair-ready receipt event id is required");
  if (!content) {
    return { state: "REFUSED", errors: [...errors, "pair-ready receipt content is missing"], descriptor: null };
  }

  if (content.kind !== "AUTODISCO_PAIR_READY_FOR_EXCHANGE") {
    errors.push("source event must be AUTODISCO_PAIR_READY_FOR_EXCHANGE");
  }
  if (content.mode !== "OBSERVED") {
    errors.push("pair-ready receipt must preserve mode OBSERVED");
  }
  if (content.broadcast_status !== "NOT_BROADCAST") {
    errors.push("pair-ready receipt must preserve broadcast_status NOT_BROADCAST");
  }
  if (metadata?.source !== "autodisco_pair_listen") {
    errors.push("source event was not emitted by Pair Listen");
  }
  if (metadata?.pair_listen_version !== PAIR_LISTEN_VERSION) {
    errors.push("source Pair Listen version is not recognized");
  }

  const pairEventId = nonEmptyString(content.pair_event_id);
  const stationParentEventId = nonEmptyString(metadata?.station_parent_event_id);
  if (!pairEventId) errors.push("pair-ready receipt must identify its pair event");
  if (!stationParentEventId) errors.push("pair-ready receipt must preserve station ancestry");

  const refs = Array.isArray(content.first_response_receipts)
    ? content.first_response_receipts
        .map((value) => parseLedgerEventId(value))
        .filter((value): value is string => !!value)
    : [];

  if (refs.length !== 2 || new Set(refs).size !== 2) {
    errors.push("pair-ready receipt must reference exactly two distinct first responses");
  }

  if (!pairEventId) {
    return { state: "REFUSED", errors, descriptor: null };
  }

  const byId = new Map(
    firstResponseEvents
      .map((event) => [nonEmptyString(event?.id), event] as const)
      .filter((entry): entry is [string, LedgerEventLike] => !!entry[0]),
  );

  const parsed = refs.map((id) => {
    const event = byId.get(id);
    return event ? parseFirstResponse(event, pairEventId) : null;
  });

  if (parsed.some((response) => !response)) {
    errors.push("every referenced first response must exist, be sealed, and belong to the same pair");
  }

  const responses = parsed.filter((response): response is ExchangeFirstResponse => !!response);

  if (responses.length === 2) {
    if (responses[0].listener_slot === responses[1].listener_slot) {
      errors.push("first responses must come from distinct listener slots");
    }
    if (responses[0].session_id === responses[1].session_id) {
      errors.push("first responses must come from distinct sessions");
    }
    if (responses[0].station_receipt_uri !== responses[1].station_receipt_uri) {
      errors.push("first responses must share the same station receipt");
    }
    if (responses[0].station_packet_hash !== responses[1].station_packet_hash) {
      errors.push("first responses must share the same station packet hash");
    }
  }

  if (errors.length > 0 || !readyId || !pairEventId || !stationParentEventId || responses.length !== 2) {
    return { state: "REFUSED", errors, descriptor: null };
  }

  const responseA = responses.find((response) => response.listener_slot === "A");
  const responseB = responses.find((response) => response.listener_slot === "B");
  if (!responseA || !responseB) {
    return {
      state: "REFUSED",
      errors: ["exchange requires one sealed response from listener A and one from listener B"],
      descriptor: null,
    };
  }

  return {
    state: "OPENABLE",
    errors: [],
    descriptor: {
      version: EXCHANGE_VERSION,
      pair_ready_receipt_uri: `ledger://events/${readyId}`,
      pair_event_id: pairEventId,
      station_parent_event_id: stationParentEventId,
      first_responses: [responseA, responseB],
      broadcast_status: "NOT_BROADCAST",
    },
  };
}

export function exchangeSession(
  descriptor: ExchangeDescriptor,
  sessionId: unknown,
): ExchangeFirstResponse | null {
  if (typeof sessionId !== "string") return null;
  return descriptor.first_responses.find((response) => response.session_id === sessionId) ?? null;
}

export function exchangeClosed(
  descriptor: ExchangeDescriptor,
  repliedSessionIds: Iterable<string>,
): boolean {
  const replied = new Set(repliedSessionIds);
  return descriptor.first_responses.every((response) => replied.has(response.session_id));
}
