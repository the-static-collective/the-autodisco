import { BROADCAST_RECEIPT_VERSION } from "./broadcastReceipt";
import { parseLedgerEventId } from "./stationPacket";

export const LISTENER_RETURN_VERSION = "listener-return/0.1" as const;

export type ListenerReturnKind = "TEXT" | "AUDIO";

export type ListenerReturnPacket = {
  version: typeof LISTENER_RETURN_VERSION;
  source: "AUTODISCO_BROADCAST";
  broadcast_receipt_uri: string;
  lineage: {
    source_receipt_uri: string;
    station_receipt_uri: string;
    release_receipt_uri: string;
  };
  listener: {
    label: string;
  };
  response:
    | {
        kind: "TEXT";
        text: string;
        artifact_sha256: null;
        filename: null;
      }
    | {
        kind: "AUDIO";
        text: null;
        artifact_sha256: string;
        filename: string | null;
      };
  captured_at: string;
  semantic_effect: "none";
};

export type ListenerReturnValidation =
  | { state: "REFUSED"; errors: string[]; packet: null }
  | { state: "CAPTURABLE"; errors: []; packet: ListenerReturnPacket };

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

function isoDate(value: unknown): string | null {
  const text = nonEmptyString(value);
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

export function validateListenerReturn(
  broadcastEvent: LedgerEventLike,
  input: {
    listenerLabel?: unknown;
    responseKind?: unknown;
    text?: unknown;
    artifactSha256?: unknown;
    filename?: unknown;
    capturedAt?: unknown;
  },
): ListenerReturnValidation {
  const errors: string[] = [];
  const eventId = nonEmptyString(broadcastEvent?.id);
  const content = record(broadcastEvent?.content);
  const metadata = record(broadcastEvent?.metadata);

  if (!eventId) errors.push("broadcast receipt event id is required");
  if (!content) {
    return {
      state: "REFUSED",
      errors: [...errors, "broadcast receipt content is missing"],
      packet: null,
    };
  }

  if (content.kind !== "AUTODISCO_BROADCAST_RECORDED") {
    errors.push("source event must be AUTODISCO_BROADCAST_RECORDED");
  }
  if (content.mode !== "OBSERVED") {
    errors.push("broadcast receipt must preserve mode OBSERVED");
  }
  if (content.broadcast_status !== "BROADCAST_RECORDED") {
    errors.push("broadcast receipt must preserve broadcast_status BROADCAST_RECORDED");
  }
  if (metadata?.source !== "autodisco_broadcast_receipt") {
    errors.push("source event was not emitted by Broadcast Receipt");
  }
  if (metadata?.broadcast_receipt_version !== BROADCAST_RECEIPT_VERSION) {
    errors.push("source Broadcast Receipt version is not recognized");
  }

  const sourceReceiptUri = nonEmptyString(content.source_receipt_uri);
  const stationReceiptUri = nonEmptyString(content.station_receipt_uri);
  const releaseReceiptUri = nonEmptyString(content.release_receipt_uri);

  if (!sourceReceiptUri || !parseLedgerEventId(sourceReceiptUri)) {
    errors.push("broadcast receipt must preserve a valid source receipt URI");
  }
  if (!stationReceiptUri || !parseLedgerEventId(stationReceiptUri)) {
    errors.push("broadcast receipt must preserve a valid station receipt URI");
  }
  if (!releaseReceiptUri || !parseLedgerEventId(releaseReceiptUri)) {
    errors.push("broadcast receipt must preserve a valid release receipt URI");
  }

  const listenerLabel = nonEmptyString(input.listenerLabel);
  if (!listenerLabel) errors.push("listener attribution is required");

  const capturedAt = isoDate(input.capturedAt);
  if (!capturedAt) errors.push("captured_at must be a valid timestamp");

  const responseKind = input.responseKind;
  if (responseKind !== "TEXT" && responseKind !== "AUDIO") {
    errors.push("response kind must be TEXT or AUDIO");
  }

  let response: ListenerReturnPacket["response"] | null = null;

  if (responseKind === "TEXT") {
    const rawText = typeof input.text === "string" ? input.text : "";
    if (!rawText.trim()) {
      errors.push("text response must contain non-whitespace text");
    } else {
      response = {
        kind: "TEXT",
        text: rawText,
        artifact_sha256: null,
        filename: null,
      };
    }
  }

  if (responseKind === "AUDIO") {
    const artifactSha256 = nonEmptyString(input.artifactSha256);
    if (!artifactSha256 || !/^[0-9a-f]{64}$/i.test(artifactSha256)) {
      errors.push("audio response requires a full artifact SHA-256");
    } else {
      response = {
        kind: "AUDIO",
        text: null,
        artifact_sha256: artifactSha256.toLowerCase(),
        filename: nonEmptyString(input.filename) ?? null,
      };
    }
  }

  if (
    errors.length > 0 ||
    !eventId ||
    !sourceReceiptUri ||
    !stationReceiptUri ||
    !releaseReceiptUri ||
    !listenerLabel ||
    !capturedAt ||
    !response
  ) {
    return { state: "REFUSED", errors, packet: null };
  }

  return {
    state: "CAPTURABLE",
    errors: [],
    packet: {
      version: LISTENER_RETURN_VERSION,
      source: "AUTODISCO_BROADCAST",
      broadcast_receipt_uri: `ledger://events/${eventId}`,
      lineage: {
        source_receipt_uri: sourceReceiptUri,
        station_receipt_uri: stationReceiptUri,
        release_receipt_uri: releaseReceiptUri,
      },
      listener: {
        label: listenerLabel,
      },
      response,
      captured_at: capturedAt,
      semantic_effect: "none",
    },
  };
}
