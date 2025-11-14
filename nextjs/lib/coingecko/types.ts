export interface NewsSource {
  title: string
  url: string
  source: string
  date?: string
}

export interface CryptoPrice {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  suggestion?: 'up' | 'down' | null
  suggestionPercent?: number | null
  reasoning?: string | null
  newsSources?: NewsSource[]
  image?: string
  predictionId?: number | null
  predictionTxHash?: string | null
  libraryId?: string | number | null
}

export interface CryptoPricesResponse {
  success: boolean
  cryptos: CryptoPrice[]
  tags?: string[]
  timestamp: string
  libraryId?: string | number | null
  txHash?: string | null
  error?: string
}

