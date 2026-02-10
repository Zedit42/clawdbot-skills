---
name: solana-funding-arb
description: Solana perpetual DEX funding rate arbitrage scanner. Compares 8-hour funding rates across Drift and Flash Trade to find delta-neutral arbitrage opportunities. Use when analyzing Solana perp funding rates, finding cross-DEX arbitrage, or running automated funding collection strategies.
---

# SolArb - Solana Funding Rate Arbitrage

Delta-neutral funding rate arbitrage scanner for Solana perpetual DEXes.

## 🎯 What It Does

Scans funding rates across Drift Protocol and Flash Trade every 8 hours to find arbitrage opportunities where you can collect funding from both sides.

## Supported DEXes

| DEX | Markets | 8h Funding | Data Source |
|-----|---------|------------|-------------|
| Drift Protocol | 65 | ✅ Live | Direct API |
| Flash Trade | 24 | ✅ Live | CoinGecko |

## Quick Start

```bash
cd scripts && npm install

# Scan current rates
npm run scan

# Web dashboard
npm run dashboard
# Open: http://localhost:3456
```

## How It Works

```
Example: SOL Funding Rates (8-hour)

Drift:  -0.0234% (negative = longs receive)
Flash:  +0.0170% (positive = shorts receive)
Spread: 0.0404% per 8h

Strategy:
→ LONG $100 SOL on Drift (receive 0.0234%)
→ SHORT $100 SOL on Flash (receive 0.0170%)  
→ Delta-neutral: No price risk
→ Collect: ~0.04% per 8h = ~0.12% daily = ~44% yearly
```

## Dashboard

Live dashboard with arbitrage simulator: **https://solana-funding-arb.vercel.app**

Features:
- Real-time 8h funding rates
- Position size calculator
- Fee & slippage estimator
- Net profit projection

## CLI Output

```
═══════════════════════════════════════════════════════════════
⚡ SOLANA DEX FUNDING RATE SCANNER - 8 HOUR RATES
═══════════════════════════════════════════════════════════════

📊 8-HOUR FUNDING RATES:

Symbol  | Drift 8h      | Flash 8h      | Spread 8h | Strategy
────────────────────────────────────────────────────────────────
SOL     | 🟢 -0.0234%  | 🔴 +0.0170%  | 0.0404%   | ✨ Long Drift, Short Flash
BTC     | 🟢 -0.0090%  | 🔴 +0.0266%  | 0.0356%   | ✨ Long Drift, Short Flash
ETH     | 🟢 -0.0112%  | 🔴 +0.0008%  | 0.0120%   | ✨ Long Drift, Short Flash

Dashboard: https://solana-funding-arb.vercel.app
═══════════════════════════════════════════════════════════════
```

## Risks

⚠️ **Rate Reversal**: Funding rates change every 8 hours
⚠️ **Execution Costs**: Trading fees (~0.1%) + slippage
⚠️ **Smart Contract Risk**: DEX vulnerabilities

## Links

- **Dashboard**: https://solana-funding-arb.vercel.app
- **Drift Protocol**: https://drift.trade
- **Flash Trade**: https://flash.trade
