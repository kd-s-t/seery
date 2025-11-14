import { request } from './api'

export async function getStakeablePredictions() {
  return request<{
    success: boolean
    predictions: any[]
    count: number
    totalStakes: string
    totalAmountStaked: string
    cached?: boolean
    timestamp: string
  }>('/api/staking/predictions')
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

