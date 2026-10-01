import React, { useMemo, useState } from "react";
import { AudioLines, CheckCircle, ShieldX } from "lucide-react";
import { ownerFetch } from "../lib/supabaseClient";
import { parseLedgerEventId } from "../lib/stationPacket";
import type { VoiceRenderKind } from "../lib/voiceRender";

type VoiceRenderResult = {
  state: "ADMITTED" | "REFUSED";
  receiptUri: string;
  sourceTextHash: string | null;
  inheritedPermissions: {
    authorized: boolean;
    broadcast: boolean;
    edit: boolean;
    synthetic_voice: boolean;
    training: boolean;
    commercial: boolean;
  } | null;
  request: unknown;
  errors: string[];
  renderStatus: "NOT_RENDERED";
  broadcastStatus: "NOT_BROADCAST";
};

export default function VoiceRenderView() {
  const [sourceReceipt, setSourceReceipt] = useState("");
  const [renderKind, setRenderKind] = useState<VoiceRenderKind>("GENERIC_NARRATION");
  const [requestedVoiceLabel, setRequestedVoiceLabel] = useState("");
  const [result, setResult] = useState<VoiceRenderResult | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceId = useMemo(() => parseLedgerEventId(sourceReceipt), [sourceReceipt]);

  async function submit() {
    if (!sourceId) return;

    setWorking(true);
    setResult(null);
    setError(null);

    try {
      const response = await ownerFetch("/api/voice-render/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceReceipt,
          renderKind,
          requestedVoiceLabel:
            renderKind === "HUMAN_VOICE_SYNTHESIS" ? requestedVoiceLabel.trim() : "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.errors?.join(" · ") || data?.error || "Voice render gate failed.");
      }
      setResult(data as VoiceRenderResult);
    } catch (err: any) {
      setError(err.message || "Voice render gate failed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
        <div className="flex items-start justify-between gap-4 border-b border-[#141414] pb-3">
          <div>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <AudioLines className="h-4 w-4 text-[#F27D26]" />
              Voice Render 001
            </h2>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-stone-600">
              contribution → inherited permissions → refuse or admit request
            </p>
          </div>
          <span className="border border-[#141414] bg-white px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest">
            {result?.state ?? "AWAITING SOURCE"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <input
            value={sourceReceipt}
            onChange={(event) => {
              setSourceReceipt(event.target.value);
              setResult(null);
              setError(null);
            }}
            placeholder="ledger://events/<first-response-or-exchange-reply>"
            className="border border-[#141414] bg-white p-2.5 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
          />

          <select
            value={renderKind}
            onChange={(event) => {
              const next = event.target.value as VoiceRenderKind;
              setRenderKind(next);
              if (next === "GENERIC_NARRATION") setRequestedVoiceLabel("");
              setResult(null);
            }}
            className="border border-[#141414] bg-white p-2.5 font-mono text-[10px]"
          >
            <option value="GENERIC_NARRATION">GENERIC NARRATION</option>
            <option value="HUMAN_VOICE_SYNTHESIS">HUMAN VOICE SYNTHESIS</option>
          </select>

          <input
            value={requestedVoiceLabel}
            onChange={(event) => {
              setRequestedVoiceLabel(event.target.value);
              setResult(null);
            }}
            disabled={renderKind !== "HUMAN_VOICE_SYNTHESIS"}
            placeholder={
              renderKind === "HUMAN_VOICE_SYNTHESIS"
                ? "authorized performer label"
                : "no named human voice"
            }
            className="border border-[#141414] bg-white p-2.5 font-mono text-[10px] disabled:bg-stone-100 disabled:text-stone-400"
          />

          <button
            onClick={() => void submit()}
            disabled={
              !sourceId ||
              working ||
              (renderKind === "HUMAN_VOICE_SYNTHESIS" && !requestedVoiceLabel.trim())
            }
            className="border border-[#141414] bg-[#141414] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] disabled:opacity-35"
          >
            {working ? "Checking…" : "Run gate"}
          </button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="border border-[#141414] bg-white p-3">
            <p className="text-[9px] font-mono font-bold uppercase tracking-widest">
              Generic narration
            </p>
            <p className="mt-1 font-mono text-[9px] leading-relaxed text-stone-600">
              May not claim, imitate, or imply a specific human voice identity.
            </p>
          </div>
          <div className="border border-[#141414] bg-white p-3">
            <p className="text-[9px] font-mono font-bold uppercase tracking-widest">
              Human voice synthesis
            </p>
            <p className="mt-1 font-mono text-[9px] leading-relaxed text-stone-600">
              Requires synthetic_voice = true and the requested identity must match the authorized performer.
            </p>
          </div>
        </div>
      </section>

      {result?.inheritedPermissions && (
        <section className="border-2 border-[#141414] bg-white p-4">
          <p className="text-[9px] font-mono font-bold uppercase tracking-widest">
            Inherited permission envelope · copied exactly
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(result.inheritedPermissions).map(([key, value]) => (
              <div key={key} className="border border-[#141414] bg-[#E4E3E0] p-2">
                <p className="font-mono text-[8px] uppercase tracking-wide text-stone-600">{key}</p>
                <p className="mt-1 font-mono text-[10px] font-bold">{String(value)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {result?.state === "ADMITTED" && (
        <section className="border-2 border-emerald-700 bg-emerald-50 p-4">
          <h3 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-800">
            <CheckCircle className="h-4 w-4" />
            Render request admitted
          </h3>
          <p className="mt-2 break-all font-mono text-[9px] text-emerald-900">{result.receiptUri}</p>
          {result.sourceTextHash && (
            <p className="mt-2 break-all font-mono text-[8px] text-emerald-900">
              source text sha256 · {result.sourceTextHash}
            </p>
          )}
          <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-emerald-800">
            NOT_RENDERED · NOT_BROADCAST · no provider call occurred
          </p>
        </section>
      )}

      {result?.state === "REFUSED" && (
        <section className="border-2 border-red-700 bg-red-50 p-4">
          <h3 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-red-800">
            <ShieldX className="h-4 w-4" />
            Render request refused
          </h3>
          <p className="mt-2 break-all font-mono text-[9px] text-red-900">{result.receiptUri}</p>
          <ul className="mt-3 space-y-1 font-mono text-[9px] text-red-800">
            {result.errors.map((item) => (
              <li key={item}>— {item}</li>
            ))}
          </ul>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-red-800">
            Refusal is durable · no render request or audio descendant exists
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
