"use client";

import { useState } from "react";
import { useToast } from "./Toast";

interface Props {
  text: string;
  url?: string;
  label?: string;
  variant?: "icon" | "full";
}

export default function ShareButton({ text, url = "https://pruvpot.vercel.app", label = "Share on X", variant = "full" }: Props) {
  const [shared, setShared] = useState(false);
  const { toast } = useToast();

  function handleShare() {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, "_blank", "width=550,height=420,noopener");
    setShared(true);
    setTimeout(() => setShared(false), 3000);
    toast("Opening X to share…", "info");
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleShare}
        title="Share on X"
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-95"
      >
        <XIcon />
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-sm font-medium text-zinc-200 transition-all"
    >
      <XIcon />
      {shared ? "Shared!" : label}
    </button>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
