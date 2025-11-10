const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3016'

export interface BuyOrderParams {
  symbol: string
  quantity?: number
  quoteOrderQty?: number
  type?: 'MARKET' | 'LIMIT'
  price?: number
}

export interface SellOrderParams {
  symbol: string
  quantity?: number
  quoteOrderQty?: number
  type?: 'MARKET' | 'LIMIT'
  price?: number
}

export async function buyCrypto(params: BuyOrderParams) {
  try {
    const response = await fetch(`${API_URL}/api/trading/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to place buy order')
    }

    return data
  } catch (error: any) {
    throw new Error(error.message || 'Failed to place buy order')
  }
}

export async function sellCrypto(params: SellOrderParams) {
  try {
    const response = await fetch(`${API_URL}/api/trading/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to place sell order')
    }

    return data
  } catch (error: any) {
    throw new Error(error.message || 'Failed to place sell order')
  }
}

export async function getAccountInfo() {
  try {
    const response = await fetch(`${API_URL}/api/trading/account`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch account info')
    }

    return data
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch account info')
  }
}

export async function getPrice(symbol: string) {
  try {
    const response = await fetch(`${API_URL}/api/trading/price?symbol=${encodeURIComponent(symbol)}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch price')
    }

    return data
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch price')
  }
}

