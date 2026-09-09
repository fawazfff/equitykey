# EquityKey

**Ownership, made programmable.**

EquityKey is a non-custodial benefit protocol for Coinbase Tokenized Stocks on Base. Benefit creators define ownership rules. Wallets prove eligibility from B20-aware balances and claim with an onchain receipt, while their assets remain in their wallets.

**Live app:** [equitykey.vercel.app](https://equitykey.vercel.app)

## Two honest modes

- **Live Mode · Base Mainnet:** read-only ownership checks against the official Coinbase Tokenized Stock contract registry.
- **Demo Mode · Base Sepolia:** interactive, zero-cost demonstration using a clearly labeled test token with no value.

Demo tokens are never presented as Coinbase-issued assets. Mainnet failures never fall back to test balances.

## Product rules

- Identify Coinbase Tokenized Stocks by canonical contract address, not ticker alone.
- Use `scaledBalanceOf` rather than raw `balanceOf`, so multiplier-based corporate actions are reflected.
- Enforce eligibility inside the claim transaction.
- Support `SINGLE`, `ALL`, `ANY`, and normalized `BASKET` rules.
- Keep immutable rule references and stable benefit IDs.
- Support one-time and continuing benefits.
- Emit claim receipts as events. Receipts are not NFTs.
- Never request token approvals, custody assets, or execute trades.

## Contract design

`EquityKey.sol` stores accepted token addresses, immutable rule inputs, benefit status, and claim history. `isEligible` reads each token's B20 `scaledBalanceOf`. `claim` repeats the check and emits `BenefitClaimed` only when the rule passes.

`BASKET` rules use normalized progress toward each stock minimum. Each stock contributes at most `1e18`; the sum must reach the stored basket threshold. This avoids directly adding quantities of unrelated stocks.

`MockB20.sol` exists only for Base Sepolia demonstrations.

### Base Sepolia deployments

- Demo B20 token: [`0xF32757dfd9714889f6Bb3db44e258337BE1D6a74`](https://sepolia.basescan.org/address/0xF32757dfd9714889f6Bb3db44e258337BE1D6a74)
- EquityKey registry: [`0xf4842f5C493cFdB7BB69df0807B346dbeEc43800`](https://sepolia.basescan.org/address/0xf4842f5C493cFdB7BB69df0807B346dbeEc43800)
- Default demo benefit: `#1`
- Verified demo mint: [`0x46fed9…fd4e3e`](https://sepolia.basescan.org/tx/0x46fed9c0c19c156a361a5d03ed14d4315722fd4944149c472a57f57b9afd4e3e)
- Verified benefit claim: [`0x8d68c2…698f7e`](https://sepolia.basescan.org/tx/0x8d68c277ee68bd811d0424d750916356a069b0667e64d72a98aa539c11698f7e)

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

No private API is required for read-only Mainnet checks. Configure the two public testnet contract addresses to enable Demo Mode transactions.

## Contracts

```bash
npm run contracts:compile
DEPLOYER_PRIVATE_KEY=0x... npm run contracts:deploy:demo
```

Use a Base Sepolia-only deployer key. Never commit private keys. The deploy script outputs the public addresses to add to `.env.local` and Vercel.

## Checks

```bash
npm run lint
npm test
npm run contracts:compile
npm run build
```

## Official sources

- [Coinbase Tokenized Stocks registry](https://www.base.org/stocks)
- [Base B20 integration guide](https://docs.base.org/specifications/b20/tokenized-stocks-on-base)

Coinbase Tokenized Stocks are issued by Coinbase and are only available to eligible people outside the United States. EquityKey does not provide investment advice or trading.
