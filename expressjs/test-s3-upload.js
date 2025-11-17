require('dotenv').config();
const s3Images = require('./lib/s3/images');

async function testS3Upload() {
  console.log('=== S3 Configuration Check ===');
  console.log('BUCKET_NAME:', process.env.S3_COIN_IMAGES_BUCKET || '(not set)');
  console.log('AWS_REGION:', process.env.AWS_REGION || 'us-east-1 (default)');
  console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '***set***' : '(not set)');
  console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '***set***' : '(not set)');
  console.log('');

  if (!process.env.S3_COIN_IMAGES_BUCKET) {
    console.error('❌ S3_COIN_IMAGES_BUCKET is not set in .env file');
    console.log('\nAdd to expressjs/.env:');
    console.log('S3_COIN_IMAGES_BUCKET=your-bucket-name');
    return;
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials are not set in .env file');
    console.log('\nAdd to expressjs/.env:');
    console.log('AWS_ACCESS_KEY_ID=your-access-key');
    console.log('AWS_SECRET_ACCESS_KEY=your-secret-key');
    return;
  }

  console.log('✅ Configuration looks good');
  console.log('');

  console.log('=== Testing Image Upload ===');
  const testCryptos = ['bitcoin', 'ethereum', 'solana'];
  
  for (const cryptoId of testCryptos) {
    console.log(`\nTesting ${cryptoId}...`);
    try {
      const imageUrl = await s3Images.getCoinImageUrl(cryptoId, 'small');
      console.log(`✅ Got image URL: ${imageUrl}`);
    } catch (error) {
      console.error(`❌ Error for ${cryptoId}:`, error.message);
    }
  }

  console.log('\n=== Test Complete ===');
  console.log('Check your S3 bucket to see if images were uploaded.');
  console.log('Also check server logs for detailed upload messages.');
}

testS3Upload().catch(console.error);

