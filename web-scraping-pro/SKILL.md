---
name: web-scraping-pro
description: Advanced web scraping with Cloudflare bypass, JavaScript rendering, and structured data extraction. Use when regular fetch fails, site has bot protection, or you need to extract structured data from complex pages. Includes Crawl4AI, Jina Reader, and custom extractors.
---

# Web Scraping Pro

Advanced scraping that handles modern anti-bot protections.

## When to Use

- Regular `web_fetch` returns 403/Cloudflare
- Need to scrape JavaScript-rendered content
- Want structured data extraction (not just HTML)
- Dealing with bot protection (Cloudflare, Akamai)

## Quick Start

### Option 1: Jina Reader (Easiest, Free)

```bash
# Just prepend r.jina.ai to any URL
curl "https://r.jina.ai/https://example.com"

# Or use the script
node skills/web-scraping-pro/scripts/jina-fetch.js "https://example.com"
```

### Option 2: Crawl4AI (Most Powerful, Free)

```bash
# Install
pip install crawl4ai
playwright install

# Use via script
python skills/web-scraping-pro/scripts/crawl4ai-fetch.py "https://example.com"
```

### Option 3: Firecrawl (API, has free tier)

```bash
# Set API key
export FIRECRAWL_API_KEY=your_key

# Fetch
node skills/web-scraping-pro/scripts/firecrawl-fetch.js "https://example.com"
```

## Available Scripts

### `scripts/jina-fetch.js`
Fetch via Jina Reader API. Free, no setup, handles most sites.
- ✅ Free unlimited
- ✅ Returns clean markdown
- ❌ Some sites block

### `scripts/crawl4ai-fetch.py`
Full browser scraping with Crawl4AI. Most capable option.
- ✅ Free, local
- ✅ Handles JS rendering
- ✅ Built-in extraction
- ❌ Slower, needs setup

### `scripts/firecrawl-fetch.js`
Firecrawl API for reliable scraping.
- ✅ Very reliable
- ✅ Clean output
- ❌ Paid after free tier

### `scripts/multi-fetch.js`
Try multiple methods in fallback order.

### `scripts/extract-structured.py`
Extract structured data (tables, lists, specific elements).

## Jina Reader Features

```bash
# Basic fetch (returns markdown)
curl "https://r.jina.ai/https://example.com"

# Search (returns search results)
curl "https://s.jina.ai/your+search+query"

# With options
curl "https://r.jina.ai/https://example.com" \
  -H "X-Return-Format: text" \
  -H "X-Target-Selector: main"
```

## Crawl4AI Features

```python
from crawl4ai import WebCrawler

crawler = WebCrawler()
crawler.warmup()

result = crawler.run(
    url="https://example.com",
    word_count_threshold=10,
    extraction_strategy="LLMExtractionStrategy",  # AI extraction
    chunking_strategy="RegexChunking"
)

print(result.markdown)  # Clean markdown
print(result.extracted_content)  # Structured data
```

## Comparison

| Tool | Cloudflare | JS Render | Speed | Cost |
|------|------------|-----------|-------|------|
| Jina Reader | ⭕ Some | ✅ Yes | Fast | Free |
| Crawl4AI | ✅ Yes | ✅ Yes | Slow | Free |
| Firecrawl | ✅ Yes | ✅ Yes | Fast | Freemium |
| Browser skill | ✅ Yes | ✅ Yes | Slow | Free |

## Tips

1. **Start with Jina** - It's free and works for most sites
2. **Fallback to Crawl4AI** - When Jina fails
3. **Use selectors** - Target specific elements for cleaner output
4. **Rate limit** - Add delays between requests
5. **Cache results** - Don't re-scrape unchanged content

## Handling Common Issues

### Cloudflare Challenge
```bash
# Use Crawl4AI with stealth
python skills/web-scraping-pro/scripts/crawl4ai-fetch.py "https://site.com" --stealth
```

### JavaScript Content
```bash
# Jina handles most JS
# For complex SPAs, use Crawl4AI with wait
python skills/web-scraping-pro/scripts/crawl4ai-fetch.py "https://spa.com" --wait 5000
```

### Rate Limiting
```bash
# Use batch script with delays
node skills/web-scraping-pro/scripts/batch-scrape.js urls.txt --delay 3000
```
