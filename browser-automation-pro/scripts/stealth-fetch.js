#!/usr/bin/env node
/**
 * Stealth Fetch - Bypass basic bot detection using puppeteer-extra-plugin-stealth
 * Usage: node stealth-fetch.js <url> [--html] [--screenshot path.png]
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const args = process.argv.slice(2);
const url = args.find(a => a.startsWith('http'));
const outputHtml = args.includes('--html');
const screenshotIdx = args.indexOf('--screenshot');
const screenshotPath = screenshotIdx !== -1 ? args[screenshotIdx + 1] : null;

if (!url) {
    console.error('Usage: node stealth-fetch.js <url> [--html] [--screenshot path.png]');
    process.exit(1);
}

async function stealthFetch(targetUrl) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Random viewport
        await page.setViewport({
            width: 1920 + Math.floor(Math.random() * 100),
            height: 1080 + Math.floor(Math.random() * 100)
        });

        // Random user agent
        const userAgents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
        ];
        await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);

        // Navigate
        const response = await page.goto(targetUrl, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        // Wait a bit for any JS to execute
        await new Promise(r => setTimeout(r, 2000));

        // Screenshot if requested
        if (screenshotPath) {
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.error(`Screenshot saved to: ${screenshotPath}`);
        }

        // Output
        if (outputHtml) {
            const html = await page.content();
            console.log(html);
        } else {
            const text = await page.evaluate(() => {
                // Remove script and style elements
                const scripts = document.querySelectorAll('script, style, noscript');
                scripts.forEach(s => s.remove());
                return document.body?.innerText || document.documentElement?.innerText || '';
            });
            console.log(text);
        }

        return { status: response.status(), ok: response.ok() };
    } finally {
        await browser.close();
    }
}

stealthFetch(url)
    .then(result => {
        console.error(`\n[Status: ${result.status}]`);
        process.exit(result.ok ? 0 : 1);
    })
    .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
