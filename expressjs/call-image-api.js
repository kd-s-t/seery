#!/usr/bin/env node

const http = require('http');

const cryptos = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'cardano', 'polkadot', 'chainlink'];

console.log('='.repeat(60));
console.log('Calling Image API to trigger S3 uploads');
console.log('='.repeat(60));
console.log('');

let completed = 0;
const total = cryptos.length;

function makeRequest(cryptoId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3016,
      path: `/api/crypto/image?cryptoId=${encodeURIComponent(cryptoId)}&size=small`,
      method: 'GET',
      timeout: 15000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          cryptoId,
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          size: data.length
        });
      });
    });

    req.on('error', (e) => {
      reject({ cryptoId, error: e.message });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({ cryptoId, error: 'Request timeout' });
    });

    req.end();
  });
}

async function run() {
  console.log(`Making ${total} requests...\n`);
  
  for (const cryptoId of cryptos) {
    try {
      const result = await makeRequest(cryptoId);
      console.log(`✅ ${cryptoId.padEnd(15)} Status: ${result.statusCode} | Type: ${result.contentType} | Size: ${result.size} bytes`);
    } catch (error) {
      console.log(`❌ ${cryptoId.padEnd(15)} Error: ${error.error || error.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('✅ All requests completed!');
  console.log('');
  console.log('📋 Check your server console logs for:');
  console.log('   - "S3 bucket not configured" (if bucket name missing)');
  console.log('   - "AWS credentials not configured" (if keys missing)');
  console.log('   - "Image X not in S3, downloading..." (upload starting)');
  console.log('   - "Successfully uploaded X to S3" (upload succeeded)');
  console.log('='.repeat(60));
}

run().catch(console.error);

