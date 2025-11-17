const http = require('http');

const cryptos = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'cardano'];

console.log('Testing image API endpoints to trigger S3 uploads...\n');

let completed = 0;
const total = cryptos.length;

cryptos.forEach((cryptoId) => {
  const options = {
    hostname: 'localhost',
    port: 3016,
    path: `/api/crypto/image?cryptoId=${encodeURIComponent(cryptoId)}&size=small`,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      completed++;
      if (res.statusCode === 200) {
        console.log(`✅ ${cryptoId}: Image served (${res.headers['content-type']})`);
      } else {
        console.log(`⚠️  ${cryptoId}: Status ${res.statusCode}`);
      }
      if (completed === total) {
        console.log('\n✅ All requests completed. Check server logs for S3 upload messages.');
        process.exit(0);
      }
    });
  });

  req.on('error', (e) => {
    completed++;
    console.error(`❌ ${cryptoId}: ${e.message}`);
    if (completed === total) {
      console.log('\n⚠️  Some requests failed. Check if server is running on port 3016.');
      process.exit(1);
    }
  });

  req.setTimeout(10000, () => {
    req.destroy();
    completed++;
    console.error(`⏱️  ${cryptoId}: Request timeout`);
    if (completed === total) {
      process.exit(1);
    }
  });

  req.end();
});

