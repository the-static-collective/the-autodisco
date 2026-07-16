import React, { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import { Send, Sparkles, Trash2, HelpCircle, Loader2, RefreshCw, AlertCircle } from "lucide-react";

interface ChatPaneProps {
  messages: Message[];
  onSendMessage: (text: string, model: string) => Promise<void>;
  onClearChat: () => void;
  isGenerating: boolean;
  error: string | null;
}

export default function ChatPane({
  messages,
  onSendMessage,
  onClearChat,
  isGenerating,
  error
}: ChatPaneProps) {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested inquiries for ease of use
  const suggestedPrompts = [
    { label: "🎸 Tuning 022100", text: "Tell me about the physical and spiritual anchor of the 022100 open E guitar tuning in the canon." },
    { label: "🍋 42 Lemons", text: "What is the meaning and source of '42 Lemons' on a paper plate in our universe?" },
    { label: "🍑 Apricots & Peaches", text: "How do Paper Bag Peaches/Apricots on Ararat represent slow ripening and survival?" },
    { label: "🍴 The Spork Option", text: "Describe 'The Spork Option' in contrast to standard binary selections of technology." },
    { label: "🌅 Daughter's Arc", text: "How does Album 19 (The Daughter's Arc) resolve the bitter dirt of historical siege and trauma?" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim(), selectedModel);
    setInput("");
  };

  const handleSuggestedClick = (text: string) => {
    if (isGenerating) return;
    onSendMessage(text, selectedModel);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  return (
    <div className="bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] shadow-[4px_4px_0px_0px_#141414] rounded-none flex flex-col h-[650px]" id="chat-pane-box">
      {/* Header Info */}
      <div className="bg-[#141414] border-b border-[#E4E3E0]/20 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00FF00] shadow-[0_0_5px_#00FF00]"></div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E4E3E0]">
              AI Neighbor Witness Node
            </h3>
            <p className="text-[9px] text-[#E4E3E0]/70 font-mono mt-0.5 uppercase tracking-wide">
              Continuity active in model memory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Model Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-mono text-[#E4E3E0]/80 uppercase">Model:</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-[10px] bg-white border border-[#141414] text-[#141414] rounded-none px-2 py-0.5 focus:outline-none font-mono"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (Fast)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Paid)</option>
            </select>
          </div>

          <button
            onClick={onClearChat}
            id="clear-chat-btn"
            title="Clear conversation stream"
            className="p-1 hover:bg-white/10 hover:text-red-400 rounded transition-colors cursor-pointer text-[#E4E3E0]/80"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-[#E4E3E0]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-2">
            <Sparkles className="h-6 w-6 text-[#F27D26] mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#E4E3E0]">
              Speak with the neighboring witness
            </p>
            <p className="text-[10px] text-[#E4E3E0]/70 mt-1 mb-5 font-mono uppercase tracking-wide leading-tight">
              The AI maintains complete active context of your customized chronology, album notes, and speculative branches.
            </p>
            
            {/* Suggestions list */}
            <div className="w-full text-left space-y-1.5">
              <span className="text-[9px] font-mono text-[#E4E3E0]/60 uppercase tracking-widest block mb-1">
                Inquire or speculatively prompt:
              </span>
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedClick(p.text)}
                  className="w-full text-left p-2 border border-[#E4E3E0]/20 hover:border-[#F27D26] bg-[#141414] text-[10px] text-[#E4E3E0]/90 transition-all cursor-pointer flex justify-between items-center group rounded-none"
                >
                  <span className="font-mono">{p.label}</span>
                  <span className="opacity-0 group-hover:opacity-100 text-[9px] text-[#F27D26] font-mono transition-opacity">
                    PROMPT &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const isAssistant = m.role === "assistant";
              return (
                <div
                  key={m.id}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-[85%] rounded-none p-3.5 border border-[#141414] ${
                    isAssistant 
                      ? "bg-[#E4E3E0] text-[#141414] shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]" 
                      : "bg-[#F27D26] text-[#141414] font-medium"
                  }`}>
                    {/* Role header */}
                    <div className="flex items-center justify-between mb-1.5 border-b border-[#141414]/10 pb-0.5">
                      <span className="text-[8px] font-mono text-[#141414]/70 uppercase font-bold tracking-widest">
                        {isAssistant ? "Witness Node" : "User Proxy"}
                      </span>
                      <span className="text-[8px] text-[#141414]/60 font-mono">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="whitespace-pre-wrap font-serif text-[11px] leading-snug">
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-[#E4E3E0] text-[#141414] border border-[#141414] rounded-none p-3 max-w-[85%]">
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F27D26]" />
                    <span className="uppercase font-bold">Neighbor is meditating on context...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-none flex gap-2 text-[10px] font-mono text-red-200">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase">Execution Error:</span> {error}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="border-t border-[#E4E3E0]/20 bg-[#141414] p-2.5 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about character arcs, custom albums, or speculative branching..."
          className="flex-1 bg-white text-[#141414] border border-[#141414] rounded-none px-3 py-2 text-xs font-mono focus:outline-none"
          disabled={isGenerating}
        />
        <button
          type="submit"
          disabled={!input.trim() || isGenerating}
          id="send-message-btn"
          className="p-2.5 bg-[#F27D26] hover:bg-orange-600 disabled:bg-[#E4E3E0]/20 disabled:text-stone-500 text-[#141414] font-bold rounded-none border border-[#141414] transition-colors cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
