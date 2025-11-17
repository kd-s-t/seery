const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3016'

export async function getCoinImageUrl(cryptoId: string, size: 'small' | 'large' | 'thumb' = 'small'): Promise<string> {
  if (!cryptoId) {
    return ''
  }
  
  try {
    const response = await fetch(`${API_URL}/api/crypto/image?cryptoId=${encodeURIComponent(cryptoId)}&size=${size}`)
    const data = await response.json()
    
    if (data.success && data.imageUrl) {
      return data.imageUrl
    }
  } catch (error) {
    console.error('Error fetching coin image from API:', error)
  }
  
  const id = cryptoId.toLowerCase().trim()
  const COINGECKO_IMAGES_BASE = 'https://assets.coingecko.com/coins/images'
  const COINGECKO_IMAGE_ID_MAP: Record<string, string> = {
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
  
  const imageId = COINGECKO_IMAGE_ID_MAP[id]
  if (imageId) {
    return `${COINGECKO_IMAGES_BASE}/${imageId}/${size}/${id}.png`
  }
  
  return `${COINGECKO_IMAGES_BASE}/0/${size}/${id}.png`
}

