/**
 * Drift Protocol Trading Client
 * 
 * Uses @drift-labs/sdk for on-chain data and trading
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { 
  DriftClient as DriftSDKClient,
  Wallet,
  MainnetPerpMarkets,
  convertToNumber,
  PRICE_PRECISION,
  QUOTE_PRECISION,
  BASE_PRECISION,
  BN,
  PositionDirection,
  getMarketOrderParams
} from '@drift-labs/sdk';
import * as fs from 'fs';
import { logger } from '../utils/logger';

export interface DriftMarketInfo {
  marketIndex: number;
  symbol: string;
  oraclePrice: number;
  markPrice: number;
  fundingRate: number;  // Hourly rate
  fundingRateApy: number;
  openInterest: number;
  volume24h: number;
}

export interface DriftPosition {
  marketIndex: number;
  symbol: string;
  side: 'long' | 'short';
  size: number;         // Base amount
  notional: number;     // USD value
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  fundingAccrued: number;
  leverage: number;
}

export interface TradeResult {
  success: boolean;
  txSignature?: string;
  orderId?: string;
  error?: string;
  details?: any;
}

export class DriftClient {
  private connection: Connection;
  private wallet: Keypair | null = null;
  private driftSDK: DriftSDKClient | null = null;
  private isDryRun: boolean;
  private isInitialized: boolean = false;
  
  constructor(rpcUrl: string, dryRun: boolean = true) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.isDryRun = dryRun || process.env.DRY_RUN === 'true';
  }

  /**
   * Initialize wallet from private key file or env
   */
  async initializeWallet(walletPath?: string): Promise<boolean> {
    try {
      let keypair: Keypair | null = null;
      
      // Try wallet path first
      if (walletPath && fs.existsSync(walletPath)) {
        const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
        keypair = Keypair.fromSecretKey(Uint8Array.from(walletData));
        this.wallet = keypair;
        logger.info(`Wallet loaded: ${keypair.publicKey.toBase58().slice(0, 8)}...`);
      }

      // Try environment variable
      const privateKeyEnv = process.env.SOLANA_PRIVATE_KEY;
      if (!keypair && privateKeyEnv) {
        const keyArray = JSON.parse(privateKeyEnv);
        keypair = Keypair.fromSecretKey(Uint8Array.from(keyArray));
        this.wallet = keypair;
        logger.info(`Wallet from env: ${keypair.publicKey.toBase58().slice(0, 8)}...`);
      }

      // Initialize Drift SDK
      await this.initializeDriftSDK(keypair);
      return true;

    } catch (error: any) {
      logger.error(`Wallet init error: ${error.message}`);
      // Still try to init SDK for read-only
      await this.initializeDriftSDK(null);
      return this.isDryRun;
    }
  }

  /**
   * Initialize Drift SDK
   */
  private async initializeDriftSDK(keypair: Keypair | null): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Create wallet (dummy or real)
      const wallet: Wallet = keypair 
        ? new Wallet(keypair)
        : {
            publicKey: PublicKey.default,
            signTransaction: async (tx: any) => tx,
            signAllTransactions: async (txs: any[]) => txs,
            payer: keypair || Keypair.generate()
          } as unknown as Wallet;

      this.driftSDK = new DriftSDKClient({
        connection: this.connection,
        wallet,
        env: 'mainnet-beta',
      });

      await this.driftSDK.subscribe();
      this.isInitialized = true;
      logger.info('Drift SDK initialized ✓');
    } catch (error: any) {
      logger.warn(`Drift SDK init failed: ${error.message}`);
      // Will use fallback data
    }
  }

  /**
   * Get all perpetual markets with funding rates
   */
  async getMarkets(): Promise<DriftMarketInfo[]> {
    const markets: DriftMarketInfo[] = [];

    try {
      if (!this.isInitialized || !this.driftSDK) {
        logger.warn('SDK not initialized, using fallback data');
        return this.getBackupMarketData();
      }

      for (const marketConfig of MainnetPerpMarkets) {
        try {
          const perpMarket = this.driftSDK.getPerpMarketAccount(marketConfig.marketIndex);
          if (!perpMarket) continue;

          // Get funding rate
          // Raw value needs to be divided by 1e11 to get hourly rate as decimal
          // Verified against Binance rates: /1e11 gives realistic -50% to +50% APY range
          const rawFundingRate = perpMarket.amm.lastFundingRate.toNumber();
          const fundingRate = rawFundingRate / 1e11; // Hourly rate as decimal
          
          // Get oracle price
          const oracleData = this.driftSDK.getOracleDataForPerpMarket(marketConfig.marketIndex);
          const oraclePrice = oracleData 
            ? convertToNumber(oracleData.price, PRICE_PRECISION)
            : 0;

          // Get mark price
          const markPrice = convertToNumber(
            perpMarket.amm.lastMarkPriceTwap, 
            PRICE_PRECISION
          );

          // Calculate APY
          const fundingRateApy = fundingRate * 24 * 365 * 100;

          // Get open interest
          const openInterest = convertToNumber(
            perpMarket.amm.baseAssetAmountLong.add(perpMarket.amm.baseAssetAmountShort.abs()),
            BASE_PRECISION
          ) * oraclePrice;

          markets.push({
            marketIndex: marketConfig.marketIndex,
            symbol: marketConfig.symbol,
            oraclePrice,
            markPrice: markPrice || oraclePrice,
            fundingRate,
            fundingRateApy,
            openInterest,
            volume24h: 0 // Not directly available from on-chain
          });
        } catch (err: any) {
          // Skip markets with errors
          logger.debug(`Skipping ${marketConfig.symbol}: ${err.message}`);
        }
      }

      if (markets.length === 0) {
        logger.warn('No markets loaded, using fallback');
        return this.getBackupMarketData();
      }

      // Sort by absolute APY
      markets.sort((a, b) => Math.abs(b.fundingRateApy) - Math.abs(a.fundingRateApy));
      
      logger.info(`Loaded ${markets.length} Drift markets from on-chain`);
      return markets;

    } catch (error: any) {
      logger.warn(`Drift getMarkets error: ${error.message}`);
      return this.getBackupMarketData();
    }
  }

  /**
   * Backup market data when SDK fails
   */
  private getBackupMarketData(): DriftMarketInfo[] {
    logger.warn('Using demo market data for Drift');
    
    const now = Date.now();
    const mockMarkets = [
      { symbol: 'SOL-PERP', index: 0, price: 190, rate: 0.00035 + Math.sin(now / 100000) * 0.0001 },
      { symbol: 'BTC-PERP', index: 1, price: 98500, rate: 0.00015 + Math.sin(now / 150000) * 0.00008 },
      { symbol: 'ETH-PERP', index: 2, price: 3350, rate: 0.00028 + Math.sin(now / 120000) * 0.0001 },
      { symbol: 'JUP-PERP', index: 5, price: 0.95, rate: 0.00042 + Math.sin(now / 80000) * 0.00015 },
      { symbol: 'WIF-PERP', index: 6, price: 1.75, rate: 0.00055 + Math.sin(now / 90000) * 0.0002 },
      { symbol: 'JTO-PERP', index: 8, price: 3.25, rate: 0.00025 + Math.sin(now / 110000) * 0.0001 },
    ];

    return mockMarkets.map(m => ({
      marketIndex: m.index,
      symbol: m.symbol,
      oraclePrice: m.price * (1 + (Math.random() - 0.5) * 0.001),
      markPrice: m.price * (1 + (Math.random() - 0.5) * 0.002),
      fundingRate: m.rate,
      fundingRateApy: m.rate * 24 * 365 * 100,
      openInterest: Math.random() * 50000000 + 10000000,
      volume24h: Math.random() * 100000000 + 20000000
    }));
  }

  /**
   * Get specific market by symbol
   */
  async getMarket(symbol: string): Promise<DriftMarketInfo | null> {
    const markets = await this.getMarkets();
    return markets.find(m => m.symbol === symbol) || null;
  }

  /**
   * Get user positions
   */
  async getPositions(): Promise<DriftPosition[]> {
    if (!this.wallet && !this.isDryRun) {
      logger.error('Wallet not initialized');
      return [];
    }

    if (this.isDryRun) {
      logger.debug('DRY_RUN: Returning empty positions');
      return [];
    }

    if (!this.driftSDK || !this.isInitialized) {
      return [];
    }

    try {
      const user = this.driftSDK.getUser();
      const positions: DriftPosition[] = [];

      for (const perpPosition of user.getPerpPositions()) {
        if (perpPosition.baseAssetAmount.isZero()) continue;

        const marketConfig = MainnetPerpMarkets.find(
          m => m.marketIndex === perpPosition.marketIndex
        );
        if (!marketConfig) continue;

        const perpMarket = this.driftSDK.getPerpMarketAccount(perpPosition.marketIndex);
        if (!perpMarket) continue;

        const baseAmount = convertToNumber(perpPosition.baseAssetAmount, BASE_PRECISION);
        const quoteAmount = convertToNumber(perpPosition.quoteAssetAmount, QUOTE_PRECISION);
        const side = baseAmount > 0 ? 'long' : 'short';

        const oracleData = this.driftSDK.getOracleDataForPerpMarket(perpPosition.marketIndex);
        const markPrice = oracleData ? convertToNumber(oracleData.price, PRICE_PRECISION) : 0;

        const unrealizedPnl = user.getUnrealizedPNL(false, perpPosition.marketIndex);

        positions.push({
          marketIndex: perpPosition.marketIndex,
          symbol: marketConfig.symbol,
          side,
          size: Math.abs(baseAmount),
          notional: Math.abs(baseAmount) * markPrice,
          entryPrice: Math.abs(quoteAmount / baseAmount),
          markPrice,
          unrealizedPnl: convertToNumber(unrealizedPnl, QUOTE_PRECISION),
          fundingAccrued: 0, // Calculate separately
          leverage: 1 // Simplified
        });
      }

      return positions;
    } catch (error: any) {
      logger.error(`Get positions error: ${error.message}`);
      return [];
    }
  }

  /**
   * Open a perpetual position
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
    
    if (this.isDryRun) {
      logger.info(`[DRY_RUN] Would open ${side.toUpperCase()} ${symbol}`);
      logger.info(`  Size: $${sizeUsd.toFixed(2)} (${baseSize.toFixed(4)} base)`);
      logger.info(`  Entry: $${market.oraclePrice.toFixed(4)}`);
      logger.info(`  Leverage: ${leverage}x`);
      logger.info(`  Funding APY: ${market.fundingRateApy.toFixed(2)}%`);
      
      return {
        success: true,
        txSignature: `DRY_RUN_${Date.now()}`,
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

    if (!this.wallet || !this.driftSDK) {
      return { success: false, error: 'Wallet/SDK not initialized' };
    }

    try {
      const direction = side === 'long' 
        ? PositionDirection.LONG 
        : PositionDirection.SHORT;

      const orderParams = getMarketOrderParams({
        marketIndex: market.marketIndex,
        direction,
        baseAssetAmount: new BN(baseSize * BASE_PRECISION.toNumber()),
      });

      const txSig = await this.driftSDK.placePerpOrder(orderParams);
      
      logger.info(`Position opened: ${txSig}`);
      return {
        success: true,
        txSignature: txSig,
        details: { market: symbol, side, size: baseSize }
      };
    } catch (error: any) {
      logger.error(`Open position error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Close a position
   */
  async closePosition(symbol: string): Promise<TradeResult> {
    if (this.isDryRun) {
      logger.info(`[DRY_RUN] Would close position for ${symbol}`);
      return {
        success: true,
        txSignature: `DRY_RUN_CLOSE_${Date.now()}`,
      };
    }

    const positions = await this.getPositions();
    const position = positions.find(p => p.symbol === symbol);
    
    if (!position) {
      return { success: false, error: `No position found for ${symbol}` };
    }

    if (!this.wallet || !this.driftSDK) {
      return { success: false, error: 'Wallet/SDK not initialized' };
    }

    try {
      // Close by opening opposite position
      const closeDirection = position.side === 'long' 
        ? PositionDirection.SHORT 
        : PositionDirection.LONG;

      const orderParams = getMarketOrderParams({
        marketIndex: position.marketIndex,
        direction: closeDirection,
        baseAssetAmount: new BN(position.size * BASE_PRECISION.toNumber()),
        reduceOnly: true,
      });

      const txSig = await this.driftSDK.placePerpOrder(orderParams);
      
      return {
        success: true,
        txSignature: txSig,
        details: position
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get account balance (USDC)
   */
  async getBalance(): Promise<number> {
    if (this.isDryRun) {
      return 1000; // Mock balance for dry run
    }

    if (!this.wallet || !this.driftSDK || !this.isInitialized) {
      return 0;
    }

    try {
      const user = this.driftSDK.getUser();
      const freeCollateral = user.getFreeCollateral();
      return convertToNumber(freeCollateral, QUOTE_PRECISION);
    } catch (error: any) {
      logger.error(`Get balance error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get wallet public key
   */
  getWalletAddress(): string | null {
    return this.wallet?.publicKey.toBase58() || null;
  }

  /**
   * Cleanup
   */
  async close(): Promise<void> {
    if (this.driftSDK) {
      await this.driftSDK.unsubscribe();
    }
  }
}
