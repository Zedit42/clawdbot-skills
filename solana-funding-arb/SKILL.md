---
name: solana-funding-arb
description: Solana perpetual DEX funding rate arbitrage scanner. Compares funding rates across Drift, Flash Trade, GMTrade, and Zeta to find cross-DEX arbitrage opportunities. Use when analyzing Solana perp funding rates, finding funding arbitrage, or setting up delta-neutral strategies to earn from funding rate differentials. Includes Monte Carlo simulation for risk analysis.
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

## Strategy Options (Monte Carlo Validated)

| Strategy | Leverage | Win Rate | APY | Max Drawdown |
|----------|----------|----------|-----|--------------|
| Ultra Safe | 1x | 96% | 126% | 2% |
| Conservative | 1.5x | 89% | 203% | 4% |
| Moderate | 2.5x | 85% | 411% | 9% |

## Quick Start

```bash
cd scripts && npm install

# Scan funding rates
npm run scan

# Start dashboard
npm run start        # http://localhost:3456

# Run simulations
npm run monte-carlo  # 10,000 Monte Carlo simulations
npm run backtest     # 1-month backtest
```

## Configuration

Create `.env` in scripts directory:

```env
# Optional: Custom RPC (recommended for Zeta)
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

## Understanding Output

```
Symbol | Drift APY | Flash APY | Spread | Strategy
SOL    | 🟢 -500%  | 🔴 +800%  | 1300%  | Long Drift, Short Flash
```

- 🟢 Negative rate → GO LONG to receive funding
- 🔴 Positive rate → GO SHORT to receive funding

## Yield Comparison

| Platform | APY | vs Ultra Safe (1x) |
|----------|-----|-------------------|
| US Bank (FDIC) | 4.5% | 28x less |
| Coinbase Earn | 4.1% | 31x less |
| Aave V3 | 2.5% | 50x less |
| Marginfi | 8.5% | 15x less |

## Risks

- Rate reversal (15-18% daily probability)
- Execution slippage (0.2-0.4%)
- Smart contract risk
- Liquidation (if using leverage)

## References

- [API Reference](references/api.md)
- [Setup Guide](references/setup.md)
