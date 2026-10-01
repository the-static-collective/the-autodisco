import assert from "node:assert/strict";
import { validateListenerReturn } from "../src/lib/listenerReturn";

const broadcastEvent = {
  id: "88888888-8888-4888-8888-888888888888",
  metadata: {
    source: "autodisco_broadcast_receipt",
    broadcast_receipt_version: "autodisco-broadcast-receipt/0.1",
    parent_event_id: "77777777-7777-4777-8777-777777777777",
    station_parent_event_id: "22222222-2222-4222-8222-222222222222",
    release_parent_event_id: "11111111-1111-4111-8111-111111111111",
  },
  content: {
    kind: "AUTODISCO_BROADCAST_RECORDED",
    mode: "OBSERVED",
    broadcast_status: "BROADCAST_RECORDED",
    source_receipt_uri: "ledger://events/77777777-7777-4777-8777-777777777777",
    station_receipt_uri: "ledger://events/22222222-2222-4222-8222-222222222222",
    release_receipt_uri: "ledger://events/11111111-1111-4111-8111-111111111111",
  },
};

const verbatim = "  I heard the door differently this time.\nKeep the pause.  ";

const textResult = validateListenerReturn(broadcastEvent, {
  listenerLabel: "Human Listener",
  responseKind: "TEXT",
  text: verbatim,
  capturedAt: "2026-10-01T16:18:00-05:00",
});

assert.equal(textResult.state, "CAPTURABLE");
if (textResult.state !== "CAPTURABLE") process.exit(1);

assert.equal(textResult.packet.version, "listener-return/0.1");
assert.equal(textResult.packet.source, "AUTODISCO_BROADCAST");
assert.equal(textResult.packet.semantic_effect, "none");
assert.equal(textResult.packet.listener.label, "Human Listener");
assert.equal(textResult.packet.response.kind, "TEXT");

if (textResult.packet.response.kind === "TEXT") {
  assert.equal(textResult.packet.response.text, verbatim);
  assert.equal(textResult.packet.response.artifact_sha256, null);
}

assert.deepEqual(textResult.packet.lineage, {
  source_receipt_uri: broadcastEvent.content.source_receipt_uri,
  station_receipt_uri: broadcastEvent.content.station_receipt_uri,
  release_receipt_uri: broadcastEvent.content.release_receipt_uri,
});

const audioResult = validateListenerReturn(broadcastEvent, {
  listenerLabel: "Human Listener",
  responseKind: "AUDIO",
  artifactSha256: "a".repeat(64),
  filename: "return.wav",
  capturedAt: "2026-10-01T16:19:00-05:00",
});

assert.equal(audioResult.state, "CAPTURABLE");
if (audioResult.state === "CAPTURABLE" && audioResult.packet.response.kind === "AUDIO") {
  assert.equal(audioResult.packet.response.text, null);
  assert.equal(audioResult.packet.response.artifact_sha256, "a".repeat(64));
  assert.equal(audioResult.packet.response.filename, "return.wav");
}

assert.equal(
  validateListenerReturn(
    {
      ...broadcastEvent,
      content: {
        ...broadcastEvent.content,
        kind: "AUTODISCO_VOICE_RENDERED",
      },
    },
    {
      listenerLabel: "Human Listener",
      responseKind: "TEXT",
      text: "hello",
      capturedAt: "2026-10-01T16:20:00-05:00",
    },
  ).state,
  "REFUSED",
);

assert.equal(
  validateListenerReturn(
    {
      ...broadcastEvent,
      metadata: {
        ...broadcastEvent.metadata,
        source: "manual_ledger_write",
      },
    },
    {
      listenerLabel: "Human Listener",
      responseKind: "TEXT",
      text: "hello",
      capturedAt: "2026-10-01T16:20:00-05:00",
    },
  ).state,
  "REFUSED",
);

assert.equal(
  validateListenerReturn(
    {
      ...broadcastEvent,
      metadata: {
        ...broadcastEvent.metadata,
        station_parent_event_id: "99999999-9999-4999-8999-999999999999",
      },
    },
    {
      listenerLabel: "Human Listener",
      responseKind: "TEXT",
      text: "hello",
      capturedAt: "2026-10-01T16:20:00-05:00",
    },
  ).state,
  "REFUSED",
);

assert.equal(
  validateListenerReturn(broadcastEvent, {
    listenerLabel: "",
    responseKind: "TEXT",
    text: "hello",
    capturedAt: "2026-10-01T16:20:00-05:00",
  }).state,
  "REFUSED",
);

assert.equal(
  validateListenerReturn(broadcastEvent, {
    listenerLabel: "Human Listener",
    responseKind: "TEXT",
    text: "   ",
    capturedAt: "2026-10-01T16:20:00-05:00",
  }).state,
  "REFUSED",
);

assert.equal(
  validateListenerReturn(broadcastEvent, {
    listenerLabel: "Human Listener",
    responseKind: "AUDIO",
    artifactSha256: "short",
    capturedAt: "2026-10-01T16:20:00-05:00",
  }).state,
  "REFUSED",
);

assert.equal(
  validateListenerReturn(broadcastEvent, {
    listenerLabel: "Human Listener",
    responseKind: "TEXT",
    text: "hello",
    capturedAt: "not-a-date",
  }).state,
  "REFUSED",
);

console.log("LISTENER RETURN 001 self-test passed");
