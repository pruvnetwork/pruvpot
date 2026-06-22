"use client";

interface Props {
  totalRounds: number;
  totalPaidSol: number;
  activePlayers: number;
  ticketsSoldToday: number;
}

export default function StatsBar({ totalRounds, totalPaidSol, activePlayers, ticketsSoldToday }: Props) {
  return (
    <div className="border-b border-zinc-800 bg-zinc-900/40 px-4 py-2">
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
        <Stat label="Total Rounds" value={totalRounds.toString()} />
        <div className="hidden sm:block w-px h-4 bg-zinc-700" />
        <Stat label="Total Prizes Paid" value={`${totalPaidSol.toFixed(1)} SOL`} accent />
        <div className="hidden sm:block w-px h-4 bg-zinc-700" />
        <Stat label="Active Players" value={activePlayers.toLocaleString()} />
        <div className="hidden sm:block w-px h-4 bg-zinc-700" />
        <Stat label="Tickets Today" value={ticketsSoldToday.toLocaleString()} />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-zinc-600">{label}</span>
      <span className={accent ? "text-emerald-400 font-semibold" : "text-zinc-300 font-semibold"}>
        {value}
      </span>
    </div>
  );
}
