# BROADCAST GATE 001 — Release Receipt → Station Packet

Status: **implemented boundary / first station-preparation slice**

## One sentence

Autodisco may assemble a station packet only from a locally admitted RETURN ADDRESS release receipt whose explicit permission envelope still authorizes broadcast consideration.

## Crossing

```text
RETURN_ADDRESS_RELEASE_ADMITTED
        ↓
verify local receipt
        ↓
preserve exact permission envelope
        ↓
AUTODISCO_STATION_PACKET_ASSEMBLED
        ↓
NOT_BROADCAST
```

A station packet is prepared context.

It is not airplay.

## Input law

The source ledger occurrence must:

- live in the current Autodisco space;
- be `RETURN_ADDRESS_RELEASE_ADMITTED`;
- remain `OBSERVED`;
- retain a full source SHA-256;
- retain performer attribution;
- retain the complete explicit permission envelope;
- retain the external capture lineage;
- explicitly permit both release and broadcast consideration.

Any missing requirement is a refusal, not an invitation to infer.

## Permission law

Station assembly preserves the permission envelope exactly.

```text
authorized
broadcast
edit
synthetic_voice
training
commercial
```

No downstream convenience may widen those booleans.

In particular:

```text
synthetic_voice: false
```

cannot become permission to render synthetic speech.

And:

```text
training: false
```

cannot become permission to train or adapt a model.

## First station role

v0.1 supports one role:

```text
human_interstitial
```

Its default memory boundary is:

```text
catalog_access: false
prior_broadcast_access: false
```

That makes the station packet compatible with a future first-listen process without silently granting catalog memory.

## Receipt

Successful assembly appends:

```text
AUTODISCO_STATION_PACKET_ASSEMBLED
```

linked to the admitted release receipt.

The receipt explicitly records:

```text
broadcast_status: NOT_BROADCAST
```

No playlist insertion, DJ generation, voice synthesis, training, Suno task, Hive broadcast, or Codex admission occurs here.

## Next crossing

**PAIR LISTEN 001** may consume one bounded station packet.

Two isolated listener sessions encounter the same packet separately.

Their first responses are sealed before either sees the other's response.

Only after both first responses exist may a later exchange be opened.

The station remembers.

The DJs arrive.
