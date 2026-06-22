"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useOnChainEvents, type OnChainEvent } from "@/hooks/useOnChainEvents";

type MsgType = "local" | "system-buy" | "system-win" | "system-round" | "system-vote";

interface ChatMsg {
  id: number;
  type: MsgType;
  wallet?: string;
  text: string;
  ts: number;
}

let _chatId = 0;
function shortAddr(addr: string) { return `${addr.slice(0, 4)}…${addr.slice(-4)}`; }

export default function LiveChat({
  roundId,
  winner,
  countdown,
  status,
  sidebar = false,
}: {
  roundId: bigint;
  winner: string | null;
  countdown: number;
  status: 0 | 1 | 2;
  sidebar?: boolean;
}) {
  const { publicKey } = useWallet();
  const myWallet = publicKey?.toBase58() ?? null;

  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(true);
  const [unread, setUnread] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevWinner = useRef<string | null>(null);
  const prevStatus = useRef<0 | 1 | 2>(0);
  const warned60 = useRef(false);
  const seenEvents = useRef(new Set<string>());

  const events = useOnChainEvents(60);

  const push = useCallback((msg: Omit<ChatMsg, "id" | "ts">) => {
    setMsgs(prev => [...prev, { ...msg, id: _chatId++, ts: Date.now() }].slice(-100));
    setUnread(n => open ? 0 : n + 1);
  }, [open]);

  // Seed: round open message
  useEffect(() => {
    push({ type: "system-round", text: `🔔 Round #${roundId.toString()} is now open` });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror on-chain events into chat
  useEffect(() => {
    for (const ev of events) {
      const key = eventKey(ev);
      if (seenEvents.current.has(key)) continue;
      seenEvents.current.add(key);

      if (ev.type === "TicketPurchased") {
        push({ type: "system-buy", wallet: ev.buyer, text: `bought ticket #${ev.index.toString()}` });
      } else if (ev.type === "DrawVoteCast") {
        push({ type: "system-vote", text: `Node ${shortAddr(ev.node)} cast draw vote (${ev.voteCount}/1)` });
      } else if (ev.type === "RoundFinalized") {
        push({ type: "system-win", text: `🏆 ${shortAddr(ev.winner)} won round #${ev.roundId.toString()} — ${(Number(ev.winnerShare) / 1e9).toFixed(3)} SOL` });
      } else if (ev.type === "RoundOpened") {
        push({ type: "system-round", text: `🔔 Round #${ev.roundId.toString()} opened` });
      }
    }
  }, [events, push]);

  // Countdown warning
  useEffect(() => {
    if (countdown < 60000 && countdown > 0 && !warned60.current && status === 0) {
      warned60.current = true;
      push({ type: "system-round", text: "⚡ Round closes in 60 seconds — last chance!" });
    }
  }, [countdown, status, push]);

  // Status transitions
  useEffect(() => {
    if (status === prevStatus.current) return;
    if (status === 1 && prevStatus.current === 0) {
      push({ type: "system-round", text: `🔐 Round #${roundId.toString()} closed — nodes deriving winner from SlotHash…` });
    }
    prevStatus.current = status;
  }, [status, roundId, push]);

  // Winner from prop (in case event is missed)
  useEffect(() => {
    if (!winner || winner === prevWinner.current) return;
    prevWinner.current = winner;
    push({ type: "system-win", text: `🏆 Winner: ${shortAddr(winner)}` });
  }, [winner, push]);

  // Auto-scroll
  useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setUnread(0);
    }
  }, [msgs, open]);

  function send() {
    if (!input.trim() || !myWallet) return;
    push({ type: "local", wallet: myWallet, text: input.trim() });
    setInput("");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  // Count unique buyers from events as "online" indicator
  const onlineCount = new Set(
    events.filter(e => e.type === "TicketPurchased").map(e => (e as { buyer: string }).buyer)
  ).size || 1;

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: "var(--surface-primary)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        role={sidebar ? "presentation" : "button"}
        onClick={sidebar ? undefined : () => { setOpen(!open); if (!open) setUnread(0); }}
        className={cn("flex items-center justify-between px-4 py-3 w-full", !sidebar && "cursor-pointer")}
        style={{ transition: "background 200ms ease" }}
        onMouseEnter={(e) => { if (!sidebar) (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)"; }}
        onMouseLeave={(e) => { if (!sidebar) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Live Chat</span>
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--success-color)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--success-color)" }} />
            {onlineCount} online
          </span>
        </div>
        {!sidebar && (
          <div className="flex items-center gap-2">
            {!open && unread > 0 && (
              <span className="text-xs text-white px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "var(--purple-primary)" }}>
                {unread}
              </span>
            )}
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{open ? "▲" : "▼"}</span>
          </div>
        )}
      </div>

      {(open || sidebar) && (
        <>
          <div
            ref={containerRef}
            className={cn("overflow-y-auto px-3 py-2 space-y-0.5", sidebar ? "h-72" : "h-56")}
            style={{ borderTop: "1px solid var(--border-default)" }}
          >
            {msgs.map(m => <ChatLine key={m.id} msg={m} myWallet={myWallet} />)}
          </div>

          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderTop: "1px solid var(--border-default)" }}
          >
            <span className="text-xs font-mono shrink-0" style={{ color: "var(--purple-primary)", fontFamily: "var(--font-mono)" }}>
              {myWallet ? shortAddr(myWallet) : "guest"}
            </span>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={myWallet ? "Say something…" : "Connect wallet to chat"}
              maxLength={120}
              disabled={!myWallet}
              className="flex-1 bg-transparent text-sm outline-none disabled:opacity-40"
              style={{
                color: "var(--text-primary)",
                caretColor: "var(--purple-primary)",
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || !myWallet}
              className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg text-white transition-colors"
              style={{
                background: (!input.trim() || !myWallet) ? "var(--surface-tertiary)" : "var(--purple-primary)",
                color: (!input.trim() || !myWallet) ? "var(--text-muted)" : "#fff",
              }}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function eventKey(ev: OnChainEvent): string {
  switch (ev.type) {
    case "TicketPurchased": return `tp-${ev.roundId}-${ev.index}`;
    case "DrawVoteCast":    return `dv-${ev.roundId}-${ev.node}`;
    case "RoundFinalized":  return `rf-${ev.roundId}`;
    case "RoundOpened":     return `ro-${ev.roundId}`;
  }
}

function ChatLine({ msg, myWallet }: { msg: ChatMsg; myWallet: string | null }) {
  const time = new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isMe = msg.wallet && msg.wallet === myWallet;

  if (msg.type === "system-win") {
    return (
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg my-1"
        style={{ background: "rgba(5, 150, 105, 0.08)", border: "1px solid rgba(5, 150, 105, 0.18)" }}
      >
        <span className="text-xs font-semibold flex-1" style={{ color: "var(--success-color)" }}>{msg.text}</span>
        <span className="text-xs shrink-0" style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>{time}</span>
      </div>
    );
  }
  if (msg.type === "system-round") {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg my-0.5" style={{ background: "var(--surface-secondary)" }}>
        <span className="flex-1 text-xs" style={{ color: "var(--text-secondary)" }}>{msg.text}</span>
        <span className="text-xs shrink-0" style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>{time}</span>
      </div>
    );
  }
  if (msg.type === "system-vote") {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg my-0.5" style={{ background: "var(--surface-secondary)" }}>
        <span className="text-xs" style={{ color: "var(--success-color)" }}>⬡</span>
        <span className="flex-1 text-xs" style={{ color: "var(--text-secondary)" }}>{msg.text}</span>
        <span className="text-xs shrink-0" style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>{time}</span>
      </div>
    );
  }
  // system-buy or local
  const isBuy = msg.type === "system-buy";
  const short = msg.wallet ? `${msg.wallet.slice(0, 4)}…${msg.wallet.slice(-4)}` : "?";
  return (
    <div
      className="flex items-start gap-2 px-2 py-1.5 rounded-lg group"
      style={{ transition: "background 150ms ease" }}
      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)"}
      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
    >
      <span
        className="text-xs shrink-0 mt-0.5"
        style={{
          color: isMe ? "var(--purple-primary)" : "var(--purple-light)",
          fontFamily: "var(--font-mono)",
          fontWeight: isMe ? 600 : 400,
        }}
      >
        {short}
      </span>
      <span
        className="text-xs flex-1 leading-relaxed"
        style={{ color: isBuy ? "var(--text-secondary)" : "var(--text-primary)" }}
      >
        {isBuy ? <>🎟️ {msg.text}</> : msg.text}
      </span>
      <span
        className="text-xs shrink-0 mt-0.5 opacity-0 group-hover:opacity-100"
        style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)", transition: "opacity 150ms ease" }}
      >
        {time}
      </span>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
