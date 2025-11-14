import { request } from './api'

export async function getMarketPrediction(symbols?: string[], tags?: string[], currency?: string, forceRefresh?: boolean) {
  const params = new URLSearchParams()
  if (symbols && symbols.length > 0) {
    params.append('symbols', symbols.join(','))
  }
  if (tags && tags.length > 0) {
    params.append('tags', tags.join(','))
  }
  if (currency) {
    params.append('currency', currency)
  }
  if (forceRefresh) {
    params.append('_t', Date.now().toString())
    params.append('_refresh', '1')
  }
  const query = params.toString()
  return request<{
    success: boolean
    cryptos: any[]
    libraryId?: string
    timestamp: string
    error?: string
  }>(`/api/market-prediction${query ? `?${query}` : ''}`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

export async function searchCrypto(query: string) {
  return request<{
    success: boolean
    results: any[]
    error?: string
  }>(`/api/crypto/search?query=${encodeURIComponent(query)}`)
}

export async function getCryptoLibrary() {
  return request<{
    success: boolean
    library: any[]
    count: number
  }>('/api/crypto/library')
}

