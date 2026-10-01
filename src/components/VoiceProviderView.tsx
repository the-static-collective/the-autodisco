import React, { useMemo, useState } from "react";
import { AudioLines, CheckCircle, PlayCircle, ShieldX } from "lucide-react";
import { ownerFetch } from "../lib/supabaseClient";
import { parseLedgerEventId } from "../lib/stationPacket";

type RenderArtifact = {
  storage: "inline-ledger-base64";
  encoding: "base64";
  mime_type: string;
  byte_length: number;
  duration_ms: number | null;
  sha256: string;
  data: string;
};

type ProviderResult = {
  state: "RENDERED" | "REFUSED";
  receiptUri: string;
  artifact?: RenderArtifact | null;
  provider?: {
    name: string;
    model: string;
    model_version: string;
    voice: string;
  } | null;
  errors?: string[];
  renderStatus: "RENDERED" | "NOT_RENDERED";
  broadcastStatus: "NOT_BROADCAST";
  replayedExistingReceipt?: boolean;
};

export default function VoiceProviderView() {
  const [renderReceipt, setRenderReceipt] = useState("");
  const [result, setResult] = useState<ProviderResult | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderId = useMemo(() => parseLedgerEventId(renderReceipt), [renderReceipt]);

  async function execute() {
    if (!renderId) return;

    setWorking(true);
    setResult(null);
    setError(null);

    try {
      const response = await ownerFetch("/api/voice-provider/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renderReceipt }),
      });
      const data = await response.json();

      if (!response.ok && data?.state !== "REFUSED") {
        throw new Error(data?.errors?.join(" · ") || data?.error || "Voice provider execution failed.");
      }

      setResult(data as ProviderResult);
    } catch (err: any) {
      setError(err.message || "Voice provider execution failed.");
    } finally {
      setWorking(false);
    }
  }

  const audioSrc =
    result?.state === "RENDERED" && result.artifact?.data
      ? `data:${result.artifact.mime_type};base64,${result.artifact.data}`
      : null;

  return (
    <div className="space-y-4">
      <section className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
        <div className="flex items-start justify-between gap-4 border-b border-[#141414] pb-3">
          <div>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <AudioLines className="h-4 w-4 text-[#F27D26]" />
              Voice Provider 001
            </h2>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-stone-600">
              admitted render request → provider → hashed audio descendant
            </p>
          </div>
          <span className="border border-[#141414] bg-white px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest">
            {result?.state ?? "AWAITING REQUEST"}
          </span>
        </div>

        <div className="mt-4 flex gap-3">
          <input
            value={renderReceipt}
            onChange={(event) => {
              setRenderReceipt(event.target.value);
              setResult(null);
              setError(null);
            }}
            placeholder="ledger://events/<admitted-voice-render-request>"
            className="min-w-0 flex-1 border border-[#141414] bg-white p-2.5 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
          />
          <button
            onClick={() => void execute()}
            disabled={!renderId || working}
            className="border border-[#141414] bg-[#141414] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] disabled:opacity-35"
          >
            {working ? "Rendering…" : "Execute provider"}
          </button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="border border-[#141414] bg-white p-3">
            <p className="text-[9px] font-mono font-bold uppercase tracking-widest">
              Provider 001 capability
            </p>
            <p className="mt-1 font-mono text-[9px] leading-relaxed text-stone-600">
              Generic narration only. Gemini prebuilt voice. No human identity claim.
            </p>
          </div>
          <div className="border border-[#141414] bg-white p-3">
            <p className="text-[9px] font-mono font-bold uppercase tracking-widest">
              Deliberate refusal
            </p>
            <p className="mt-1 font-mono text-[9px] leading-relaxed text-stone-600">
              Human-voice synthesis stays refused until an identity-bound provider with its own consent path exists.
            </p>
          </div>
        </div>
      </section>

      {result?.state === "RENDERED" && result.artifact && (
        <section className="border-2 border-emerald-700 bg-emerald-50 p-4">
          <h3 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-800">
            <CheckCircle className="h-4 w-4" />
            Audio descendant rendered
          </h3>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-emerald-700 bg-white p-2">
              <p className="font-mono text-[8px] uppercase text-emerald-700">provider</p>
              <p className="mt-1 font-mono text-[9px]">{result.provider?.name}</p>
            </div>
            <div className="border border-emerald-700 bg-white p-2">
              <p className="font-mono text-[8px] uppercase text-emerald-700">model</p>
              <p className="mt-1 break-all font-mono text-[9px]">{result.provider?.model}</p>
            </div>
            <div className="border border-emerald-700 bg-white p-2">
              <p className="font-mono text-[8px] uppercase text-emerald-700">bytes</p>
              <p className="mt-1 font-mono text-[9px]">{result.artifact.byte_length}</p>
            </div>
            <div className="border border-emerald-700 bg-white p-2">
              <p className="font-mono text-[8px] uppercase text-emerald-700">duration</p>
              <p className="mt-1 font-mono text-[9px]">
                {result.artifact.duration_ms === null ? "unknown" : `${result.artifact.duration_ms} ms`}
              </p>
            </div>
          </div>

          {audioSrc && (
            <div className="mt-4 border border-emerald-700 bg-white p-3">
              <p className="mb-2 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-800">
                <PlayCircle className="h-4 w-4" />
                Rendered artifact
              </p>
              <audio controls src={audioSrc} className="w-full" />
            </div>
          )}

          <p className="mt-3 break-all font-mono text-[8px] text-emerald-900">
            sha256 · {result.artifact.sha256}
          </p>
          <p className="mt-1 break-all font-mono text-[8px] text-emerald-900">
            receipt · {result.receiptUri}
          </p>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-emerald-800">
            RENDERED · NOT_BROADCAST
            {result.replayedExistingReceipt ? " · existing receipt replayed" : ""}
          </p>
        </section>
      )}

      {result?.state === "REFUSED" && (
        <section className="border-2 border-red-700 bg-red-50 p-4">
          <h3 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-red-800">
            <ShieldX className="h-4 w-4" />
            Provider refused
          </h3>
          {result.receiptUri && (
            <p className="mt-2 break-all font-mono text-[9px] text-red-900">{result.receiptUri}</p>
          )}
          <ul className="mt-3 space-y-1 font-mono text-[9px] text-red-800">
            {(result.errors || []).map((item) => (
              <li key={item}>— {item}</li>
            ))}
          </ul>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-red-800">
            NOT_RENDERED · NOT_BROADCAST
          </p>
        </section>
      )}

      {error && (
        <section className="border-2 border-red-700 bg-red-50 p-4 font-mono text-[10px] text-red-800">
          {error}
        </section>
      )}
    </div>
  );
}
