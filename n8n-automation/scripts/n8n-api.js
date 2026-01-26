#!/usr/bin/env node
/**
 * n8n API Client
 * Usage: 
 *   node n8n-api.js list                    - List all workflows
 *   node n8n-api.js get <id>                - Get workflow details
 *   node n8n-api.js execute <id>            - Execute a workflow
 *   node n8n-api.js activate <id>           - Activate a workflow
 *   node n8n-api.js deactivate <id>         - Deactivate a workflow
 * 
 * Environment:
 *   N8N_HOST     - n8n host (default: http://localhost:5678)
 *   N8N_API_KEY  - API key for authentication
 */

const https = require('https');
const http = require('http');

const N8N_HOST = process.env.N8N_HOST || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

const args = process.argv.slice(2);
const command = args[0];
const workflowId = args[1];

function apiRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(N8N_HOST + path);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        if (N8N_API_KEY) {
            options.headers['X-N8N-API-KEY'] = N8N_API_KEY;
        }
        
        const req = client.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(responseData) });
                } catch {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function main() {
    if (!command) {
        console.log('n8n API Client\n');
        console.log('Usage:');
        console.log('  node n8n-api.js list                 - List all workflows');
        console.log('  node n8n-api.js get <id>             - Get workflow details');
        console.log('  node n8n-api.js execute <id>         - Execute a workflow');
        console.log('  node n8n-api.js activate <id>        - Activate a workflow');
        console.log('  node n8n-api.js deactivate <id>      - Deactivate a workflow');
        console.log('\nEnvironment:');
        console.log('  N8N_HOST     - n8n host (default: http://localhost:5678)');
        console.log('  N8N_API_KEY  - API key for authentication');
        process.exit(0);
    }
    
    try {
        let result;
        
        switch (command) {
            case 'list':
                result = await apiRequest('GET', '/api/v1/workflows');
                console.log('Workflows:');
                if (result.data.data) {
                    result.data.data.forEach(wf => {
                        const status = wf.active ? '✅' : '⭕';
                        console.log(`  ${status} [${wf.id}] ${wf.name}`);
                    });
                } else {
                    console.log(JSON.stringify(result.data, null, 2));
                }
                break;
                
            case 'get':
                if (!workflowId) {
                    console.error('Error: Workflow ID required');
                    process.exit(1);
                }
                result = await apiRequest('GET', `/api/v1/workflows/${workflowId}`);
                console.log(JSON.stringify(result.data, null, 2));
                break;
                
            case 'execute':
                if (!workflowId) {
                    console.error('Error: Workflow ID required');
                    process.exit(1);
                }
                result = await apiRequest('POST', `/api/v1/workflows/${workflowId}/execute`);
                console.log('Execution result:', JSON.stringify(result.data, null, 2));
                break;
                
            case 'activate':
                if (!workflowId) {
                    console.error('Error: Workflow ID required');
                    process.exit(1);
                }
                result = await apiRequest('PATCH', `/api/v1/workflows/${workflowId}`, { active: true });
                console.log('✅ Workflow activated');
                break;
                
            case 'deactivate':
                if (!workflowId) {
                    console.error('Error: Workflow ID required');
                    process.exit(1);
                }
                result = await apiRequest('PATCH', `/api/v1/workflows/${workflowId}`, { active: false });
                console.log('⭕ Workflow deactivated');
                break;
                
            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

main();
