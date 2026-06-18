"use client";

import type { NodeInfo, DrawVoteInfo } from "@/lib/types";
import { shortenAddress } from "@/lib/utils";

interface Props {
  nodes: NodeInfo[];
  votes: DrawVoteInfo[];
  required: number;
  status: 0 | 1 | 2;
}

export default function NodeConsensus({ nodes, votes, required, status }: Props) {
  const votedSet = new Set(votes.map((v) => v.nodePubkey));

  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-200">Node Consensus</h3>
        <span className="text-xs text-zinc-500">
          {votes.length}/{required} required (2/3 threshold)
        </span>
      </div>

      <div className="space-y-2">
        {nodes.map((node) => {
          const voted = votedSet.has(node.operatorPubkey);
          const vote = votes.find((v) => v.nodePubkey === node.operatorPubkey);

          return (
            <div
              key={node.operatorPubkey}
              className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/40"
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  voted
                    ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                    : status === 0
                    ? "bg-zinc-600"
                    : "bg-yellow-500 animate-pulse"
                }`}
              />
              <span className="text-xs font-mono text-zinc-400 flex-1">
                {shortenAddress(node.operatorPubkey)}
              </span>
              <span className="text-xs text-zinc-600">
                Rep {node.reputation}
              </span>
              {voted && vote && (
                <span className="text-xs font-mono text-emerald-500">
                  → ticket #{vote.winnerIndex.toString()}
                </span>
              )}
              {!voted && status === 1 && (
                <span className="text-xs text-yellow-600">voting…</span>
              )}
            </div>
          );
        })}
      </div>

      {status === 2 && (
        <div className="mt-3 p-2 bg-emerald-950/50 border border-emerald-800 rounded-lg text-center">
          <p className="text-xs text-emerald-400">
            Consensus reached — winner derived from SlotHash XOR
          </p>
        </div>
      )}

      {status === 0 && (
        <p className="mt-3 text-xs text-zinc-600 text-center">
          Nodes will cast votes once the round ends
        </p>
      )}
    </div>
  );
}
