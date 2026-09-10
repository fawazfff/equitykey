# Base Builder Code Attribution

EquityKey uses Base Builder Code `bc_5782069q` for ERC-8021 transaction attribution.

## Where it is stored

The Builder Code and its ERC-8021 schema 0 data suffix are stored in `src/constants/builderCode.ts`.

## How attribution is attached

`lib/wagmi.ts` passes the shared ERC-8021 suffix to Wagmi's `createConfig` through `dataSuffix`.

This means transactions sent through EquityKey's Wagmi transaction hooks automatically carry EquityKey's Builder Code attribution.

The current Base Sepolia flows covered by this are:
- creating a benefit
- receiving a demo share
- recording a benefit claim

## Rule

Do not remove the `dataSuffix` configuration from `lib/wagmi.ts`. Any new transaction path should use the shared `wagmiConfig` so Base can attribute the transaction to EquityKey.
