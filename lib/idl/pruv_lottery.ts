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
      "name": "exitNode",
      "docs": [
        "Leave the registry. The record is closed and its full balance (stake +",
        "rent) is returned to the operator. Prize claims for past votes remain",
        "possible: they are keyed by the DrawVote accounts, not by this record."
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
