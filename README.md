# YEET Token

**SUNDAY SUNDAY SUNDAY** — A monster-truck-themed tax token dApp on Base.

## Overview

YEET is an ERC-20 token deployed on **Base** with a flat **1% tax** on every Uniswap V2 buy and sell. All taxes go directly to an immutable on-chain vault.

## Contract Addresses (Base, chain ID 8453)

| Contract       | Address                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| YEET Token     | [`0xd369f5884df947030f9e54fc51f7b35d07496b3e`](https://basescan.org/token/0xd369f5884df947030f9e54fc51f7b35d07496b3e)             |
| Tax Vault      | [`0xB2ac59aE04d0f7310dC3519573BF70387b3b6E3a`](https://basescan.org/address/0xB2ac59aE04d0f7310dC3519573BF70387b3b6E3a)           |
| Uniswap V2 Pair | [`0x16048B16Aace160Cdb7dF4De2E20b4d28b5227FA`](https://basescan.org/address/0x16048B16Aace160Cdb7dF4De2E20b4d28b5227FA)          |
| V2 Router      | [`0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24`](https://basescan.org/address/0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24)           |

- **Total supply:** 1,000,000 YEET
- **Tax:** 1% on Uniswap V2 buys and sells (forwarded immutably to the vault)

## Quickstart (Frontend)

```bash
yarn install
yarn start
```

Visit `http://localhost:3000`.

## Build

```bash
yarn next:build
```
