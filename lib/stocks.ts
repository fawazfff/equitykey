export type Stock = { ticker: string; company: string; address: `0x${string}`; color: string };

// Canonical Base mainnet addresses from docs.base.org/specifications/b20/tokenized-stocks-on-base.
// Identity is address-first: symbols are display metadata only.
export const STOCKS: Stock[] = [
  { ticker: "AAPLc", company: "Apple", address: "0xb200000000000000000000C2e324d24d7eEcd1fb", color: "#111111" },
  { ticker: "AMZNc", company: "Amazon", address: "0xb200000000000000000000d9192b6B456483C2E8", color: "#ff9900" },
  { ticker: "COINc", company: "Coinbase", address: "0xb200000000000000000000c85a31389D71F3ecfb", color: "#0052ff" },
  { ticker: "CRCLc", company: "Circle", address: "0xB20000000000000000000019f6E7C675b73C2e4D", color: "#00a6de" },
  { ticker: "GOOGLc", company: "Alphabet", address: "0xb2000000000000000000002D0BA3164cc74f58B7", color: "#4285f4" },
  { ticker: "INTCc", company: "Intel", address: "0xB2000000000000000000004AFF16039bA04bdFBc", color: "#0071c5" },
  { ticker: "METAc", company: "Meta", address: "0xb2000000000000000000008bC8786B856E61707C", color: "#0668e1" },
  { ticker: "MSFTc", company: "Microsoft", address: "0xB200000000000000000000Ab99cFa739E253872B", color: "#737373" },
  { ticker: "MSTRc", company: "Strategy", address: "0xb2000000000000000000004884b426556b92883d", color: "#f24822" },
  { ticker: "NVDAc", company: "NVIDIA", address: "0xb20000000000000000000078ee7ce2fE4908108C", color: "#76b900" },
  { ticker: "SNDKc", company: "SanDisk", address: "0xb200000000000000000000397293Cb8cda9a10c5", color: "#6d28d9" },
  { ticker: "SPCXc", company: "SpaceX", address: "0xb2000000000000000000007b9fcbd005511aCBd5", color: "#111111" },
  { ticker: "TSLAc", company: "Tesla", address: "0xb2000000000000000000001e800a7f5189430cD0", color: "#e82127" },
];

export const isOfficialStock = (address: string) => STOCKS.some((stock) => stock.address.toLowerCase() === address.toLowerCase());
export const shorten = (value: string, size = 5) => `${value.slice(0, size + 2)}…${value.slice(-size)}`;
