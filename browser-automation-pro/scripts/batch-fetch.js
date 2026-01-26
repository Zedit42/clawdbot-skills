#!/usr/bin/env node
/**
 * Batch Fetch - Fetch multiple URLs with stealth, rate limiting and rotation
 * Usage: node batch-fetch.js urls.txt [--delay 3000] [--output dir/]
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const args = process.argv.slice(2);
const urlsFile = args[0];
const delayIdx = args.indexOf('--delay');
const delay = delayIdx !== -1 ? parseInt(args[delayIdx + 1]) : 3000;
const outputIdx = args.indexOf('--output');
const outputDir = outputIdx !== -1 ? args[outputIdx + 1] : './output';

if (!urlsFile || !fs.existsSync(urlsFile)) {
    console.error('Usage: node batch-fetch.js urls.txt [--delay 3000] [--output dir/]');
    console.error('urls.txt should contain one URL per line');
    process.exit(1);
}

const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

async function fetchUrl(page, url, index) {
    try {
        // Rotate user agent
        await page.setUserAgent(userAgents[index % userAgents.length]);
        
        // Random viewport variation
        await page.setViewport({
            width: 1920 + Math.floor(Math.random() * 100),
            height: 1080 + Math.floor(Math.random() * 100)
        });

        const response = await page.goto(url, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        await new Promise(r => setTimeout(r, 1000));

        const text = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script, style, noscript');
            scripts.forEach(s => s.remove());
            return document.body?.innerText || '';
        });

        return { url, status: response.status(), text, error: null };
    } catch (err) {
        return { url, status: 0, text: '', error: err.message };
    }
}

async function main() {
    const urls = fs.readFileSync(urlsFile, 'utf-8')
        .split('\n')
        .map(u => u.trim())
        .filter(u => u.startsWith('http'));

    console.log(`Fetching ${urls.length} URLs with ${delay}ms delay...`);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const results = [];

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`[${i + 1}/${urls.length}] ${url}`);
        
        const result = await fetchUrl(page, url, i);
        results.push(result);

        // Save individual result
        const filename = `${i + 1}-${new URL(url).hostname}.txt`;
        fs.writeFileSync(
            path.join(outputDir, filename),
            `URL: ${url}\nStatus: ${result.status}\nError: ${result.error || 'none'}\n\n${result.text}`
        );

        if (result.error) {
            console.log(`  ❌ Error: ${result.error}`);
        } else {
            console.log(`  ✅ Status: ${result.status}`);
        }

        // Delay between requests
        if (i < urls.length - 1) {
            const jitter = Math.floor(Math.random() * 1000);
            await new Promise(r => setTimeout(r, delay + jitter));
        }
    }

    await browser.close();

    // Summary
    const success = results.filter(r => r.status >= 200 && r.status < 400).length;
    console.log(`\nDone! ${success}/${urls.length} successful`);
    console.log(`Results saved to: ${outputDir}/`);

    // Save summary
    fs.writeFileSync(
        path.join(outputDir, '_summary.json'),
        JSON.stringify(results.map(r => ({ url: r.url, status: r.status, error: r.error })), null, 2)
    );
}

main().catch(console.error);
