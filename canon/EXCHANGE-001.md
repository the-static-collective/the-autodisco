# EXCHANGE 001 — Bounded Dialogue After First Listen

Status: **implemented boundary / first post-seal dialogue slice**

## One sentence

Two preserved first interpretations may meet only after Pair Listen marks them ready, and each listener gets one descendant reply without rewriting, ranking, or merging the originals.

## Crossing

```text
FIRST A SEALED     FIRST B SEALED
       \             /
        PAIR READY
            ↓
      EXCHANGE OPENED
        ↓         ↓
    REPLY A     REPLY B
        \         /
       EXCHANGE CLOSED
```

## Source law

Exchange opens only from a local `AUTODISCO_PAIR_READY_FOR_EXCHANGE` receipt emitted by Pair Listen.

The ready receipt must still carry:

```text
broadcast_status: NOT_BROADCAST
```

and exactly two distinct sealed first-response receipts.

Each first response must remain:

```text
AUTODISCO_FIRST_RESPONSE_SEALED
mode: INTERPRETATION
sealed: true
```

Both must belong to the same pair, come from distinct sessions/slots, and retain the same station receipt and station-packet hash.

## Reveal law

Pair Listen does not expose the other first response.

Exchange is the first crossing allowed to return both sealed first-response texts together.

That reveal does not modify either source receipt.

First response remains first response.

Exchange is a descendant.

## Reply law

Exchange 001 permits at most one textual reply from each preserved listener session.

Each reply is:

```text
AUTODISCO_EXCHANGE_REPLY
mode: INTERPRETATION
broadcast_status: NOT_BROADCAST
```

It preserves:

- exchange ancestry;
- pair ancestry;
- station ancestry;
- listener/session identity;
- its source first-response receipt;
- station packet hash.

A reply is not a replacement for the first response.

## No-collapse law

Exchange 001 produces no:

- winner;
- ranking;
- consensus;
- merged interpretation;
- AI summary injected between the two readings;
- canon admission;
- broadcast.

Difference survives the meeting.

## Closure

After both distinct sessions have one exchange reply, Autodisco appends:

```text
AUTODISCO_EXCHANGE_CLOSED
```

The close receipt references the two descendant reply receipts without merging their text.

Closing means only that the bounded v0.1 dialogue completed.

## Next crossings

**VOICE RENDER 001** may render a contribution only when its inherited permission envelope explicitly authorizes the requested transformation.

**BROADCAST RECEIPT 001** may later record an actual airing as a separate occurrence.

Neither is implied by exchange closure.
