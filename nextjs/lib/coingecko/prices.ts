import type { CryptoPricesResponse } from './types'
import { getMarketPrediction, searchCrypto as seerySearchCrypto, getCryptoLibrary as seeryGetCryptoLibrary } from '@/lib/seery'

export async function getCryptoPriceDirect(coinId: string, currency: string = 'usd'): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${currency}`,
      { 
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store'
      }
    )
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000
      throw new Error(`Rate limited. Wait ${waitTime / 1000} seconds.`)
    }
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    const price = data[coinId]?.[currency]
    
    return price || null
  } catch (error: any) {
    if (error.message?.includes('Rate limited')) {
      throw error
    }
    return null
  }
}

export async function getCryptoPrices(symbols?: string[], tags?: string[], currency?: string, forceRefresh?: boolean): Promise<CryptoPricesResponse> {
  try {
    if (forceRefresh) {
      console.log('Frontend: Force refresh - calling API')
    }
    
    const data = await getMarketPrediction(symbols, tags, currency, forceRefresh)
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

export async function searchCrypto(query: string) {
  try {
    const data = await seerySearchCrypto(query)
    return data
  } catch (error: any) {
    return {
      success: false,
      results: [],
      error: error.message || 'Failed to search crypto'
    }
  }
}

export interface CryptoLibraryItem {
  id: string
  name: string
  symbol: string
  marketCap: number
}

export async function getCryptoLibrary(): Promise<{ success: boolean; library: CryptoLibraryItem[]; count: number }> {
  try {
    const data = await seeryGetCryptoLibrary()
    return data
  } catch (error: any) {
    return {
      success: false,
      library: [],
      count: 0
    }
  }
}

