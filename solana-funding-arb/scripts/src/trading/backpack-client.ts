/**
 * Backpack Exchange Client
 * 
 * Solana-native exchange with perpetual futures
 * Public API - no authentication required for market data
 * https://docs.backpack.exchange/
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const BACKPACK_API = 'https://api.backpack.exchange/api/v1';

export interface BackpackMarketInfo {
  symbol: string;
  baseAsset: string;
  oraclePrice: number;
  markPrice: number;
  fundingRate: number;      // Per hour rate as decimal
  fundingRateApy: number;   // Annualized %
  nextFundingTime: number;
  openInterest: number;
  volume24h: number;
}

export interface TradeResult {
  success: boolean;
  orderId?: string;
  error?: string;
  details?: any;
}

export class BackpackClient {
  name = 'backpack';
  private isDryRun: boolean;

  constructor(dryRun: boolean = true) {
    this.isDryRun = dryRun || process.env.DRY_RUN === 'true';
  }

  async initializeWallet(walletPath?: string): Promise<boolean> {
    logger.info('Backpack: Market data mode');
    return true;
  }

  /**
   * Get perp markets with funding rates
   * Only fetches main markets for speed
   */
  async getMarkets(): Promise<BackpackMarketInfo[]> {
    // Main perp symbols on Backpack
    const targetSymbols = [
      'SOL_USDC_PERP',
      'BTC_USDC_PERP', 
      'ETH_USDC_PERP',
      'WIF_USDC_PERP',
      'JUP_USDC_PERP',
      'RENDER_USDC_PERP',
    ];

    try {
      // Get tickers for prices
      const tickersRes = await axios.get(`${BACKPACK_API}/tickers`, { timeout: 10000 });
      const tickerMap = new Map<string, any>();
      for (const t of tickersRes.data) {
        tickerMap.set(t.symbol, t);
      }

      // Fetch funding rates in parallel for speed
      const fundingPromises = targetSymbols.map(symbol =>
        axios.get(`${BACKPACK_API}/fundingRates`, {
          params: { symbol },
          timeout: 10000
        }).then(res => ({ symbol, data: res.data })).catch(() => null)
      );

      const fundingResults = await Promise.all(fundingPromises);
      const markets: BackpackMarketInfo[] = [];

      for (const result of fundingResults) {
        if (!result || !result.data || result.data.length === 0) continue;

        const latestFunding = result.data[0];
        const ticker = tickerMap.get(result.symbol);
        
        // Funding rate is already hourly
        const hourlyRate = parseFloat(latestFunding.fundingRate);
        const fundingRateApy = hourlyRate * 24 * 365 * 100;

        // Convert symbol format: SOL_USDC_PERP -> SOL-PERP
        const baseAsset = result.symbol.replace('_USDC_PERP', '');
        const driftSymbol = `${baseAsset}-PERP`;

        markets.push({
          symbol: driftSymbol,  // Match Drift format for comparison
          baseAsset,
          oraclePrice: ticker ? parseFloat(ticker.lastPrice) : 0,
          markPrice: ticker ? parseFloat(ticker.lastPrice) : 0,
          fundingRate: hourlyRate,
          fundingRateApy,
          nextFundingTime: Date.now() + 3600000, // Backpack = hourly funding
          openInterest: 0,  // Not in public API
          volume24h: ticker ? parseFloat(ticker.quoteVolume) : 0
        });
      }

      // Sort by absolute APY
      markets.sort((a, b) => Math.abs(b.fundingRateApy) - Math.abs(a.fundingRateApy));
      
      logger.info(`Loaded ${markets.length} Backpack markets`);
      return markets;

    } catch (error: any) {
      logger.error(`Backpack API error: ${error.message}`);
      return [];
    }
  }

  /**
   * Get specific market
   */
  async getMarket(symbol: string): Promise<BackpackMarketInfo | null> {
    const markets = await this.getMarkets();
    const baseSymbol = symbol.replace('-PERP', '');
    return markets.find(m => m.baseAsset === baseSymbol) || null;
  }

  /**
   * Open position (dry run)
   */
  async openPosition(
    symbol: string,
    side: 'long' | 'short',
    sizeUsd: number,
    leverage: number = 1
  ): Promise<TradeResult> {
    const market = await this.getMarket(symbol);
    if (!market) {
      return { success: false, error: `Market ${symbol} not found` };
    }

    const baseSize = sizeUsd / market.oraclePrice;

    logger.info(`[BACKPACK DRY_RUN] Would open ${side.toUpperCase()} ${symbol}`);
    logger.info(`  Size: $${sizeUsd.toFixed(2)} (${baseSize.toFixed(6)} base)`);
    logger.info(`  Entry: $${market.oraclePrice.toFixed(4)}`);
    logger.info(`  Funding APY: ${market.fundingRateApy.toFixed(2)}%`);

    return {
      success: true,
      orderId: `BACKPACK_DRY_${Date.now()}`,
      details: {
        market: symbol,
        side,
        size: baseSize,
        notional: sizeUsd,
        entry: market.oraclePrice,
        fundingApy: market.fundingRateApy
      }
    };
  }

  /**
   * Close position
   */
  async closePosition(symbol: string): Promise<TradeResult> {
    logger.info(`[BACKPACK DRY_RUN] Would close ${symbol}`);
    return {
      success: true,
      orderId: `BACKPACK_CLOSE_${Date.now()}`
    };
  }

  /**
   * Get balance (placeholder)
   */
  async getBalance(): Promise<number> {
    return 1000; // Mock
  }

  getWalletAddress(): string | null {
    return null;
  }
}
