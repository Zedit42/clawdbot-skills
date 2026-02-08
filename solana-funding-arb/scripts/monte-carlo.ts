/**
 * Monte Carlo Simulation for Funding Rate Arbitrage
 * Tests: slippage, timing, rate changes, liquidation risk
 */

interface SimulationParams {
  initialCapital: number;
  leverage: number;
  days: number;
  numSimulations: number;
  
  // Rate parameters
  baseSpreadDaily: number;      // Expected daily spread (e.g., 0.03 = 3%)
  spreadVolatility: number;     // Daily volatility of spread
  rateReversalProb: number;     // Probability of rate reversal per day
  
  // Execution parameters
  slippageMean: number;         // Average slippage per entry/exit
  slippageStd: number;          // Slippage standard deviation
  entryExitFrequency: number;   // How often we rebalance (days)
  
  // Fee parameters
  tradingFee: number;           // Per trade fee
  fundingFee: number;           // DEX funding fee (if any)
  
  // Risk parameters
  liquidationThreshold: number; // Equity % at which liquidation occurs
  maxDrawdownLimit: number;     // Stop trading if DD exceeds this
}

interface SimulationResult {
  finalEquity: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  wasLiquidated: boolean;
  hitDrawdownLimit: boolean;
  dailyReturns: number[];
}

interface MonteCarloStats {
  meanReturn: number;
  medianReturn: number;
  stdDev: number;
  percentile5: number;
  percentile25: number;
  percentile75: number;
  percentile95: number;
  liquidationRate: number;
  drawdownLimitRate: number;
  profitableRate: number;
  meanMaxDrawdown: number;
  meanSharpe: number;
}

// Normal distribution random
function randomNormal(mean: number = 0, std: number = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

// Run single simulation
function runSimulation(params: SimulationParams): SimulationResult {
  let equity = params.initialCapital;
  let maxEquity = equity;
  let maxDrawdown = 0;
  const dailyReturns: number[] = [];
  let wasLiquidated = false;
  let hitDrawdownLimit = false;
  let currentSpread = params.baseSpreadDaily;
  let positionOpen = false;
  let daysSinceEntry = 0;
  
  for (let day = 0; day < params.days; day++) {
    // 1. Update spread with mean reversion + noise
    const spreadNoise = randomNormal(0, params.spreadVolatility);
    const meanReversion = (params.baseSpreadDaily - currentSpread) * 0.1;
    currentSpread = Math.max(0, currentSpread + meanReversion + spreadNoise);
    
    // 2. Check for rate reversal (spread goes negative)
    if (Math.random() < params.rateReversalProb) {
      currentSpread = -Math.abs(currentSpread) * (0.3 + Math.random() * 0.7);
    }
    
    // 3. Calculate daily PnL
    let dailyPnL = 0;
    
    if (!positionOpen) {
      // Entry decision - enter if spread is positive
      if (currentSpread > params.tradingFee * 2) {
        positionOpen = true;
        daysSinceEntry = 0;
        
        // Entry slippage
        const entrySlippage = Math.abs(randomNormal(params.slippageMean, params.slippageStd));
        dailyPnL -= entrySlippage * params.leverage;
        dailyPnL -= params.tradingFee * params.leverage;
      }
    } else {
      // Position is open
      daysSinceEntry++;
      
      // Collect funding (spread * leverage)
      const fundingCollected = currentSpread * params.leverage;
      dailyPnL += fundingCollected;
      
      // Subtract ongoing fees
      dailyPnL -= params.fundingFee * params.leverage;
      
      // Check if we should exit
      const shouldExit = 
        currentSpread < 0 ||  // Spread reversed
        daysSinceEntry >= params.entryExitFrequency ||  // Rebalance time
        Math.random() < 0.02;  // Random exit (2% daily)
      
      if (shouldExit) {
        positionOpen = false;
        
        // Exit slippage
        const exitSlippage = Math.abs(randomNormal(params.slippageMean, params.slippageStd));
        dailyPnL -= exitSlippage * params.leverage;
        dailyPnL -= params.tradingFee * params.leverage;
      }
    }
    
    // 4. Update equity
    const dailyReturnPct = dailyPnL;
    dailyReturns.push(dailyReturnPct);
    equity *= (1 + dailyReturnPct);
    
    // 5. Track max equity and drawdown
    if (equity > maxEquity) {
      maxEquity = equity;
    }
    const currentDrawdown = (maxEquity - equity) / maxEquity;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }
    
    // 6. Check liquidation
    if (equity < params.initialCapital * params.liquidationThreshold) {
      wasLiquidated = true;
      break;
    }
    
    // 7. Check drawdown limit
    if (currentDrawdown > params.maxDrawdownLimit) {
      hitDrawdownLimit = true;
      break;
    }
  }
  
  // Calculate Sharpe
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(365) : 0;
  
  return {
    finalEquity: equity,
    totalReturn: (equity - params.initialCapital) / params.initialCapital,
    maxDrawdown,
    sharpeRatio,
    wasLiquidated,
    hitDrawdownLimit,
    dailyReturns,
  };
}

// Run Monte Carlo
function runMonteCarlo(params: SimulationParams): MonteCarloStats {
  const results: SimulationResult[] = [];
  
  for (let i = 0; i < params.numSimulations; i++) {
    results.push(runSimulation(params));
  }
  
  // Calculate statistics
  const returns = results.map(r => r.totalReturn * 100).sort((a, b) => a - b);
  const drawdowns = results.map(r => r.maxDrawdown * 100);
  const sharpes = results.map(r => r.sharpeRatio);
  
  const sum = returns.reduce((a, b) => a + b, 0);
  const mean = sum / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
  
  return {
    meanReturn: mean,
    medianReturn: returns[Math.floor(returns.length / 2)],
    stdDev: Math.sqrt(variance),
    percentile5: returns[Math.floor(returns.length * 0.05)],
    percentile25: returns[Math.floor(returns.length * 0.25)],
    percentile75: returns[Math.floor(returns.length * 0.75)],
    percentile95: returns[Math.floor(returns.length * 0.95)],
    liquidationRate: results.filter(r => r.wasLiquidated).length / results.length * 100,
    drawdownLimitRate: results.filter(r => r.hitDrawdownLimit).length / results.length * 100,
    profitableRate: results.filter(r => r.totalReturn > 0).length / results.length * 100,
    meanMaxDrawdown: drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length,
    meanSharpe: sharpes.reduce((a, b) => a + b, 0) / sharpes.length,
  };
}

async function main() {
  console.log('═'.repeat(80));
  console.log('🎲 MONTE CARLO SIMULATION - FUNDING RATE ARBITRAGE');
  console.log('═'.repeat(80));
  console.log('\nRunning 10,000 simulations for 30-day period...\n');
  
  // Scenario 1: Conservative (REALISTIC)
  const conservative: SimulationParams = {
    initialCapital: 10000,
    leverage: 1.5,
    days: 30,
    numSimulations: 10000,
    baseSpreadDaily: 0.005,      // 0.5% daily base spread (realistic after fees/slippage)
    spreadVolatility: 0.008,     // High volatility - spreads change fast
    rateReversalProb: 0.15,      // 15% chance of reversal per day (common!)
    slippageMean: 0.003,         // 0.3% average slippage
    slippageStd: 0.002,          // Variable slippage
    entryExitFrequency: 5,       // Rebalance every 5 days
    tradingFee: 0.001,           // 0.1% per trade
    fundingFee: 0.0002,          // 0.02% daily funding fee
    liquidationThreshold: 0.2,   // Liquidated at 80% loss
    maxDrawdownLimit: 0.25,      // Stop at 25% drawdown
  };
  
  // Scenario 2: Moderate
  const moderate: SimulationParams = {
    ...conservative,
    leverage: 2.5,
    baseSpreadDaily: 0.008,      // 0.8% daily (optimistic)
    spreadVolatility: 0.01,
    rateReversalProb: 0.18,      // More reversals with higher leverage
    slippageMean: 0.004,
    maxDrawdownLimit: 0.35,
  };
  
  // Scenario 3: Aggressive
  const aggressive: SimulationParams = {
    ...conservative,
    leverage: 4,
    baseSpreadDaily: 0.012,      // 1.2% daily
    spreadVolatility: 0.015,
    rateReversalProb: 0.22,      // High reversal risk
    slippageMean: 0.006,
    maxDrawdownLimit: 0.50,
  };
  
  const scenarios = [
    { name: 'Conservative (1.5x)', params: conservative },
    { name: 'Moderate (2.5x)', params: moderate },
    { name: 'Aggressive (4x)', params: aggressive },
  ];
  
  console.log('┌─────────────────────┬───────────┬───────────┬───────────┬───────────┬───────────┬───────────┬───────────┐');
  console.log('│ Scenario            │ Mean Ret  │ Median    │ P5 (Worst)│ P95 (Best)│ Max DD    │ Liq Rate  │ Win Rate  │');
  console.log('├─────────────────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───────────┤');
  
  const allResults: { name: string; stats: MonteCarloStats }[] = [];
  
  for (const scenario of scenarios) {
    const stats = runMonteCarlo(scenario.params);
    allResults.push({ name: scenario.name, stats });
    
    console.log(
      `│ ${scenario.name.padEnd(19)} │ ` +
      `${stats.meanReturn.toFixed(1).padStart(7)}% │ ` +
      `${stats.medianReturn.toFixed(1).padStart(7)}% │ ` +
      `${stats.percentile5.toFixed(1).padStart(7)}% │ ` +
      `${stats.percentile95.toFixed(1).padStart(7)}% │ ` +
      `${stats.meanMaxDrawdown.toFixed(1).padStart(7)}% │ ` +
      `${stats.liquidationRate.toFixed(1).padStart(7)}% │ ` +
      `${stats.profitableRate.toFixed(1).padStart(7)}% │`
    );
  }
  
  console.log('└─────────────────────┴───────────┴───────────┴───────────┴───────────┴───────────┴───────────┴───────────┘');
  
  // Detailed analysis
  console.log('\n' + '═'.repeat(80));
  console.log('📊 DETAILED ANALYSIS');
  console.log('═'.repeat(80));
  
  for (const { name, stats } of allResults) {
    console.log(`\n${name}:`);
    console.log(`  Expected Monthly Return: ${stats.meanReturn.toFixed(1)}% (Median: ${stats.medianReturn.toFixed(1)}%)`);
    console.log(`  Annual Projection: ${(stats.meanReturn * 12).toFixed(0)}% (simple) / ${(Math.pow(1 + stats.meanReturn/100, 12) - 1).toFixed(0) * 100}% (compound)`);
    console.log(`  Risk Metrics:`);
    console.log(`    - Worst 5%: ${stats.percentile5.toFixed(1)}%`);
    console.log(`    - Best 5%:  ${stats.percentile95.toFixed(1)}%`);
    console.log(`    - Std Dev:  ${stats.stdDev.toFixed(1)}%`);
    console.log(`    - Sharpe:   ${stats.meanSharpe.toFixed(2)}`);
    console.log(`  Failure Rates:`);
    console.log(`    - Liquidation: ${stats.liquidationRate.toFixed(2)}%`);
    console.log(`    - DD Limit:    ${stats.drawdownLimitRate.toFixed(2)}%`);
    console.log(`    - Profitable:  ${stats.profitableRate.toFixed(1)}%`);
  }
  
  // Risk-adjusted comparison - USDC/Stablecoin yields only
  console.log('\n' + '═'.repeat(80));
  console.log('⚖️  USDC/STABLECOIN YIELD COMPARISON');
  console.log('═'.repeat(80));
  
  console.log(`
┌──────────────────────────────────────────────────────────────────────────────┐
│ Platform                       │ APY             │ Risk Level │ Notes        │
├────────────────────────────────┼─────────────────┼────────────┼──────────────┤
│ 🏦 US BANKS (USD)                                                            │
├────────────────────────────────┼─────────────────┼────────────┼──────────────┤
│ High-Yield Savings (Ally)      │ 4.0%            │ Very Low   │ FDIC insured │
│ 1-Year CD                      │ 4.5%            │ Very Low   │ FDIC insured │
│ Money Market (Fidelity)        │ 4.9%            │ Very Low   │ SIPC insured │
├────────────────────────────────┼─────────────────┼────────────┼──────────────┤
│ 📊 CEX EARN (USDC)                                                           │
├────────────────────────────────┼─────────────────┼────────────┼──────────────┤
│ Binance Flexible               │ 3.2%            │ Low        │ Custodial    │
│ Coinbase USDC Rewards          │ 4.1%            │ Low        │ Custodial    │
│ Bybit Savings                  │ 5.5%            │ Low        │ Custodial    │
│ OKX Simple Earn                │ 4.8%            │ Low        │ Custodial    │
├────────────────────────────────┼─────────────────┼────────────┼──────────────┤
│ 🔷 DEFI LENDING (USDC)                                                       │
├────────────────────────────────┼─────────────────┼────────────┼──────────────┤
│ Aave V3 (Ethereum)             │ 2.5%            │ Low-Med    │ Blue chip    │
│ Aave V3 (Base)                 │ 3.8%            │ Low-Med    │ Blue chip    │
│ Compound V3                    │ 3.5%            │ Low-Med    │ Blue chip    │
│ Morpho (Ethereum)              │ 5.0%            │ Medium     │ Optimized    │
│ Marginfi (Solana)              │ 8.5%            │ Medium     │ Solana DeFi  │
│ Kamino (Solana)                │ 7.2%            │ Medium     │ Solana DeFi  │
│ Gains Network (Arb)            │ 14.0%           │ Med-High   │ GLP-style    │
├────────────────────────────────┼─────────────────┼────────────┼──────────────┤
│ ⚡ FUNDING RATE ARBITRAGE                                                    │
├────────────────────────────────┼─────────────────┼────────────┼──────────────┤
│ Conservative (1.5x)            │ ${(allResults[0].stats.meanReturn * 12).toFixed(0).padStart(3)}%           │ Medium     │ ${allResults[0].stats.profitableRate.toFixed(0)}% win rate │
│ Moderate (2.5x)                │ ${(allResults[1].stats.meanReturn * 12).toFixed(0).padStart(3)}%           │ Med-High   │ ${allResults[1].stats.profitableRate.toFixed(0)}% win rate │
│ Aggressive (4x)                │ ${(allResults[2].stats.meanReturn * 12).toFixed(0).padStart(3)}%          │ High       │ ${allResults[2].stats.profitableRate.toFixed(0)}% win rate │
└────────────────────────────────┴─────────────────┴────────────┴──────────────┘
`);

  // Key insights
  console.log('═'.repeat(80));
  console.log('💡 KEY INSIGHTS');
  console.log('═'.repeat(80));
  
  const conservativeAnnual = allResults[0].stats.meanReturn * 12;
  const moderateAnnual = allResults[1].stats.meanReturn * 12;
  
  console.log(`
  📈 RETURN COMPARISON (vs USDC Yields):
  
  ┌────────────────────────┬──────────┬─────────────────────────────────────┐
  │ Baseline               │ APY      │ Funding Arb Multiplier              │
  ├────────────────────────┼──────────┼─────────────────────────────────────┤
  │ US Bank (4.5%)         │ 4.5%     │ ${(conservativeAnnual / 4.5).toFixed(0)}x / ${(moderateAnnual / 4.5).toFixed(0)}x / ${(allResults[2].stats.meanReturn * 12 / 4.5).toFixed(0)}x (Con/Mod/Agg)    │
  │ CEX Earn (4%)          │ 4.0%     │ ${(conservativeAnnual / 4).toFixed(0)}x / ${(moderateAnnual / 4).toFixed(0)}x / ${(allResults[2].stats.meanReturn * 12 / 4).toFixed(0)}x                      │
  │ Aave USDC (2.5%)       │ 2.5%     │ ${(conservativeAnnual / 2.5).toFixed(0)}x / ${(moderateAnnual / 2.5).toFixed(0)}x / ${(allResults[2].stats.meanReturn * 12 / 2.5).toFixed(0)}x                     │
  │ Marginfi (8.5%)        │ 8.5%     │ ${(conservativeAnnual / 8.5).toFixed(0)}x / ${(moderateAnnual / 8.5).toFixed(0)}x / ${(allResults[2].stats.meanReturn * 12 / 8.5).toFixed(0)}x                      │
  └────────────────────────┴──────────┴─────────────────────────────────────┘
  
  ⚠️ RISK TRADE-OFF:
  
  │ Strategy      │ Win Rate │ Worst 5%  │ Max DD  │ Active Mgmt │
  ├───────────────┼──────────┼───────────┼─────────┼─────────────┤
  │ Bank/CEX      │ 100%     │ +4%       │ 0%      │ None        │
  │ Aave          │ ~100%    │ +2%       │ ~0%     │ Low         │
  │ Funding (1.5x)│ ${allResults[0].stats.profitableRate.toFixed(0)}%     │ ${allResults[0].stats.percentile5.toFixed(0)}%       │ ${allResults[0].stats.meanMaxDrawdown.toFixed(0)}%      │ High        │
  │ Funding (2.5x)│ ${allResults[1].stats.profitableRate.toFixed(0)}%     │ ${allResults[1].stats.percentile5.toFixed(0)}%       │ ${allResults[1].stats.meanMaxDrawdown.toFixed(0)}%      │ High        │
  │ Funding (4x)  │ ${allResults[2].stats.profitableRate.toFixed(0)}%     │ ${allResults[2].stats.percentile5.toFixed(0)}%      │ ${allResults[2].stats.meanMaxDrawdown.toFixed(0)}%     │ Very High   │
  
  🎯 RECOMMENDATION:
  - If you want passive income → Stick with Aave/CEX (2-8% APY, near 0 risk)
  - If you can actively manage → Funding arb offers 20-100x better yields
  - Start small, prove the strategy works before scaling
  - Never use funds you cannot afford to lose
`);

  console.log('═'.repeat(80));
}

main().catch(console.error);
