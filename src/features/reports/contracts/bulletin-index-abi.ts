// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

export const T3rminalBulletinIndexABI = [
  {
    inputs: [{ internalType: "bytes32", name: "shopKey", type: "bytes32" }],
    name: "getAllDates",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "shopKey", type: "bytes32" },
      { internalType: "string", name: "date", type: "string" },
    ],
    name: "getMetadata",
    outputs: [
      {
        components: [
          { internalType: "string", name: "cid", type: "string" },
          { internalType: "uint256", name: "entryCount", type: "uint256" },
          { internalType: "uint256", name: "publishedAt", type: "uint256" },
          { internalType: "bool", name: "exists", type: "bool" },
        ],
        internalType: "struct IT3rminalBulletinIndex.DayMetadata",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "shopKey", type: "bytes32" },
      { internalType: "string", name: "date", type: "string" },
    ],
    name: "getCID",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "shopKey", type: "bytes32" }],
    name: "getReportCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "shopKey", type: "bytes32" },
      { indexed: true, internalType: "string", name: "date", type: "string" },
      { indexed: false, internalType: "string", name: "cid", type: "string" },
      { indexed: false, internalType: "uint256", name: "entryCount", type: "uint256" },
      { indexed: false, internalType: "address", name: "writer", type: "address" },
    ],
    name: "DailyReportStored",
    type: "event",
  },
] as const;
