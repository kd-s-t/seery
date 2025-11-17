#!/usr/bin/env node

require('dotenv').config();
const s3Images = require('./lib/s3/images');

async function testDirectUpload() {
  console.log('='.repeat(60));
  console.log('Direct S3 Upload Test');
  console.log('='.repeat(60));
  console.log('');

  const bucket = process.env.S3_COIN_IMAGES_BUCKET;
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket) {
    console.log('❌ S3_COIN_IMAGES_BUCKET is not set');
    console.log('Add to expressjs/.env: S3_COIN_IMAGES_BUCKET=your-bucket-name');
    return;
  }

  if (!accessKey || !secretKey) {
    console.log('❌ AWS credentials are not set');
    console.log('Add to expressjs/.env:');
    console.log('  AWS_ACCESS_KEY_ID=your-key');
    console.log('  AWS_SECRET_ACCESS_KEY=your-secret');
    return;
  }

  console.log(`✅ Configuration found:`);
  console.log(`   Bucket: ${bucket}`);
  console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`   Access Key: ${accessKey.substring(0, 8)}...`);
  console.log('');

  console.log('Testing upload for "bitcoin"...');
  try {
    const imageUrl = await s3Images.getCoinImageUrl('bitcoin', 'small');
    console.log(`✅ Got URL: ${imageUrl}`);
    
    if (imageUrl.includes('s3.amazonaws.com')) {
      console.log('✅ Image URL points to S3 - upload likely succeeded!');
    } else if (imageUrl.includes('coingecko.com')) {
      console.log('⚠️  Image URL points to CoinGecko - S3 upload may have failed');
      console.log('   Check server logs for error messages');
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
  }

  console.log('');
  console.log('='.repeat(60));
}

testDirectUpload().catch(console.error);

