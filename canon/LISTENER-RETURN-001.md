# LISTENER RETURN 001 — Carry the Human Response Home

Status: **implemented return-mail boundary / portable packet only**

## One sentence

A human response that occurs after a recorded broadcast becomes a new attributable correspondence packet that can travel back to RETURN ADDRESS without inheriting publication, synthesis, training, endorsement, or canon authority.

## Long loop

```text
MAIL
→ RELEASE
→ STATION
→ HEARING
→ EXCHANGE
→ RENDER
→ BROADCAST
→ HUMAN RETURN
        ↓
   RETURN ADDRESS
```

## Core law

```text
BROADCAST != RESPONSE
RESPONSE != APPROVAL
RESPONSE != CANON
LISTENER != AUDIENCE SEGMENT
RETURN != RELEASE
```

A listener response is a new human occurrence.

It does not retroactively change what the broadcast meant.

## Source law

Listener Return accepts only a recognized:

```text
AUTODISCO_BROADCAST_RECORDED
mode: OBSERVED
broadcast_status: BROADCAST_RECORDED
```

emitted by Broadcast Receipt 001.

The source, station, and release URIs carried inside the broadcast receipt must agree with the ledger parent metadata.

A right-looking receipt with mismatched ancestry is refused.

The return must also be temporally downstream of the broadcast occurrence. If the broadcast has a completion timestamp, `captured_at` may not precede it; otherwise it may not precede the broadcast start.

## Packet

Successful capture produces:

```text
listener-return/0.1
source: AUTODISCO_BROADCAST
semantic_effect: none
```

The packet carries:

- broadcast receipt URI;
- source receipt URI;
- station receipt URI;
- RETURN ADDRESS release receipt URI;
- human-readable listener attribution;
- exact capture timestamp;
- either verbatim text or an audio artifact reference.

## Text law

For a text response:

- non-whitespace content is required;
- the original string is preserved verbatim;
- leading/trailing whitespace and line breaks are not normalized away;
- no sentiment label is added;
- no summary is added;
- no interpretation is added.

## Audio law

For an audio response:

- a full SHA-256 is required;
- filename is optional;
- audio bytes are not copied in v0.1;
- no transcript is inferred;
- no voice identity/license is inferred.

## Receipt

Autodisco appends:

```text
AUTODISCO_LISTENER_RETURN_CAPTURED
mode: OBSERVED
release_status: UNRELEASED
semantic_effect: none
```

The ledger occurrence preserves the entire return packet and lineage.

The receipt explicitly grants no:

- publication authority;
- editing authority;
- commercial authority;
- synthesis authority;
- training authority;
- rebroadcast authority;
- endorsement status;
- canon status.

## Portability

The owner-facing Listener Return surface can:

- copy the packet as JSON;
- export `listener-return-001.json`.

No direct Groove Rooms or RETURN ADDRESS database write occurs in v0.1.

The packet is mail.

The next system may choose whether to admit it.

## Closing law

> The loop closes without eating its history.

Human return becomes new correspondence, not proof that the previous cycle succeeded.
