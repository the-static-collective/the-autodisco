# PAIR LISTEN 001 — Two First Hearings Before Meeting

Status: **implemented boundary / first isolated-listening slice**

## One sentence

Two listeners receive the same bounded station packet independently, seal their first responses without seeing each other, and only then become eligible for a later exchange.

## Crossing

```text
AUTODISCO_STATION_PACKET_ASSEMBLED
          ↓
     PAIR OPENED
       ↙     ↘
LISTENER A  LISTENER B
   ↓           ↓
FIRST A      FIRST B
 SEALED       SEALED
       ↘     ↙
PAIR READY FOR EXCHANGE
```

Nothing in this crossing broadcasts.

Nothing in this crossing opens the exchange.

## Source law

The source must be a local `AUTODISCO_STATION_PACKET_ASSEMBLED` receipt emitted by Broadcast Gate and still marked:

```text
broadcast_status: NOT_BROADCAST
```

Both sessions inherit the exact same bounded station packet and the same SHA-256 packet hash.

## Isolation law

Each session receives:

```text
catalog_access: false
prior_broadcast_access: false
```

The pair surface does not reveal either sealed first-response text to the other side.

One sealed response is insufficient to open exchange readiness.

Two distinct session IDs must each seal exactly one first response.

## First-response law

A first response is recorded as:

```text
AUTODISCO_FIRST_RESPONSE_SEALED
mode: INTERPRETATION
sealed: true
broadcast_status: NOT_BROADCAST
```

It preserves:

- pair ancestry;
- station receipt ancestry;
- exact station-packet hash;
- listener slot and session ID;
- listener label;
- response text;
- model/provider/version when supplied;
- timestamp.

The response is interpretation only.

It is not song metadata, artist statement, canon, fact, training permission, or broadcast.

## Readiness law

After every new seal, Autodisco re-reads the pair's child receipts from the ledger before deciding readiness.

This prevents near-simultaneous first responses from stranding the pair in a false one-response state.

When both distinct sessions are sealed, Autodisco appends:

```text
AUTODISCO_PAIR_READY_FOR_EXCHANGE
```

The readiness receipt points to the pair and the first-response receipts, but does not include response text.

Readiness means only:

> a later exchange crossing is now allowed to exist.

## Next crossing

**EXCHANGE 001** may reveal the two sealed interpretations to one another and permit a short bounded dialogue.

That future crossing must remain separate from Pair Listen.

The station remembers.

The DJs arrive.
