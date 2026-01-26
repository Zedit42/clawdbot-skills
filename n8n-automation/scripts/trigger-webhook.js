#!/usr/bin/env node
/**
 * Trigger n8n Webhook
 * Usage: node trigger-webhook.js --url <webhook-url> [--data '{"key":"value"}']
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const urlIdx = args.indexOf('--url');
const dataIdx = args.indexOf('--data');

const webhookUrl = urlIdx !== -1 ? args[urlIdx + 1] : null;
const jsonData = dataIdx !== -1 ? args[dataIdx + 1] : '{}';

if (!webhookUrl) {
    console.error('Usage: node trigger-webhook.js --url <webhook-url> [--data \'{"key":"value"}\']');
    console.error('\nExamples:');
    console.error('  node trigger-webhook.js --url http://localhost:5678/webhook/abc123');
    console.error('  node trigger-webhook.js --url http://localhost:5678/webhook/abc123 --data \'{"message":"hello"}\'');
    process.exit(1);
}

let data;
try {
    data = JSON.parse(jsonData);
} catch (e) {
    console.error('Error: Invalid JSON data');
    process.exit(1);
}

const url = new URL(webhookUrl);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

const postData = JSON.stringify(data);

const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log(`Triggering webhook: ${webhookUrl}`);
console.log(`Payload: ${postData}`);

const req = client.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    
    res.on('end', () => {
        console.log(`\nStatus: ${res.statusCode}`);
        
        if (responseData) {
            try {
                const parsed = JSON.parse(responseData);
                console.log('Response:', JSON.stringify(parsed, null, 2));
            } catch {
                console.log('Response:', responseData);
            }
        }
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('\n✅ Webhook triggered successfully');
        } else {
            console.log('\n❌ Webhook returned error');
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error(`\n❌ Error: ${e.message}`);
    process.exit(1);
});

req.write(postData);
req.end();
