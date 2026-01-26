#!/usr/bin/env node
/**
 * Multi-Fetch - Try multiple scraping methods in fallback order
 * Usage: node multi-fetch.js <url>
 * 
 * Order: Jina → Crawl4AI → Firecrawl
 */

const https = require('https');
const { spawn } = require('child_process');
const path = require('path');

const url = process.argv[2];

if (!url || !url.startsWith('http')) {
    console.error('Usage: node multi-fetch.js <url>');
    process.exit(1);
}

const scriptsDir = __dirname;

async function tryJina(targetUrl) {
    return new Promise((resolve) => {
        const jinaUrl = `https://r.jina.ai/${targetUrl}`;
        
        https.get(jinaUrl, { headers: { 'Accept': 'text/plain' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 && data.length > 100) {
                    resolve({ success: true, data, method: 'jina' });
                } else {
                    resolve({ success: false });
                }
            });
        }).on('error', () => resolve({ success: false }));
    });
}

async function tryCrawl4AI(targetUrl) {
    return new Promise((resolve) => {
        const script = path.join(scriptsDir, 'crawl4ai-fetch.py');
        const proc = spawn('python3', [script, targetUrl]);
        
        let stdout = '';
        let stderr = '';
        
        proc.stdout.on('data', d => stdout += d);
        proc.stderr.on('data', d => stderr += d);
        
        proc.on('close', (code) => {
            if (code === 0 && stdout.length > 100) {
                resolve({ success: true, data: stdout, method: 'crawl4ai' });
            } else {
                resolve({ success: false });
            }
        });
        
        proc.on('error', () => resolve({ success: false }));
        
        // Timeout after 30s
        setTimeout(() => {
            proc.kill();
            resolve({ success: false });
        }, 30000);
    });
}

async function main() {
    console.error(`Trying to fetch: ${url}\n`);
    
    // Try Jina first (fastest)
    console.error('1. Trying Jina Reader...');
    let result = await tryJina(url);
    
    if (result.success) {
        console.error(`✅ Success with ${result.method}\n`);
        console.log(result.data);
        return;
    }
    console.error('   ❌ Failed\n');
    
    // Try Crawl4AI
    console.error('2. Trying Crawl4AI...');
    result = await tryCrawl4AI(url);
    
    if (result.success) {
        console.error(`✅ Success with ${result.method}\n`);
        console.log(result.data);
        return;
    }
    console.error('   ❌ Failed\n');
    
    // All methods failed
    console.error('❌ All methods failed. Site may have strong bot protection.');
    process.exit(1);
}

main();
