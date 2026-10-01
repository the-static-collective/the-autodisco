import { VOICE_RENDER_VERSION, type VoiceRenderRequest } from "./voiceRender";
import type { ReleasePermissions } from "./releaseGate";
import { parseLedgerEventId } from "./stationPacket";

export const VOICE_PROVIDER_VERSION = "autodisco-voice-provider/0.1" as const;

export const GENERIC_TTS_PROVIDER = {
  provider: "google-gemini",
  model: "gemini-3.8-flash-tts",
  model_version: "gemini-3.8-flash-tts",
  voice: "Kore",
  mime_type: "audio/wav",
} as const;

type LedgerEventLike = {
  id?: unknown;
  content?: unknown;
  metadata?: unknown;
};

export type VoiceProviderValidation =
  | { state: "REFUSED"; errors: string[]; request: null }
  | { state: "EXECUTABLE"; errors: []; request: VoiceRenderRequest };

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function permissions(value: unknown): ReleasePermissions | null {
  const item = record(value);
  if (!item) return null;

  const keys = [
    "authorized",
    "broadcast",
    "edit",
    "synthetic_voice",
    "training",
    "commercial",
  ] as const;

  if (!keys.every((key) => typeof item[key] === "boolean")) return null;

  return {
    authorized: item.authorized as boolean,
    broadcast: item.broadcast as boolean,
    edit: item.edit as boolean,
    synthetic_voice: item.synthetic_voice as boolean,
    training: item.training as boolean,
    commercial: item.commercial as boolean,
  };
}

export function validateVoiceProviderSource(event: LedgerEventLike): VoiceProviderValidation {
  const errors: string[] = [];
  const content = record(event?.content);
  const metadata = record(event?.metadata);

  if (!nonEmptyString(event?.id)) errors.push("voice render receipt id is required");
  if (!content) {
    return { state: "REFUSED", errors: [...errors, "voice render receipt content is missing"], request: null };
  }

  if (content.kind !== "AUTODISCO_VOICE_RENDER_REQUEST_ADMITTED") {
    errors.push("source event must be AUTODISCO_VOICE_RENDER_REQUEST_ADMITTED");
  }
  if (content.mode !== "OBSERVED") {
    errors.push("voice render receipt must preserve mode OBSERVED");
  }
  if (content.render_status !== "NOT_RENDERED") {
    errors.push("voice render receipt must preserve render_status NOT_RENDERED");
  }
  if (content.broadcast_status !== "NOT_BROADCAST") {
    errors.push("voice render receipt must preserve broadcast_status NOT_BROADCAST");
  }
  if (metadata?.source !== "autodisco_voice_render") {
    errors.push("source event was not emitted by Voice Render gate");
  }
  if (metadata?.voice_render_version !== VOICE_RENDER_VERSION) {
    errors.push("source Voice Render version is not recognized");
  }

  const raw = record(content.request);
  const inherited = permissions(raw?.inherited_permissions);
  const sourceReceiptUri = nonEmptyString(raw?.source_receipt_uri);
  const stationReceiptUri = nonEmptyString(raw?.station_receipt_uri);
  const sourceTextHash = nonEmptyString(raw?.source_text_hash);
  const stationPacketHash = nonEmptyString(raw?.station_packet_hash);
  const requestedVoice = record(raw?.requested_voice);
  const voiceLabel =
    requestedVoice?.label === null ? null : nonEmptyString(requestedVoice?.label) ?? null;

  if (raw?.version !== VOICE_RENDER_VERSION) errors.push("render request version is not recognized");
  if (raw?.status !== "ADMITTED") errors.push("render request status must be ADMITTED");
  if (!sourceReceiptUri || !parseLedgerEventId(sourceReceiptUri)) {
    errors.push("render request must preserve a valid source receipt URI");
  }
  if (!stationReceiptUri || !parseLedgerEventId(stationReceiptUri)) {
    errors.push("render request must preserve a valid station receipt URI");
  }
  if (!sourceTextHash || !/^[0-9a-f]{64}$/i.test(sourceTextHash)) {
    errors.push("render request must preserve a full source-text SHA-256");
  }
  if (!stationPacketHash || !/^[0-9a-f]{64}$/i.test(stationPacketHash)) {
    errors.push("render request must preserve a full station-packet SHA-256");
  }
  if (!inherited) errors.push("render request must preserve a complete permission envelope");
  if (inherited && (inherited.authorized !== true || inherited.broadcast !== true)) {
    errors.push("render request no longer carries authorized broadcast consideration");
  }

  const renderKind = raw?.render_kind;
  if (renderKind !== "GENERIC_NARRATION" && renderKind !== "HUMAN_VOICE_SYNTHESIS") {
    errors.push("render request kind is not recognized");
  }
  if (renderKind === "GENERIC_NARRATION" && voiceLabel) {
    errors.push("generic narration cannot carry a named human voice identity");
  }
  if (renderKind === "HUMAN_VOICE_SYNTHESIS") {
    if (!voiceLabel) errors.push("human voice synthesis request must preserve its requested identity");
    if (inherited?.synthetic_voice !== true) {
      errors.push("human voice synthesis no longer has explicit synthetic_voice permission");
    }
  }

  if (
    errors.length > 0 ||
    !sourceReceiptUri ||
    !stationReceiptUri ||
    !sourceTextHash ||
    !stationPacketHash ||
    !inherited ||
    (renderKind !== "GENERIC_NARRATION" && renderKind !== "HUMAN_VOICE_SYNTHESIS")
  ) {
    return { state: "REFUSED", errors, request: null };
  }

  return {
    state: "EXECUTABLE",
    errors: [],
    request: {
      version: VOICE_RENDER_VERSION,
      source_receipt_uri: sourceReceiptUri,
      source_text_hash: sourceTextHash.toLowerCase(),
      render_kind: renderKind,
      requested_voice: { label: voiceLabel },
      inherited_permissions: { ...inherited },
      station_receipt_uri: stationReceiptUri,
      station_packet_hash: stationPacketHash.toLowerCase(),
      status: "ADMITTED",
    },
  };
}

export function providerCapabilityErrors(request: VoiceRenderRequest): string[] {
  if (request.render_kind === "GENERIC_NARRATION") return [];

  return [
    "VOICE PROVIDER 001 has no enrolled identity-bound human voice provider; human voice synthesis is refused",
  ];
}

export function wavDurationMs(bytes: Uint8Array): number | null {
  if (bytes.length < 44) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (offset: number, length: number) =>
    String.fromCharCode(...bytes.slice(offset, offset + length));

  if (ascii(0, 4) !== "RIFF" || ascii(8, 4) !== "WAVE") return null;

  let offset = 12;
  let byteRate: number | null = null;
  let dataSize: number | null = null;

  while (offset + 8 <= bytes.length) {
    const chunkId = ascii(offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const bodyOffset = offset + 8;

    if (chunkId === "fmt " && chunkSize >= 16 && bodyOffset + 12 <= bytes.length) {
      byteRate = view.getUint32(bodyOffset + 8, true);
    } else if (chunkId === "data") {
      dataSize = Math.min(chunkSize, bytes.length - bodyOffset);
      break;
    }

    offset = bodyOffset + chunkSize + (chunkSize % 2);
  }

  if (!byteRate || dataSize === null) return null;
  return Math.round((dataSize / byteRate) * 1000);
}
