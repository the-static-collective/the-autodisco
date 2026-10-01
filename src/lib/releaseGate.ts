export const RETURN_ADDRESS_RELEASE_VERSION = "return-address-release/0.1" as const;

export type ReleasePermissions = {
  authorized: boolean;
  broadcast: boolean;
  edit: boolean;
  synthetic_voice: boolean;
  training: boolean;
  commercial: boolean;
};

export type ReturnAddressReleasePacket = {
  version: typeof RETURN_ADDRESS_RELEASE_VERSION;
  source: "RETURN_ADDRESS";
  artifact: {
    sha256: string;
    filename?: string;
  };
  lineage: {
    capture_event_id: string;
    handoff_event_id?: string | null;
    return_event_id?: string | null;
    decision_event_id?: string | null;
  };
  release: ReleasePermissions;
  performer: {
    label: string;
  };
  note?: string;
};

export type ReleaseGateValidation =
  | {
      state: "HELD";
      errors: string[];
      packet: null;
    }
  | {
      state: "RELEASABLE";
      errors: [];
      packet: ReturnAddressReleasePacket;
    };

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function nullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return optionalString(value);
}

export function validateReturnAddressRelease(input: unknown): ReleaseGateValidation {
  const errors: string[] = [];
  const root = record(input);

  if (!root) {
    return { state: "HELD", errors: ["packet must be a JSON object"], packet: null };
  }

  if (root.version !== RETURN_ADDRESS_RELEASE_VERSION) {
    errors.push(`version must be "${RETURN_ADDRESS_RELEASE_VERSION}"`);
  }
  if (root.source !== "RETURN_ADDRESS") {
    errors.push('source must be "RETURN_ADDRESS"');
  }

  const artifact = record(root.artifact);
  const sha256 = optionalString(artifact?.sha256);
  if (!sha256 || !/^[0-9a-f]{64}$/i.test(sha256)) {
    errors.push("artifact.sha256 must be a full 64-character SHA-256 hash");
  }

  const lineage = record(root.lineage);
  const captureEventId = optionalString(lineage?.capture_event_id);
  if (!captureEventId) {
    errors.push("lineage.capture_event_id is required");
  }

  const release = record(root.release);
  if (release?.authorized !== true) {
    errors.push("release.authorized must be explicitly true");
  }
  if (release?.broadcast !== true) {
    errors.push("release.broadcast must be explicitly true");
  }

  const performer = record(root.performer);
  const performerLabel = optionalString(performer?.label);
  if (!performerLabel) {
    errors.push("performer.label is required for attribution");
  }

  if (errors.length > 0 || !sha256 || !captureEventId || !performerLabel) {
    return { state: "HELD", errors, packet: null };
  }

  return {
    state: "RELEASABLE",
    errors: [],
    packet: {
      version: RETURN_ADDRESS_RELEASE_VERSION,
      source: "RETURN_ADDRESS",
      artifact: {
        sha256: sha256.toLowerCase(),
        filename: optionalString(artifact?.filename),
      },
      lineage: {
        capture_event_id: captureEventId,
        handoff_event_id: nullableString(lineage?.handoff_event_id),
        return_event_id: nullableString(lineage?.return_event_id),
        decision_event_id: nullableString(lineage?.decision_event_id),
      },
      release: {
        authorized: true,
        broadcast: true,
        edit: release?.edit === true,
        synthetic_voice: release?.synthetic_voice === true,
        training: release?.training === true,
        commercial: release?.commercial === true,
      },
      performer: {
        label: performerLabel,
      },
      note: optionalString(root.note),
    },
  };
}
