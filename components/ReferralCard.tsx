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
    <div className="border border-violet-800/50 bg-violet-950/10 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔗</span>
        <h3 className="text-sm font-semibold text-violet-300">Refer & Earn</h3>
        <span className="ml-auto text-xs text-zinc-600">0.1% per referred ticket</span>
      </div>

      {/* Copy link */}
      <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2">
        <span className="text-xs font-mono text-zinc-400 flex-1 truncate">{REF_LINK}</span>
        <button
          onClick={copyLink}
          className="shrink-0 text-xs px-3 py-1.5 rounded-md transition-all"
          style={{
            background: copied ? "rgb(5,150,105)" : "rgb(109,40,217)",
            color: "white",
          }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      <p className="text-xs text-zinc-600">
        Earn 0.1% of every ticket purchase made through your link. Rewards sent automatically on-chain.
      </p>
    </div>
  );
}
