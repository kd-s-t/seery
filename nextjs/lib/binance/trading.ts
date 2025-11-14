import { buyCrypto as seeryBuyCrypto, sellCrypto as seerySellCrypto, getAccountInfo as seeryGetAccountInfo, getPrice as seeryGetPrice } from '@/lib/seery'

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
    const data = await seeryBuyCrypto(params)
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to place buy order')
    }

    return data
  } catch (error: any) {
    throw new Error(error.message || 'Failed to place buy order')
  }
}

export async function sellCrypto(params: SellOrderParams) {
  try {
    const data = await seerySellCrypto(params)
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to place sell order')
    }

    return data
  } catch (error: any) {
    throw new Error(error.message || 'Failed to place sell order')
  }
}

export async function getAccountInfo() {
  try {
    const data = await seeryGetAccountInfo()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch account info')
    }

    return data
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch account info')
  }
}

export async function getPrice(symbol: string) {
  try {
    const data = await seeryGetPrice(symbol)
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch price')
    }

    return data
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch price')
  }
}

