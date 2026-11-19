/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/pruv_lottery.json`.
 */
export type PruvLottery = {
  "address": "Ckvfj2PVnEseErjbjFYM9LtqwvZaVLCN6m8Vii7qPddF",
  "metadata": {
    "name": "pruvLottery",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "pruv daily lottery — node-consensus randomness, on-chain prize distribution"
  },
  "instructions": [
    {
      "name": "buyTicket",
      "docs": [
        "`ticket_index` must equal `lottery_state.ticket_count` at call time."
      ],
      "discriminator": [
        11,
        24,
        17,
        193,
        168,
        116,
        164,
        169
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "lotteryState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              }
            ]
          }
        },
        {
          "name": "ticket",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  99,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              },
              {
                "kind": "arg",
                "path": "ticketIndex"
              }
            ]
          }
        },
        {
          "name": "walletCount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                  95,
                  116,
                  105,
                  99,
                  107,
                  101,
                  116,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "roundId",
          "type": "u64"
        },
        {
          "name": "ticketIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "castDrawVote",
      "docs": [
        "Node calls this once the seed window `end_slot .. end_slot+8` is fully in the",
        "SlotHashes sysvar. Program re-derives `winner_index` from the seed; the tx is",
        "rejected if the node's value differs. The first accepted vote fixes the seed."
      ],
      "discriminator": [
        99,
        123,
        255,
        171,
        152,
        64,
        234,
        107
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "lotteryState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              }
            ]
          }
        },
        {
          "name": "drawVote",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  114,
                  97,
                  119,
                  95,
                  118,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              },
              {
                "kind": "account",
                "path": "nodeOperator"
              }
            ]
          }
        },
        {
          "name": "slotHashes",
          "address": "SysvarS1otHashes111111111111111111111111111"
        },
        {
          "name": "nodeRecord",
          "docs": [
            "Only registered, active operators may vote."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "nodeOperator"
              }
            ]
          }
        },
        {
          "name": "nodeOperator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "roundId",
          "type": "u64"
        },
        {
          "name": "winnerIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimNodePrize",
      "discriminator": [
        135,
        112,
        26,
        254,
        235,
        129,
        4,
        84
      ],
      "accounts": [
        {
          "name": "drawVote",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  114,
                  97,
                  119,
                  95,
                  118,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              },
              {
                "kind": "account",
                "path": "nodeOperator"
              }
            ]
          }
        },
        {
          "name": "nodePrizePool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101,
                  95,
                  112,
                  114,
                  105,
                  122,
                  101,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              }
            ]
          }
        },
        {
          "name": "nodeOperator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "roundId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimPenaltyPot",
      "docs": [
        "Permissionless. Once the round is closed, pays everything in the round's",
        "penalty pot (above rent) to the winner. Can be called again if more",
        "slashes arrive later."
      ],
      "discriminator": [
        179,
        178,
        97,
        162,
        26,
        46,
        114,
        214
      ],
      "accounts": [
        {
          "name": "lotteryState",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              }
            ]
          }
        },
        {
          "name": "reschedules",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  115,
                  99,
                  104,
                  101,
                  100,
                  117,
                  108,
                  101,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              }
            ]
          }
        },
        {
          "name": "winnerWallet",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "roundId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "exitNode",
      "docs": [
        "Step 2 of leaving, `UNBONDING_SLOTS` after `request_exit`. The record is",
        "closed and its full balance (stake + rent) is returned to the operator.",
        "Prize claims for past votes remain possible: they are keyed by the DrawVote",
        "accounts, not by this record."
      ],
      "discriminator": [
        127,
        144,
        206,
        137,
        196,
        37,
        165,
        43
      ],
      "accounts": [
        {
          "name": "nodeRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "nodeOperator"
              }
            ]
          }
        },
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "exitRequest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  105,
                  116,
                  95,
                  114,
                  101,
                  113,
                  117,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "nodeOperator"
              }
            ]
          }
        },
        {
          "name": "nodeOperator",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "finalizeDraw",
      "discriminator": [
        112,
        9,
        234,
        94,
        99,
        176,
        12,
        181
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "registry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "lotteryState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              }
            ]
          }
        },
        {
          "name": "winnerTicket",
          "docs": [
            "Winner's Ticket PDA — proves wallet address for the winning index."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  99,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              },
              {
                "kind": "account",
                "path": "lottery_state.committed_winner_index",
                "account": "lotteryState"
              }
            ]
          }
        },
        {
          "name": "winnerWallet",
          "writable": true
        },
        {
          "name": "nodePrizePool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101,
                  95,
                  112,
                  114,
                  105,
                  122,
                  101,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "caller",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "roundId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initConfig",
      "discriminator": [
        23,
        235,
        115,
        232,
        168,
        96,
        1,
        231
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "ticketPriceLamports",
          "type": "u64"
        },
        {
          "name": "maxTicketsPerWallet",
          "type": "u8"
        },
        {
          "name": "roundDurationSlots",
          "type": "u64"
        },
        {
          "name": "nodeShareBps",
          "type": "u16"
        },
        {
          "name": "treasuryShareBps",
          "type": "u16"
        },
        {
          "name": "thresholdBps",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeRound",
      "docs": [
        "Client reads `config.current_round_id`, adds 1, passes as `next_round_id`."
      ],
      "discriminator": [
        43,
        135,
        19,
        93,
        14,
        225,
        131,
        188
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "lotteryState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "nextRoundId"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nextRoundId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "lockConfig",
      "docs": [
        "Permanently freezes the configuration. Creates the `lottery_lock` PDA;",
        "while it exists, `update_config` is rejected (node registration stays open).",
        "There is no unlock. Round opening, ticket sales, voting, finalization",
        "and claims are unaffected (none of them are authority-gated)."
      ],
      "discriminator": [
        140,
        30,
        78,
        170,
        92,
        132,
        150,
        212
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "lock",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121,
                  95,
                  108,
                  111,
                  99,
                  107
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "registerNode",
      "docs": [
        "Register as a node operator by locking `stake_lamports` (≥ MIN_NODE_STAKE)",
        "in a `NodeRecord` PDA. Only registered, active nodes may cast draw votes,",
        "and the 2/3 threshold is computed over the registry's active count.",
        "Permissionless; works before and after `lock_config`."
      ],
      "discriminator": [
        102,
        85,
        117,
        114,
        194,
        188,
        211,
        168
      ],
      "accounts": [
        {
          "name": "nodeRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "nodeOperator"
              }
            ]
          }
        },
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "nodeOperator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "stakeLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "requestExit",
      "docs": [
        "Step 1 of leaving: the node leaves the active set now (it owes no vote for",
        "any window ending after this slot) but its stake stays slashable for",
        "windows it already owed until `exit_node` is allowed."
      ],
      "discriminator": [
        121,
        186,
        203,
        74,
        138,
        218,
        135,
        151
      ],
      "accounts": [
        {
          "name": "nodeRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "nodeOperator"
              }
            ]
          }
        },
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "exitRequest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  105,
                  116,
                  95,
                  114,
                  101,
                  113,
                  117,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "nodeOperator"
              }
            ]
          }
        },
        {
          "name": "nodeOperator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "rescheduleDraw",
      "docs": [
        "Permissionless recovery. If no node voted while the seed window was still",
        "inside the SlotHashes sysvar (~512 slots), the seed can no longer be read",
        "on-chain. Anyone may then move the window to the current slot. Sales stay",
        "closed (buy_ticket requires `slot < end_slot`), the ticket set is unchanged,",
        "and the new window's hashes do not exist yet when this runs.",
        "",
        "The missed window is stored as `MissedWindow[round, attempt]` (attempt = the",
        "round's reschedule count before this call), so every node that owed a vote",
        "for it can be slashed with `slash_missed_window`. Empty rounds have nothing",
        "to draw and cannot be rescheduled."
      ],
      "discriminator": [
        4,
        111,
        24,
        8,
        105,
        94,
        176,
        21
      ],
      "accounts": [
        {
          "name": "lotteryState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              }
            ]
          }
        },
        {
          "name": "slotHashes",
          "address": "SysvarS1otHashes111111111111111111111111111"
        },
        {
          "name": "reschedules",
          "docs": [
            "Per-round reschedule counter and penalty pot."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  115,
                  99,
                  104,
                  101,
                  100,
                  117,
                  108,
                  101,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              }
            ]
          }
        },
        {
          "name": "missedWindow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  115,
                  115,
                  101,
                  100
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              },
              {
                "kind": "arg",
                "path": "attempt"
              }
            ]
          }
        },
        {
          "name": "caller",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "roundId",
          "type": "u64"
        },
        {
          "name": "attempt",
          "type": "u32"
        }
      ]
    },
    {
      "name": "slashAbsentNode",
      "docs": [
        "Permissionless liveness slash. Succeeds only if the node was registered before",
        "the round's `end_slot`, the vote deadline has passed, and the node's DrawVote",
        "account for this round does not exist. Takes `SLASH_BPS` of the stake to the",
        "treasury; a node whose stake falls below the minimum leaves the active set.",
        "The SlashRecord PDA makes it once per (round, node)."
      ],
      "discriminator": [
        69,
        124,
        97,
        164,
        222,
        223,
        5,
        209
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "lotteryState",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              }
            ]
          }
        },
        {
          "name": "nodeRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "node_record.operator",
                "account": "nodeRecord"
              }
            ]
          }
        },
        {
          "name": "drawVote",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  114,
                  97,
                  119,
                  95,
                  118,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              },
              {
                "kind": "account",
                "path": "node_record.operator",
                "account": "nodeRecord"
              }
            ]
          }
        },
        {
          "name": "exitRequest",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  105,
                  116,
                  95,
                  114,
                  101,
                  113,
                  117,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "node_record.operator",
                "account": "nodeRecord"
              }
            ]
          }
        },
        {
          "name": "slashRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  108,
                  97,
                  115,
                  104
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              },
              {
                "kind": "account",
                "path": "node_record.operator",
                "account": "nodeRecord"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "caller",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "roundId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "slashMissedWindow",
      "docs": [
        "Permissionless re-draw penalty. A `MissedWindow` exists only if no node voted",
        "while that window was readable (any accepted vote moves the round out of",
        "Open, and `reschedule_draw` requires Open). Every node that owed a vote for",
        "it loses `SLASH_BPS` of its stake to the round's penalty pot, which goes to",
        "the winner (`claim_penalty_pot`). Once per (round, attempt, node)."
      ],
      "discriminator": [
        163,
        224,
        4,
        223,
        190,
        154,
        78,
        176
      ],
      "accounts": [
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "missedWindow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  115,
                  115,
                  101,
                  100
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              },
              {
                "kind": "arg",
                "path": "attempt"
              }
            ]
          }
        },
        {
          "name": "reschedules",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  115,
                  99,
                  104,
                  101,
                  100,
                  117,
                  108,
                  101,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              }
            ]
          }
        },
        {
          "name": "nodeRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  100,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "node_record.operator",
                "account": "nodeRecord"
              }
            ]
          }
        },
        {
          "name": "exitRequest",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  105,
                  116,
                  95,
                  114,
                  101,
                  113,
                  117,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "node_record.operator",
                "account": "nodeRecord"
              }
            ]
          }
        },
        {
          "name": "slashRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  115,
                  115,
                  101,
                  100,
                  95,
                  115,
                  108,
                  97,
                  115,
                  104
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              },
              {
                "kind": "arg",
                "path": "attempt"
              },
              {
                "kind": "account",
                "path": "node_record.operator",
                "account": "nodeRecord"
              }
            ]
          }
        },
        {
          "name": "caller",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "roundId",
          "type": "u64"
        },
        {
          "name": "attempt",
          "type": "u32"
        }
      ]
    },
    {
      "name": "updateConfig",
      "docs": [
        "Authority can rotate treasury and/or authority address, or adjust",
        "ticket price and round duration. Pass `None` to leave a field unchanged.",
        "Changes apply to rounds opened after this call; an open round keeps the",
        "`end_slot` it was created with."
      ],
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "lock",
          "docs": [
            "to succeed; once `lock_config` has created it, config is frozen forever."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  116,
                  116,
                  101,
                  114,
                  121,
                  95,
                  108,
                  111,
                  99,
                  107
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "config"
          ]
        }
      ],
      "args": [
        {
          "name": "newTreasury",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "newAuthority",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "newTicketPrice",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "newRoundDurationSlots",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "newThresholdBps",
          "type": {
            "option": "u64"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "drawVote",
      "discriminator": [
        120,
        37,
        90,
        181,
        89,
        213,
        219,
        80
      ]
    },
    {
      "name": "exitRequest",
      "discriminator": [
        90,
        22,
        188,
        209,
        173,
        217,
        62,
        9
      ]
    },
    {
      "name": "lotteryConfig",
      "discriminator": [
        174,
        54,
        184,
        175,
        81,
        20,
        237,
        24
      ]
    },
    {
      "name": "lotteryLock",
      "discriminator": [
        42,
        204,
        227,
        52,
        9,
        81,
        91,
        24
      ]
    },
    {
      "name": "lotteryState",
      "discriminator": [
        196,
        210,
        202,
        219,
        204,
        63,
        133,
        85
      ]
    },
    {
      "name": "missedWindow",
      "discriminator": [
        182,
        200,
        127,
        167,
        66,
        192,
        162,
        233
      ]
    },
    {
      "name": "nodePrizePool",
      "discriminator": [
        3,
        38,
        189,
        204,
        84,
        89,
        74,
        28
      ]
    },
    {
      "name": "nodeRecord",
      "discriminator": [
        197,
        233,
        27,
        85,
        153,
        138,
        216,
        115
      ]
    },
    {
      "name": "nodeRegistry",
      "discriminator": [
        44,
        159,
        137,
        51,
        245,
        185,
        177,
        45
      ]
    },
    {
      "name": "roundReschedules",
      "discriminator": [
        47,
        212,
        228,
        114,
        169,
        24,
        65,
        10
      ]
    },
    {
      "name": "slashRecord",
      "discriminator": [
        107,
        134,
        175,
        65,
        150,
        130,
        94,
        68
      ]
    },
    {
      "name": "ticket",
      "discriminator": [
        41,
        228,
        24,
        165,
        78,
        90,
        235,
        200
      ]
    },
    {
      "name": "walletTicketCount",
      "discriminator": [
        219,
        182,
        134,
        162,
        244,
        214,
        148,
        121
      ]
    }
  ],
  "events": [
    {
      "name": "configLocked",
      "discriminator": [
        111,
        41,
        37,
        92,
        41,
        202,
        238,
        59
      ]
    },
    {
      "name": "drawRescheduled",
      "discriminator": [
        135,
        195,
        70,
        67,
        122,
        60,
        152,
        203
      ]
    },
    {
      "name": "drawVoteCast",
      "discriminator": [
        81,
        171,
        255,
        241,
        149,
        71,
        84,
        58
      ]
    },
    {
      "name": "exitRequested",
      "discriminator": [
        92,
        125,
        6,
        23,
        233,
        196,
        149,
        70
      ]
    },
    {
      "name": "lateVoteCast",
      "discriminator": [
        171,
        152,
        213,
        218,
        197,
        106,
        101,
        39
      ]
    },
    {
      "name": "missedWindowSlashed",
      "discriminator": [
        43,
        221,
        237,
        52,
        215,
        122,
        50,
        16
      ]
    },
    {
      "name": "nodeExited",
      "discriminator": [
        80,
        101,
        249,
        168,
        214,
        181,
        167,
        235
      ]
    },
    {
      "name": "nodePrizeClaimed",
      "discriminator": [
        43,
        164,
        6,
        15,
        218,
        140,
        115,
        70
      ]
    },
    {
      "name": "nodeRegistered",
      "discriminator": [
        15,
        57,
        183,
        59,
        93,
        55,
        157,
        195
      ]
    },
    {
      "name": "nodeSlashed",
      "discriminator": [
        195,
        114,
        214,
        16,
        173,
        73,
        177,
        87
      ]
    },
    {
      "name": "penaltyPotPaid",
      "discriminator": [
        131,
        242,
        18,
        61,
        158,
        196,
        27,
        29
      ]
    },
    {
      "name": "roundFinalized",
      "discriminator": [
        43,
        187,
        17,
        193,
        36,
        241,
        48,
        82
      ]
    },
    {
      "name": "roundOpened",
      "discriminator": [
        99,
        173,
        228,
        72,
        142,
        57,
        109,
        178
      ]
    },
    {
      "name": "seedCommitted",
      "discriminator": [
        224,
        239,
        12,
        205,
        163,
        28,
        63,
        9
      ]
    },
    {
      "name": "ticketPurchased",
      "discriminator": [
        108,
        59,
        246,
        95,
        84,
        145,
        13,
        71
      ]
    },
    {
      "name": "windowMissed",
      "discriminator": [
        104,
        122,
        179,
        74,
        98,
        63,
        251,
        119
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "roundNotOpen",
      "msg": "Round is not open"
    },
    {
      "code": 6001,
      "name": "roundEnded",
      "msg": "Round end slot has passed"
    },
    {
      "code": 6002,
      "name": "roundNotEnded",
      "msg": "Round end slot not yet reached"
    },
    {
      "code": 6003,
      "name": "roundNotCommitting",
      "msg": "Round not in Committing state"
    },
    {
      "code": 6004,
      "name": "invalidTicketIndex",
      "msg": "ticket_index must equal ticket_count"
    },
    {
      "code": 6005,
      "name": "maxTicketsExceeded",
      "msg": "Max tickets per wallet reached"
    },
    {
      "code": 6006,
      "name": "noTicketsSold",
      "msg": "No tickets sold — cannot draw"
    },
    {
      "code": 6007,
      "name": "winnerIndexMismatch",
      "msg": "winner_index mismatch with on-chain derivation"
    },
    {
      "code": 6008,
      "name": "invalidWinnerIndex",
      "msg": "winner_index out of range"
    },
    {
      "code": 6009,
      "name": "slotHashesReadFailed",
      "msg": "Failed to read SlotHashes sysvar"
    },
    {
      "code": 6010,
      "name": "thresholdNotMet",
      "msg": "Node threshold (2/3) not met"
    },
    {
      "code": 6011,
      "name": "winnerTicketMismatch",
      "msg": "Winner ticket index mismatch"
    },
    {
      "code": 6012,
      "name": "alreadyClaimed",
      "msg": "Prize already claimed"
    },
    {
      "code": 6013,
      "name": "invalidParam",
      "msg": "Invalid parameter"
    },
    {
      "code": 6014,
      "name": "unauthorized",
      "msg": "unauthorised"
    },
    {
      "code": 6015,
      "name": "configLocked",
      "msg": "Configuration is locked"
    },
    {
      "code": 6016,
      "name": "nodeNotRegistered",
      "msg": "Node is not registered or not active"
    },
    {
      "code": 6017,
      "name": "stakeTooLow",
      "msg": "Stake below MIN_NODE_STAKE_LAMPORTS"
    },
    {
      "code": 6018,
      "name": "noActiveNodes",
      "msg": "No active nodes or no votes"
    },
    {
      "code": 6019,
      "name": "seedWindowNotComplete",
      "msg": "Seed window not yet fully in SlotHashes"
    },
    {
      "code": 6020,
      "name": "seedExpired",
      "msg": "Seed window rotated out of SlotHashes; call reschedule_draw"
    },
    {
      "code": 6021,
      "name": "seedNotExpired",
      "msg": "Seed window is still readable; nothing to reschedule"
    },
    {
      "code": 6022,
      "name": "poseidonFailed",
      "msg": "Poseidon syscall failed"
    },
    {
      "code": 6023,
      "name": "voteWindowOpen",
      "msg": "Vote deadline not passed yet"
    },
    {
      "code": 6024,
      "name": "nodeNotDue",
      "msg": "Node owed no vote for this window (registered later or already leaving)"
    },
    {
      "code": 6025,
      "name": "nodeVoted",
      "msg": "Node voted in this round"
    },
    {
      "code": 6026,
      "name": "invalidAttempt",
      "msg": "attempt must equal the round's reschedule count"
    },
    {
      "code": 6027,
      "name": "roundNotClosed",
      "msg": "Round is not closed yet"
    },
    {
      "code": 6028,
      "name": "penaltyPotEmpty",
      "msg": "Penalty pot is empty"
    },
    {
      "code": 6029,
      "name": "unbondingNotOver",
      "msg": "Unbonding period after request_exit not over"
    }
  ],
  "types": [
    {
      "name": "configLocked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "slot",
            "type": "u64"
          },
          {
            "name": "by",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "drawRescheduled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "oldEndSlot",
            "type": "u64"
          },
          {
            "name": "newEndSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "drawVote",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "nodePubkey",
            "type": "pubkey"
          },
          {
            "name": "winnerIndex",
            "type": "u64"
          },
          {
            "name": "seed",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "drawVoteCast",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "nodePubkey",
            "type": "pubkey"
          },
          {
            "name": "winnerIndex",
            "type": "u64"
          },
          {
            "name": "voteCount",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "exitRequest",
      "docs": [
        "Exists between `request_exit` and `exit_node`."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "operator",
            "type": "pubkey"
          },
          {
            "name": "requestedSlot",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "exitRequested",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "operator",
            "type": "pubkey"
          },
          {
            "name": "requestedSlot",
            "type": "u64"
          },
          {
            "name": "exitAfterSlot",
            "type": "u64"
          },
          {
            "name": "activeNodes",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "lateVoteCast",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "nodePubkey",
            "type": "pubkey"
          },
          {
            "name": "winnerIndex",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "lotteryConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "ticketPriceLamports",
            "type": "u64"
          },
          {
            "name": "maxTicketsPerWallet",
            "type": "u8"
          },
          {
            "name": "roundDurationSlots",
            "type": "u64"
          },
          {
            "name": "nodeShareBps",
            "type": "u16"
          },
          {
            "name": "treasuryShareBps",
            "type": "u16"
          },
          {
            "name": "thresholdBps",
            "type": "u64"
          },
          {
            "name": "activeNodeCount",
            "docs": [
              "Legacy: no longer used for the threshold (see NodeRegistry.active)."
            ],
            "type": "u32"
          },
          {
            "name": "currentRoundId",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "lotteryLock",
      "docs": [
        "Exists only after `lock_config`; its presence freezes the config forever."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lockedAtSlot",
            "type": "u64"
          },
          {
            "name": "lockedBy",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "lotteryState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "startSlot",
            "type": "u64"
          },
          {
            "name": "endSlot",
            "type": "u64"
          },
          {
            "name": "ticketCount",
            "type": "u64"
          },
          {
            "name": "prizePoolLamports",
            "type": "u64"
          },
          {
            "name": "status",
            "docs": [
              "0 = Open, 1 = Committing, 2 = Closed"
            ],
            "type": "u8"
          },
          {
            "name": "winner",
            "type": "pubkey"
          },
          {
            "name": "committedWinnerIndex",
            "type": "u64"
          },
          {
            "name": "seed",
            "docs": [
              "Draw seed (Poseidon over the 8-slot window) — fixed by the first cast_draw_vote"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "voteCount",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "missedWindow",
      "docs": [
        "One per rescheduled window: `end_slot` is the window nobody voted on."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "attempt",
            "type": "u32"
          },
          {
            "name": "endSlot",
            "type": "u64"
          },
          {
            "name": "rescheduledAt",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "missedWindowSlashed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "attempt",
            "type": "u32"
          },
          {
            "name": "operator",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "stakeLeft",
            "type": "u64"
          },
          {
            "name": "deactivated",
            "type": "bool"
          },
          {
            "name": "by",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "nodeExited",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "operator",
            "type": "pubkey"
          },
          {
            "name": "stakeReturned",
            "type": "u64"
          },
          {
            "name": "activeNodes",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "nodePrizeClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "nodePubkey",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "nodePrizePool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "totalLamports",
            "type": "u64"
          },
          {
            "name": "voteCount",
            "type": "u8"
          },
          {
            "name": "claimedCount",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "nodeRecord",
      "docs": [
        "One per registered operator; holds the operator's stake."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "operator",
            "type": "pubkey"
          },
          {
            "name": "stakeLamports",
            "type": "u64"
          },
          {
            "name": "registeredSlot",
            "type": "u64"
          },
          {
            "name": "votesCast",
            "type": "u64"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "nodeRegistered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "operator",
            "type": "pubkey"
          },
          {
            "name": "stakeLamports",
            "type": "u64"
          },
          {
            "name": "activeNodes",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "nodeRegistry",
      "docs": [
        "Global node registry: the active count drives the 2/3 vote threshold."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "active",
            "type": "u32"
          },
          {
            "name": "totalRegistered",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "nodeSlashed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "operator",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "stakeLeft",
            "type": "u64"
          },
          {
            "name": "deactivated",
            "type": "bool"
          },
          {
            "name": "by",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "penaltyPotPaid",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "winner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "roundFinalized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "winner",
            "type": "pubkey"
          },
          {
            "name": "winnerIndex",
            "type": "u64"
          },
          {
            "name": "winnerShare",
            "type": "u64"
          },
          {
            "name": "nodeShare",
            "type": "u64"
          },
          {
            "name": "treasuryShare",
            "type": "u64"
          },
          {
            "name": "voteCount",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "roundOpened",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "startSlot",
            "type": "u64"
          },
          {
            "name": "endSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "roundReschedules",
      "docs": [
        "Per round: how many times the draw window was missed and moved, and the",
        "penalty pot built from the nodes slashed for it (paid to the winner)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "count",
            "type": "u32"
          },
          {
            "name": "penaltyLamports",
            "type": "u64"
          },
          {
            "name": "paidLamports",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "seedCommitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "firstSlot",
            "type": "u64"
          },
          {
            "name": "slotHashes",
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    32
                  ]
                },
                8
              ]
            }
          },
          {
            "name": "presentMask",
            "type": "u8"
          },
          {
            "name": "ticketCount",
            "type": "u64"
          },
          {
            "name": "seed",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "slashRecord",
      "docs": [
        "One per (round, node) slash; its existence prevents a second slash for the same miss."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "operator",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "slot",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "ticket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "ticketPurchased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "walletTicketCount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "count",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "windowMissed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "attempt",
            "type": "u32"
          },
          {
            "name": "missedEndSlot",
            "type": "u64"
          },
          {
            "name": "rescheduleCount",
            "type": "u32"
          }
        ]
      }
    }
  ]
};
