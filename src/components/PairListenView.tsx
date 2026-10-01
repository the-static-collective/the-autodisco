import React, { useMemo, useState } from "react";
import { Headphones, Lock, RadioTower, SealCheck, Users } from "lucide-react";
import { ownerFetch } from "../lib/supabaseClient";
import { parseLedgerEventId } from "../lib/stationPacket";

type PairDescriptor = {
  station_receipt_uri: string;
  station_packet_hash: string;
  sessions: [
    {
      slot: "A";
      session_id: string;
      listener_label: string;
      catalog_access: false;
      prior_broadcast_access: false;
    },
    {
      slot: "B";
      session_id: string;
      listener_label: string;
      catalog_access: false;
      prior_broadcast_access: false;
    },
  ];
};

type PairOpenResult = {
  state: "PAIR_OPENED";
  receiptUri: string;
  pairEventId: string;
  descriptor: PairDescriptor;
  exchangeReady: false;
  broadcastStatus: "NOT_BROADCAST";
};

type SealedState = {
  A: boolean;
  B: boolean;
};

export default function PairListenView() {
  const [stationReceipt, setStationReceipt] = useState("");
  const [listenerA, setListenerA] = useState("Listener A");
  const [listenerB, setListenerB] = useState("Listener B");
  const [pair, setPair] = useState<PairOpenResult | null>(null);
  const [responseA, setResponseA] = useState("");
  const [responseB, setResponseB] = useState("");
  const [sealed, setSealed] = useState<SealedState>({ A: false, B: false });
  const [exchangeReady, setExchangeReady] = useState(false);
  const [readyReceipt, setReadyReceipt] = useState<string | null>(null);
  const [working, setWorking] = useState<"open" | "A" | "B" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stationId = useMemo(() => parseLedgerEventId(stationReceipt), [stationReceipt]);

  async function openPair() {
    if (!stationId || !listenerA.trim() || !listenerB.trim()) return;

    setWorking("open");
    setError(null);
    setPair(null);
    setSealed({ A: false, B: false });
    setExchangeReady(false);
    setReadyReceipt(null);
    setResponseA("");
    setResponseB("");

    try {
      const response = await ownerFetch("/api/pair-listen/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationReceipt,
          listenerA: listenerA.trim(),
          listenerB: listenerB.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.errors?.join(" · ") || data?.error || "Could not open Pair Listen.");
      }
      setPair(data as PairOpenResult);
    } catch (err: any) {
      setError(err.message || "Could not open Pair Listen.");
    } finally {
      setWorking(null);
    }
  }

  async function seal(slot: "A" | "B") {
    if (!pair || sealed[slot]) return;

    const session = pair.descriptor.sessions.find((item) => item.slot === slot);
    const text = slot === "A" ? responseA.trim() : responseB.trim();
    if (!session || !text) return;

    setWorking(slot);
    setError(null);

    try {
      const response = await ownerFetch("/api/pair-listen/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairReceipt: pair.receiptUri,
          sessionId: session.session_id,
          text,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.errors?.join(" · ") || data?.error || "Could not seal first response.");
      }

      setSealed((current) => ({ ...current, [slot]: true }));
      if (slot === "A") setResponseA("");
      if (slot === "B") setResponseB("");
      setExchangeReady(data.exchangeReady === true);
      setReadyReceipt(data.readyReceiptUri ?? null);
    } catch (err: any) {
      setError(err.message || "Could not seal first response.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
        <div className="flex items-start justify-between gap-4 border-b border-[#141414] pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Headphones className="h-4 w-4 text-[#F27D26]" />
              Pair Listen 001
            </h2>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-stone-600">
              same station packet · independent first hearing · sealed before meeting
            </p>
          </div>
          <span className="border border-[#141414] bg-white px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest">
            {exchangeReady ? "READY FOR EXCHANGE" : pair ? "PAIR OPEN" : "AWAITING STATION PACKET"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
          <input
            value={stationReceipt}
            onChange={(event) => {
              setStationReceipt(event.target.value);
              setPair(null);
              setSealed({ A: false, B: false });
              setExchangeReady(false);
              setReadyReceipt(null);
              setError(null);
            }}
            placeholder="ledger://events/<station-packet-receipt>"
            className="border border-[#141414] bg-white p-2.5 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
          />
          <input
            value={listenerA}
            onChange={(event) => setListenerA(event.target.value)}
            disabled={!!pair}
            className="border border-[#141414] bg-white p-2.5 font-mono text-[10px] disabled:bg-stone-100"
            aria-label="Listener A label"
          />
          <input
            value={listenerB}
            onChange={(event) => setListenerB(event.target.value)}
            disabled={!!pair}
            className="border border-[#141414] bg-white p-2.5 font-mono text-[10px] disabled:bg-stone-100"
            aria-label="Listener B label"
          />
          <button
            onClick={() => void openPair()}
            disabled={!stationId || !listenerA.trim() || !listenerB.trim() || !!pair || working === "open"}
            className="border border-[#141414] bg-[#141414] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] disabled:opacity-35"
          >
            {working === "open" ? "Opening…" : "Open pair"}
          </button>
        </div>

        {stationReceipt.trim() && !stationId && (
          <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-red-700">
            Station receipt must be a ledger event UUID or ledger://events/&lt;uuid&gt; URI.
          </p>
        )}
      </section>

      {pair && (
        <section className="border-2 border-[#141414] bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {pair.descriptor.sessions.map((session) => {
              const slot = session.slot;
              const isSealed = sealed[slot];
              const text = slot === "A" ? responseA : responseB;
              const setText = slot === "A" ? setResponseA : setResponseB;

              return (
                <div key={session.session_id} className="border border-[#141414] bg-[#E4E3E0] p-4">
                  <div className="flex items-start justify-between gap-3 border-b border-[#141414]/30 pb-2">
                    <div>
                      <p className="text-[9px] font-mono font-bold uppercase tracking-widest">
                        Listener {slot} · {session.listener_label}
                      </p>
                      <p className="mt-1 break-all font-mono text-[8px] text-stone-600">
                        session {session.session_id}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 border border-[#141414] bg-white px-2 py-1 text-[8px] font-mono uppercase tracking-widest">
                      {isSealed ? <SealCheck className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {isSealed ? "SEALED" : "ISOLATED"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 font-mono text-[8px] uppercase tracking-wide text-stone-600">
                    <p>catalog access: false</p>
                    <p>prior broadcast access: false</p>
                    <p>response mode: INTERPRETATION</p>
                  </div>

                  {!isSealed ? (
                    <>
                      <textarea
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        rows={8}
                        placeholder="First response. The other listener's response is not available here."
                        className="mt-3 w-full border border-[#141414] bg-white p-3 font-mono text-[10px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                      />
                      <button
                        onClick={() => void seal(slot)}
                        disabled={!text.trim() || working === slot}
                        className="mt-2 w-full border border-[#141414] bg-[#141414] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-[#E4E3E0] disabled:opacity-35"
                      >
                        {working === slot ? "Sealing…" : "Seal first response"}
                      </button>
                    </>
                  ) : (
                    <div className="mt-3 border border-[#141414] bg-white p-3">
                      <p className="font-mono text-[9px] uppercase tracking-wide text-stone-600">
                        First response sealed. Its text is intentionally not resurfaced in the pair view before exchange.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-[#141414] pt-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wide text-stone-600">
                station packet hash
              </p>
              <p className="mt-1 break-all font-mono text-[9px] text-[#141414]">
                {pair.descriptor.station_packet_hash}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#F27D26]" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
                {sealed.A ? "A sealed" : "A open"} · {sealed.B ? "B sealed" : "B open"}
              </span>
            </div>
          </div>
        </section>
      )}

      {exchangeReady && (
        <section className="border-2 border-emerald-700 bg-emerald-50 p-4">
          <h3 className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-800">
            <RadioTower className="h-4 w-4" />
            Pair ready for a later exchange crossing
          </h3>
          {readyReceipt && (
            <p className="mt-2 break-all font-mono text-[9px] text-emerald-900">{readyReceipt}</p>
          )}
          <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-emerald-800">
            Both first responses exist and remain sealed. No exchange has opened. Nothing has broadcast.
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
