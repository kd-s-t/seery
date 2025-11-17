const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3016,
  path: '/api/market-prediction?symbols=bitcoin,ethereum',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

console.log('Calling market prediction API...');
console.log(`URL: http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\nResponse:');
      console.log(JSON.stringify(json, null, 2));
      console.log(`\nTotal cryptos: ${json.cryptos?.length || 0}`);
    } catch (e) {
      console.log('\nRaw response:');
      console.log(data.substring(0, 1000));
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.setTimeout(30000, () => {
  req.destroy();
  console.error('Request timeout after 30 seconds');
});

req.end();

