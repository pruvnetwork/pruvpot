"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type MsgType = "user" | "system-buy" | "system-win" | "system-round" | "system-vote";

interface ChatMsg {
  id: number;
  type: MsgType;
  wallet?: string;
  text: string;
  ts: number;
}

const WALLETS = [
  "4mNb...rK9Q", "7xKX...gAsU", "DRpb...Srh5", "HN7c...YWrH",
  "6Pn1...qA7S", "8Hk2...vN4T", "3Fj9...mR2K", "1Lm3...nT6R",
  "2Qs5...dC8W", "0Wq8...eP2S",
];

const USER_MESSAGES = [
  "LFG 🚀", "good luck everyone", "bought 3 tickets, feeling lucky",
  "this is insane", "provably fair is the way", "when moon 🌙",
  "PRUV protocol is built different", "let's gooo", "someone's about to win big",
  "gm fam", "first time here, seems legit", "the randomness proof is actually cool",
  "bought 5 tickets 🎟️", "can't wait for the draw", "on-chain lottery > centralized",
  "SlotHash randomness is genius", "wagmi", "who's winning today?",
];

let _chatId = 0;

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function ts() { return Date.now(); }

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
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(true);
  const [unread, setUnread] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevWinner = useRef<string | null>(null);
  const prevStatus = useRef<0 | 1 | 2>(0);
  const warned60 = useRef(false);

  const push = useCallback((msg: Omit<ChatMsg, "id" | "ts">) => {
    setMsgs(prev => [...prev, { ...msg, id: _chatId++, ts: ts() }].slice(-80));
    setUnread(n => open ? 0 : n + 1);
  }, [open]);

  // Seed initial messages
  useEffect(() => {
    const seeds: Omit<ChatMsg, "id" | "ts">[] = [
      { type: "system-round", text: `🔔 Round #${roundId.toString()} is now open — buy your tickets!` },
      { type: "user", wallet: rnd(WALLETS), text: "gm everyone! let's go 🚀" },
      { type: "system-buy", wallet: rnd(WALLETS), text: "bought 2 tickets" },
      { type: "user", wallet: rnd(WALLETS), text: "PRUV randomness is actually undefeatable" },
      { type: "system-buy", wallet: rnd(WALLETS), text: "bought 1 ticket" },
    ];
    seeds.forEach((s, i) => {
      setTimeout(() => push(s), i * 300);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulate user messages and buy activity
  useEffect(() => {
    if (status === 2) return;
    const interval = setInterval(() => {
      const r = Math.random();
      if (r < 0.45) {
        push({ type: "system-buy", wallet: rnd(WALLETS), text: `bought ${Math.ceil(Math.random() * 3)} ticket${Math.random() > 0.5 ? "s" : ""}` });
      } else if (r < 0.8) {
        push({ type: "user", wallet: rnd(WALLETS), text: rnd(USER_MESSAGES) });
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [status, push]);

  // Countdown warning at 60s
  useEffect(() => {
    if (countdown < 60000 && countdown > 0 && !warned60.current && status === 0) {
      warned60.current = true;
      push({ type: "system-round", text: "⚡ Round closes in 60 seconds — last chance to buy!" });
    }
  }, [countdown, status, push]);

  // Status change messages
  useEffect(() => {
    if (status === prevStatus.current) return;
    if (status === 1 && prevStatus.current === 0) {
      push({ type: "system-round", text: `🔐 Round #${roundId.toString()} closed — nodes are deriving winner from SlotHash…` });
      push({ type: "system-vote", text: "Node 7xKX...gAsU cast draw vote ✓" });
      setTimeout(() => push({ type: "system-vote", text: "Node DRpb...Srh5 cast draw vote ✓" }), 4000);
      setTimeout(() => push({ type: "system-vote", text: "Node HN7c...YWrH cast draw vote ✓ — threshold reached!" }), 8000);
    }
    prevStatus.current = status;
  }, [status, roundId, push]);

  // Winner announcement
  useEffect(() => {
    if (!winner || winner === prevWinner.current) return;
    prevWinner.current = winner;
    push({ type: "system-win", text: `🏆 ${winner} won the jackpot!` });
    setTimeout(() => push({ type: "user", wallet: rnd(WALLETS), text: "CONGRATS! 🎉" }), 800);
    setTimeout(() => push({ type: "user", wallet: rnd(WALLETS), text: "ggg wp" }), 1600);
    setTimeout(() => push({ type: "user", wallet: rnd(WALLETS), text: "next round LFG 🚀" }), 2800);
  }, [winner, push]);

  // Auto-scroll within container only
  useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setUnread(0);
    }
  }, [msgs, open]);

  function send() {
    const text = input.trim();
    if (!text) return;
    push({ type: "user", wallet: "9ZwL...kFpQ", text });
    setInput("");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
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
            {WALLETS.length + 1} online
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
          {/* Messages */}
          <div
            ref={containerRef}
            className={cn(
              "overflow-y-auto px-3 py-2 space-y-1 border-t border-zinc-800/60",
              sidebar ? "h-72" : "h-56"
            )}
          >
            {msgs.map(m => <ChatLine key={m.id} msg={m} />)}
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800/60 flex items-center gap-2 px-3 py-2">
            <span className="text-xs font-mono text-violet-400 shrink-0">9ZwL</span>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Say something…"
              maxLength={120}
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
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

function ChatLine({ msg }: { msg: ChatMsg }) {
  const time = new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (msg.type === "system-win") {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-950/40 border border-emerald-800/50 rounded-lg my-1">
        <span className="text-sm">🏆</span>
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

  // system-buy or user
  const isBuy = msg.type === "system-buy";
  return (
    <div className="flex items-start gap-2 px-1 py-0.5 group hover:bg-zinc-800/20 rounded transition-colors">
      <span className={cn(
        "font-mono text-xs shrink-0 mt-0.5",
        msg.wallet === "9ZwL...kFpQ" ? "text-violet-400" : "text-zinc-500"
      )}>
        {msg.wallet}
      </span>
      <span className={cn("text-xs flex-1 leading-relaxed", isBuy ? "text-zinc-500" : "text-zinc-300")}>
        {isBuy ? (
          <><span className="text-zinc-600">🎟️</span> {msg.text}</>
        ) : msg.text}
      </span>
      <span className="text-xs text-zinc-700 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
        {time}
      </span>
    </div>
  );
}
