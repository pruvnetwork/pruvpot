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
      <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Prize Pool</p>
      <p className="text-4xl sm:text-5xl font-bold text-white tabular-nums" style={{ textShadow: "0 0 40px rgba(139,92,246,0.25)" }}>
        <AnimatedNumber value={total} decimals={3} />
        <span className="text-xl sm:text-2xl text-zinc-400 ml-1">SOL</span>
      </p>
      <p className="text-zinc-500 text-xs sm:text-sm mt-1">
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
  const colors = {
    emerald: "bg-emerald-950 border-emerald-800 text-emerald-300",
    sky: "bg-sky-950 border-sky-800 text-sky-300",
    zinc: "bg-zinc-800 border-zinc-700 text-zinc-300",
  };

  return (
    <div className={`border rounded-lg px-3 py-1.5 text-center ${colors[color]}`}>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-semibold">{pct}%</p>
      <p className="text-xs font-mono">
        <AnimatedNumber value={value} decimals={3} /> SOL
      </p>
    </div>
  );
}
