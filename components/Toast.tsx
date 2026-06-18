"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "loading";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  detail?: string;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType, detail?: string) => number;
  dismiss: (id: number) => void;
  promise: <T>(p: Promise<T>, msgs: { loading: string; success: string; error: string }) => Promise<T>;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const add = useCallback((message: string, type: ToastType = "info", detail?: string): number => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type, detail }]);
    if (type !== "loading") {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }
    return id;
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const promise = useCallback(async <T,>(
    p: Promise<T>,
    msgs: { loading: string; success: string; error: string }
  ): Promise<T> => {
    const id = add(msgs.loading, "loading");
    try {
      const result = await p;
      dismiss(id);
      add(msgs.success, "success");
      return result;
    } catch (err) {
      dismiss(id);
      add(msgs.error, "error");
      throw err;
    }
  }, [add, dismiss]);

  return (
    <Ctx.Provider value={{ toast: add, dismiss, promise }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-xs w-full">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm pointer-events-auto",
              "animate-[slideIn_0.25s_ease_both]",
              t.type === "success" && "bg-emerald-950 border-emerald-700 text-emerald-200",
              t.type === "error"   && "bg-red-950 border-red-700 text-red-200",
              t.type === "info"    && "bg-zinc-900 border-zinc-700 text-zinc-200",
              t.type === "loading" && "bg-zinc-900 border-zinc-700 text-zinc-200",
            )}
          >
            <span className="mt-0.5 shrink-0 text-base">
              {t.type === "success" ? "✓" :
               t.type === "error"   ? "✕" :
               t.type === "loading" ? <Spinner /> : "ℹ"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{t.message}</p>
              {t.detail && <p className="text-xs opacity-60 mt-0.5">{t.detail}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-40 hover:opacity-80 transition-opacity text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
      style={{ animation: "spin 0.7s linear infinite" }}
    />
  );
}
