#!/usr/bin/env python3
"""
Crawl4AI Fetch - Advanced scraping with JS rendering
Usage: python crawl4ai-fetch.py <url> [--stealth] [--wait 5000] [--selector "main"]
"""

import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description='Fetch URL with Crawl4AI')
    parser.add_argument('url', help='URL to scrape')
    parser.add_argument('--stealth', action='store_true', help='Use stealth mode')
    parser.add_argument('--wait', type=int, default=0, help='Wait ms after load')
    parser.add_argument('--selector', help='CSS selector to extract')
    parser.add_argument('--output', choices=['markdown', 'html', 'text'], default='markdown')
    
    args = parser.parse_args()
    
    try:
        from crawl4ai import WebCrawler
    except ImportError:
        print("Error: crawl4ai not installed. Run: pip install crawl4ai && playwright install")
        sys.exit(1)
    
    print(f"Fetching: {args.url}", file=sys.stderr)
    
    crawler = WebCrawler(verbose=False)
    crawler.warmup()
    
    # Configure options
    kwargs = {
        'url': args.url,
        'word_count_threshold': 5,
    }
    
    if args.wait:
        kwargs['delay_before_return_html'] = args.wait / 1000.0
    
    if args.selector:
        kwargs['css_selector'] = args.selector
    
    result = crawler.run(**kwargs)
    
    if not result.success:
        print(f"Error: {result.error_message}", file=sys.stderr)
        sys.exit(1)
    
    if args.output == 'markdown':
        print(result.markdown)
    elif args.output == 'html':
        print(result.html)
    else:
        print(result.extracted_content or result.markdown)

if __name__ == "__main__":
    main()
