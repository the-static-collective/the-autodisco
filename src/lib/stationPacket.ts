import { RETURN_ADDRESS_RELEASE_VERSION, type ReleasePermissions } from "./releaseGate";

export const AUTODISCO_STATION_PACKET_VERSION = "autodisco-station-packet/0.1" as const;

export type StationPacket = {
  version: typeof AUTODISCO_STATION_PACKET_VERSION;
  release_receipt_uri: string;
  source: {
    artifact_sha256: string;
    artifact_filename?: string;
    performer_label: string;
    external_lineage: {
      capture_event_id: string;
      handoff_event_id?: string | null;
      return_event_id?: string | null;
      decision_event_id?: string | null;
    };
  };
  permissions: ReleasePermissions;
  role: "human_interstitial";
  memory: {
    catalog_access: false;
    prior_broadcast_access: false;
  };
};

export type StationPacketAssembly =
  | { state: "REFUSED"; errors: string[]; packet: null }
  | { state: "ASSEMBLED"; errors: []; packet: StationPacket };

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

function nullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return nonEmptyString(value);
}

function explicitBooleanEnvelope(value: unknown): ReleasePermissions | null {
  const release = record(value);
  if (!release) return null;

  const keys = [
    "authorized",
    "broadcast",
    "edit",
    "synthetic_voice",
    "training",
    "commercial",
  ] as const;

  for (const key of keys) {
    if (typeof release[key] !== "boolean") return null;
  }

  return {
    authorized: release.authorized as boolean,
    broadcast: release.broadcast as boolean,
    edit: release.edit as boolean,
    synthetic_voice: release.synthetic_voice as boolean,
    training: release.training as boolean,
    commercial: release.commercial as boolean,
  };
}

export function parseLedgerEventId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const raw = trimmed.startsWith("ledger://events/")
    ? trimmed.slice("ledger://events/".length)
    : trimmed;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)
    ? raw
    : null;
}

export function assembleStationPacket(event: LedgerEventLike): StationPacketAssembly {
  const errors: string[] = [];
  const eventId = nonEmptyString(event?.id);
  const content = record(event?.content);
  const metadata = record(event?.metadata);

  if (!eventId) errors.push("release receipt event id is required");
  if (!content) {
    return { state: "REFUSED", errors: [...errors, "release receipt content is missing"], packet: null };
  }

  if (content.kind !== "RETURN_ADDRESS_RELEASE_ADMITTED") {
    errors.push("source event must be RETURN_ADDRESS_RELEASE_ADMITTED");
  }
  if (content.mode !== "OBSERVED") {
    errors.push("source release receipt must preserve mode OBSERVED");
  }
  if (metadata?.source !== "return_address_release_gate") {
    errors.push("source event was not emitted by RETURN ADDRESS Release Gate");
  }
  if (metadata?.release_version !== RETURN_ADDRESS_RELEASE_VERSION) {
    errors.push("source event release version is not recognized");
  }

  const artifactSha256 = nonEmptyString(content.artifact_sha256);
  if (!artifactSha256 || !/^[0-9a-f]{64}$/i.test(artifactSha256)) {
    errors.push("source release receipt must contain a full artifact SHA-256");
  }

  const performerLabel = nonEmptyString(content.performer_label);
  if (!performerLabel) {
    errors.push("source release receipt must contain performer attribution");
  }

  const permissions = explicitBooleanEnvelope(content.release);
  if (!permissions) {
    errors.push("source release receipt must contain an explicit complete permission envelope");
  } else {
    if (permissions.authorized !== true) {
      errors.push("source release receipt is not explicitly authorized");
    }
    if (permissions.broadcast !== true) {
      errors.push("source release receipt is not explicitly authorized for broadcast consideration");
    }
  }

  const lineage = record(content.lineage);
  const captureEventId = nonEmptyString(lineage?.capture_event_id);
  if (!captureEventId) {
    errors.push("source release receipt must preserve capture_event_id");
  }

  if (errors.length > 0 || !eventId || !artifactSha256 || !performerLabel || !permissions || !captureEventId) {
    return { state: "REFUSED", errors, packet: null };
  }

  return {
    state: "ASSEMBLED",
    errors: [],
    packet: {
      version: AUTODISCO_STATION_PACKET_VERSION,
      release_receipt_uri: `ledger://events/${eventId}`,
      source: {
        artifact_sha256: artifactSha256.toLowerCase(),
        artifact_filename: nonEmptyString(content.artifact_filename),
        performer_label: performerLabel,
        external_lineage: {
          capture_event_id: captureEventId,
          handoff_event_id: nullableString(lineage?.handoff_event_id),
          return_event_id: nullableString(lineage?.return_event_id),
          decision_event_id: nullableString(lineage?.decision_event_id),
        },
      },
      permissions: { ...permissions },
      role: "human_interstitial",
      memory: {
        catalog_access: false,
        prior_broadcast_access: false,
      },
    },
  };
}
