'use client'

import { useState, useEffect } from 'react'
import { Box, Container, Typography } from '@mui/material'
import { useContract, useMetaMask, useWallet, useNetwork } from '@/hooks'
import { SnackbarState } from '@/types'
import Header from '@/components/Header'
import MetaMaskWarning from '@/components/MetaMaskWarning'
import NotificationSnackbar from '@/components/NotificationSnackbar'
import CryptoTable from '@/components/CryptoTable'
import Homepage from '@/components/Homepage'

export default function Home() {
  // Custom hooks
  const { address, isConnected, isConnecting, connectError, handleConnect, handleDisconnect, ensureTestnet } = useWallet()
  const { contractAddress, loading: contractLoading } = useContract()
  const { showWarning, setShowWarning } = useMetaMask()
  const { isTestnet, switchToTestnet } = useNetwork()

  // Local state
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Show message helper
  const showMessage = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  // Handle wallet connection
  const onConnect = () => {
    if (typeof window !== 'undefined' && !window.ethereum) {
      showMessage('MetaMask not found. Please install MetaMask extension.', 'error')
      return
    }
    handleConnect()
  }

  // Auto-switch to testnet when connected
  useEffect(() => {
    if (isConnected && !isTestnet) {
      switchToTestnet()
    }
  }, [isConnected, isTestnet, switchToTestnet])

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      const errorMessage = connectError.message || 'Failed to connect wallet'
      if (errorMessage.includes('rejected') || errorMessage.includes('User rejected')) {
        showMessage('Connection rejected by user', 'error')
      } else if (errorMessage.includes('not found') || errorMessage.includes('MetaMask')) {
        showMessage('MetaMask not found. Please install MetaMask extension.', 'error')
      } else {
        showMessage(`Connection error: ${errorMessage}`, 'error')
      }
    }
  }, [connectError])


  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <MetaMaskWarning
          show={showWarning && !isConnected}
          onClose={() => setShowWarning(false)}
        />
        
        <Header
          address={address}
          isConnected={isConnected}
          isConnecting={isConnecting}
          onConnect={onConnect}
          onDisconnect={handleDisconnect}
        />

        {!contractLoading && !contractAddress && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'warning.light', color: 'warning.contrastText', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Backend Not Connected
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Cannot fetch contract address from backend. Make sure the backend is running.
            </Typography>
            <Typography variant="body2" component="pre" sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 1, borderRadius: 1, fontSize: '0.85rem', overflow: 'auto' }}>
{`1. Start backend:
   cd expressjs
   npm start

2. Ensure expressjs/.env has:
   CONTRACT_ADDRESS=0x... (your deployed contract address)
   PORT=3016

3. Refresh this page`}
            </Typography>
          </Box>
        )}

        <Homepage />
        
        {isConnected && (
          <Box id="market-section" sx={{ mt: 4, scrollMarginTop: '80px' }}>
            <CryptoTable />
          </Box>
        )}

        <NotificationSnackbar
          snackbar={snackbar}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </Container>
    </Box>
  )
}
