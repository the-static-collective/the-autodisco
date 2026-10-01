import assert from "node:assert/strict";
import {
  descriptorFromExchangeReceipt,
  exchangeClosed,
  exchangeSession,
  EXCHANGE_VERSION,
  validateExchangeSource,
} from "../src/lib/exchange";

const readyEvent = {
  id: "44444444-4444-4444-8444-444444444444",
  metadata: {
    source: "autodisco_pair_listen",
    pair_listen_version: "autodisco-pair-listen/0.1",
    station_parent_event_id: "22222222-2222-4222-8222-222222222222",
  },
  content: {
    kind: "AUTODISCO_PAIR_READY_FOR_EXCHANGE",
    mode: "OBSERVED",
    pair_event_id: "33333333-3333-4333-8333-333333333333",
    first_response_receipts: [
      "ledger://events/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "ledger://events/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    ],
    broadcast_status: "NOT_BROADCAST",
  },
};

const firstA = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  metadata: {
    source: "autodisco_pair_listen",
    pair_listen_version: "autodisco-pair-listen/0.1",
    parent_event_id: "33333333-3333-4333-8333-333333333333",
  },
  content: {
    kind: "AUTODISCO_FIRST_RESPONSE_SEALED",
    mode: "INTERPRETATION",
    sealed: true,
    session_id: "session-a",
    listener_slot: "A",
    listener_label: "Listener A",
    text: "I heard the hinge as grief.",
    station_receipt_uri: "ledger://events/22222222-2222-4222-8222-222222222222",
    station_packet_hash: "d".repeat(64),
    broadcast_status: "NOT_BROADCAST",
  },
};

const firstB = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  metadata: {
    source: "autodisco_pair_listen",
    pair_listen_version: "autodisco-pair-listen/0.1",
    parent_event_id: "33333333-3333-4333-8333-333333333333",
  },
  content: {
    kind: "AUTODISCO_FIRST_RESPONSE_SEALED",
    mode: "INTERPRETATION",
    sealed: true,
    session_id: "session-b",
    listener_slot: "B",
    listener_label: "Listener B",
    text: "I heard the hinge as permission.",
    station_receipt_uri: "ledger://events/22222222-2222-4222-8222-222222222222",
    station_packet_hash: "d".repeat(64),
    broadcast_status: "NOT_BROADCAST",
  },
};

const opened = validateExchangeSource(readyEvent, [firstA, firstB]);
assert.equal(opened.state, "OPENABLE");
if (opened.state !== "OPENABLE") process.exit(1);

assert.equal(opened.descriptor.first_responses[0].listener_slot, "A");
assert.equal(opened.descriptor.first_responses[1].listener_slot, "B");
assert.equal(opened.descriptor.first_responses[0].text, "I heard the hinge as grief.");
assert.equal(exchangeSession(opened.descriptor, "session-a")?.listener_slot, "A");
assert.equal(exchangeSession(opened.descriptor, "unknown"), null);
assert.equal(exchangeClosed(opened.descriptor, ["session-a"]), false);
assert.equal(exchangeClosed(opened.descriptor, ["session-a", "session-b"]), true);

assert.equal(
  validateExchangeSource(
    { ...readyEvent, content: { ...readyEvent.content, broadcast_status: "BROADCAST" } },
    [firstA, firstB],
  ).state,
  "REFUSED",
);

assert.equal(
  validateExchangeSource(
    { ...readyEvent, metadata: { ...readyEvent.metadata, source: "manual_ledger_write" } },
    [firstA, firstB],
  ).state,
  "REFUSED",
);

assert.equal(
  validateExchangeSource(readyEvent, [firstA]).state,
  "REFUSED",
);

assert.equal(
  validateExchangeSource(
    readyEvent,
    [
      firstA,
      {
        ...firstB,
        content: { ...firstB.content, listener_slot: "A" },
      },
    ],
  ).state,
  "REFUSED",
);

const exchangeReceipt = {
  id: "55555555-5555-4555-8555-555555555555",
  metadata: {
    source: "autodisco_exchange",
    exchange_version: EXCHANGE_VERSION,
  },
  content: {
    kind: "AUTODISCO_EXCHANGE_OPENED",
    mode: "OBSERVED",
    broadcast_status: "NOT_BROADCAST",
    descriptor: opened.descriptor,
  },
};

const recovered = descriptorFromExchangeReceipt(exchangeReceipt);
assert.ok(recovered);
assert.equal(recovered?.first_responses[0].text, "I heard the hinge as grief.");
assert.equal(recovered?.first_responses[1].text, "I heard the hinge as permission.");

assert.equal(
  descriptorFromExchangeReceipt({
    ...exchangeReceipt,
    content: { ...exchangeReceipt.content, broadcast_status: "BROADCAST" },
  }),
  null,
);

console.log("EXCHANGE 001 self-test passed");
