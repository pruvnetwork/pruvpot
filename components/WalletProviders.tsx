"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

import { rpcEndpoint } from "@/lib/rpc";

export default function WalletProviders({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={rpcEndpoint()}>
      <WalletProvider wallets={wallets} autoConnect onError={() => {}}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
