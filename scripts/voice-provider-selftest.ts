import assert from "node:assert/strict";
import {
  GENERIC_TTS_PROVIDER,
  providerCapabilityErrors,
  validateVoiceProviderSource,
  wavDurationMs,
} from "../src/lib/voiceProvider";

const admittedGeneric = {
  id: "66666666-6666-4666-8666-666666666666",
  metadata: {
    source: "autodisco_voice_render",
    voice_render_version: "autodisco-voice-render-request/0.1",
  },
  content: {
    kind: "AUTODISCO_VOICE_RENDER_REQUEST_ADMITTED",
    mode: "OBSERVED",
    render_status: "NOT_RENDERED",
    broadcast_status: "NOT_BROADCAST",
    request: {
      version: "autodisco-voice-render-request/0.1",
      source_receipt_uri: "ledger://events/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      source_text_hash: "c".repeat(64),
      render_kind: "GENERIC_NARRATION",
      requested_voice: { label: null },
      inherited_permissions: {
        authorized: true,
        broadcast: true,
        edit: false,
        synthetic_voice: false,
        training: false,
        commercial: false,
      },
      station_receipt_uri: "ledger://events/22222222-2222-4222-8222-222222222222",
      station_packet_hash: "b".repeat(64),
      status: "ADMITTED",
    },
  },
};

const generic = validateVoiceProviderSource(admittedGeneric);
assert.equal(generic.state, "EXECUTABLE");
if (generic.state !== "EXECUTABLE") process.exit(1);
assert.equal(generic.request.render_kind, "GENERIC_NARRATION");
assert.deepEqual(providerCapabilityErrors(generic.request), []);
assert.equal(GENERIC_TTS_PROVIDER.provider, "google-gemini");
assert.equal(GENERIC_TTS_PROVIDER.model, "gemini-3.8-flash-tts");
assert.equal(GENERIC_TTS_PROVIDER.voice, "Kore");

assert.equal(
  validateVoiceProviderSource({
    ...admittedGeneric,
    content: { ...admittedGeneric.content, kind: "AUTODISCO_VOICE_RENDER_REFUSED" },
  }).state,
  "REFUSED",
);

assert.equal(
  validateVoiceProviderSource({
    ...admittedGeneric,
    content: { ...admittedGeneric.content, render_status: "RENDERED" },
  }).state,
  "REFUSED",
);

assert.equal(
  validateVoiceProviderSource({
    ...admittedGeneric,
    metadata: { ...admittedGeneric.metadata, source: "manual_ledger_write" },
  }).state,
  "REFUSED",
);

const humanSynth = validateVoiceProviderSource({
  ...admittedGeneric,
  content: {
    ...admittedGeneric.content,
    request: {
      ...admittedGeneric.content.request,
      render_kind: "HUMAN_VOICE_SYNTHESIS",
      requested_voice: { label: "Human Performer" },
      inherited_permissions: {
        ...admittedGeneric.content.request.inherited_permissions,
        synthetic_voice: true,
      },
    },
  },
});
assert.equal(humanSynth.state, "EXECUTABLE");
if (humanSynth.state === "EXECUTABLE") {
  assert.ok(providerCapabilityErrors(humanSynth.request).length > 0);
}

assert.equal(
  validateVoiceProviderSource({
    ...admittedGeneric,
    content: {
      ...admittedGeneric.content,
      request: {
        ...admittedGeneric.content.request,
        render_kind: "HUMAN_VOICE_SYNTHESIS",
        requested_voice: { label: "Human Performer" },
      },
    },
  }).state,
  "REFUSED",
);

function oneSecondWav(): Uint8Array {
  const dataSize = 48_000;
  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);
  const writeAscii = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) bytes[offset + i] = value.charCodeAt(i);
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 24_000, true);
  view.setUint32(28, 48_000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, dataSize, true);
  return bytes;
}

assert.equal(wavDurationMs(oneSecondWav()), 1000);
assert.equal(wavDurationMs(new Uint8Array([1, 2, 3])), null);

console.log("VOICE PROVIDER 001 self-test passed");
