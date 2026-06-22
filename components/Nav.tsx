"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

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
      <header
        className="backdrop-blur sticky top-0 z-50"
        style={{
          background: "var(--nav-bg)",
          borderBottom: "1px solid var(--nav-border)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.svg" alt="PRUV" className="w-6 h-6" />
            <span
              className="font-bold text-sm hidden sm:block tracking-tight"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.02em", fontFamily: "var(--font-body)" }}
            >
              PRUVPOT
            </span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full hidden sm:block"
              style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-default)", color: "var(--text-muted)" }}
            >
              devnet
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm px-3 py-1.5 rounded-lg"
                style={{
                  color: path === l.href ? "var(--purple-dark)" : "var(--text-muted)",
                  background: path === l.href ? "rgba(124, 58, 237, 0.10)" : "transparent",
                  border: path === l.href ? "1px solid rgba(124, 58, 237, 0.16)" : "1px solid transparent",
                  boxShadow: path === l.href ? "0 4px 12px rgba(124, 58, 237, 0.08)" : "none",
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  transition: "var(--transition)",
                }}
                onMouseEnter={(e) => {
                  if (path !== l.href) {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (path !== l.href) {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
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
                className="hidden md:flex w-7 h-7 rounded-full items-center justify-center shrink-0"
                style={{
                  background: path.startsWith("/u/") ? "var(--purple-primary)" : "var(--surface-secondary)",
                  color: path.startsWith("/u/") ? "#fff" : "var(--text-muted)",
                  transition: "var(--transition)",
                }}
                title="My Profile"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--purple-primary)";
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = path.startsWith("/u/") ? "var(--purple-primary)" : "var(--surface-secondary)";
                  (e.currentTarget as HTMLElement).style.color = path.startsWith("/u/") ? "#fff" : "var(--text-muted)";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </Link>
            ) : (
              <span
                className="hidden md:flex w-7 h-7 rounded-full items-center justify-center shrink-0"
                style={{ background: "var(--surface-secondary)", color: "var(--text-faint)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </span>
            )}

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notification bell */}
            <NotificationBell />

            {/* Wallet button */}
            {connected ? (
              <button
                onClick={onDisconnect}
                className="text-xs sm:text-sm px-3 py-1.5 rounded-lg shrink-0"
                style={{
                  background: "var(--surface-secondary)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-default)",
                  transition: "var(--transition)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(225, 29, 72, 0.30)";
                  (e.currentTarget as HTMLElement).style.color = "var(--danger-color)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--success-color)" }} />
                  {walletAddr}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setWalletModal(true)}
                className="text-xs sm:text-sm px-3 py-1.5 rounded-lg shrink-0"
                style={{
                  background: "linear-gradient(135deg, #A855F7 0%, #7C3AED 48%, #2563EB 100%)",
                  color: "#fff",
                  fontWeight: 600,
                  boxShadow: "0 6px 20px rgba(124, 58, 237, 0.18)",
                  border: "none",
                  transition: "var(--transition)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.filter = "brightness(1.04)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 26px rgba(124, 58, 237, 0.26)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.filter = "";
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(124, 58, 237, 0.18)";
                }}
              >
                Connect
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--surface-secondary)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
              aria-label="Menu"
            >
              <span className={cn("block w-5 h-0.5 transition-all", menuOpen && "rotate-45 translate-y-2")} style={{ background: "currentColor" }} />
              <span className={cn("block w-5 h-0.5 transition-all", menuOpen && "opacity-0")} style={{ background: "currentColor" }} />
              <span className={cn("block w-5 h-0.5 transition-all", menuOpen && "-rotate-45 -translate-y-2")} style={{ background: "currentColor" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 top-14 z-40 backdrop-blur"
          style={{ background: "var(--nav-bg)" }}
        >
          <nav className="flex flex-col p-4 gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm"
                style={{
                  color: path === l.href ? "var(--purple-dark)" : "var(--text-muted)",
                  background: path === l.href ? "rgba(124, 58, 237, 0.10)" : "transparent",
                  border: path === l.href ? "1px solid rgba(124, 58, 237, 0.16)" : "1px solid transparent",
                  transition: "var(--transition)",
                }}
              >
                <span className="text-lg">{l.icon}</span>
                {l.label}
                {path === l.href && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--purple-primary)" }} />}
              </Link>
            ))}
            {profileHref ? (
              <Link
                href={profileHref}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm"
                style={{
                  color: path.startsWith("/u/") ? "var(--purple-dark)" : "var(--text-muted)",
                  background: path.startsWith("/u/") ? "rgba(124, 58, 237, 0.10)" : "transparent",
                  border: path.startsWith("/u/") ? "1px solid rgba(124, 58, 237, 0.16)" : "1px solid transparent",
                  transition: "var(--transition)",
                }}
              >
                <span className="text-lg">◎</span>
                My Profile
                {path.startsWith("/u/") && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--purple-primary)" }} />}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm" style={{ color: "var(--text-faint)" }}>
                <span className="text-lg">◎</span>
                My Profile
                <span className="ml-auto text-xs" style={{ color: "var(--text-faint)" }}>connect wallet</span>
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
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{
              background: "var(--surface-primary)",
              border: "1px solid var(--border-default)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Connect Wallet</h2>
              <button
                onClick={() => setWalletModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-lg transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-secondary)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                }}
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              {wallets.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
                  No wallets detected.{" "}
                  <a
                    href="https://phantom.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--purple-primary)" }}
                    className="hover:underline"
                  >
                    Install Phantom ↗
                  </a>
                </p>
              ) : (
                wallets.map(w => (
                  <button
                    key={w.adapter.name}
                    onClick={() => handleSelectWallet(w.adapter.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                    style={{
                      background: "var(--surface-secondary)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border-accent)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--surface-secondary)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                    }}
                  >
                    {w.adapter.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.adapter.icon} alt={w.adapter.name} className="w-6 h-6 rounded-md" />
                    )}
                    <span className="text-sm font-medium">{w.adapter.name}</span>
                    <span
                      className={cn("ml-auto text-xs px-2 py-0.5 rounded-full")}
                      style={w.readyState === "Installed"
                        ? { background: "rgba(5, 150, 105, 0.12)", color: "var(--success-color)" }
                        : { background: "var(--surface-tertiary)", color: "var(--text-muted)" }
                      }
                    >
                      {w.readyState === "Installed" ? "Detected" : "Not installed"}
                    </span>
                  </button>
                ))
              )}
            </div>

            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              Connecting to Solana devnet
            </p>
          </div>
        </div>
      )}
    </>
  );
}
