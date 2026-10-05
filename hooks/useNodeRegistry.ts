"use client";

import { useEffect, useState } from "react";
import { getConnection } from "@/lib/rpc";
import { fetchAllNodeRecords, fetchRegistry, type NodeRecordInfo, type NodeRegistryInfo } from "@/lib/lottery-client";

export interface NodeRegistryState {
  registry: NodeRegistryInfo | null;
  nodes: NodeRecordInfo[];
  loading: boolean;
}

/** Registered node operators and the registry counters, polled every 15 s. */
export function useNodeRegistry(): NodeRegistryState {
  const [state, setState] = useState<NodeRegistryState>({ registry: null, nodes: [], loading: true });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const conn = getConnection();
        const [registry, nodes] = await Promise.all([fetchRegistry(conn), fetchAllNodeRecords(conn)]);
        if (!cancelled) setState({ registry, nodes, loading: false });
      } catch {
        if (!cancelled) setState(prev => ({ ...prev, loading: false }));
      }
    }
    load();
    const id = setInterval(load, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return state;
}
