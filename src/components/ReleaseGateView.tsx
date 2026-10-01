import React, { useMemo, useState } from "react";
import { CheckCircle, ClipboardCheck, LockKeyhole, Radio, ShieldAlert } from "lucide-react";
import { ownerFetch } from "../lib/supabaseClient";
import { validateReturnAddressRelease } from "../lib/releaseGate";

const SAMPLE_PACKET = {
  version: "return-address-release/0.1",
  source: "RETURN_ADDRESS",
  artifact: {
    sha256: "0000000000000000000000000000000000000000000000000000000000000000",
    filename: "voice-letter.wav",
  },
  lineage: {
    capture_event_id: "replace-with-capture-event-id",
    handoff_event_id: null,
    return_event_id: null,
    decision_event_id: null,
  },
  release: {
    authorized: false,
    broadcast: false,
    edit: false,
    synthetic_voice: false,
    training: false,
    commercial: false,
  },
  performer: {
    label: "replace-with-performer-label",
  },
  note: "Optional owner note. This declaration does not itself prove legal ownership or license validity.",
};

export default function ReleaseGateView() {
  const [raw, setRaw] = useState(() => JSON.stringify(SAMPLE_PACKET, null, 2));
  const [receipt, setReceipt] = useState<string | null>(null);
  const [admitting, setAdmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    try {
      return { value: JSON.parse(raw), error: null as string | null };
    } catch (err: any) {
      return { value: null, error: err.message || "Invalid JSON" };
    }
  }, [raw]);

  const validation = useMemo(
    () =>
      parsed.error
        ? { state: "HELD" as const, errors: [parsed.error], packet: null }
        : validateReturnAddressRelease(parsed.value),
    [parsed],
  );

  const state = receipt ? "ADMITTED" : validation.state;

  async function admit() {
    if (validation.state !== "RELEASABLE") return;

    setAdmitting(true);
    setServerError(null);
    setReceipt(null);

    try {
      const response = await ownerFetch("/api/release-gate/admit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packet: validation.packet }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.errors?.join(" · ") || data?.error || "Release admission failed.");
      }

      setReceipt(data.receiptUri ?? null);
    } catch (err: any) {
      setServerError(err.message || "Release admission failed.");
    } finally {
      setAdmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
        <div className="flex items-start justify-between gap-4 border-b border-[#141414] pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-[#F27D26]" />
              Release Gate 001
            </h2>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-stone-600">
              RETURN ADDRESS → declared release → Autodisco ledger
            </p>
          </div>
          <span
            className={`px-2 py-1 border text-[9px] font-mono font-bold uppercase tracking-widest ${
              state === "ADMITTED"
                ? "border-emerald-700 text-emerald-800 bg-emerald-50"
                : state === "RELEASABLE"
                  ? "border-[#F27D26] text-[#F27D26] bg-white"
                  : "border-stone-500 text-stone-600 bg-white"
            }`}
          >
            {state}
          </span>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_240px]">
          <div>
            <label className="text-[9px] font-mono font-bold uppercase tracking-widest">
              Release packet JSON
            </label>
            <textarea
              value={raw}
              onChange={(event) => {
                setRaw(event.target.value);
                setReceipt(null);
                setServerError(null);
              }}
              rows={22}
              spellCheck={false}
              className="mt-2 w-full border border-[#141414] bg-white p-3 font-mono text-[10px] leading-relaxed text-[#141414] focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
            />
          </div>

          <aside className="space-y-3">
            <div className="border border-[#141414] bg-white p-3">
              <p className="text-[9px] font-mono font-bold uppercase tracking-widest">Gate law</p>
              <div className="mt-2 space-y-1 text-[9px] font-mono uppercase tracking-wide text-stone-600">
                <p>SEND ≠ PUBLISH</p>
                <p>RETURN ≠ RELEASE</p>
                <p>VOICE ≠ LICENSE</p>
                <p>PERFORMANCE ≠ CHARACTER</p>
                <p>PRIVATE RELATION ≠ BROADCAST AUTHORITY</p>
              </div>
            </div>

            <div className="border border-[#141414] bg-[#D1CFC9] p-3">
              <p className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Required
              </p>
              <div className="mt-2 space-y-1 text-[9px] font-mono text-stone-700">
                <p>full SHA-256</p>
                <p>capture lineage anchor</p>
                <p>performer attribution</p>
                <p>authorized = true</p>
                <p>broadcast = true</p>
              </div>
            </div>

            <button
              onClick={() => void admit()}
              disabled={validation.state !== "RELEASABLE" || admitting}
              className="w-full border border-[#141414] bg-[#141414] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {admitting ? "Appending receipt…" : "Admit to release ledger"}
            </button>
          </aside>
        </div>
      </section>

      {validation.state === "HELD" && (
        <section className="border-2 border-stone-500 bg-white p-4">
          <h3 className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-stone-700">
            <ShieldAlert className="h-4 w-4" />
            Held at gate
          </h3>
          <ul className="mt-2 space-y-1 font-mono text-[10px] text-stone-600">
            {validation.errors.map((error) => (
              <li key={error}>— {error}</li>
            ))}
          </ul>
        </section>
      )}

      {validation.state === "RELEASABLE" && !receipt && (
        <section className="border-2 border-[#F27D26] bg-white p-4">
          <h3 className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#F27D26]">
            <Radio className="h-4 w-4" />
            Releasable, not broadcast
          </h3>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-stone-600">
            The packet explicitly declares release and broadcast permission. Admission creates an OBSERVED ledger receipt only.
            It does not queue a show, synthesize a voice, train a model, mutate canon, or prove legal rights.
          </p>
        </section>
      )}

      {receipt && (
        <section className="border-2 border-emerald-700 bg-emerald-50 p-4">
          <h3 className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-800">
            <CheckCircle className="h-4 w-4" />
            Admitted
          </h3>
          <p className="mt-2 break-all font-mono text-[10px] text-emerald-900">{receipt}</p>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-emerald-800">
            Eligible for downstream station consideration · broadcast has not occurred
          </p>
        </section>
      )}

      {serverError && (
        <section className="border-2 border-red-700 bg-red-50 p-4 font-mono text-[10px] text-red-800">
          {serverError}
        </section>
      )}
    </div>
  );
}
