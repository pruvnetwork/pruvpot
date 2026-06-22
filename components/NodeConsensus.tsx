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
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--surface-primary)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Node Consensus</h3>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
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
              className="flex items-center gap-3 p-2 rounded-lg"
              style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-soft)" }}
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  !voted && status === 1 ? "bg-yellow-500 animate-pulse" : ""
                }`}
                style={voted
                  ? { background: "var(--success-color)", boxShadow: "0 0 6px rgba(52,211,153,0.8)" }
                  : status === 0
                  ? { background: "var(--text-faint)" }
                  : undefined
                }
              />
              <span className="text-xs flex-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                {shortenAddress(node.operatorPubkey)}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Rep {node.reputation}
              </span>
              {voted && vote && (
                <span className="text-xs" style={{ color: "var(--success-color)", fontFamily: "var(--font-mono)" }}>
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
        <div className="mt-3 p-2 rounded-lg text-center" style={{ background: "rgba(5, 150, 105, 0.08)", border: "1px solid rgba(5, 150, 105, 0.20)" }}>
          <p className="text-xs" style={{ color: "var(--success-color)" }}>
            Consensus reached — winner derived from SlotHash XOR
          </p>
        </div>
      )}

      {status === 0 && (
        <p className="mt-3 text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Nodes will cast votes once the round ends
        </p>
      )}
    </div>
  );
}
