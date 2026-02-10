#!/usr/bin/env npx ts-node
/**
 * Solana DEX Funding Rate Dashboard
 * Modern UI with live data from Drift Protocol
 */

import express from 'express';

const app = express();
const PORT = 3456;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// ============ DRIFT API ============

const DRIFT_MARKETS = [
  'SOL-PERP', 'BTC-PERP', 'ETH-PERP', 'APT-PERP', 'ARB-PERP',
  'DOGE-PERP', 'BNB-PERP', 'SUI-PERP', 'PEPE-PERP', 'WIF-PERP',
  'JTO-PERP', 'PYTH-PERP', 'JUP-PERP', 'RNDR-PERP', 'INJ-PERP'
];

interface FundingRate {
  market: string;
  fundingRate: number;      // hourly rate as percentage
  fundingRateApy: number;   // annualized
  lastUpdate: string;
  direction: string;        // "Longs Pay" or "Shorts Pay"
}

async function fetchDriftRate(market: string): Promise<FundingRate | null> {
  try {
    const resp = await fetch(`https://data.api.drift.trade/fundingRates?marketName=${market}`);
    const data = await resp.json() as any[];
    
    if (!data || data.length === 0) return null;
    
    // Get latest funding rate (last item)
    const latest = data[data.length - 1];
    
    // fundingRate is in 1e-9 precision, convert to percentage
    // Drift uses 8-hour funding, so hourly = fundingRate / 8
    const rawRate = parseInt(latest.fundingRate || '0');
    const hourlyRatePct = (rawRate / 1e9) / 8 * 100;
    const apyPct = hourlyRatePct * 24 * 365;
    
    return {
      market: market.replace('-PERP', ''),
      fundingRate: hourlyRatePct,
      fundingRateApy: apyPct,
      lastUpdate: new Date(parseInt(latest.ts) * 1000).toISOString(),
      direction: rawRate > 0 ? 'Longs Pay' : rawRate < 0 ? 'Shorts Pay' : 'Neutral'
    };
  } catch (e) {
    console.error(`Error fetching ${market}:`, e);
    return null;
  }
}

async function getAllRates(): Promise<FundingRate[]> {
  const results: FundingRate[] = [];
  
  // Fetch in parallel with rate limiting (5 at a time)
  for (let i = 0; i < DRIFT_MARKETS.length; i += 5) {
    const batch = DRIFT_MARKETS.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(m => fetchDriftRate(m)));
    results.push(...batchResults.filter(r => r !== null) as FundingRate[]);
    
    // Small delay between batches
    if (i + 5 < DRIFT_MARKETS.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  
  // Sort by absolute funding rate (highest opportunity first)
  return results.sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate));
}

// ============ API ROUTES ============

app.get('/api/rates', async (req, res) => {
  try {
    const rates = await getAllRates();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: rates.length,
      rates
    });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

// ============ DASHBOARD HTML ============

const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚡ Drift Funding Scanner</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --bg-primary: #0a0a0f;
      --bg-secondary: #12121a;
      --bg-card: #1a1a24;
      --text-primary: #e4e4e7;
      --text-secondary: #71717a;
      --accent: #8b5cf6;
      --accent-glow: rgba(139, 92, 246, 0.3);
      --green: #22c55e;
      --red: #ef4444;
      --yellow: #eab308;
      --border: #27272a;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      line-height: 1.5;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    h1 span { font-size: 1.5rem; }
    
    .status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--green);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
    }
    
    .stat-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    
    .stat-value.green { color: var(--green); }
    .stat-value.red { color: var(--red); }
    .stat-value.yellow { color: var(--yellow); }
    .stat-value.accent { color: var(--accent); }
    
    .table-container {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    
    .table-title {
      font-weight: 600;
      font-size: 1rem;
    }
    
    .refresh-btn {
      background: var(--accent);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .refresh-btn:hover {
      background: #7c3aed;
      box-shadow: 0 0 20px var(--accent-glow);
    }
    
    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th {
      text-align: left;
      padding: 0.875rem 1.5rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
    }
    
    td {
      padding: 1rem 1.5rem;
      font-size: 0.875rem;
      border-bottom: 1px solid var(--border);
      font-variant-numeric: tabular-nums;
    }
    
    tr:last-child td { border-bottom: none; }
    
    tr:hover td { background: rgba(139, 92, 246, 0.05); }
    
    .market-name {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .market-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
    }
    
    .rate { font-weight: 500; }
    .rate.positive { color: var(--red); }
    .rate.negative { color: var(--green); }
    
    .apy-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .apy-value {
      font-weight: 700;
      min-width: 80px;
    }
    
    .apy-visual {
      flex: 1;
      height: 6px;
      background: var(--bg-secondary);
      border-radius: 3px;
      overflow: hidden;
      max-width: 120px;
    }
    
    .apy-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    
    .apy-fill.positive { background: linear-gradient(90deg, var(--red), #f87171); }
    .apy-fill.negative { background: linear-gradient(90deg, var(--green), #4ade80); }
    
    .direction {
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
      background: var(--bg-secondary);
      border-radius: 20px;
      color: var(--text-secondary);
    }
    
    .direction.longs { 
      background: rgba(239, 68, 68, 0.1);
      color: var(--red);
    }
    
    .direction.shorts { 
      background: rgba(34, 197, 94, 0.1);
      color: var(--green);
    }
    
    .loading {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }
    
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      color: var(--text-secondary);
      font-size: 0.75rem;
    }
    
    .auto-refresh {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .auto-refresh input {
      accent-color: var(--accent);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1><span>⚡</span> Drift Funding Scanner</h1>
      <div class="status">
        <div class="status-dot"></div>
        <span id="lastUpdate">Connecting...</span>
      </div>
    </header>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Highest APY</div>
        <div class="stat-value yellow" id="highestApy">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Funding</div>
        <div class="stat-value accent" id="avgFunding">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Markets</div>
        <div class="stat-value" id="marketCount">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Shorts Paying</div>
        <div class="stat-value red" id="shortsPaying">0</div>
      </div>
    </div>
    
    <div class="table-container">
      <div class="table-header">
        <div class="table-title">📊 Drift Protocol Funding Rates</div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <label class="auto-refresh">
            <input type="checkbox" id="autoRefresh" checked>
            Auto-refresh (60s)
          </label>
          <button class="refresh-btn" id="refreshBtn" onclick="fetchRates()">
            🔄 Refresh
          </button>
        </div>
      </div>
      
      <div id="tableContent">
        <div class="loading">
          <div class="spinner"></div>
          <div>Loading funding rates...</div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      Drift Protocol | Data refreshes every 60 seconds | Built with ⚡
    </div>
  </div>
  
  <script>
    let autoRefreshInterval = null;
    
    async function fetchRates() {
      const btn = document.getElementById('refreshBtn');
      btn.disabled = true;
      btn.textContent = '⏳ Loading...';
      
      try {
        const resp = await fetch('/api/rates');
        const data = await resp.json();
        
        if (data.success) {
          renderTable(data.rates);
          updateStats(data.rates);
          document.getElementById('lastUpdate').textContent = 
            'Updated: ' + new Date().toLocaleTimeString();
        }
      } catch (e) {
        console.error('Fetch error:', e);
        document.getElementById('tableContent').innerHTML = 
          '<div class="loading">⚠️ Failed to fetch rates. Retrying...</div>';
      }
      
      btn.disabled = false;
      btn.textContent = '🔄 Refresh';
    }
    
    function renderTable(rates) {
      if (!rates || rates.length === 0) {
        document.getElementById('tableContent').innerHTML = 
          '<div class="loading">No rates available</div>';
        return;
      }
      
      let html = \`
        <table>
          <thead>
            <tr>
              <th>Market</th>
              <th>Hourly Rate</th>
              <th>APY</th>
              <th>Direction</th>
            </tr>
          </thead>
          <tbody>
      \`;
      
      for (const r of rates) {
        const isPositive = r.fundingRate > 0;
        const rateClass = isPositive ? 'positive' : 'negative';
        const apyPct = Math.min(Math.abs(r.fundingRateApy) / 100 * 100, 100);
        const dirClass = r.direction === 'Longs Pay' ? 'longs' : r.direction === 'Shorts Pay' ? 'shorts' : '';
        
        html += \`
          <tr>
            <td>
              <div class="market-name">
                <div class="market-icon">\${r.market.slice(0, 2)}</div>
                \${r.market}
              </div>
            </td>
            <td class="rate \${rateClass}">
              \${r.fundingRate >= 0 ? '+' : ''}\${r.fundingRate.toFixed(6)}%
            </td>
            <td>
              <div class="apy-bar">
                <span class="apy-value \${rateClass}">\${r.fundingRateApy >= 0 ? '+' : ''}\${r.fundingRateApy.toFixed(2)}%</span>
                <div class="apy-visual">
                  <div class="apy-fill \${rateClass}" style="width: \${apyPct}%"></div>
                </div>
              </div>
            </td>
            <td>
              <span class="direction \${dirClass}">\${r.direction}</span>
            </td>
          </tr>
        \`;
      }
      
      html += '</tbody></table>';
      document.getElementById('tableContent').innerHTML = html;
    }
    
    function updateStats(rates) {
      const apys = rates.map(r => Math.abs(r.fundingRateApy));
      const highestApy = apys.length ? Math.max(...apys) : 0;
      const avgRate = rates.length ? rates.reduce((s, r) => s + r.fundingRate, 0) / rates.length : 0;
      const shortsPaying = rates.filter(r => r.direction === 'Shorts Pay').length;
      
      document.getElementById('highestApy').textContent = highestApy.toFixed(2) + '%';
      document.getElementById('avgFunding').textContent = (avgRate >= 0 ? '+' : '') + avgRate.toFixed(6) + '%';
      document.getElementById('marketCount').textContent = rates.length;
      document.getElementById('shortsPaying').textContent = shortsPaying;
    }
    
    document.getElementById('autoRefresh').addEventListener('change', (e) => {
      if (e.target.checked) {
        autoRefreshInterval = setInterval(fetchRates, 60000);
      } else {
        clearInterval(autoRefreshInterval);
      }
    });
    
    // Initial load
    fetchRates();
    autoRefreshInterval = setInterval(fetchRates, 60000);
  </script>
</body>
</html>`;

// Serve dashboard
app.get('/', (req, res) => {
  res.send(dashboardHTML);
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  ⚡ Drift Funding Scanner Dashboard                   ║');
  console.log('║                                                       ║');
  console.log('║  Dashboard: http://localhost:' + PORT + '                    ║');
  console.log('║  API:       http://localhost:' + PORT + '/api/rates          ║');
  console.log('║                                                       ║');
  console.log('║  Press Ctrl+C to stop                                 ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
});
