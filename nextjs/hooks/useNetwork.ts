import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { localhost } from '@/lib/wagmi'

export function useNetwork() {
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { isConnected } = useAccount()

  const isTestnet = chainId === bscTestnet.id
  const isLocalhost = chainId === localhost.id
  const isMainnet = false
  
  const networkName = isLocalhost 
    ? 'Hardhat Localhost' 
    : isTestnet 
    ? 'BNB Testnet' 
    : `Chain ${chainId}`

  const switchToTestnet = () => {
    if (isConnected && !isTestnet) {
      switchChain({ chainId: bscTestnet.id })
    }
  }

  return {
    chainId,
    networkName,
    isTestnet,
    isLocalhost,
    isMainnet,
    isSwitching,
    switchToTestnet,
  }
}

