import { AUTODISCO_STATION_PACKET_VERSION, type StationPacket } from "./stationPacket";

export const PAIR_LISTEN_VERSION = "autodisco-pair-listen/0.1" as const;

export type PairListenSession = {
  slot: "A" | "B";
  session_id: string;
  listener_label: string;
  catalog_access: false;
  prior_broadcast_access: false;
};

export type PairListenDescriptor = {
  version: typeof PAIR_LISTEN_VERSION;
  station_receipt_uri: string;
  station_packet_hash: string;
  station_packet: StationPacket;
  sessions: [PairListenSession, PairListenSession];
};

export type PairListenValidation =
  | { state: "REFUSED"; errors: string[]; descriptor: null }
  | { state: "OPENABLE"; errors: []; descriptor: PairListenDescriptor };

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

function bool(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function stationPacket(value: unknown): StationPacket | null {
  const packet = record(value);
  if (!packet || packet.version !== AUTODISCO_STATION_PACKET_VERSION) return null;

  const source = record(packet.source);
  const permissions = record(packet.permissions);
  const memory = record(packet.memory);

  if (
    !source ||
    !permissions ||
    !memory ||
    packet.role !== "human_interstitial" ||
    !nonEmptyString(source.artifact_sha256) ||
    !nonEmptyString(source.performer_label)
  ) {
    return null;
  }

  const permissionKeys = [
    "authorized",
    "broadcast",
    "edit",
    "synthetic_voice",
    "training",
    "commercial",
  ] as const;

  if (!permissionKeys.every((key) => bool(permissions[key]))) return null;
  if (memory.catalog_access !== false || memory.prior_broadcast_access !== false) return null;

  return value as StationPacket;
}

export function validatePairListenSource(
  event: LedgerEventLike,
  listenerA: unknown,
  listenerB: unknown,
  sessionA: string,
  sessionB: string,
  stationPacketHash: string,
): PairListenValidation {
  const errors: string[] = [];
  const eventId = nonEmptyString(event?.id);
  const content = record(event?.content);
  const metadata = record(event?.metadata);
  const labelA = nonEmptyString(listenerA);
  const labelB = nonEmptyString(listenerB);

  if (!eventId) errors.push("station receipt event id is required");
  if (!content) {
    return { state: "REFUSED", errors: [...errors, "station receipt content is missing"], descriptor: null };
  }

  if (content.kind !== "AUTODISCO_STATION_PACKET_ASSEMBLED") {
    errors.push("source event must be AUTODISCO_STATION_PACKET_ASSEMBLED");
  }
  if (content.mode !== "OBSERVED") {
    errors.push("station receipt must preserve mode OBSERVED");
  }
  if (content.broadcast_status !== "NOT_BROADCAST") {
    errors.push("station receipt must preserve broadcast_status NOT_BROADCAST");
  }
  if (metadata?.source !== "autodisco_broadcast_gate") {
    errors.push("source event was not emitted by Broadcast Gate");
  }
  if (metadata?.station_packet_version !== AUTODISCO_STATION_PACKET_VERSION) {
    errors.push("source station packet version is not recognized");
  }

  const packet = stationPacket(content.packet);
  if (!packet) errors.push("source station packet is malformed or exceeds first-listen memory bounds");

  if (!labelA) errors.push("listener A label is required");
  if (!labelB) errors.push("listener B label is required");
  if (!sessionA || !sessionB || sessionA === sessionB) {
    errors.push("pair listen requires two distinct session IDs");
  }
  if (!/^[0-9a-f]{64}$/i.test(stationPacketHash)) {
    errors.push("station packet hash must be a full SHA-256");
  }

  if (errors.length > 0 || !eventId || !packet || !labelA || !labelB) {
    return { state: "REFUSED", errors, descriptor: null };
  }

  return {
    state: "OPENABLE",
    errors: [],
    descriptor: {
      version: PAIR_LISTEN_VERSION,
      station_receipt_uri: `ledger://events/${eventId}`,
      station_packet_hash: stationPacketHash.toLowerCase(),
      station_packet: packet,
      sessions: [
        {
          slot: "A",
          session_id: sessionA,
          listener_label: labelA,
          catalog_access: false,
          prior_broadcast_access: false,
        },
        {
          slot: "B",
          session_id: sessionB,
          listener_label: labelB,
          catalog_access: false,
          prior_broadcast_access: false,
        },
      ],
    },
  };
}

export function pairReady(
  descriptor: PairListenDescriptor,
  sealedSessionIds: Iterable<string>,
): boolean {
  const sealed = new Set(sealedSessionIds);
  return descriptor.sessions.every((session) => sealed.has(session.session_id));
}

export function sessionFor(
  descriptor: PairListenDescriptor,
  sessionId: unknown,
): PairListenSession | null {
  if (typeof sessionId !== "string") return null;
  return descriptor.sessions.find((session) => session.session_id === sessionId) ?? null;
}


export function descriptorFromPairReceipt(event: LedgerEventLike): PairListenDescriptor | null {
  const content = record(event?.content);
  const metadata = record(event?.metadata);
  const descriptor = record(content?.descriptor);

  if (
    content?.kind !== "AUTODISCO_PAIR_LISTEN_OPENED" ||
    content?.mode !== "OBSERVED" ||
    content?.broadcast_status !== "NOT_BROADCAST" ||
    metadata?.source !== "autodisco_pair_listen" ||
    metadata?.pair_listen_version !== PAIR_LISTEN_VERSION ||
    !descriptor ||
    descriptor.version !== PAIR_LISTEN_VERSION ||
    !/^[0-9a-f]{64}$/i.test(nonEmptyString(descriptor.station_packet_hash) || "")
  ) {
    return null;
  }

  const packet = stationPacket(descriptor.station_packet);
  const sessions = Array.isArray(descriptor.sessions) ? descriptor.sessions : null;
  if (!packet || !sessions || sessions.length !== 2) return null;

  const parsedSessions = sessions.map((value) => {
    const item = record(value);
    const slot = item?.slot;
    const sessionId = nonEmptyString(item?.session_id);
    const label = nonEmptyString(item?.listener_label);
    if (
      (slot !== "A" && slot !== "B") ||
      !sessionId ||
      !label ||
      item?.catalog_access !== false ||
      item?.prior_broadcast_access !== false
    ) {
      return null;
    }

    return {
      slot: slot as PairListenSession["slot"],
      session_id: sessionId,
      listener_label: label,
      catalog_access: false as const,
      prior_broadcast_access: false as const,
    };
  });

  if (!parsedSessions[0] || !parsedSessions[1]) return null;
  if (parsedSessions[0].slot === parsedSessions[1].slot) return null;
  if (parsedSessions[0].session_id === parsedSessions[1].session_id) return null;

  const sessionA = parsedSessions.find((session) => session?.slot === "A");
  const sessionB = parsedSessions.find((session) => session?.slot === "B");
  if (!sessionA || !sessionB) return null;

  const stationReceiptUri = nonEmptyString(descriptor.station_receipt_uri);
  if (!stationReceiptUri) return null;

  return {
    version: PAIR_LISTEN_VERSION,
    station_receipt_uri: stationReceiptUri,
    station_packet_hash: String(descriptor.station_packet_hash).toLowerCase(),
    station_packet: packet,
    sessions: [sessionA, sessionB],
  };
}
