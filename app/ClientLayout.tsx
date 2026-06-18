"use client";

import { useState, useCallback } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ToastProvider, useToast } from "@/components/Toast";

function Inner({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [walletAddr, setWalletAddr] = useState<string | null>(null);

  const handleConnect = useCallback(() => {
    setConnected(true);
    setWalletAddr("9ZwL...kFpQ");
    toast("Wallet connected", "success", "9ZwL...kFpQ · devnet");
  }, [toast]);

  return (
    <>
      <Nav connected={connected} walletAddr={walletAddr} onConnect={handleConnect} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Inner>{children}</Inner>
    </ToastProvider>
  );
}
