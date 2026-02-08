---
name: solana-funding-arb
description: Solana perpetual DEX funding rate arbitrage scanner. Compares funding rates across Drift, Flash Trade, GMTrade, and Zeta to find cross-DEX arbitrage opportunities. Use when analyzing Solana perp funding rates, finding funding arbitrage, or setting up delta-neutral strategies to earn from funding rate differentials.
---

# Solana Funding Rate Arbitrage Scanner

Scan funding rates across Solana perpetual DEXes and identify cross-exchange arbitrage opportunities.

## Supported DEXes

| DEX | Markets | Data Source |
|-----|---------|-------------|
| Drift Protocol | 64 | Direct API |
| Flash Trade | 19 | CoinGecko |
| GMTrade | 37 | CoinGecko |
| Zeta Markets | 24 | SDK (requires RPC) |

## Quick Start

```bash
# Install dependencies
cd scripts && npm install

# Run scanner (CLI)
npm run scan

# Start dashboard
npm run start
# Open http://localhost:3456
```

## Configuration

Create `.env` in the scripts directory:

```env
# Optional: Custom Solana RPC (recommended for Zeta)
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Optional: For trade execution (NEVER share this!)
# SOLANA_PRIVATE_KEY=your_base58_private_key
```

### RPC Providers (Free Tiers)

- **Helius**: https://helius.xyz (100k req/day free)
- **Alchemy**: https://alchemy.com/solana
- **QuickNode**: https://quicknode.com

## Understanding the Output

```
Symbol | Drift APY | Flash APY | Spread | Arbitrage
SOL    | 🟢 -500%  | 🔴 +800%  | 1300%  | Long Drift, Short Flash
```

- 🟢 **Negative rate**: Shorts pay longs → GO LONG to receive funding
- 🔴 **Positive rate**: Longs pay shorts → GO SHORT to receive funding
- **Spread**: Potential profit from delta-neutral position

## Strategy

1. **Find opportunity**: High spread between two DEXes
2. **Open hedge**: Long on negative-rate DEX, Short on positive-rate DEX
3. **Collect funding**: Receive payments from both sides
4. **Monitor**: Close when spread narrows or reverses

## Risks

- **Spread reversal**: Rates can flip direction
- **Execution risk**: Slippage when opening/closing
- **Liquidation**: Leverage positions can be liquidated
- **Funding volatility**: Rates change frequently

## API Reference

See [references/api.md](references/api.md) for programmatic access.

## Manual Setup

See [references/setup.md](references/setup.md) for detailed installation guide.
