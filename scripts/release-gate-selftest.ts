import assert from "node:assert/strict";
import { validateReturnAddressRelease } from "../src/lib/releaseGate";

const base = {
  version: "return-address-release/0.1",
  source: "RETURN_ADDRESS",
  artifact: {
    sha256: "a".repeat(64),
    filename: "letter.wav",
  },
  lineage: {
    capture_event_id: "capture-001",
    handoff_event_id: null,
    return_event_id: null,
    decision_event_id: null,
  },
  release: {
    authorized: true,
    broadcast: true,
  },
  performer: {
    label: "Human Performer",
  },
};

const valid = validateReturnAddressRelease(base);
assert.equal(valid.state, "RELEASABLE");
if (valid.state === "RELEASABLE") {
  assert.equal(valid.packet.release.edit, false);
  assert.equal(valid.packet.release.synthetic_voice, false);
  assert.equal(valid.packet.release.training, false);
  assert.equal(valid.packet.release.commercial, false);
}

assert.equal(
  validateReturnAddressRelease({
    ...base,
    release: { ...base.release, authorized: false },
  }).state,
  "HELD",
);

assert.equal(
  validateReturnAddressRelease({
    ...base,
    release: { ...base.release, broadcast: false },
  }).state,
  "HELD",
);

assert.equal(
  validateReturnAddressRelease({
    ...base,
    artifact: { ...base.artifact, sha256: "abc123" },
  }).state,
  "HELD",
);

assert.equal(
  validateReturnAddressRelease({
    ...base,
    lineage: { ...base.lineage, capture_event_id: "" },
  }).state,
  "HELD",
);

assert.equal(
  validateReturnAddressRelease({
    ...base,
    performer: { label: "" },
  }).state,
  "HELD",
);

console.log("RELEASE GATE 001 self-test passed");
