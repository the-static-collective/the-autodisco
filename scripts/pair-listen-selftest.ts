import assert from "node:assert/strict";
import {
  descriptorFromPairReceipt,
  pairReady,
  PAIR_LISTEN_VERSION,
  sessionFor,
  validatePairListenSource,
} from "../src/lib/pairListen";

const stationPacket = {
  version: "autodisco-station-packet/0.1",
  release_receipt_uri: "ledger://events/11111111-1111-4111-8111-111111111111",
  source: {
    artifact_sha256: "c".repeat(64),
    performer_label: "Human Performer",
    external_lineage: {
      capture_event_id: "capture-001",
      handoff_event_id: null,
      return_event_id: null,
      decision_event_id: null,
    },
  },
  permissions: {
    authorized: true,
    broadcast: true,
    edit: false,
    synthetic_voice: false,
    training: false,
    commercial: false,
  },
  role: "human_interstitial",
  memory: {
    catalog_access: false,
    prior_broadcast_access: false,
  },
};

const stationReceipt = {
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

const opened = validatePairListenSource(
  stationReceipt,
  "Listener A",
  "Listener B",
  "session-a",
  "session-b",
  "d".repeat(64),
);

assert.equal(opened.state, "OPENABLE");
if (opened.state !== "OPENABLE") process.exit(1);

assert.notEqual(opened.descriptor.sessions[0].session_id, opened.descriptor.sessions[1].session_id);
assert.equal(opened.descriptor.sessions[0].catalog_access, false);
assert.equal(opened.descriptor.sessions[1].prior_broadcast_access, false);
assert.equal(pairReady(opened.descriptor, ["session-a"]), false);
assert.equal(pairReady(opened.descriptor, ["session-a", "session-b"]), true);
assert.equal(sessionFor(opened.descriptor, "session-a")?.slot, "A");
assert.equal(sessionFor(opened.descriptor, "unknown"), null);

assert.equal(
  validatePairListenSource(
    stationReceipt,
    "Listener A",
    "Listener B",
    "same-session",
    "same-session",
    "d".repeat(64),
  ).state,
  "REFUSED",
);

assert.equal(
  validatePairListenSource(
    {
      ...stationReceipt,
      content: { ...stationReceipt.content, broadcast_status: "BROADCAST" },
    },
    "Listener A",
    "Listener B",
    "session-a",
    "session-b",
    "d".repeat(64),
  ).state,
  "REFUSED",
);

assert.equal(
  validatePairListenSource(
    {
      ...stationReceipt,
      metadata: { ...stationReceipt.metadata, source: "manual_ledger_write" },
    },
    "Listener A",
    "Listener B",
    "session-a",
    "session-b",
    "d".repeat(64),
  ).state,
  "REFUSED",
);

assert.equal(
  validatePairListenSource(
    {
      ...stationReceipt,
      content: {
        ...stationReceipt.content,
        packet: {
          ...stationPacket,
          permissions: { ...stationPacket.permissions, broadcast: false },
        },
      },
    },
    "Listener A",
    "Listener B",
    "session-a",
    "session-b",
    "d".repeat(64),
  ).state,
  "REFUSED",
);

const pairReceipt = {
  id: "33333333-3333-4333-8333-333333333333",
  metadata: {
    source: "autodisco_pair_listen",
    pair_listen_version: PAIR_LISTEN_VERSION,
  },
  content: {
    kind: "AUTODISCO_PAIR_LISTEN_OPENED",
    mode: "OBSERVED",
    broadcast_status: "NOT_BROADCAST",
    descriptor: opened.descriptor,
  },
};

const recovered = descriptorFromPairReceipt(pairReceipt);
assert.ok(recovered);
assert.equal(recovered?.station_packet_hash, "d".repeat(64));
assert.equal(recovered?.sessions[0].slot, "A");
assert.equal(recovered?.sessions[1].slot, "B");

assert.equal(
  descriptorFromPairReceipt({
    ...pairReceipt,
    content: { ...pairReceipt.content, broadcast_status: "BROADCAST" },
  }),
  null,
);

console.log("PAIR LISTEN 001 self-test passed");
