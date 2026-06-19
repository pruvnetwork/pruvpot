"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLotteryState } from "@/hooks/useLotteryState";
import { useToast } from "./Toast";

interface Notif {
  id: number;
  msg: string;
  time: number;
  read: boolean;
}

let _notifId = 0;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const { toast } = useToast();
  const warned60 = useRef(false);
  const warned30 = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastRoundRef = useRef<bigint | null>(null);

  const { countdown, round } = useLotteryState();

  // Fire notifications from real chain countdown
  useEffect(() => {
    if (!round || round.status !== 0) return;

    // Reset warnings when round changes
    if (lastRoundRef.current !== round.roundId) {
      lastRoundRef.current = round.roundId;
      warned60.current = false;
      warned30.current = false;
    }

    if (countdown < 60_000 && countdown > 0 && !warned60.current) {
      warned60.current = true;
      addNotif("Round closes in 60 seconds!");
      toast("Round closes in 60 seconds!", "info");
    }
    if (countdown < 30_000 && countdown > 0 && !warned30.current) {
      warned30.current = true;
      addNotif("Last chance — 30 seconds left!");
      toast("Last chance — 30 seconds left!", "error");
    }
  }, [countdown, round, toast]);

  // Close panel on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function addNotif(msg: string) {
    const notif = { id: ++_notifId, msg, time: Date.now(), read: false };
    setNotifs(prev => [notif, ...prev].slice(0, 20));
    setHasNew(true);
  }

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setHasNew(false);
  }

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className={cn(
          "relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
          open ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
        )}
        aria-label="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a5 5 0 0 0-5 5v2.586L1.707 9.88A1 1 0 0 0 2.414 11.5H5.5a2.5 2.5 0 0 0 5 0h3.086a1 1 0 0 0 .707-1.707L13 8.586V6a5 5 0 0 0-5-5z"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-sm font-semibold text-zinc-200">Notifications</span>
            {notifs.length > 0 && (
              <button
                onClick={() => setNotifs([])}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-zinc-600 text-sm">No notifications yet</p>
                <p className="text-zinc-700 text-xs mt-1">You'll be alerted when a round is closing</p>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-zinc-800/50 last:border-0",
                    !n.read && "bg-violet-950/20"
                  )}
                >
                  <span className="text-base mt-0.5">🔔</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300">{n.msg}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {Math.floor((Date.now() - n.time) / 1000)}s ago
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
