"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";

const MOCK_WALLET = "9ZwL...kFpQ";

const links = [
  { href: "/",            label: "Lottery",      icon: "◈" },
  { href: "/tickets",     label: "My Tickets",   icon: "◉" },
  { href: "/stats",       label: "Stats",        icon: "◌" },
  { href: "/leaderboard", label: "Leaderboard",  icon: "◆" },
];

interface Props {
  connected: boolean;
  walletAddr: string | null;
  onConnect: () => void;
}

export default function Nav({ connected, walletAddr, onConnect }: Props) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-xs font-bold">
              P
            </div>
            <span className="font-semibold text-zinc-100 hidden sm:block">PRUVPOT</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full hidden sm:block">
              devnet
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "text-sm px-3 py-1.5 rounded-lg transition-colors",
                  path === l.href
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Profile avatar */}
            <Link
              href={`/u/${encodeURIComponent(walletAddr ?? MOCK_WALLET)}`}
              className={cn(
                "hidden md:flex w-7 h-7 rounded-full items-center justify-center transition-colors shrink-0",
                path.startsWith("/u/")
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-violet-700 hover:text-white"
              )}
              title="My Profile"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </Link>

            {/* Notification bell */}
            <NotificationBell />

            {/* Wallet button */}
            <button
              onClick={onConnect}
              className={cn(
                "text-xs sm:text-sm px-3 py-1.5 rounded-lg transition-all shrink-0",
                connected
                  ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                  : "bg-violet-600 hover:bg-violet-500 active:scale-95 text-white"
              )}
            >
              {connected ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {walletAddr}
                </span>
              ) : "Connect"}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              aria-label="Menu"
            >
              <span className={cn("block w-5 h-0.5 bg-zinc-400 transition-all", open && "rotate-45 translate-y-2")} />
              <span className={cn("block w-5 h-0.5 bg-zinc-400 transition-all", open && "opacity-0")} />
              <span className={cn("block w-5 h-0.5 bg-zinc-400 transition-all", open && "-rotate-45 -translate-y-2")} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-zinc-950/95 backdrop-blur">
          <nav className="flex flex-col p-4 gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-colors",
                  path === l.href
                    ? "bg-violet-600/20 text-violet-300 border border-violet-800/50"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                )}
              >
                <span className="text-lg">{l.icon}</span>
                {l.label}
                {path === l.href && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
                )}
              </Link>
            ))}
            <Link
              href={`/u/${encodeURIComponent(walletAddr ?? MOCK_WALLET)}`}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-colors",
                path.startsWith("/u/")
                  ? "bg-violet-600/20 text-violet-300 border border-violet-800/50"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              )}
            >
              <span className="text-lg">◎</span>
              My Profile
              {path.startsWith("/u/") && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
              )}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
