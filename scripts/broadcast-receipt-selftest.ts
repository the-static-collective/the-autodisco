import assert from "node:assert/strict";
import {
  validateAiring,
  validateBroadcastSource,
} from "../src/lib/broadcastReceipt";

const permissions = {
  authorized: true,
  broadcast: true,
  edit: false,
  synthetic_voice: false,
  training: false,
  commercial: false,
};

const stationPacket = {
  version: "autodisco-station-packet/0.1",
  release_receipt_uri: "ledger://events/11111111-1111-4111-8111-111111111111",
  source: {
    artifact_sha256: "a".repeat(64),
    performer_label: "Human Performer",
    external_lineage: {
      capture_event_id: "capture-001",
      handoff_event_id: null,
      return_event_id: null,
      decision_event_id: null,
    },
  },
  permissions,
  role: "human_interstitial",
  memory: {
    catalog_access: false,
    prior_broadcast_access: false,
  },
};

const stationEvent = {
  id: "22222222-2222-4222-8222-222222222222",
  metadata: {
    source: "autodisco_broadcast_gate",
    station_packet_version: "autodisco-station-packet/0.1",
  },
  content: {
    kind: "AUTODISCO_STATION_PACKET_ASSEMBLED",
    mode: "OBSERVED",
    packet: stationPacket,
    broadcast_status: "NOT_BROADCAST",
  },
};

const original = validateBroadcastSource(stationEvent, stationEvent);
assert.equal(original.state, "ELIGIBLE");
if (original.state !== "ELIGIBLE") process.exit(1);
assert.equal(original.source.source_kind, "ORIGINAL_HUMAN");
assert.equal(original.source.audio_sha256, "a".repeat(64));
assert.equal(original.source.release_receipt_uri, stationPacket.release_receipt_uri);

const renderedEvent = {
  id: "77777777-7777-4777-8777-777777777777",
  metadata: {
    source: "autodisco_voice_provider",
    voice_provider_version: "autodisco-voice-provider/0.1",
  },
  content: {
    kind: "AUTODISCO_VOICE_RENDERED",
    mode: "DERIVED",
    render_status: "RENDERED",
    broadcast_status: "NOT_BROADCAST",
    station_receipt_uri: "ledger://events/22222222-2222-4222-8222-222222222222",
    station_packet_sha256: "b".repeat(64),
    inherited_permissions: permissions,
    provider: {
      name: "google-gemini",
      model: "gemini-3.8-flash-tts",
      model_version: "gemini-3.8-flash-tts",
      voice: "Kore",
    },
    artifact: {
      storage: "inline-ledger-base64",
      encoding: "base64",
      data: "AA==",
      byte_length: 1,
      sha256: "c".repeat(64),
      duration_ms: 5000,
    },
  },
};

const rendered = validateBroadcastSource(renderedEvent, stationEvent, "b".repeat(64));
assert.equal(rendered.state, "ELIGIBLE");
if (rendered.state !== "ELIGIBLE") process.exit(1);
assert.equal(rendered.source.source_kind, "RENDERED");
assert.equal(rendered.source.audio_sha256, "c".repeat(64));
assert.equal(rendered.source.artifact_duration_ms, 5000);

assert.equal(
  validateBroadcastSource(
    {
      ...renderedEvent,
      metadata: { ...renderedEvent.metadata, source: "manual_ledger_write" },
    },
    stationEvent,
    "b".repeat(64),
  ).state,
  "REFUSED",
);

assert.equal(
  validateBroadcastSource(
    {
      ...renderedEvent,
      content: {
        ...renderedEvent.content,
        inherited_permissions: { ...permissions, broadcast: false },
      },
    },
    stationEvent,
    "b".repeat(64),
  ).state,
  "REFUSED",
);

assert.equal(
  validateBroadcastSource(renderedEvent, stationEvent, "d".repeat(64)).state,
  "REFUSED",
);

assert.equal(
  validateBroadcastSource(
    {
      ...renderedEvent,
      content: {
        ...renderedEvent.content,
        artifact: {
          ...renderedEvent.content.artifact,
          data: "",
        },
      },
    },
    stationEvent,
    "b".repeat(64),
  ).state,
  "REFUSED",
);

const complete = validateAiring(rendered.source, {
  station: "Static First Listen",
  show: "Open Window",
  slot: "01",
  startedAt: "2026-10-01T20:00:00-05:00",
  completedAt: "2026-10-01T20:00:05-05:00",
  completion: "COMPLETE",
  airedAudioSha256: "",
  airedDurationMs: "",
});
assert.equal(complete.state, "RECORDABLE");
if (complete.state === "RECORDABLE") {
  assert.equal(complete.airing.aired_audio_sha256, "c".repeat(64));
  assert.equal(complete.airing.aired_duration_ms, 5000);
}

assert.equal(
  validateAiring(rendered.source, {
    station: "Static First Listen",
    startedAt: "2026-10-01T20:00:00-05:00",
    completedAt: "",
    completion: "COMPLETE",
  }).state,
  "REFUSED",
);

assert.equal(
  validateAiring(rendered.source, {
    station: "Static First Listen",
    startedAt: "2026-10-01T20:00:00-05:00",
    completedAt: "2026-10-01T20:00:05-05:00",
    completion: "COMPLETE",
    airedAudioSha256: "e".repeat(64),
  }).state,
  "REFUSED",
);

const partial = validateAiring(rendered.source, {
  station: "Static First Listen",
  startedAt: "2026-10-01T20:00:00-05:00",
  completedAt: "2026-10-01T20:00:02-05:00",
  completion: "PARTIAL",
  airedAudioSha256: "f".repeat(64),
  airedDurationMs: 2000,
});
assert.equal(partial.state, "RECORDABLE");
if (partial.state === "RECORDABLE") {
  assert.equal(partial.airing.aired_audio_sha256, "f".repeat(64));
  assert.equal(partial.airing.aired_duration_ms, 2000);
}

assert.equal(
  validateAiring(rendered.source, {
    station: "Static First Listen",
    startedAt: "2026-10-01T20:00:00-05:00",
    completedAt: "2026-10-01T20:00:02-05:00",
    completion: "INTERRUPTED",
    airedDurationMs: 2000,
  }).state,
  "REFUSED",
);

assert.equal(
  validateAiring(rendered.source, {
    station: "Static First Listen",
    startedAt: "2026-10-01T20:00:00-05:00",
    completedAt: "2026-10-01T20:00:02-05:00",
    completion: "PARTIAL",
    airedAudioSha256: "f".repeat(64),
    airedDurationMs: 6000,
  }).state,
  "REFUSED",
);

console.log("BROADCAST RECEIPT 001 self-test passed");
