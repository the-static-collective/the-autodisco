import type { ReleasePermissions } from "./releaseGate";
import {
  AUTODISCO_STATION_PACKET_VERSION,
  parseLedgerEventId,
  type StationPacket,
} from "./stationPacket";
import { VOICE_PROVIDER_VERSION } from "./voiceProvider";

export const BROADCAST_RECEIPT_VERSION = "autodisco-broadcast-receipt/0.1" as const;

export type BroadcastCompletion = "COMPLETE" | "PARTIAL" | "INTERRUPTED";

export type EligibleBroadcastSource = {
  source_kind: "ORIGINAL_HUMAN" | "RENDERED";
  source_receipt_uri: string;
  station_receipt_uri: string;
  release_receipt_uri: string;
  audio_sha256: string;
  artifact_duration_ms: number | null;
  permissions: ReleasePermissions;
  provider: {
    name: string;
    model: string;
    model_version: string;
    voice: string;
  } | null;
};

export type AiringReceiptInput = {
  station: string;
  show: string | null;
  slot: string | null;
  started_at: string;
  completed_at: string | null;
  completion: BroadcastCompletion;
  aired_audio_sha256: string;
  aired_duration_ms: number | null;
};

export type BroadcastSourceValidation =
  | { state: "REFUSED"; errors: string[]; source: null }
  | { state: "ELIGIBLE"; errors: []; source: EligibleBroadcastSource };

export type AiringValidation =
  | { state: "REFUSED"; errors: string[]; airing: null }
  | { state: "RECORDABLE"; errors: []; airing: AiringReceiptInput };

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

function stationPacket(value: unknown): StationPacket | null {
  const packet = record(value);
  const source = record(packet?.source);
  const inherited = permissions(packet?.permissions);
  const memory = record(packet?.memory);
  const releaseReceiptUri = nonEmptyString(packet?.release_receipt_uri);
  const artifactSha256 = nonEmptyString(source?.artifact_sha256);
  const performerLabel = nonEmptyString(source?.performer_label);

  if (
    packet?.version !== AUTODISCO_STATION_PACKET_VERSION ||
    !releaseReceiptUri ||
    !parseLedgerEventId(releaseReceiptUri) ||
    !artifactSha256 ||
    !/^[0-9a-f]{64}$/i.test(artifactSha256) ||
    !performerLabel ||
    !inherited ||
    inherited.authorized !== true ||
    inherited.broadcast !== true ||
    packet?.role !== "human_interstitial" ||
    memory?.catalog_access !== false ||
    memory?.prior_broadcast_access !== false
  ) {
    return null;
  }

  return value as StationPacket;
}

function validatedStation(event: LedgerEventLike): {
  id: string;
  packet: StationPacket;
} | null {
  const id = nonEmptyString(event?.id);
  const content = record(event?.content);
  const metadata = record(event?.metadata);
  const packet = stationPacket(content?.packet);

  if (
    !id ||
    content?.kind !== "AUTODISCO_STATION_PACKET_ASSEMBLED" ||
    content?.mode !== "OBSERVED" ||
    content?.broadcast_status !== "NOT_BROADCAST" ||
    metadata?.source !== "autodisco_broadcast_gate" ||
    metadata?.station_packet_version !== AUTODISCO_STATION_PACKET_VERSION ||
    !packet
  ) {
    return null;
  }

  return { id, packet };
}

export function validateBroadcastSource(
  sourceEvent: LedgerEventLike,
  stationEvent: LedgerEventLike,
  resolvedStationPacketHash?: string,
): BroadcastSourceValidation {
  const errors: string[] = [];
  const sourceId = nonEmptyString(sourceEvent?.id);
  const content = record(sourceEvent?.content);
  const metadata = record(sourceEvent?.metadata);
  const station = validatedStation(stationEvent);

  if (!sourceId) errors.push("source audio receipt id is required");
  if (!content) {
    return { state: "REFUSED", errors: [...errors, "source audio receipt content is missing"], source: null };
  }
  if (!station) errors.push("source must resolve to a recognized NOT_BROADCAST station packet");

  if (content.kind === "AUTODISCO_STATION_PACKET_ASSEMBLED") {
    if (!station || station.id !== sourceId) {
      errors.push("original human source must be the resolved station packet receipt");
    }

    if (errors.length > 0 || !sourceId || !station) {
      return { state: "REFUSED", errors, source: null };
    }

    return {
      state: "ELIGIBLE",
      errors: [],
      source: {
        source_kind: "ORIGINAL_HUMAN",
        source_receipt_uri: `ledger://events/${sourceId}`,
        station_receipt_uri: `ledger://events/${station.id}`,
        release_receipt_uri: station.packet.release_receipt_uri,
        audio_sha256: station.packet.source.artifact_sha256.toLowerCase(),
        artifact_duration_ms: null,
        permissions: { ...station.packet.permissions },
        provider: null,
      },
    };
  }

  if (content.kind !== "AUTODISCO_VOICE_RENDERED") {
    errors.push("source must be original station audio or AUTODISCO_VOICE_RENDERED");
  }
  if (content.mode !== "DERIVED") {
    errors.push("rendered audio source must preserve mode DERIVED");
  }
  if (content.render_status !== "RENDERED") {
    errors.push("rendered audio source must preserve render_status RENDERED");
  }
  if (content.broadcast_status !== "NOT_BROADCAST") {
    errors.push("rendered audio source must preserve broadcast_status NOT_BROADCAST");
  }
  if (metadata?.source !== "autodisco_voice_provider") {
    errors.push("rendered audio source was not emitted by Voice Provider");
  }
  if (metadata?.voice_provider_version !== VOICE_PROVIDER_VERSION) {
    errors.push("rendered audio source Voice Provider version is not recognized");
  }

  const sourceStationUri = nonEmptyString(content.station_receipt_uri);
  const sourceStationId = sourceStationUri ? parseLedgerEventId(sourceStationUri) : null;
  if (!sourceStationId || !station || station.id !== sourceStationId) {
    errors.push("rendered audio source station ancestry does not match the resolved station receipt");
  }

  const inherited = permissions(content.inherited_permissions);
  if (!inherited || inherited.authorized !== true || inherited.broadcast !== true) {
    errors.push("rendered audio source no longer carries explicit broadcast authority");
  }

  if (inherited && station) {
    const keys = [
      "authorized",
      "broadcast",
      "edit",
      "synthetic_voice",
      "training",
      "commercial",
    ] as const;
    if (keys.some((key) => inherited[key] !== station.packet.permissions[key])) {
      errors.push("rendered audio permission envelope does not match station ancestry");
    }
  }

  const artifact = record(content.artifact);
  const artifactData = nonEmptyString(artifact?.data);
  const artifactByteLength = artifact?.byte_length;
  if (
    artifact?.storage !== "inline-ledger-base64" ||
    artifact?.encoding !== "base64" ||
    !artifactData ||
    typeof artifactByteLength !== "number" ||
    artifactByteLength <= 0
  ) {
    errors.push("rendered audio source must preserve its bounded inline audio artifact");
  }

  const audioSha256 = nonEmptyString(artifact?.sha256);
  if (!audioSha256 || !/^[0-9a-f]{64}$/i.test(audioSha256)) {
    errors.push("rendered audio source must preserve a full output SHA-256");
  }

  const stationPacketSha256 = nonEmptyString(content.station_packet_sha256);
  if (
    !stationPacketSha256 ||
    !resolvedStationPacketHash ||
    !/^[0-9a-f]{64}$/i.test(resolvedStationPacketHash) ||
    stationPacketSha256.toLowerCase() !== resolvedStationPacketHash.toLowerCase()
  ) {
    errors.push("rendered audio source station packet hash no longer matches station ancestry");
  }

  const provider = record(content.provider);
  const providerName = nonEmptyString(provider?.name);
  const providerModel = nonEmptyString(provider?.model);
  const providerVersion = nonEmptyString(provider?.model_version);
  const providerVoice = nonEmptyString(provider?.voice);
  if (!providerName || !providerModel || !providerVersion || !providerVoice) {
    errors.push("rendered audio source must preserve provider/model/version/voice");
  }

  const duration =
    typeof artifact?.duration_ms === "number" && artifact.duration_ms >= 0
      ? artifact.duration_ms
      : null;

  if (
    errors.length > 0 ||
    !sourceId ||
    !station ||
    !inherited ||
    !audioSha256 ||
    !providerName ||
    !providerModel ||
    !providerVersion ||
    !providerVoice
  ) {
    return { state: "REFUSED", errors, source: null };
  }

  return {
    state: "ELIGIBLE",
    errors: [],
    source: {
      source_kind: "RENDERED",
      source_receipt_uri: `ledger://events/${sourceId}`,
      station_receipt_uri: `ledger://events/${station.id}`,
      release_receipt_uri: station.packet.release_receipt_uri,
      audio_sha256: audioSha256.toLowerCase(),
      artifact_duration_ms: duration,
      permissions: { ...inherited },
      provider: {
        name: providerName,
        model: providerModel,
        model_version: providerVersion,
        voice: providerVoice,
      },
    },
  };
}

function isoDate(value: unknown): string | null {
  const text = nonEmptyString(value);
  if (!text) return null;
  const time = Date.parse(text);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

export function validateAiring(
  source: EligibleBroadcastSource,
  input: {
    station?: unknown;
    show?: unknown;
    slot?: unknown;
    startedAt?: unknown;
    completedAt?: unknown;
    completion?: unknown;
    airedAudioSha256?: unknown;
    airedDurationMs?: unknown;
  },
): AiringValidation {
  const errors: string[] = [];
  const station = nonEmptyString(input.station);
  const show = nonEmptyString(input.show) ?? null;
  const slot = nonEmptyString(input.slot) ?? null;
  const startedAt = isoDate(input.startedAt);
  const completedAt = input.completedAt === null || input.completedAt === ""
    ? null
    : isoDate(input.completedAt);

  if (!station) errors.push("airing station label is required");
  if (!startedAt) errors.push("airing started_at must be a valid timestamp");

  const completion = input.completion;
  if (completion !== "COMPLETE" && completion !== "PARTIAL" && completion !== "INTERRUPTED") {
    errors.push("completion must be COMPLETE, PARTIAL, or INTERRUPTED");
  }

  if (input.completedAt !== null && input.completedAt !== "" && !completedAt) {
    errors.push("completed_at must be a valid timestamp when supplied");
  }
  if (completion === "COMPLETE" && !completedAt) {
    errors.push("COMPLETE airing requires completed_at");
  }
  if (startedAt && completedAt && Date.parse(completedAt) < Date.parse(startedAt)) {
    errors.push("completed_at cannot precede started_at");
  }

  const suppliedHash = nonEmptyString(input.airedAudioSha256);
  let airedHash = source.audio_sha256;

  if (completion === "PARTIAL" || completion === "INTERRUPTED") {
    if (!suppliedHash || !/^[0-9a-f]{64}$/i.test(suppliedHash)) {
      errors.push("partial or interrupted airing requires the exact SHA-256 of the bytes actually aired");
    } else {
      airedHash = suppliedHash.toLowerCase();
    }
  } else if (suppliedHash && suppliedHash.toLowerCase() !== source.audio_sha256) {
    errors.push("COMPLETE airing hash must equal the full source audio SHA-256");
  }

  const rawDuration = input.airedDurationMs;
  let airedDurationMs: number | null = null;
  if (rawDuration !== undefined && rawDuration !== null && rawDuration !== "") {
    const value = typeof rawDuration === "number" ? rawDuration : Number(rawDuration);
    if (!Number.isFinite(value) || value <= 0) {
      errors.push("aired_duration_ms must be a positive number when supplied");
    } else {
      airedDurationMs = Math.round(value);
    }
  }

  if ((completion === "PARTIAL" || completion === "INTERRUPTED") && airedDurationMs === null) {
    errors.push("partial or interrupted airing requires aired_duration_ms");
  }
  if (
    airedDurationMs !== null &&
    source.artifact_duration_ms !== null &&
    airedDurationMs > source.artifact_duration_ms
  ) {
    errors.push("aired_duration_ms cannot exceed the source artifact duration");
  }

  if (
    errors.length > 0 ||
    !station ||
    !startedAt ||
    (completion !== "COMPLETE" && completion !== "PARTIAL" && completion !== "INTERRUPTED")
  ) {
    return { state: "REFUSED", errors, airing: null };
  }

  return {
    state: "RECORDABLE",
    errors: [],
    airing: {
      station,
      show,
      slot,
      started_at: startedAt,
      completed_at: completedAt,
      completion,
      aired_audio_sha256: airedHash,
      aired_duration_ms:
        completion === "COMPLETE" && source.artifact_duration_ms !== null
          ? source.artifact_duration_ms
          : airedDurationMs,
    },
  };
}
