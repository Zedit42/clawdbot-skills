#!/usr/bin/env node
/**
 * Real Browser - Maximum stealth using puppeteer-real-browser
 * Passes virtually all fingerprint tests by using actual Chrome
 * Usage: node real-browser.js <url> [--html] [--screenshot path.png]
 */

async function main() {
    const { connect } = await import('puppeteer-real-browser');
    
    const args = process.argv.slice(2);
    const url = args.find(a => a.startsWith('http'));
    const outputHtml = args.includes('--html');
    const screenshotIdx = args.indexOf('--screenshot');
    const screenshotPath = screenshotIdx !== -1 ? args[screenshotIdx + 1] : null;

    if (!url) {
        console.error('Usage: node real-browser.js <url> [--html] [--screenshot path.png]');
        process.exit(1);
    }

    const { browser, page } = await connect({
        headless: 'auto',
        turnstile: true,
        fingerprint: true,
        args: ['--no-sandbox']
    });

    try {
        // Navigate
        const response = await page.goto(url, { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        // Wait for any challenges to complete
        await new Promise(r => setTimeout(r, 5000));

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
                const scripts = document.querySelectorAll('script, style, noscript');
                scripts.forEach(s => s.remove());
                return document.body?.innerText || document.documentElement?.innerText || '';
            });
            console.log(text);
        }

        console.error(`\n[Status: ${response?.status() || 'unknown'}]`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

main();
