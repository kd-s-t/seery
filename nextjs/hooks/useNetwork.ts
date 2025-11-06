import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'

export function useNetwork() {
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { isConnected } = useAccount()

  const isTestnet = chainId === bscTestnet.id
  const isMainnet = false // TESTNET ONLY - No mainnet support
  const networkName = isTestnet ? 'BNB Testnet' : 'Wrong Network - Switch to BNB Testnet'

  const switchToTestnet = () => {
    if (isConnected && !isTestnet) {
      switchChain({ chainId: bscTestnet.id })
    }
  }

  return {
    chainId,
    networkName,
    isTestnet,
    isMainnet,
    isSwitching,
    switchToTestnet,
  }
}

