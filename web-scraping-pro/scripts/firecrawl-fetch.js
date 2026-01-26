#!/usr/bin/env node
/**
 * Firecrawl Fetch - Reliable scraping via Firecrawl API
 * Usage: node firecrawl-fetch.js <url> [--format markdown|html]
 * 
 * Requires: FIRECRAWL_API_KEY environment variable
 * Get key at: https://firecrawl.dev
 */

const https = require('https');

const args = process.argv.slice(2);
const url = args.find(a => a.startsWith('http'));
const formatIdx = args.indexOf('--format');
const format = formatIdx !== -1 ? args[formatIdx + 1] : 'markdown';

const API_KEY = process.env.FIRECRAWL_API_KEY;

if (!url) {
    console.error('Usage: node firecrawl-fetch.js <url> [--format markdown|html]');
    process.exit(1);
}

if (!API_KEY) {
    console.error('Error: FIRECRAWL_API_KEY environment variable required');
    console.error('Get your key at: https://firecrawl.dev');
    process.exit(1);
}

const postData = JSON.stringify({
    url: url,
    formats: [format]
});

const options = {
    hostname: 'api.firecrawl.dev',
    port: 443,
    path: '/v1/scrape',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.error(`Fetching via Firecrawl: ${url}`);

const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', chunk => data += chunk);
    
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            
            if (result.success && result.data) {
                if (format === 'markdown') {
                    console.log(result.data.markdown || result.data.content);
                } else {
                    console.log(result.data.html || result.data.content);
                }
            } else {
                console.error('Error:', result.error || 'Unknown error');
                process.exit(1);
            }
        } catch (e) {
            console.error('Error parsing response:', e.message);
            console.error(data);
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
    process.exit(1);
});

req.write(postData);
req.end();
