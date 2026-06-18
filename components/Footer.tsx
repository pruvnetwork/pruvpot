import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 mt-auto py-4 px-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3 text-xs text-zinc-700">
        <span>PRUVPOT · devnet prototype</span>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="hover:text-zinc-500 transition-colors">Admin Panel</Link>
          <Link href="/operator" className="hover:text-zinc-500 transition-colors">Node Operator Portal</Link>
          <a
            href="https://github.com/pruvnetwork/pruv"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-500 transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
