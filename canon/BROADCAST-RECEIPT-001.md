# BROADCAST RECEIPT 001 — Actual Airing as a New Occurrence

Status: **implemented occurrence boundary / no streaming transport**

## One sentence

Autodisco records an actual airing only as a new immutable receipt descended from eligible audio; release, rendering, and scheduling never become broadcast by implication.

## Core law

```text
RELEASED != RENDERED
RENDERED != SCHEDULED
SCHEDULED != BROADCAST
BROADCAST != ENDORSEMENT
```

## Eligible sources

### Original human audio

Original human audio enters Broadcast Receipt 001 through its recognized `AUTODISCO_STATION_PACKET_ASSEMBLED` receipt.

That station packet must still preserve:

- the exact RETURN ADDRESS release receipt URI;
- the original artifact SHA-256;
- the complete permission envelope;
- `authorized: true`;
- `broadcast: true`;
- `broadcast_status: NOT_BROADCAST`.

No synthetic-audio assumption is introduced.

### Rendered audio

Rendered audio enters through a recognized:

```text
AUTODISCO_VOICE_RENDERED
mode: DERIVED
render_status: RENDERED
broadcast_status: NOT_BROADCAST
```

The receipt must still match its station-packet hash and permission envelope and preserve provider/model/version/voice plus exact output SHA-256.

For the v0.1 inline artifact, Broadcast Receipt also recomputes the SHA-256 from the stored rendered bytes and verifies the stored byte length before accepting the source. Metadata alone is insufficient.

## Airing truth

Every broadcast receipt records:

- station label;
- optional show;
- optional slot;
- start timestamp;
- completion state;
- exact bytes-aired SHA-256;
- aired duration when needed;
- source/station/release ancestry.

Completion is one of:

```text
COMPLETE
PARTIAL
INTERRUPTED
```

For `COMPLETE`, the aired-audio hash must equal the full source artifact hash.

For `PARTIAL` or `INTERRUPTED`, the operator must supply:

- SHA-256 of the exact bytes that actually aired;
- positive aired duration in milliseconds.

If the source duration is known, aired duration may not exceed it.

Partial and interrupted broadcasts remain valid truthful occurrences. They are not rewritten as failed complete broadcasts.

## Receipt

Successful recording appends:

```text
AUTODISCO_BROADCAST_RECORDED
mode: OBSERVED
broadcast_status: BROADCAST_RECORDED
endorsement_status: NOT_INFERRED
```

The source event is never rewritten.

The receipt preserves:

- exact source audio hash;
- exact aired audio hash;
- source receipt;
- station receipt;
- release receipt;
- inherited permissions;
- provider metadata when the source was rendered;
- airing details.

## Endorsement law

Recording that audio aired does not imply endorsement by:

- performer;
- station;
- show;
- provider;
- audience.

Broadcast is an occurrence, not a testimonial.

## Next crossing

**LISTENER RETURN 001** may allow an attributable post-broadcast human response to enter RETURN ADDRESS as a new capture.

That closes the long loop without collapsing ancestry:

```text
MAIL
→ RELEASE
→ STATION
→ HEARING
→ EXCHANGE
→ RENDER
→ BROADCAST
→ HUMAN RETURN
```
