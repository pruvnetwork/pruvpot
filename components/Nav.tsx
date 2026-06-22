"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";

const links = [
  { href: "/",            label: "Lottery",      icon: "◈" },
  { href: "/tickets",     label: "My Tickets",   icon: "◉" },
  { href: "/stats",       label: "Stats",        icon: "◌" },
  { href: "/leaderboard", label: "Leaderboard",  icon: "◆" },
];

interface Props {
  connected: boolean;
  walletAddr: string | null;
  onDisconnect: () => void;
}

export default function Nav({ connected, walletAddr, onDisconnect }: Props) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletModal, setWalletModal] = useState(false);
  const { wallets, select, connect } = useWallet();

  const profileHref = walletAddr ? `/u/${encodeURIComponent(walletAddr)}` : null;

  async function handleSelectWallet(name: string) {
    setWalletModal(false);
    select(name as Parameters<typeof select>[0]);
    try { await connect(); } catch { /* user rejected */ }
  }

  return (
    <>
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.svg" alt="PRUV" className="w-7 h-7 rounded-lg" />
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
            {profileHref ? (
              <Link
                href={profileHref}
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
            ) : (
              <span className="hidden md:flex w-7 h-7 rounded-full items-center justify-center bg-zinc-800/40 text-zinc-600 shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </span>
            )}

            {/* Notification bell */}
            <NotificationBell />

            {/* Wallet button */}
            {connected ? (
              <button
                onClick={onDisconnect}
                className="text-xs sm:text-sm px-3 py-1.5 rounded-lg transition-all shrink-0 bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-red-800 hover:text-red-400"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {walletAddr}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setWalletModal(true)}
                className="text-xs sm:text-sm px-3 py-1.5 rounded-lg transition-all shrink-0 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white"
              >
                Connect
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              aria-label="Menu"
            >
              <span className={cn("block w-5 h-0.5 bg-zinc-400 transition-all", menuOpen && "rotate-45 translate-y-2")} />
              <span className={cn("block w-5 h-0.5 bg-zinc-400 transition-all", menuOpen && "opacity-0")} />
              <span className={cn("block w-5 h-0.5 bg-zinc-400 transition-all", menuOpen && "-rotate-45 -translate-y-2")} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-zinc-950/95 backdrop-blur">
          <nav className="flex flex-col p-4 gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-colors",
                  path === l.href
                    ? "bg-violet-600/20 text-violet-300 border border-violet-800/50"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                )}
              >
                <span className="text-lg">{l.icon}</span>
                {l.label}
                {path === l.href && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </Link>
            ))}
            {profileHref ? (
              <Link
                href={profileHref}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-colors",
                  path.startsWith("/u/")
                    ? "bg-violet-600/20 text-violet-300 border border-violet-800/50"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                )}
              >
                <span className="text-lg">◎</span>
                My Profile
                {path.startsWith("/u/") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm text-zinc-600">
                <span className="text-lg">◎</span>
                My Profile
                <span className="ml-auto text-xs text-zinc-700">connect wallet</span>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Wallet select modal */}
      {walletModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setWalletModal(false)}
        >
          <div
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-100">Connect Wallet</h2>
              <button
                onClick={() => setWalletModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              {wallets.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">
                  No wallets detected.{" "}
                  <a
                    href="https://phantom.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:underline"
                  >
                    Install Phantom ↗
                  </a>
                </p>
              ) : (
                wallets.map(w => (
                  <button
                    key={w.adapter.name}
                    onClick={() => handleSelectWallet(w.adapter.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600 transition-colors"
                  >
                    {w.adapter.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.adapter.icon} alt={w.adapter.name} className="w-6 h-6 rounded-md" />
                    )}
                    <span className="text-sm font-medium text-zinc-200">{w.adapter.name}</span>
                    <span className={cn(
                      "ml-auto text-xs px-2 py-0.5 rounded-full",
                      w.readyState === "Installed"
                        ? "bg-emerald-900/50 text-emerald-400"
                        : "bg-zinc-700 text-zinc-500"
                    )}>
                      {w.readyState === "Installed" ? "Detected" : "Not installed"}
                    </span>
                  </button>
                ))
              )}
            </div>

            <p className="text-xs text-zinc-600 text-center">
              Connecting to Solana devnet
            </p>
          </div>
        </div>
      )}
    </>
  );
}
