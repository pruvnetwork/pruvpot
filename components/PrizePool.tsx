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
      <p
        className="text-xs uppercase tracking-widest mb-2 font-semibold"
        style={{ color: "var(--text-muted)", letterSpacing: "0.15em" }}
      >
        Prize Pool
      </p>

      {/* Hero number */}
      <div
        className="relative inline-block"
        style={{
          filter: "drop-shadow(0 0 32px rgba(124,58,237,0.4))",
        }}
      >
        <p
          className="text-5xl sm:text-6xl font-bold tabular-nums"
          style={{
            background: "linear-gradient(135deg, #A855F7 0%, #38BDF8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.1,
          }}
        >
          <AnimatedNumber value={total} decimals={3} />
        </p>
      </div>
      <span
        className="ml-2 text-xl sm:text-2xl font-semibold align-top mt-2 inline-block"
        style={{ color: "var(--text-secondary)" }}
      >
        SOL
      </span>

      <p
        className="text-sm mt-2"
        style={{ color: "var(--text-muted)" }}
      >
        {ticketCount.toString()} tickets · {ticketPriceSol} SOL each
      </p>

      {/* Share pills */}
      <div className="flex gap-2 sm:gap-3 mt-5 justify-center">
        <SharePill label="Winner" value={winnerShare} pct={80} variant="purple" />
        <SharePill label="Nodes"  value={nodeShare}   pct={15} variant="blue" />
        <SharePill label="Treasury" value={treasuryShare} pct={5} variant="neutral" />
      </div>
    </div>
  );
}

function SharePill({
  label, value, pct, variant,
}: {
  label: string; value: number; pct: number; variant: "purple" | "blue" | "neutral";
}) {
  const styles = {
    purple: {
      background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(168,85,247,0.12))",
      border: "1px solid rgba(124,58,237,0.28)",
      valueColor: "#A855F7",
    },
    blue: {
      background: "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(56,189,248,0.12))",
      border: "1px solid rgba(37,99,235,0.28)",
      valueColor: "#38BDF8",
    },
    neutral: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid var(--border)",
      valueColor: "var(--text-secondary)",
    },
  };

  const s = styles[variant];

  return (
    <div
      className="rounded-xl px-3 py-2 text-center flex-1 max-w-[100px]"
      style={{
        background: s.background,
        border: s.border,
      }}
    >
      <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-base font-bold" style={{ color: s.valueColor }}>{pct}%</p>
      <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-secondary)" }}>
        <AnimatedNumber value={value} decimals={3} /> SOL
      </p>
    </div>
  );
}
