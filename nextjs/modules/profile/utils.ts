import { formatEther } from 'viem'
import { type UserStats, type UserStake } from './types'

export function formatPrice(priceWei: string): string {
  try {
    return parseFloat(formatEther(BigInt(priceWei))).toFixed(2)
  } catch {
    return '0.00'
  }
}

export function formatAmount(amountWei?: string, amount?: string): string {
  try {
    if (amountWei) {
      return parseFloat(formatEther(BigInt(amountWei))).toFixed(4)
    }
    if (amount) {
      return parseFloat(amount).toFixed(4)
    }
    return '0.0000'
  } catch {
    return '0.0000'
  }
}

export function formatPercent(percent: number): string {
  try {
    return percent > 0 ? `+${percent.toFixed(2)}%` : `${percent.toFixed(2)}%`
  } catch {
    return '0.00%'
  }
}

export function calculateNetProfit(stats: UserStats): number {
  try {
    return Number(formatEther(stats.totalWon)) - Number(formatEther(stats.totalLost))
  } catch {
    return 0
  }
}

export function getWinRatePercent(stats: UserStats): string {
  try {
    return (Number(stats.winRate) / 100).toFixed(2)
  } catch {
    return '0.00'
  }
}

export function getStakeStatus(stake: UserStake): {
  status: 'Active' | 'Expired' | 'Won' | 'Lost'
  color: 'info' | 'warning' | 'success' | 'error'
} {
  if (stake.isResolved) {
    // Check rewarded first - this indicates if the individual staker won
    // rewarded is set to true only if the staker's bet direction matched the outcome
    if (stake.rewarded !== null && stake.rewarded !== undefined) {
      return stake.rewarded
        ? { status: 'Won', color: 'success' }
        : { status: 'Lost', color: 'error' }
    }
    // Fallback: calculate based on stakeUp and actualPrice vs currentPrice
    if (stake.stakeUp !== undefined && stake.actualPrice && stake.currentPrice) {
      const actualPriceNum = parseFloat(stake.actualPrice)
      const currentPriceNum = parseFloat(stake.currentPrice)
      const actualUp = actualPriceNum > currentPriceNum
      const stakerWon = (actualUp && stake.stakeUp) || (!actualUp && !stake.stakeUp)
      return stakerWon
        ? { status: 'Won', color: 'success' }
        : { status: 'Lost', color: 'error' }
    }
    // Last fallback to predictionCorrect (less accurate for individual stakers)
    if (stake.predictionCorrect !== null && stake.predictionCorrect !== undefined) {
      return stake.predictionCorrect
        ? { status: 'Won', color: 'success' }
        : { status: 'Lost', color: 'error' }
    }
    return { status: 'Lost', color: 'error' }
  }
  if (stake.isExpired) {
    return { status: 'Expired', color: 'warning' }
  }
  return { status: 'Active', color: 'info' }
}

