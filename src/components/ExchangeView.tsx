import React, { useMemo, useState } from "react";
import { ArrowLeftRight, Lock, MessageSquareReply, SealCheck } from "lucide-react";
import { ownerFetch } from "../lib/supabaseClient";
import { parseLedgerEventId } from "../lib/stationPacket";

type FirstResponse = {
  receipt_uri: string;
  session_id: string;
  listener_slot: "A" | "B";
  listener_label: string;
  text: string;
  station_receipt_uri: string;
  station_packet_hash: string;
};

type ExchangeOpenResult = {
  state: "EXCHANGE_OPENED";
  receiptUri: string;
  exchangeEventId: string;
  descriptor: {
    first_responses: [FirstResponse, FirstResponse];
  };
  broadcastStatus: "NOT_BROADCAST";
};

export default function ExchangeView() {
  const [readyReceipt, setReadyReceipt] = useState("");
  const [exchange, setExchange] = useState<ExchangeOpenResult | null>(null);
  const [replyA, setReplyA] = useState("");
  const [replyB, setReplyB] = useState("");
  const [replied, setReplied] = useState({ A: false, B: false });
  const [closed, setClosed] = useState(false);
  const [closedReceipt, setClosedReceipt] = useState<string | null>(null);
  const [working, setWorking] = useState<"open" | "A" | "B" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readyId = useMemo(() => parseLedgerEventId(readyReceipt), [readyReceipt]);

  async function openExchange() {
    if (!readyId) return;
    setWorking("open");
    setError(null);
    setExchange(null);
    setReplied({ A: false, B: false });
    setClosed(false);
    setClosedReceipt(null);
    setReplyA("");
    setReplyB("");

    try {
      const response = await ownerFetch("/api/exchange/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readyReceipt }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.errors?.join(" · ") || data?.error || "Could not open exchange.");
      }
      setExchange(data as ExchangeOpenResult);
    } catch (err: any) {
      setError(err.message || "Could not open exchange.");
    } finally {
      setWorking(null);
    }
  }

  async function reply(slot: "A" | "B") {
    if (!exchange || replied[slot]) return;
    const first = exchange.descriptor.first_responses.find((item) => item.listener_slot === slot);
    const text = slot === "A" ? replyA.trim() : replyB.trim();
    if (!first || !text) return;

    setWorking(slot);
    setError(null);

    try {
      const response = await ownerFetch("/api/exchange/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchangeReceipt: exchange.receiptUri,
          sessionId: first.session_id,
          text,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.errors?.join(" · ") || data?.error || "Could not record exchange reply.");
      }

      setReplied((current) => ({ ...current, [slot]: true }));
      if (slot === "A") setReplyA("");
      if (slot === "B") setReplyB("");
      setClosed(data.exchangeClosed === true);
      setClosedReceipt(data.closedReceiptUri ?? null);
    } catch (err: any) {
      setError(err.message || "Could not record exchange reply.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414]">
        <div className="flex items-start justify-between gap-4 border-b border-[#141414] pb-3">
          <div>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <ArrowLeftRight className="h-4 w-4 text-[#F27D26]" />
              Exchange 001
            </h2>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-stone-600">
              sealed first hearings meet · one descendant reply each
            </p>
          </div>
          <span className="border border-[#141414] bg-white px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest">
            {closed ? "EXCHANGE CLOSED" : exchange ? "EXCHANGE OPEN" : "AWAITING PAIR READY"}
          </span>
        </div>

        <div className="mt-4 flex gap-3">
          <input
            value={readyReceipt}
            onChange={(event) => {
              setReadyReceipt(event.target.value);
              setExchange(null);
              setClosed(false);
              setClosedReceipt(null);
              setError(null);
            }}
            placeholder="ledger://events/<pair-ready-receipt>"
            className="min-w-0 flex-1 border border-[#141414] bg-white p-2.5 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
          />
          <button
            onClick={() => void openExchange()}
            disabled={!readyId || !!exchange || working === "open"}
            className="border border-[#141414] bg-[#141414] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] disabled:opacity-35"
          >
            {working === "open" ? "Opening…" : "Open exchange"}
          </button>
        </div>
      </section>

      {exchange && (
        <section className="grid gap-3 md:grid-cols-2">
          {exchange.descriptor.first_responses.map((first) => {
            const slot = first.listener_slot;
            const hasReplied = replied[slot];
            const replyText = slot === "A" ? replyA : replyB;
            const setReplyText = slot === "A" ? setReplyA : setReplyB;

            return (
              <article key={first.receipt_uri} className="border-2 border-[#141414] bg-white p-4">
                <div className="flex items-start justify-between gap-3 border-b border-[#141414]/30 pb-2">
                  <div>
                    <p className="text-[9px] font-mono font-bold uppercase tracking-widest">
                      Listener {slot} · {first.listener_label}
                    </p>
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-wide text-stone-500">
                      original first response · immutable
                    </p>
                  </div>
                  <SealCheck className="h-4 w-4 text-[#F27D26]" />
                </div>

                <blockquote className="mt-3 whitespace-pre-wrap border-l-2 border-[#F27D26] pl-3 font-mono text-[10px] leading-relaxed text-[#141414]">
                  {first.text}
                </blockquote>

                {!hasReplied ? (
                  <>
                    <textarea
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      rows={6}
                      placeholder="One bounded reply. This becomes a descendant, not a replacement."
                      className="mt-4 w-full border border-[#141414] bg-[#E4E3E0] p-3 font-mono text-[10px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                    />
                    <button
                      onClick={() => void reply(slot)}
                      disabled={!replyText.trim() || working === slot}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1 border border-[#141414] bg-[#141414] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-[#E4E3E0] disabled:opacity-35"
                    >
                      <MessageSquareReply className="h-3.5 w-3.5" />
                      {working === slot ? "Recording…" : "Record exchange reply"}
                    </button>
                  </>
                ) : (
                  <div className="mt-4 flex items-center gap-2 border border-[#141414] bg-[#E4E3E0] p-3">
                    <Lock className="h-3.5 w-3.5" />
                    <p className="font-mono text-[9px] uppercase tracking-wide">
                      Reply recorded. Exchange 001 allows one descendant reply per listener.
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {closed && (
        <section className="border-2 border-emerald-700 bg-emerald-50 p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-800">
            Exchange closed · both descendant replies recorded
          </p>
          {closedReceipt && (
            <p className="mt-2 break-all font-mono text-[9px] text-emerald-900">{closedReceipt}</p>
          )}
          <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-emerald-800">
            No winner · no consensus · no merged voice · NOT_BROADCAST
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
