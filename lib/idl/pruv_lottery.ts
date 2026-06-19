/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/pruv_lottery.json`.
 */
export type PruvLottery = {
  "address": "HxoYg9RGSK4J7bbFkuUuPXiJqonKD9g5Dx6FiaBSVpob",
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
        "Node calls this after `end_slot` passes. Program re-derives `winner_index`",
        "from SlotHashes; tx is rejected if node's value differs."
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
      "name": "updateNodeCount",
      "discriminator": [
        172,
        38,
        139,
        55,
        2,
        94,
        20,
        45
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
          "signer": true,
          "relations": [
            "config"
          ]
        }
      ],
      "args": [
        {
          "name": "newCount",
          "type": "u32"
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
    }
  ],
  "types": [
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
            "name": "slotHashUsed",
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
            "name": "slotHashUsed",
            "docs": [
              "Slot hash used as entropy — fixed on first cast_draw_vote"
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
    }
  ]
};
