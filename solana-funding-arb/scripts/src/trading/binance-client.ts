/**
 * Binance Futures Client
 * 
 * Gets funding rates from Binance Futures (USDT-M)
 * Public API - no authentication required for market data
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const BINANCE_API = 'https://fapi.binance.com';

export interface BinanceMarketInfo {
  symbol: string;
  baseAsset: string;
  oraclePrice: number;
  markPrice: number;
  fundingRate: number;      // Per 8h rate as decimal
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

export class BinanceClient {
  name = 'binance';
  private isDryRun: boolean;

  constructor(dryRun: boolean = true) {
    this.isDryRun = dryRun || process.env.DRY_RUN === 'true';
  }

  async initializeWallet(walletPath?: string): Promise<boolean> {
    // Binance doesn't need Solana wallet
    logger.info('Binance: Market data mode (no trading)');
    return true;
  }

  /**
   * Get funding rates for major assets
   */
  async getMarkets(): Promise<BinanceMarketInfo[]> {
    try {
      // Get premium index (includes funding rate and mark price)
      const [premiumResponse, tickerResponse] = await Promise.all([
        axios.get(`${BINANCE_API}/fapi/v1/premiumIndex`, { timeout: 10000 }),
        axios.get(`${BINANCE_API}/fapi/v1/ticker/24hr`, { timeout: 10000 })
      ]);

      const premiumData = premiumResponse.data;
      const tickerData = tickerResponse.data;

      // Create ticker map for quick lookup
      const tickerMap = new Map<string, any>();
      for (const t of tickerData) {
        tickerMap.set(t.symbol, t);
      }

      const markets: BinanceMarketInfo[] = [];

      // Filter for major assets that match Drift markets
      const targetAssets = ['SOL', 'BTC', 'ETH', 'JUP', 'WIF', 'JTO', 'BONK', 'DOGE', 'ARB', 'SUI', 'APT', 'INJ'];

      for (const p of premiumData) {
        // Only USDT perpetuals
        if (!p.symbol.endsWith('USDT')) continue;
        
        const baseAsset = p.symbol.replace('USDT', '');
        if (!targetAssets.includes(baseAsset)) continue;

        const ticker = tickerMap.get(p.symbol);
        
        // Binance funding rate is per 8 hours
        // Convert to hourly then to APY
        const fundingRate8h = parseFloat(p.lastFundingRate);
        const hourlyRate = fundingRate8h / 8;
        const fundingRateApy = hourlyRate * 24 * 365 * 100;

        markets.push({
          symbol: `${baseAsset}-PERP`,  // Match Drift format
          baseAsset,
          oraclePrice: parseFloat(p.indexPrice),
          markPrice: parseFloat(p.markPrice),
          fundingRate: hourlyRate,
          fundingRateApy,
          nextFundingTime: parseInt(p.nextFundingTime),
          openInterest: ticker ? parseFloat(ticker.openInterest) * parseFloat(p.markPrice) : 0,
          volume24h: ticker ? parseFloat(ticker.quoteVolume) : 0
        });
      }

      // Sort by absolute APY
      markets.sort((a, b) => Math.abs(b.fundingRateApy) - Math.abs(a.fundingRateApy));
      
      logger.info(`Loaded ${markets.length} Binance markets`);
      return markets;

    } catch (error: any) {
      logger.error(`Binance API error: ${error.message}`);
      return this.getFallbackData();
    }
  }

  /**
   * Fallback data if API fails
   */
  private getFallbackData(): BinanceMarketInfo[] {
    logger.warn('Using fallback data for Binance');
    return [
      { symbol: 'SOL-PERP', baseAsset: 'SOL', oraclePrice: 88, markPrice: 88, fundingRate: -0.00005, fundingRateApy: -43.8, nextFundingTime: 0, openInterest: 0, volume24h: 0 },
      { symbol: 'BTC-PERP', baseAsset: 'BTC', oraclePrice: 71000, markPrice: 71000, fundingRate: 0.00001, fundingRateApy: 8.76, nextFundingTime: 0, openInterest: 0, volume24h: 0 },
      { symbol: 'ETH-PERP', baseAsset: 'ETH', oraclePrice: 2100, markPrice: 2100, fundingRate: 0.00002, fundingRateApy: 17.52, nextFundingTime: 0, openInterest: 0, volume24h: 0 },
    ];
  }

  /**
   * Get specific market
   */
  async getMarket(symbol: string): Promise<BinanceMarketInfo | null> {
    const markets = await this.getMarkets();
    const baseSymbol = symbol.replace('-PERP', '');
    return markets.find(m => m.baseAsset === baseSymbol) || null;
  }

  /**
   * Open position (dry run only - actual trading would need API keys)
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

    logger.info(`[BINANCE DRY_RUN] Would open ${side.toUpperCase()} ${symbol}`);
    logger.info(`  Size: $${sizeUsd.toFixed(2)} (${baseSize.toFixed(6)} base)`);
    logger.info(`  Entry: $${market.oraclePrice.toFixed(4)}`);
    logger.info(`  Funding APY: ${market.fundingRateApy.toFixed(2)}%`);

    return {
      success: true,
      orderId: `BINANCE_DRY_${Date.now()}`,
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
    logger.info(`[BINANCE DRY_RUN] Would close ${symbol}`);
    return {
      success: true,
      orderId: `BINANCE_CLOSE_${Date.now()}`
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
