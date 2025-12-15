import { request } from './api'

export async function getStakeablePredictions(bypassCache = false) {
  const endpoint = bypassCache 
    ? '/api/staking/predictions?refresh=true'
    : '/api/staking/predictions'
  
  return request<{
    success: boolean
    predictions: any[]
    count: number
    totalStakes: string
    totalAmountStaked: string
    cached?: boolean
    timestamp: string
  }>(endpoint)
}

export async function getUserStats(address: string) {
  return request<{
    success: boolean
    stats: {
      wins: string
      losses: string
      totalStaked: string
      totalWon: string
      totalLost: string
      winRate: string
    }
    timestamp: string
  }>(`/api/staking/user/${address}/stats`)
}

export async function getUserStakes(address: string) {
  return request<{
    success: boolean
    stakes: any[]
    count: number
    timestamp: string
  }>(`/api/staking/user/${address}`)
}

