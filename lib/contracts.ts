export const b20Abi = [
  { type: "function", name: "scaledBalanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
] as const;

export const demoTokenAbi = [
  ...b20Abi,
  { type: "function", name: "claimDemoTokens", stateMutability: "nonpayable", inputs: [], outputs: [] },
] as const;

export const equityKeyAbi = [
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [{ name: "benefitId", type: "uint256" }], outputs: [] },
  { type: "function", name: "isEligible", stateMutability: "view", inputs: [{ name: "benefitId", type: "uint256" }, { name: "account", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "hasClaimed", stateMutability: "view", inputs: [{ name: "benefitId", type: "uint256" }, { name: "account", type: "address" }], outputs: [{ name: "", type: "bool" }] },
] as const;

export const DEMO_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_DEMO_TOKEN_ADDRESS as `0x${string}` | undefined;
export const EQUITYKEY_ADDRESS = process.env.NEXT_PUBLIC_EQUITYKEY_ADDRESS as `0x${string}` | undefined;
