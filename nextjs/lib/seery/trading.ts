import { request } from './api'

export async function buyCrypto(params: { symbol: string; quantity?: number; quoteOrderQty?: number; type?: 'MARKET' | 'LIMIT'; price?: number }) {
  return request<{
    success: boolean
    orderId?: string
    error?: string
  }>('/api/trading/buy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
}

export async function sellCrypto(params: { symbol: string; quantity?: number; quoteOrderQty?: number; type?: 'MARKET' | 'LIMIT'; price?: number }) {
  return request<{
    success: boolean
    orderId?: string
    error?: string
  }>('/api/trading/sell', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
}

export async function getAccountInfo() {
  return request<{
    success: boolean
    account?: any
    error?: string
  }>('/api/trading/account')
}

export async function getPrice(symbol: string) {
  return request<{
    success: boolean
    price?: number
    error?: string
  }>(`/api/trading/price?symbol=${encodeURIComponent(symbol)}`)
}

