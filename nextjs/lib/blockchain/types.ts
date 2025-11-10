export type ContractABI = readonly {
  name: string
  type: string
  stateMutability?: string
  inputs?: readonly {
    name: string
    type: string
    indexed?: boolean
  }[]
  outputs?: readonly {
    name: string
    type: string
  }[]
}[]

export interface MarketData {
  creator: string
  question: string
  endTime: bigint
  resolved: boolean
  winningOutcome?: bigint
  totalPool: bigint
}

export interface MarketOutcome {
  marketId: number
  outcomeIndex: number
  outcomeLabel: string
  poolAmount: bigint
}

export interface BetParams {
  marketId: number
  outcome: number
  amount: bigint
}

export interface CreateMarketParams {
  question: string
  outcomes: string[]
  durationHours: number
}

