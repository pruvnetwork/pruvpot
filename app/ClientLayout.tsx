"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WalletProviders from "@/components/WalletProviders";
import { ToastProvider, useToast } from "@/components/Toast";

function Inner({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { connected, publicKey, disconnect } = useWallet();
  const prevConnected = useRef(false);

  const walletAddr = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : null;

  useEffect(() => {
    if (connected && !prevConnected.current && walletAddr) {
      toast("Wallet connected", "success", `${walletAddr} · devnet`);
    }
    prevConnected.current = connected;
  }, [connected, walletAddr, toast]);

  return (
    <>
      <Nav
        connected={connected}
        walletAddr={walletAddr}
        onDisconnect={disconnect}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProviders>
      <ToastProvider>
        <Inner>{children}</Inner>
      </ToastProvider>
    </WalletProviders>
  );
}
