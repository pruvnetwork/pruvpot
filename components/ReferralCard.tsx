"use client";

import { useState } from "react";
import { useToast } from "./Toast";

const REF_CODE = "PRUV-9ZWL";
const REF_LINK = `https://pruvpot.vercel.app/?ref=${REF_CODE}`;

export default function ReferralCard() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(REF_LINK).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast("Referral link copied!", "success", "Share it and earn 0.1% of every ticket bought");
  }

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{
        background: "rgba(124, 58, 237, 0.05)",
        border: "1px solid rgba(124, 58, 237, 0.18)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">🔗</span>
        <h3 className="text-sm font-semibold" style={{ color: "var(--purple-primary)" }}>Refer & Earn</h3>
        <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>0.1% per referred ticket</span>
      </div>

      {/* Copy link */}
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2"
        style={{
          background: "var(--bg-page)",
          border: "1px solid var(--border-default)",
        }}
      >
        <span
          className="text-xs flex-1 truncate"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
        >
          {REF_LINK}
        </span>
        <button
          onClick={copyLink}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium text-white"
          style={{
            background: copied ? "var(--success-color)" : "var(--purple-primary)",
            boxShadow: copied ? "none" : "0 4px 12px rgba(124, 58, 237, 0.25)",
            transition: "background 200ms ease, box-shadow 200ms ease",
          }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Earn 0.1% of every ticket purchase made through your link. Rewards sent automatically on-chain.
      </p>
    </div>
  );
}
