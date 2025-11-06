import { createConfig, http } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

// TESTNET ONLY - No mainnet support
const chains = [bscTestnet] as const

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    metaMask(),
  ],
  transports: {
    [bscTestnet.id]: http(),
  },
})

