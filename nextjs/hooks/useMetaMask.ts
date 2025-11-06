import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

export function useMetaMask() {
  const { isConnected } = useAccount()
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMetaMask = () => {
        // Hide warning if connected or MetaMask is available
        if (isConnected || window.ethereum) {
          setShowWarning(false)
        } else {
          setShowWarning(true)
        }
      }
      checkMetaMask()
      // Re-check periodically in case MetaMask is installed after page load
      const interval = setInterval(checkMetaMask, 2000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

  return { showWarning, setShowWarning }
}

