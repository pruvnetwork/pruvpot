"use client";

import { useEffect, useRef, useState } from "react";
import { shortenAddress } from "@/lib/utils";

interface FeedItem {
  id: number;
  wallet: string;
  tickets: number;
  solAmount: number;
  ts: number;
}

const WALLETS = [
  "4mNb...rK9Q", "7xKX...gAsU", "DRpb...Srh5", "HN7c...YWrH",
  "9ZwL...kFpQ", "2Qs5...dC8W", "6Pn1...qA7S", "8Hk2...vN4T",
  "3Fj9...mR2K", "5xK7...pQ9L", "1Lm3...nT6R", "0Wq8...eP2S",
];

let _feedId = 0;

export default function LiveFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function addItem() {
      const tickets = Math.ceil(Math.random() * 3);
      const item: FeedItem = {
        id: _feedId++,
        wallet: WALLETS[Math.floor(Math.random() * WALLETS.length)],
        tickets,
        solAmount: tickets * 0.01,
        ts: Date.now(),
      };
      setItems((prev) => [item, ...prev].slice(0, 6));
    }

    addItem();
    const id = setInterval(addItem, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-200">Live Activity</h3>
        <span className="flex items-center gap-1 text-xs text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          live
        </span>
      </div>

      <div ref={containerRef} className="space-y-1.5 overflow-hidden">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg bg-zinc-800/40"
            style={{
              opacity: 1 - i * 0.13,
              transform: `translateY(0)`,
              transition: "opacity 0.4s ease",
            }}
          >
            <span className="text-violet-400 font-mono">{item.wallet}</span>
            <span className="text-zinc-600 flex-1">bought</span>
            <span className="text-zinc-300 font-semibold">
              {item.tickets} ticket{item.tickets > 1 ? "s" : ""}
            </span>
            <span className="text-emerald-500 font-mono">
              -{item.solAmount.toFixed(2)} SOL
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
