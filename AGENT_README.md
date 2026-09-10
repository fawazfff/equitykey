# Base Builder Code Attribution

EquityKey uses Base Builder Code `bc_5782069q` for ERC-8021 transaction attribution.

## Where it is stored

The code is stored in `src/constants/builderCode.ts`:

```ts
export const BUILDER_CODE = "bc_5782069q";
```

## How attribution is attached

`lib/wagmi.ts` converts the Builder Code to an ERC-8021 data suffix with `ox/erc8021` and passes it to Wagmi's `createConfig` through `dataSuffix`.

This means transactions sent through EquityKey's Wagmi transaction hooks automatically carry the Builder Code attribution.

## Rule

Do not remove the `dataSuffix` configuration from `lib/wagmi.ts`. Any new transaction path should use the shared `wagmiConfig` so Base can attribute the transaction to EquityKey.
