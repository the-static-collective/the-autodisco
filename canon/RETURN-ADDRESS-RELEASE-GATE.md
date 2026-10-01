# RELEASE GATE 001 — RETURN ADDRESS → Autodisco

Status: **implemented boundary / first vertical slice**

## One sentence

Autodisco may consider a human voice-letter descendant for broadcast only after an owner explicitly admits a bounded RETURN ADDRESS release packet into the append-only ledger.

## Governing law

```text
SEND != PUBLISH
RETURN != RELEASE
VOICE != LICENSE
PERFORMANCE != CHARACTER
PRIVATE RELATION != BROADCAST AUTHORITY
```

RETURN ADDRESS is correspondence.

Autodisco is broadcast infrastructure.

The release gate is the crossing between them.

## States

### HELD

The packet exists but does not satisfy the release contract.

Typical reasons:

- no explicit release authorization;
- no explicit broadcast authorization;
- no full source hash;
- no capture lineage anchor;
- no human-readable performer attribution.

HELD material must not be treated as broadcast-eligible.

### RELEASABLE

The packet satisfies the deterministic v0.1 contract:

- `release.authorized === true`;
- `release.broadcast === true`;
- source SHA-256 is present;
- capture lineage is present;
- performer attribution is present.

RELEASABLE still does not mean broadcast.

### ADMITTED

The owner deliberately crosses the gate.

Autodisco appends a `RETURN_ADDRESS_RELEASE_ADMITTED` receipt to the shared ledger and returns a `ledger://events/<id>` URI.

The receipt is `OBSERVED`: it records that an attributable release declaration was admitted.

It does not prove legal ownership or license validity.

It does not imply synthetic-voice permission, training permission, editing permission, commercial permission, canon admission, or completed broadcast unless those separate facts are established elsewhere.

## Permission envelope

Omitted optional permissions fail closed.

```text
edit            default false
synthetic_voice default false
training        default false
commercial      default false
```

Authorization to broadcast does not silently imply any of them.

## Lineage

The release receipt preserves the declared RETURN ADDRESS ancestry:

```text
capture_event_id
handoff_event_id?
return_event_id?
decision_event_id?
```

The Autodisco ledger receipt may point its `parent_event_id` at the external capture event.

If that parent does not exist in the local ledger, lineage traversal should expose a missing boundary rather than fabricate continuity.

## First-Listen relationship

RELEASE GATE 001 does not place material into a station playlist.

A later **BROADCAST GATE 001** may consume only admitted release receipts and construct the bounded listening packet required by First-Listen Radio.

That future crossing should preserve:

- source release receipt;
- approved audio descendant;
- character/voice separation;
- human-root voice authority;
- model/provider/version if synthesis is separately authorized;
- final rendered output hash;
- broadcast position.

## Canon compression

> Correspondence may knock. Release opens the station door. Broadcast is another crossing.
