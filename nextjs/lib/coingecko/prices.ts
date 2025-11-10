import type { CryptoPricesResponse } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3016'

export async function getCryptoPrices(symbols?: string[]): Promise<CryptoPricesResponse> {
  try {
    const params = symbols ? `?symbols=${symbols.join(',')}` : ''
    const response = await fetch(`${API_URL}/api/crypto/prices${params}`)
    const data = await response.json()
    return data
  } catch (error: any) {
    return {
      success: false,
      cryptos: [],
      timestamp: new Date().toISOString(),
      error: error.message || 'Failed to fetch crypto prices'
    }
  }
}

