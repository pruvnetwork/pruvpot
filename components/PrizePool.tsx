"use client";

import { useState, useEffect } from "react";
import AnimatedNumber from "./AnimatedNumber";

interface Props {
  prizePoolLamports: bigint;
  ticketCount: bigint;
  ticketPriceSol: number;
}

export default function PrizePool({ prizePoolLamports, ticketCount, ticketPriceSol }: Props) {
  const total = Number(prizePoolLamports) / 1_000_000_000;
  const winnerShare = total * 0.8;
  const nodeShare = total * 0.15;
  const treasuryShare = total * 0.05;

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.04em" }}>Prize Pool</p>
      <p
        className="text-4xl sm:text-5xl font-bold tabular-nums"
        style={{
          color: "var(--text-primary)",
          letterSpacing: "-0.04em",
          fontVariantNumeric: "tabular-nums",
          textShadow: "none",
        }}
      >
        <AnimatedNumber value={total} decimals={3} />
        <span
          className="text-xl sm:text-2xl ml-1"
          style={{
            color: isDark ? "var(--purple-light)" : "var(--purple-primary)",
            fontWeight: 600,
            textShadow: isDark ? "0 0 22px rgba(139, 92, 246, 0.10)" : "none",
          }}
        >
          SOL
        </span>
      </p>
      <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-muted)", fontWeight: 400 }}>
        {ticketCount.toString()} tickets · {ticketPriceSol} SOL each
      </p>

      <div className="flex gap-2 sm:gap-3 mt-4 justify-center">
        <SharePill label="Winner" value={winnerShare} pct={80} color="emerald" isDark={isDark} />
        <SharePill label="Nodes" value={nodeShare} pct={15} color="sky" isDark={isDark} />
        <SharePill label="Treasury" value={treasuryShare} pct={5} color="zinc" isDark={isDark} />
      </div>
    </div>
  );
}

const pillStylesLight = {
  emerald: {
    bg: "rgba(168, 85, 247, 0.055)",
    border: "1px solid rgba(168, 85, 247, 0.20)",
    pctColor: "var(--purple-primary)",
    solColor: "var(--purple-light)",
  },
  sky: {
    bg: "rgba(37, 99, 235, 0.055)",
    border: "1px solid rgba(37, 99, 235, 0.20)",
    pctColor: "var(--blue-primary)",
    solColor: "var(--blue-light)",
  },
  zinc: {
    bg: "rgba(99, 102, 241, 0.045)",
    border: "1px solid rgba(99, 102, 241, 0.17)",
    pctColor: "#6366F1",
    solColor: "#818CF8",
  },
};

const pillStylesDark = {
  emerald: {
    bg: "linear-gradient(180deg, rgba(124,58,237,0.16), rgba(124,58,237,0.08))",
    border: "1px solid rgba(168,85,247,0.34)",
    pctColor: "var(--purple-primary)",
    solColor: "var(--purple-light)",
  },
  sky: {
    bg: "linear-gradient(180deg, rgba(37,99,235,0.17), rgba(37,99,235,0.08))",
    border: "1px solid rgba(59,130,246,0.32)",
    pctColor: "var(--blue-primary)",
    solColor: "var(--blue-light)",
  },
  zinc: {
    bg: "linear-gradient(180deg, rgba(99,102,241,0.14), rgba(99,102,241,0.07))",
    border: "1px solid rgba(129,140,248,0.26)",
    pctColor: "#818CF8",
    solColor: "#A5B4FC",
  },
};

function SharePill({
  label,
  value,
  pct,
  color,
  isDark,
}: {
  label: string;
  value: number;
  pct: number;
  color: "emerald" | "sky" | "zinc";
  isDark: boolean;
}) {
  const s = isDark ? pillStylesDark[color] : pillStylesLight[color];

  return (
    <div className="rounded-lg px-3 py-1.5 text-center" style={{ background: s.bg, border: s.border }}>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: s.pctColor, fontVariantNumeric: "tabular-nums" }}>{pct}%</p>
      <p className="text-xs" style={{ color: s.solColor, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
        <AnimatedNumber value={value} decimals={3} /> SOL
      </p>
    </div>
  );
}
