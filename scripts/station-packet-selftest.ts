import assert from "node:assert/strict";
import { assembleStationPacket, parseLedgerEventId } from "../src/lib/stationPacket";

const releaseEvent = {
  id: "11111111-1111-4111-8111-111111111111",
  metadata: {
    source: "return_address_release_gate",
    release_version: "return-address-release/0.1",
  },
  content: {
    kind: "RETURN_ADDRESS_RELEASE_ADMITTED",
    mode: "OBSERVED",
    artifact_sha256: "b".repeat(64),
    artifact_filename: "returned-letter.wav",
    performer_label: "Human Performer",
    release: {
      authorized: true,
      broadcast: true,
      edit: false,
      synthetic_voice: false,
      training: false,
      commercial: true,
    },
    lineage: {
      capture_event_id: "capture-001",
      handoff_event_id: "handoff-001",
      return_event_id: "return-001",
      decision_event_id: "decision-001",
    },
  },
};

const assembled = assembleStationPacket(releaseEvent);
assert.equal(assembled.state, "ASSEMBLED");

if (assembled.state === "ASSEMBLED") {
  assert.deepEqual(assembled.packet.permissions, releaseEvent.content.release);
  assert.equal(assembled.packet.permissions.synthetic_voice, false);
  assert.equal(assembled.packet.permissions.training, false);
  assert.equal(assembled.packet.memory.catalog_access, false);
  assert.equal(assembled.packet.memory.prior_broadcast_access, false);
  assert.equal(assembled.packet.role, "human_interstitial");
  assert.equal(
    assembled.packet.release_receipt_uri,
    "ledger://events/11111111-1111-4111-8111-111111111111",
  );
}

assert.equal(
  assembleStationPacket({
    ...releaseEvent,
    content: { ...releaseEvent.content, kind: "AUTODISCO_MUTATION_ACCEPTED" },
  }).state,
  "REFUSED",
);

assert.equal(
  assembleStationPacket({
    ...releaseEvent,
    metadata: { ...releaseEvent.metadata, source: "manual_ledger_write" },
  }).state,
  "REFUSED",
);

assert.equal(
  assembleStationPacket({
    ...releaseEvent,
    content: { ...releaseEvent.content, mode: "DERIVED" },
  }).state,
  "REFUSED",
);

assert.equal(
  assembleStationPacket({
    ...releaseEvent,
    content: {
      ...releaseEvent.content,
      release: { ...releaseEvent.content.release, broadcast: false },
    },
  }).state,
  "REFUSED",
);

assert.equal(
  assembleStationPacket({
    ...releaseEvent,
    content: {
      ...releaseEvent.content,
      release: {
        authorized: true,
        broadcast: true,
        edit: false,
        synthetic_voice: false,
        training: false,
      },
    },
  }).state,
  "REFUSED",
);

assert.equal(
  parseLedgerEventId("ledger://events/11111111-1111-4111-8111-111111111111"),
  "11111111-1111-4111-8111-111111111111",
);
assert.equal(parseLedgerEventId("not-a-receipt"), null);

console.log("BROADCAST GATE 001 self-test passed");
