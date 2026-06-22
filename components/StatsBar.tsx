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
      style={{
        borderBottom: "1px solid var(--border)",
        background: "rgba(124,58,237,0.04)",
        padding: "8px 16px",
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
        <Stat label="Total Rounds" value={totalRounds.toString()} />
        <Divider />
        <Stat label="Total Prizes Paid" value={`${totalPaidSol.toFixed(1)} SOL`} accent />
        <Divider />
        <Stat label="Active Players" value={activePlayers.toLocaleString()} />
        <Divider />
        <Stat label="Tickets This Round" value={ticketsSoldToday.toLocaleString()} />
      </div>
    </div>
  );
}

function Divider() {
  return (
    <span
      className="hidden sm:block w-px h-3"
      style={{ background: "var(--border)" }}
    />
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span
        className="font-semibold tabular-nums"
        style={{
          color: accent
            ? "#A855F7"
            : "var(--text-secondary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
