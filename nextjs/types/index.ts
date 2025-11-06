export interface Market {
  market_id: number
  question: string
  outcomes: string[]
  resolved: boolean
  winning_outcome?: number
  outcomePools?: { [key: number]: { total: string } }
}

export interface MarketForm {
  question: string
  outcomes: string
  duration: number
}

export interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error'
}

export interface ApiConfig {
  contractAddress?: string
}

