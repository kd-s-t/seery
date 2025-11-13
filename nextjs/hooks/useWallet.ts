import { useConnect, useAccount, useChainId, useSwitchChain, useDisconnect } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { localhost } from '@/lib/wagmi'

export function useWallet() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect()
  const { switchChain } = useSwitchChain()
  const { disconnect } = useDisconnect()

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
        // Don't force chain - let user choose or use current chain
      })
    }
  }

  // Allow localhost or testnet - don't auto-switch
  const ensureTestnet = () => {
    // Disabled - allow localhost or testnet
  }

  const handleDisconnect = () => {
    disconnect()
  }

  return {
    address,
    isConnected,
    isConnecting,
    connectError,
    handleConnect,
    handleDisconnect,
    ensureTestnet,
    chainId,
  }
}

