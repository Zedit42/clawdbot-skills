---
name: browser-automation-pro
description: Advanced browser automation with Cloudflare bypass, stealth mode, and anti-detection. Use when regular browser/fetch fails due to bot protection, Cloudflare, or when you need to scrape protected sites. Includes puppeteer-real-browser for undetectable automation.
---

# Browser Automation Pro

Advanced browser automation that bypasses common anti-bot protections.

## When to Use

- Regular `web_fetch` returns 403/Cloudflare challenge
- Site has bot detection (Cloudflare, Akamai, PerimeterX)
- Need to interact with JavaScript-heavy SPAs
- Regular puppeteer gets blocked

## Quick Start

### Install Dependencies

```bash
npm install puppeteer-real-browser puppeteer-extra puppeteer-extra-plugin-stealth
```

### Basic Usage (Stealth Mode)

Run the stealth browser script:

```bash
node skills/browser-automation-pro/scripts/stealth-fetch.js "https://example.com"
```

### Puppeteer Real Browser (Maximum Stealth)

For sites with aggressive bot detection:

```bash
node skills/browser-automation-pro/scripts/real-browser.js "https://example.com"
```

## Available Scripts

### `scripts/stealth-fetch.js`
Basic stealth fetch using puppeteer-extra-plugin-stealth.
- Bypasses most basic bot detection
- Faster startup than real-browser
- Good for: Cloudflare JS challenge, basic fingerprinting

### `scripts/real-browser.js`
Maximum stealth using puppeteer-real-browser.
- Uses actual Chrome instead of Chromium
- Passes all fingerprint tests
- Good for: Aggressive bot detection, Cloudflare Turnstile

### `scripts/batch-fetch.js`
Fetch multiple URLs with rate limiting and rotation.
- Configurable delays
- Random user agents
- Good for: Bulk scraping without getting blocked

## Tips

1. **Start with stealth-fetch.js** - It's faster and works for 80% of cases
2. **Use real-browser.js** only when stealth-fetch fails
3. **Add delays** between requests (2-5 seconds minimum)
4. **Rotate user agents** for bulk operations

## Limitations

- Cannot solve CAPTCHAs (need paid service like 2captcha)
- Very aggressive sites may still detect after many requests
- Slower than regular fetch (browser overhead)

## References

See `references/detection-methods.md` for details on how bot detection works.
