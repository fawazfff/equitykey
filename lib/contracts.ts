export const b20Abi = [
  { type: "function", name: "scaledBalanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
] as const;

export const demoTokenAbi = [
  ...b20Abi,
  { type: "function", name: "claimDemoTokens", stateMutability: "nonpayable", inputs: [], outputs: [] },
] as const;

export const equityKeyAbi = [
  { type: "function", name: "createBenefit", stateMutability: "nonpayable", inputs: [{ name: "ruleType", type: "uint8" }, { name: "tokens", type: "address[]" }, { name: "minimums", type: "uint256[]" }, { name: "basketThresholdWad", type: "uint256" }, { name: "oneTime", type: "bool" }, { name: "metadataURI", type: "string" }], outputs: [{ name: "benefitId", type: "uint256" }] },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [{ name: "benefitId", type: "uint256" }], outputs: [] },
  { type: "function", name: "setBenefitActive", stateMutability: "nonpayable", inputs: [{ name: "benefitId", type: "uint256" }, { name: "active", type: "bool" }], outputs: [] },
  { type: "function", name: "isEligible", stateMutability: "view", inputs: [{ name: "benefitId", type: "uint256" }, { name: "account", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "hasClaimed", stateMutability: "view", inputs: [{ name: "benefitId", type: "uint256" }, { name: "account", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "benefits", stateMutability: "view", inputs: [{ name: "benefitId", type: "uint256" }], outputs: [{ name: "creator", type: "address" }, { name: "ruleType", type: "uint8" }, { name: "oneTime", type: "bool" }, { name: "active", type: "bool" }, { name: "basketThresholdWad", type: "uint256" }, { name: "ruleRef", type: "bytes32" }, { name: "metadataURI", type: "string" }] },
  { type: "function", name: "getRule", stateMutability: "view", inputs: [{ name: "benefitId", type: "uint256" }], outputs: [{ name: "tokens", type: "address[]" }, { name: "minimums", type: "uint256[]" }] },
  { type: "event", name: "BenefitCreated", inputs: [{ name: "benefitId", type: "uint256", indexed: true }, { name: "creator", type: "address", indexed: true }, { name: "ruleRef", type: "bytes32", indexed: true }, { name: "ruleType", type: "uint8", indexed: false }, { name: "oneTime", type: "bool", indexed: false }, { name: "metadataURI", type: "string", indexed: false }] },
  { type: "event", name: "BenefitClaimed", inputs: [{ name: "benefitId", type: "uint256", indexed: true }, { name: "account", type: "address", indexed: true }, { name: "ruleRef", type: "bytes32", indexed: true }, { name: "claimNumber", type: "uint256", indexed: false }, { name: "timestamp", type: "uint256", indexed: false }] },
  { type: "event", name: "BenefitStatusChanged", inputs: [{ name: "benefitId", type: "uint256", indexed: true }, { name: "active", type: "bool", indexed: false }] },
] as const;

export const DEMO_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_DEMO_TOKEN_ADDRESS || "0xF32757dfd9714889f6Bb3db44e258337BE1D6a74") as `0x${string}`;
export const EQUITYKEY_ADDRESS = (process.env.NEXT_PUBLIC_EQUITYKEY_ADDRESS || "0xf4842f5C493cFdB7BB69df0807B346dbeEc43800") as `0x${string}`;
