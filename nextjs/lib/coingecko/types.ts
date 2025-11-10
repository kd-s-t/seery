export interface CryptoPrice {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  suggestion?: 'up' | 'down' | null
  suggestionPercent?: number | null
  reasoning?: string | null
}

export interface CryptoPricesResponse {
  success: boolean
  cryptos: CryptoPrice[]
  tags?: string[]
  timestamp: string
  error?: string
}

