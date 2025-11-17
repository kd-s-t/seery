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

const BUCKET_NAME = process.env.S3_COIN_IMAGES_BUCKET || ''
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
  if (!BUCKET_NAME) {
    return false
  }
  
  try {
    const key = getS3Key(cryptoId, size)
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
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
  if (!BUCKET_NAME) {
    return null
  }
  
  try {
    const key = getS3Key(cryptoId, size)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
      CacheControl: 'max-age=31536000',
      ACL: 'public-read'
    })
    await s3Client.send(command)
    return key
  } catch (error) {
    console.error(`Error uploading ${cryptoId} to S3:`, error.message)
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
  
  if (!BUCKET_NAME) {
    return getCoinGeckoImageUrl(id, size)
  }
  
  const exists = await checkS3ImageExists(id, size)
  
  if (exists) {
    const region = process.env.AWS_REGION || 'us-east-1'
    return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${getS3Key(id, size)}`
  }
  
  const imageBuffer = await downloadFromCoinGecko(id, size)
  
  if (imageBuffer) {
    await uploadToS3(id, imageBuffer, size)
    const region = process.env.AWS_REGION || 'us-east-1'
    return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${getS3Key(id, size)}`
  }
  
  return getCoinGeckoImageUrl(id, size)
}

module.exports = {
  getCoinImageUrl,
  checkS3ImageExists,
  uploadToS3,
  downloadFromCoinGecko
}

