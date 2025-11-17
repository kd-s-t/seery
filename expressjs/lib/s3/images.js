const { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')
const axios = require('axios')
const { Readable } = require('stream')

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
})

function getBucketName() {
  return process.env.S3_COIN_IMAGES_BUCKET || ''
}
const BUCKET_NAME = getBucketName()
const COINGECKO_IMAGES_BASE = 'https://assets.coingecko.com/coins/images'

const COINGECKO_IMAGE_ID_MAP = {
  'bitcoin': '1',
  'ethereum': '279',
  'binancecoin': '825',
  'solana': '4128',
  'cardano': '975',
  'polkadot': '12171',
  'chainlink': '877',
  'avalanche-2': '12559',
  'polygon': '4713',
  'litecoin': '2',
  'ripple': '52',
  'dogecoin': '5',
  'shiba-inu': '11939',
  'tron': '1958',
  'uniswap': '12504',
  'stellar': '100',
  'tether': '325',
  'usd-coin': '6319',
  'bitcoin-cash': '780',
  'cosmos': '3794',
  'ethereum-classic': '1321',
  'monero': '69',
  'algorand': '4030',
  'filecoin': '3821',
  'vechain': '1160',
  'aave': '6612',
  'maker': '151',
  'compound': '3499',
  'dash': '19',
  'zcash': '1437',
  'tezos': '976',
  'eos': '1765',
  'iota': '1720',
  'neo': '1376',
  'waves': '986',
  'near': '11165',
  'fantom': '3513',
  'harmony': '3949',
  'celo': '5567',
  'hedera-hashgraph': '4648',
  'theta-token': '2416',
  'basic-attention-token': '1540',
  '0x': '863',
  'curve-dao-token': '5414',
  'yearn-finance': '5873',
  'sushi': '11976',
  '1inch': '8104',
  'pancakeswap-token': '12561',
  'aptos': '26455',
  'sui': '20947',
  'optimism': '11844',
  'arbitrum': '13188',
  'immutable-x': '10603',
  'loopring': '1934',
  'zilliqa': '2469',
  'icon': '2116',
  'ontology': '2566',
  'qtum': '1682',
  'omisego': '1808',
  'ravencoin': '3652',
  'siacoin': '1042',
  'digibyte': '109',
  'verge': '603',
  'reddcoin': '118',
  'pivx': '107',
  'nano': '1210',
  'dai': '9956',
  'true-usd': '5246',
  'binance-usd': '5038',
  'wrapped-bitcoin': '3717',
  'hyperliquid': '31124',
  'aster-2': '31124',
}

function getCoinGeckoImageUrl(cryptoId, size = 'small') {
  const id = cryptoId.toLowerCase().trim()
  const imageId = COINGECKO_IMAGE_ID_MAP[id]
  
  if (imageId) {
    return `${COINGECKO_IMAGES_BASE}/${imageId}/${size}/${id}.png`
  }
  
  return `${COINGECKO_IMAGES_BASE}/0/${size}/${id}.png`
}

module.exports.getCoinGeckoImageUrl = getCoinGeckoImageUrl

function getS3Key(cryptoId, size = 'small') {
  return `coins/${cryptoId.toLowerCase()}/${size}.png`
}

async function checkS3ImageExists(cryptoId, size = 'small') {
  const bucketName = getBucketName()
  if (!bucketName) {
    return false
  }
  
  try {
    const key = getS3Key(cryptoId, size)
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key
    })
    await s3Client.send(command)
    return true
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false
    }
    console.error(`Error checking S3 for ${cryptoId}:`, error.message)
    return false
  }
}

async function uploadToS3(cryptoId, imageBuffer, size = 'small', contentType = 'image/png') {
  console.log(`[S3 Upload] Starting upload for ${cryptoId}...`)
  
  const bucketName = getBucketName()
  if (!bucketName) {
    console.warn(`[S3 Upload] ❌ Cannot upload ${cryptoId} to S3: S3_COIN_IMAGES_BUCKET not set`)
    console.warn(`[S3 Upload]    Set S3_COIN_IMAGES_BUCKET=production-seer-coin-images in expressjs/.env file`)
    console.warn(`[S3 Upload]    Current env value: "${process.env.S3_COIN_IMAGES_BUCKET || 'undefined'}"`)
    return null
  }
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(`[S3 Upload] ❌ Cannot upload ${cryptoId} to S3: AWS credentials not configured`)
    console.warn(`[S3 Upload]    Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file`)
    return null
  }
  
  try {
    const key = getS3Key(cryptoId, size)
    console.log(`[S3 Upload] Uploading to s3://${bucketName}/${key}`)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
      CacheControl: 'max-age=31536000'
    })
    await s3Client.send(command)
    console.log(`[S3 Upload] ✅ Successfully uploaded ${cryptoId} to S3: s3://${bucketName}/${key}`)
    return key
  } catch (error) {
    console.error(`[S3 Upload] ❌ Error uploading ${cryptoId} to S3:`, error.message)
    if (error.name === 'NoSuchBucket') {
      console.error(`[S3 Upload]    Bucket ${bucketName} does not exist. Create it in AWS S3.`)
    } else if (error.name === 'AccessDenied') {
      console.error(`[S3 Upload]    Access denied to bucket ${bucketName}. Check AWS credentials and bucket permissions.`)
    } else if (error.name === 'InvalidAccessKeyId') {
      console.error(`[S3 Upload]    Invalid AWS Access Key ID. Check AWS_ACCESS_KEY_ID.`)
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error(`[S3 Upload]    Invalid AWS Secret Key. Check AWS_SECRET_ACCESS_KEY.`)
    } else {
      console.error(`[S3 Upload]    Full error:`, error)
    }
    return null
  }
}

async function downloadFromCoinGecko(cryptoId, size = 'small') {
  try {
    const imageUrl = getCoinGeckoImageUrl(cryptoId, size)
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    })
    return Buffer.from(response.data)
  } catch (error) {
    console.error(`Error downloading ${cryptoId} from CoinGecko:`, error.message)
    return null
  }
}

async function getCoinImageUrl(cryptoId, size = 'small') {
  if (!cryptoId) {
    return getCoinGeckoImageUrl(cryptoId, size)
  }
  
  const id = cryptoId.toLowerCase().trim()
  
  const bucketName = getBucketName()
  
  if (!bucketName) {
    console.log(`[S3] ⚠️  S3 bucket not configured (S3_COIN_IMAGES_BUCKET is empty), using CoinGecko directly for ${id}`)
    console.log(`[S3]    To enable S3 uploads, set S3_COIN_IMAGES_BUCKET=production-seer-coin-images in expressjs/.env file`)
    console.log(`[S3]    Current env value: "${process.env.S3_COIN_IMAGES_BUCKET || 'undefined'}"`)
    return getCoinGeckoImageUrl(id, size)
  }
  
  console.log(`[S3] Checking if ${id} exists in S3 bucket ${bucketName}...`)
  const exists = await checkS3ImageExists(id, size)
  
  if (exists) {
    console.log(`[S3] ✅ Image ${id} already exists in S3`)
    const region = process.env.AWS_REGION || 'us-east-1'
    return `https://${bucketName}.s3.${region}.amazonaws.com/${getS3Key(id, size)}`
  }
  
  console.log(`[S3] 📥 Image ${id} not in S3, downloading from CoinGecko and uploading...`)
  const imageBuffer = await downloadFromCoinGecko(id, size)
  
  if (imageBuffer) {
    console.log(`[S3] ✅ Downloaded ${id} from CoinGecko (${imageBuffer.length} bytes)`)
    const uploadResult = await uploadToS3(id, imageBuffer, size)
    if (uploadResult) {
      console.log(`[S3] ✅ Successfully uploaded ${id} to S3: ${uploadResult}`)
      const region = process.env.AWS_REGION || 'us-east-1'
      return `https://${bucketName}.s3.${region}.amazonaws.com/${getS3Key(id, size)}`
    } else {
      console.warn(`[S3] ⚠️  Failed to upload ${id} to S3, using CoinGecko fallback`)
    }
  } else {
    console.warn(`[S3] ⚠️  Failed to download ${id} from CoinGecko`)
  }
  
  return getCoinGeckoImageUrl(id, size)
}

module.exports = {
  getCoinImageUrl,
  getCoinGeckoImageUrl,
  checkS3ImageExists,
  uploadToS3,
  downloadFromCoinGecko
}

