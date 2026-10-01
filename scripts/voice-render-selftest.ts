import assert from "node:assert/strict";
import { validateVoiceRenderRequest } from "../src/lib/voiceRender";

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
    broadcast_status: "NOT_BROADCAST",
    packet: stationPacket,
  },
};

const firstResponse = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  metadata: {
    source: "autodisco_pair_listen",
    pair_listen_version: "autodisco-pair-listen/0.1",
  },
  content: {
    kind: "AUTODISCO_FIRST_RESPONSE_SEALED",
    mode: "INTERPRETATION",
    sealed: true,
    text: "The hinge sounded like permission.",
    station_receipt_uri: "ledger://events/22222222-2222-4222-8222-222222222222",
    station_packet_hash: "b".repeat(64),
    broadcast_status: "NOT_BROADCAST",
  },
};

const sourceTextHash = "c".repeat(64);
const stationPacketHash = "b".repeat(64);

const generic = validateVoiceRenderRequest(
  firstResponse,
  stationEvent,
  "GENERIC_NARRATION",
  "",
  sourceTextHash,
  stationPacketHash,
);
assert.equal(generic.state, "ADMITTED");
if (generic.state === "ADMITTED") {
  assert.deepEqual(generic.request.inherited_permissions, permissions);
  assert.equal(generic.request.render_kind, "GENERIC_NARRATION");
  assert.equal(generic.request.requested_voice.label, null);
  assert.equal(generic.request.source_text_hash, sourceTextHash);
}

assert.equal(
  validateVoiceRenderRequest(
    firstResponse,
    stationEvent,
    "GENERIC_NARRATION",
    "Human Performer",
    sourceTextHash,
    stationPacketHash,
  ).state,
  "REFUSED",
);

assert.equal(
  validateVoiceRenderRequest(
    firstResponse,
    stationEvent,
    "HUMAN_VOICE_SYNTHESIS",
    "Human Performer",
    sourceTextHash,
    stationPacketHash,
  ).state,
  "REFUSED",
);

const synthStationEvent = {
  ...stationEvent,
  content: {
    ...stationEvent.content,
    packet: {
      ...stationPacket,
      permissions: { ...permissions, synthetic_voice: true },
    },
  },
};

const synth = validateVoiceRenderRequest(
  firstResponse,
  synthStationEvent,
  "HUMAN_VOICE_SYNTHESIS",
  "Human Performer",
  sourceTextHash,
  stationPacketHash,
);
assert.equal(synth.state, "ADMITTED");
if (synth.state === "ADMITTED") {
  assert.equal(synth.request.inherited_permissions.synthetic_voice, true);
  assert.equal(synth.request.requested_voice.label, "Human Performer");
}

assert.equal(
  validateVoiceRenderRequest(
    firstResponse,
    synthStationEvent,
    "HUMAN_VOICE_SYNTHESIS",
    "Different Person",
    sourceTextHash,
    stationPacketHash,
  ).state,
  "REFUSED",
);

assert.equal(
  validateVoiceRenderRequest(
    firstResponse,
    stationEvent,
    "GENERIC_NARRATION",
    "",
    sourceTextHash,
    "d".repeat(64),
  ).state,
  "REFUSED",
);

assert.equal(
  validateVoiceRenderRequest(
    { ...firstResponse, content: { ...firstResponse.content, kind: "AUTODISCO_EXCHANGE_CLOSED" } },
    stationEvent,
    "GENERIC_NARRATION",
    "",
    sourceTextHash,
    stationPacketHash,
  ).state,
  "REFUSED",
);

assert.equal(
  validateVoiceRenderRequest(
    {
      ...firstResponse,
      metadata: { ...firstResponse.metadata, pair_listen_version: "forged-version" },
    },
    stationEvent,
    "GENERIC_NARRATION",
    "",
    sourceTextHash,
    stationPacketHash,
  ).state,
  "REFUSED",
);

assert.equal(
  validateVoiceRenderRequest(
    firstResponse,
    { ...stationEvent, metadata: { ...stationEvent.metadata, source: "manual_ledger_write" } },
    "GENERIC_NARRATION",
    "",
    sourceTextHash,
    stationPacketHash,
  ).state,
  "REFUSED",
);

console.log("VOICE RENDER 001 self-test passed");
