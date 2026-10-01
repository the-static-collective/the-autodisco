import {
  AUTODISCO_STATION_PACKET_VERSION,
  parseLedgerEventId,
  type StationPacket,
} from "./stationPacket";
import type { ReleasePermissions } from "./releaseGate";

export const VOICE_RENDER_VERSION = "autodisco-voice-render-request/0.1" as const;

export type VoiceRenderKind = "GENERIC_NARRATION" | "HUMAN_VOICE_SYNTHESIS";

export type VoiceRenderRequest = {
  version: typeof VOICE_RENDER_VERSION;
  source_receipt_uri: string;
  source_text_hash: string;
  render_kind: VoiceRenderKind;
  requested_voice: {
    label: string | null;
  };
  inherited_permissions: ReleasePermissions;
  station_receipt_uri: string;
  station_packet_hash: string;
  status: "ADMITTED";
};

export type VoiceRenderValidation =
  | {
      state: "REFUSED";
      errors: string[];
      request: null;
      inherited_permissions: ReleasePermissions | null;
    }
  | {
      state: "ADMITTED";
      errors: [];
      request: VoiceRenderRequest;
      inherited_permissions: ReleasePermissions;
    };

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

function completePermissions(value: unknown): ReleasePermissions | null {
  const permissions = record(value);
  if (!permissions) return null;

  const keys = [
    "authorized",
    "broadcast",
    "edit",
    "synthetic_voice",
    "training",
    "commercial",
  ] as const;

  if (!keys.every((key) => typeof permissions[key] === "boolean")) return null;

  return {
    authorized: permissions.authorized as boolean,
    broadcast: permissions.broadcast as boolean,
    edit: permissions.edit as boolean,
    synthetic_voice: permissions.synthetic_voice as boolean,
    training: permissions.training as boolean,
    commercial: permissions.commercial as boolean,
  };
}

function stationPacket(value: unknown): StationPacket | null {
  const packet = record(value);
  if (!packet || packet.version !== AUTODISCO_STATION_PACKET_VERSION) return null;

  const source = record(packet.source);
  const permissions = completePermissions(packet.permissions);
  const memory = record(packet.memory);

  if (
    !source ||
    !permissions ||
    !memory ||
    packet.role !== "human_interstitial" ||
    !nonEmptyString(source.artifact_sha256) ||
    !nonEmptyString(source.performer_label) ||
    memory.catalog_access !== false ||
    memory.prior_broadcast_access !== false
  ) {
    return null;
  }

  return value as StationPacket;
}

export function validateVoiceRenderRequest(
  sourceEvent: LedgerEventLike,
  stationEvent: LedgerEventLike,
  renderKind: unknown,
  requestedVoiceLabel: unknown,
  sourceTextHash: string,
  stationPacketHash: string,
): VoiceRenderValidation {
  const errors: string[] = [];
  const sourceId = nonEmptyString(sourceEvent?.id);
  const sourceContent = record(sourceEvent?.content);
  const sourceMetadata = record(sourceEvent?.metadata);
  const stationContent = record(stationEvent?.content);
  const stationMetadata = record(stationEvent?.metadata);

  if (!sourceId) errors.push("source contribution receipt id is required");
  if (!sourceContent) errors.push("source contribution content is missing");

  const kind = sourceContent?.kind;
  const firstResponse =
    kind === "AUTODISCO_FIRST_RESPONSE_SEALED" &&
    sourceContent?.mode === "INTERPRETATION" &&
    sourceContent?.sealed === true &&
    sourceMetadata?.source === "autodisco_pair_listen";

  const exchangeReply =
    kind === "AUTODISCO_EXCHANGE_REPLY" &&
    sourceContent?.mode === "INTERPRETATION" &&
    sourceMetadata?.source === "autodisco_exchange";

  if (!firstResponse && !exchangeReply) {
    errors.push("source contribution must be a sealed first response or exchange reply");
  }
  if (sourceContent?.broadcast_status !== "NOT_BROADCAST") {
    errors.push("source contribution must remain NOT_BROADCAST");
  }

  const sourceText = nonEmptyString(sourceContent?.text);
  if (!sourceText) errors.push("source contribution text is required");

  const sourceStationUri = nonEmptyString(sourceContent?.station_receipt_uri);
  const sourceStationId = sourceStationUri ? parseLedgerEventId(sourceStationUri) : null;
  if (!sourceStationId) errors.push("source contribution must preserve a valid station receipt URI");

  const sourcePacketHash = nonEmptyString(sourceContent?.station_packet_hash);
  if (!sourcePacketHash || !/^[0-9a-f]{64}$/i.test(sourcePacketHash)) {
    errors.push("source contribution must preserve a full station packet hash");
  }

  const stationId = nonEmptyString(stationEvent?.id);
  if (!stationId || stationId !== sourceStationId) {
    errors.push("resolved station receipt does not match source contribution ancestry");
  }
  if (stationContent?.kind !== "AUTODISCO_STATION_PACKET_ASSEMBLED") {
    errors.push("resolved station receipt must be AUTODISCO_STATION_PACKET_ASSEMBLED");
  }
  if (stationContent?.mode !== "OBSERVED" || stationContent?.broadcast_status !== "NOT_BROADCAST") {
    errors.push("resolved station receipt must remain OBSERVED and NOT_BROADCAST");
  }
  if (
    stationMetadata?.source !== "autodisco_broadcast_gate" ||
    stationMetadata?.station_packet_version !== AUTODISCO_STATION_PACKET_VERSION
  ) {
    errors.push("resolved station receipt was not emitted by the recognized Broadcast Gate");
  }

  const packet = stationPacket(stationContent?.packet);
  const permissions = packet ? completePermissions(packet.permissions) : null;
  if (!packet || !permissions) {
    errors.push("resolved station packet or permission envelope is malformed");
  } else {
    if (permissions.authorized !== true) errors.push("inherited release authorization is not true");
    if (permissions.broadcast !== true) errors.push("inherited broadcast authorization is not true");
  }

  if (!/^[0-9a-f]{64}$/i.test(sourceTextHash)) {
    errors.push("source text hash must be a full SHA-256");
  }
  if (!/^[0-9a-f]{64}$/i.test(stationPacketHash)) {
    errors.push("resolved station packet hash must be a full SHA-256");
  }
  if (sourcePacketHash && sourcePacketHash.toLowerCase() !== stationPacketHash.toLowerCase()) {
    errors.push("resolved station packet hash does not match source contribution ancestry");
  }

  if (renderKind !== "GENERIC_NARRATION" && renderKind !== "HUMAN_VOICE_SYNTHESIS") {
    errors.push("render_kind must be GENERIC_NARRATION or HUMAN_VOICE_SYNTHESIS");
  }

  const voiceLabel = nonEmptyString(requestedVoiceLabel) ?? null;
  if (renderKind === "GENERIC_NARRATION" && voiceLabel) {
    errors.push("generic narration cannot claim or imply a specific human voice identity");
  }

  if (renderKind === "HUMAN_VOICE_SYNTHESIS") {
    if (!voiceLabel) errors.push("human voice synthesis requires a requested voice label");
    if (permissions?.synthetic_voice !== true) {
      errors.push("human voice synthesis requires inherited synthetic_voice permission to be explicitly true");
    }
  }

  if (
    errors.length > 0 ||
    !sourceId ||
    !sourceText ||
    !sourceStationUri ||
    !sourcePacketHash ||
    !permissions ||
    (renderKind !== "GENERIC_NARRATION" && renderKind !== "HUMAN_VOICE_SYNTHESIS")
  ) {
    return {
      state: "REFUSED",
      errors,
      request: null,
      inherited_permissions: permissions,
    };
  }

  return {
    state: "ADMITTED",
    errors: [],
    inherited_permissions: { ...permissions },
    request: {
      version: VOICE_RENDER_VERSION,
      source_receipt_uri: `ledger://events/${sourceId}`,
      source_text_hash: sourceTextHash.toLowerCase(),
      render_kind: renderKind,
      requested_voice: {
        label: voiceLabel,
      },
      inherited_permissions: { ...permissions },
      station_receipt_uri: sourceStationUri,
      station_packet_hash: sourcePacketHash.toLowerCase(),
      status: "ADMITTED",
    },
  };
}
