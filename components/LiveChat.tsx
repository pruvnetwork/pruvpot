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
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden flex flex-col">
      <div
        role={sidebar ? "presentation" : "button"}
        onClick={sidebar ? undefined : () => { setOpen(!open); if (!open) setUnread(0); }}
        className={cn(
          "flex items-center justify-between px-4 py-3 w-full",
          !sidebar && "hover:bg-zinc-800/30 transition-colors cursor-pointer"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-200">Live Chat</span>
          <span className="flex items-center gap-1 text-xs text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {onlineCount} online
          </span>
        </div>
        {!sidebar && (
          <div className="flex items-center gap-2">
            {!open && unread > 0 && (
              <span className="text-xs bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-semibold">
                {unread}
              </span>
            )}
            <span className="text-zinc-600 text-xs">{open ? "▲" : "▼"}</span>
          </div>
        )}
      </div>

      {(open || sidebar) && (
        <>
          <div
            ref={containerRef}
            className={cn(
              "overflow-y-auto px-3 py-2 space-y-1 border-t border-zinc-800/60",
              sidebar ? "h-72" : "h-56"
            )}
          >
            {msgs.map(m => <ChatLine key={m.id} msg={m} myWallet={myWallet} />)}
          </div>

          <div className="border-t border-zinc-800/60 flex items-center gap-2 px-3 py-2">
            <span className="text-xs font-mono text-violet-400 shrink-0">
              {myWallet ? shortAddr(myWallet) : "guest"}
            </span>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={myWallet ? "Say something…" : "Connect wallet to chat"}
              maxLength={120}
              disabled={!myWallet}
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none disabled:opacity-40"
            />
            <button
              onClick={send}
              disabled={!input.trim() || !myWallet}
              className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition-colors"
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
      <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-950/40 border border-emerald-800/50 rounded-lg my-1">
        <span className="text-xs text-emerald-300 font-semibold flex-1">{msg.text}</span>
        <span className="text-xs text-zinc-700 shrink-0">{time}</span>
      </div>
    );
  }
  if (msg.type === "system-round") {
    return (
      <div className="flex items-center gap-2 px-2 py-1 my-0.5">
        <span className="flex-1 text-xs text-zinc-500 italic">{msg.text}</span>
        <span className="text-xs text-zinc-700 shrink-0">{time}</span>
      </div>
    );
  }
  if (msg.type === "system-vote") {
    return (
      <div className="flex items-center gap-2 px-2 py-0.5 my-0.5">
        <span className="text-emerald-600 text-xs">⬡</span>
        <span className="flex-1 text-xs text-zinc-600">{msg.text}</span>
        <span className="text-xs text-zinc-700 shrink-0">{time}</span>
      </div>
    );
  }
  // system-buy or local
  const isBuy = msg.type === "system-buy";
  const short = msg.wallet ? `${msg.wallet.slice(0, 4)}…${msg.wallet.slice(-4)}` : "?";
  return (
    <div className="flex items-start gap-2 px-1 py-0.5 group hover:bg-zinc-800/20 rounded transition-colors">
      <span className={cn(
        "font-mono text-xs shrink-0 mt-0.5",
        isMe ? "text-violet-400" : "text-zinc-500"
      )}>
        {short}
      </span>
      <span className={cn("text-xs flex-1 leading-relaxed", isBuy ? "text-zinc-500" : "text-zinc-300")}>
        {isBuy ? <><span className="text-zinc-600">🎟️</span> {msg.text}</> : msg.text}
      </span>
      <span className="text-xs text-zinc-700 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
        {time}
      </span>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
