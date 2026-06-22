import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="mt-auto py-4 px-4"
      style={{
        background: "var(--surface-primary)",
        borderTop: "1px solid var(--border-default)",
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>PRUVPOT · devnet prototype</span>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            style={{ color: "var(--text-muted)", transition: "var(--transition)" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
          >
            Admin Panel
          </Link>
          <Link
            href="/operator"
            style={{ color: "var(--text-muted)", transition: "var(--transition)" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
          >
            Node Operator Portal
          </Link>
          <a
            href="https://github.com/pruvnetwork/pruv"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--text-muted)", transition: "var(--transition)" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
