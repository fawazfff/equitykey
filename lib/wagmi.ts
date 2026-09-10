import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { BUILDER_CODE_DATA_SUFFIX } from "@/src/constants/builderCode";

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [injected()],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"),
  },
  dataSuffix: BUILDER_CODE_DATA_SUFFIX,
  ssr: true,
});
