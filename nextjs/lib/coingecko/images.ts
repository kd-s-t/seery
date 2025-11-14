const CRYPTO_ICONS_BASE = 'https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master'

const CRYPTO_ID_MAP: Record<string, string> = {
  'binancecoin': 'binance-coin',
  'avalanche-2': 'avalanche',
  'usd-coin': 'usd-coin',
  'wrapped-bitcoin': 'wrapped-bitcoin',
  'bitcoin-cash': 'bitcoin-cash',
  'polkadot': 'polkadot-new',
}

export function getCryptoImageUrl(cryptoId: string, size: number = 32): string {
  if (!cryptoId) {
    return ''
  }
  
  const id = cryptoId.toLowerCase().trim()
  
  const mappedId = CRYPTO_ID_MAP[id] || id
  
  return `${CRYPTO_ICONS_BASE}/${size}/${mappedId}.png`
}

