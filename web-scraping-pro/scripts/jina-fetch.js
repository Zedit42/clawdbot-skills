#!/usr/bin/env node
/**
 * Jina Reader - Free web scraping via Jina AI
 * Usage: node jina-fetch.js <url> [--format markdown|text|html] [--selector "main"]
 */

const https = require('https');

const args = process.argv.slice(2);
const url = args.find(a => a.startsWith('http'));
const formatIdx = args.indexOf('--format');
const format = formatIdx !== -1 ? args[formatIdx + 1] : 'markdown';
const selectorIdx = args.indexOf('--selector');
const selector = selectorIdx !== -1 ? args[selectorIdx + 1] : null;

if (!url) {
    console.error('Usage: node jina-fetch.js <url> [--format markdown|text|html] [--selector "main"]');
    console.error('\nExamples:');
    console.error('  node jina-fetch.js https://example.com');
    console.error('  node jina-fetch.js https://example.com --format text');
    console.error('  node jina-fetch.js https://example.com --selector "article"');
    process.exit(1);
}

const jinaUrl = `https://r.jina.ai/${url}`;

const headers = {
    'Accept': 'text/plain'
};

if (format === 'text') {
    headers['X-Return-Format'] = 'text';
} else if (format === 'html') {
    headers['X-Return-Format'] = 'html';
}

if (selector) {
    headers['X-Target-Selector'] = selector;
}

console.error(`Fetching via Jina Reader: ${url}`);

const req = https.get(jinaUrl, { headers }, (res) => {
    let data = '';
    
    res.on('data', chunk => data += chunk);
    
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log(data);
        } else {
            console.error(`Error: HTTP ${res.statusCode}`);
            console.error(data);
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
    process.exit(1);
});
