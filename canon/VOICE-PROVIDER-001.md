# VOICE PROVIDER 001 — Permission-Preserving Audio Descendant

Status: **implemented provider boundary / generic narration only**

## One sentence

An admitted Voice Render request may produce audio only after the provider re-validates the original contribution, station packet, permission envelope, render kind, and source-text hash.

## Crossing

```text
AUTODISCO_VOICE_RENDER_REQUEST_ADMITTED
          ↓
re-validate source + station + permissions
          ↓
provider capability
      ↙              ↘
REFUSE          GENERIC TTS
                     ↓
              AUDIO DESCENDANT
                     ↓
          SHA-256 + ledger receipt
```

## Provider 001

v0.1 uses the existing `@google/genai` / `GEMINI_API_KEY` path already present in Autodisco.

```text
provider: google-gemini
model: gemini-3.8-flash-tts
voice: Kore
expected unary output: audio/wav
```

The prebuilt provider voice is treated as generic narration.

It is not labeled as, advertised as, or substituted for the RETURN ADDRESS performer.

## Human voice synthesis

VOICE PROVIDER 001 deliberately has no identity-bound human-voice provider.

Therefore an admitted request with:

```text
render_kind: HUMAN_VOICE_SYNTHESIS
```

is durably refused at provider execution.

`synthetic_voice: true` means the upstream permission gate may admit such a request.

It does not magically create an enrolled provider identity.

A future provider may cross that door only if its provider-native identity/consent mechanism is separately configured and re-verified.

## Revalidation law

Before any paid provider call, Provider 001 re-fetches:

- the admitted Voice Render receipt;
- the original first-response or exchange-reply contribution;
- the exact station receipt.

It recomputes:

- source-text SHA-256;
- station-packet SHA-256.

Then it re-runs the Voice Render permission gate.

If the reconstructed request no longer equals the admitted request, provider execution refuses.

## Artifact

Successful generic narration produces one derived artifact embedded in the append-only ledger receipt.

```text
storage: inline-ledger-base64
encoding: base64
mime_type: provider response mime type
sha256: exact rendered bytes
byte_length: exact rendered bytes
duration_ms: derived from WAV header when available
```

v0.1 intentionally caps:

```text
source text: 700 characters
raw rendered audio: 2 MiB
```

This keeps the first real audio descendant bounded without introducing a second storage system in the same PR.

A later media-storage migration may move bytes elsewhere while preserving this artifact receipt as ancestry.

## Receipt law

Success appends:

```text
AUTODISCO_VOICE_RENDERED
mode: DERIVED
render_status: RENDERED
broadcast_status: NOT_BROADCAST
```

Provider or permission failure may append:

```text
AUTODISCO_VOICE_PROVIDER_REFUSED
render_status: NOT_RENDERED
broadcast_status: NOT_BROADCAST
```

Refusal creates no audio descendant.

## No-collapse law

```text
RENDER REQUEST != RENDERED AUDIO
RENDERED AUDIO != HUMAN PERFORMANCE
RENDERED AUDIO != TRAINING AUTHORITY
RENDERED AUDIO != PUBLICATION
RENDERED AUDIO != BROADCAST
```

## Next crossing

**BROADCAST RECEIPT 001** may record an actual airing of an eligible original-human or rendered descendant.

Actual airing must remain a new occurrence with its own receipt.
