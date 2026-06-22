"use client";

interface Props {
  totalRounds: number;
  totalPaidSol: number;
  activePlayers: number;
  ticketsSoldToday: number;
}

export default function StatsBar({ totalRounds, totalPaidSol, activePlayers, ticketsSoldToday }: Props) {
  return (
    <div
      className="border-b px-4 py-2"
      style={{
        background: "var(--surface-primary)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
        <Stat label="Total Rounds" value={totalRounds.toString()} />
        <span className="hidden sm:block w-px h-4" style={{ background: "var(--border-default)" }} />
        <Stat label="Total Prizes Paid" value={`${totalPaidSol.toFixed(1)} SOL`} accent />
        <span className="hidden sm:block w-px h-4" style={{ background: "var(--border-default)" }} />
        <Stat label="Active Players" value={activePlayers.toLocaleString()} />
        <span className="hidden sm:block w-px h-4" style={{ background: "var(--border-default)" }} />
        <Stat label="Tickets Today" value={ticketsSoldToday.toLocaleString()} />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span style={{ color: "var(--text-muted)", fontWeight: 500, fontFamily: "var(--font-body)" }}>{label}</span>
      <span style={accent
        ? { color: "var(--cyan-accent)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }
        : { color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }
      }>
        {value}
      </span>
    </div>
  );
}
