import { useConnect, useAccount, useChainId, useSwitchChain } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'

export function useWallet() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect()
  const { switchChain } = useSwitchChain()

  const handleConnect = async () => {
    // Check if MetaMask is installed
    if (typeof window !== 'undefined' && !window.ethereum) {
      // Error will be handled by the caller
      return
    }

    // Find MetaMask connector - try different possible IDs
    const metaMaskConnector = connectors.find(
      c => c.id === 'io.metamask' || c.id === 'metaMask' || c.name?.toLowerCase().includes('metamask')
    ) || connectors[0] // Fallback to first connector if only one is configured

    if (metaMaskConnector) {
      connect({ 
        connector: metaMaskConnector,
        chainId: bscTestnet.id // Force BNB Testnet
      })
    }
  }

  // Auto-switch to testnet if connected to wrong network
  const ensureTestnet = () => {
    if (isConnected && chainId !== bscTestnet.id) {
      switchChain({ chainId: bscTestnet.id })
    }
  }

  return {
    address,
    isConnected,
    isConnecting,
    connectError,
    handleConnect,
    ensureTestnet,
    chainId,
  }
}

