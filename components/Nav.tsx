"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";

const links = [
  { href: "/",            label: "Lottery"    },
  { href: "/tickets",     label: "My Tickets" },
  { href: "/leaderboard", label: "Leaderboard"},
  { href: "/rounds",      label: "Rounds"     },
  { href: "/stats",       label: "Stats"      },
];

export default function Nav() {
  const pathname = usePathname();
  const { connected, publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;
  const [mobileOpen, setMobileOpen] = useState(false);

  const profileHref = walletAddress
    ? `/u/${encodeURIComponent(walletAddress)}`
    : null;

  return (
    <>
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(7,11,20,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 1px 0 rgba(124,58,237,0.08)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div
              className="relative w-7 h-7 rounded-xl overflow-hidden"
              style={{ boxShadow: "0 0 12px rgba(124,58,237,0.35)" }}
            >
              <img src="/logo.svg" alt="PRUV" className="w-7 h-7" />
            </div>
            <span
              className="font-bold text-sm hidden sm:block tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              PRUVPOT
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:block tracking-wide uppercase"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(37,99,235,0.18))",
                border: "1px solid rgba(124,58,237,0.30)",
                color: "#A855F7",
              }}
            >
              devnet
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {links.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    color: active ? "#A855F7" : "var(--text-secondary)",
                    background: active
                      ? "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.10))"
                      : "transparent",
                    boxShadow: active ? "0 0 12px rgba(124,58,237,0.12)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }
                  }}
                >
                  {l.label}
                  {active && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                      style={{ background: "linear-gradient(90deg, #7C3AED, #2563EB)" }}
                    />
                  )}
                </Link>
              );
            })}
            {profileHref && (
              <Link
                href={profileHref}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                Profile
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="wallet-btn-wrapper">
              <WalletMultiButton />
            </div>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors duration-200"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                {mobileOpen ? (
                  <>
                    <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="15" y1="3" x2="3" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden px-4 py-3 space-y-1"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(7,11,20,0.95)",
            }}
          >
            {links.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    color: active ? "#A855F7" : "var(--text-secondary)",
                    background: active
                      ? "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.10))"
                      : "transparent",
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
            {profileHref && (
              <Link
                href={profileHref}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ color: "var(--text-secondary)" }}
              >
                Profile
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
}
