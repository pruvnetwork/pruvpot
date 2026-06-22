"use client";

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
        <span className="text-xl sm:text-2xl ml-1" style={{ color: "var(--purple-primary)", fontWeight: 600 }}>SOL</span>
      </p>
      <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-muted)", fontWeight: 400 }}>
        {ticketCount.toString()} tickets · {ticketPriceSol} SOL each
      </p>

      <div className="flex gap-2 sm:gap-3 mt-4 justify-center">
        <SharePill label="Winner" value={winnerShare} pct={80} color="emerald" />
        <SharePill label="Nodes" value={nodeShare} pct={15} color="sky" />
        <SharePill label="Treasury" value={treasuryShare} pct={5} color="zinc" />
      </div>
    </div>
  );
}

const pillStyles = {
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

function SharePill({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: number;
  pct: number;
  color: "emerald" | "sky" | "zinc";
}) {
  const s = pillStyles[color];

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
