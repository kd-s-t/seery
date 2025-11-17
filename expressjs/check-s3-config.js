#!/usr/bin/env node

require('dotenv').config();

console.log('='.repeat(60));
console.log('S3 Configuration Check');
console.log('='.repeat(60));
console.log('');

const bucket = process.env.S3_COIN_IMAGES_BUCKET;
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || 'us-east-1';

console.log('Configuration Status:');
console.log('─'.repeat(60));
console.log(`S3_COIN_IMAGES_BUCKET: ${bucket || '❌ NOT SET'}`);
console.log(`AWS_ACCESS_KEY_ID:      ${accessKey ? '✅ SET' : '❌ NOT SET'}`);
console.log(`AWS_SECRET_ACCESS_KEY:  ${secretKey ? '✅ SET' : '❌ NOT SET'}`);
console.log(`AWS_REGION:             ${region}`);
console.log('');

if (!bucket) {
  console.log('❌ ISSUE: S3 bucket name is not configured');
  console.log('');
  console.log('To fix: Add to expressjs/.env:');
  console.log('  S3_COIN_IMAGES_BUCKET=your-bucket-name');
  console.log('');
}

if (!accessKey || !secretKey) {
  console.log('❌ ISSUE: AWS credentials are not configured');
  console.log('');
  console.log('To fix: Add to expressjs/.env:');
  console.log('  AWS_ACCESS_KEY_ID=your-access-key');
  console.log('  AWS_SECRET_ACCESS_KEY=your-secret-key');
  console.log('  AWS_REGION=us-east-1');
  console.log('');
}

if (bucket && accessKey && secretKey) {
  console.log('✅ Configuration looks complete!');
  console.log('');
  console.log('If S3 is still empty, check your server logs for:');
  console.log('  - "Image X not in S3, downloading..." (upload starting)');
  console.log('  - "Successfully uploaded X to S3" (upload succeeded)');
  console.log('  - "Error uploading X to S3" (upload failed - check error message)');
  console.log('');
  console.log('Common issues:');
  console.log('  1. Bucket doesn\'t exist - create it in AWS S3');
  console.log('  2. Wrong region - make sure AWS_REGION matches bucket region');
  console.log('  3. Permissions - AWS credentials need s3:PutObject permission');
}

console.log('='.repeat(60));

