import { createConfig, http } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'
import { defineChain } from 'viem'

export const localhost = defineChain({
  id: 31337,
  name: 'Hardhat Localhost',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
  },
})

const chains = [bscTestnet, localhost] as const

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    metaMask(),
  ],
  transports: {
    [bscTestnet.id]: http(),
    [localhost.id]: http('http://localhost:8545', {
      retryCount: 3,
      timeout: 60000,
      fetchOptions: {
        signal: AbortSignal.timeout(60000),
      },
    }),
  },
  batch: {
    multicall: {
      wait: 50,
    },
  },
})

export * from './types'
