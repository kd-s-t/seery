'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { Box, Container, Typography } from '@mui/material'
import { CONTRACT_ABI } from '@/lib/blockchain'
import { useMarkets, useContract, useMetaMask, useWallet, useNetwork } from '@/hooks'
import { SnackbarState, MarketForm } from '@/types'
import Header from '@/components/Header'
import MetaMaskWarning from '@/components/MetaMaskWarning'
import WalletConnection from '@/components/WalletConnection'
import MarketCreationForm from '@/components/MarketCreationForm'
import MarketsList from '@/components/MarketsList'
import NotificationSnackbar from '@/components/NotificationSnackbar'
import CryptoTable from '@/components/CryptoTable'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3016'

export default function Home() {
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Custom hooks
  const { address, isConnected, isConnecting, connectError, handleConnect, ensureTestnet } = useWallet()
  const { markets, loading: marketsLoading, reloadMarkets } = useMarkets(isConnected)
  const { contractAddress, loading: contractLoading } = useContract()
  const { showWarning, setShowWarning } = useMetaMask()
  const { isTestnet, switchToTestnet } = useNetwork()

  // Local state
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  })
  const [marketForm, setMarketForm] = useState<MarketForm>({
    question: '',
    outcomes: '',
    duration: 72
  })
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

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

  // Show messages for transaction states
  useEffect(() => {
    if (isWriting) {
      showMessage('Confirm transaction in MetaMask...', 'success')
    }
  }, [isWriting])

  useEffect(() => {
    if (hash) {
      showMessage(`Transaction sent! Hash: ${hash}`, 'success')
    }
  }, [hash])

  useEffect(() => {
    if (isConfirming) {
      showMessage('Waiting for confirmation...', 'success')
    }
  }, [isConfirming])

  useEffect(() => {
    if (isConfirmed) {
      showMessage('Transaction confirmed successfully!', 'success')
      reloadMarkets()
      setMarketForm({ question: '', outcomes: '', duration: 72 })
    }
  }, [isConfirmed, reloadMarkets])

  // Create market
  const createMarket = async (form: MarketForm) => {
    if (!isConnected) {
      showMessage('Please connect your wallet first', 'error')
      return
    }

    if (!contractAddress) {
      showMessage('Contract not deployed. Deploy: cd bnb && npm run deploy, then add CONTRACT_ADDRESS to expressjs/.env', 'error')
      return
    }

    const outcomes = form.outcomes.split(',').map(s => s.trim())
    if (outcomes.length < 2) {
      showMessage('At least 2 outcomes are required', 'error')
      return
    }

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'createMarket',
        args: [form.question, outcomes, BigInt(form.duration)],
      })
    } catch (error: any) {
      if (error.message?.includes('User rejected')) {
        showMessage('Transaction rejected by user', 'error')
      } else {
        showMessage('Error: ' + (error.message || 'Unknown error'), 'error')
      }
    }
  }

  // Place bet
  const placeBet = async (marketId: number, outcome: number, amount: number) => {
    if (!isConnected) {
      showMessage('Please connect your wallet first', 'error')
      return
    }

    if (!amount || amount < 0.001) {
      showMessage('Minimum bet is 0.001 BNB', 'error')
      return
    }

    if (!contractAddress) {
      showMessage('Contract not deployed. Deploy: cd bnb && npm run deploy, then add CONTRACT_ADDRESS to expressjs/.env', 'error')
      return
    }

    try {
      const amountWei = parseEther(amount.toString())
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'placeBet',
        args: [BigInt(marketId), BigInt(outcome)],
        value: amountWei,
      })
      showMessage('Please confirm the transaction in MetaMask', 'success')
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error'
      let userMessage = 'Failed to place bet'
      
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        userMessage = 'Transaction rejected. Please try again when ready.'
      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('balance')) {
        userMessage = 'Insufficient balance. Please ensure you have enough BNB in your wallet.'
      } else if (errorMessage.includes('network')) {
        userMessage = 'Network error. Please check your connection and try again.'
      } else {
        userMessage = `Error placing bet: ${errorMessage}`
      }
      
      showMessage(userMessage, 'error')
    }
  }

  // AI Generate market
  const generateAIMarket = async () => {
    if (isGeneratingAI) return // Prevent multiple simultaneous requests
    
    setIsGeneratingAI(true)
    try {
      const response = await fetch(`${API_URL}/api/ai/generate-markets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'cryptocurrency', count: 3 })
      })

      const data = await response.json()
      
      if (!data.success) {
        // Handle API errors (like quota exceeded)
        let errorMsg = data.error || 'Failed to generate market'
        if (data.errorCode === 'QUOTA_EXCEEDED') {
          errorMsg = 'OpenAI API quota exceeded. ' + (data.details || 'Please check your billing at https://platform.openai.com/account/billing')
          if (data.solutions && data.solutions.length > 0) {
            console.error('OpenAI Quota Solutions:', data.solutions)
          }
        } else if (data.errorCode === 'RATE_LIMIT') {
          errorMsg = 'OpenAI API rate limit exceeded. Please try again in a moment.'
        } else if (data.errorCode === 'AI_DISABLED') {
          errorMsg = 'AI features are disabled. OPENAI_API_KEY not configured. The app works without AI - you can create markets manually or use the "Random Question" button.'
        }
        showMessage(errorMsg, 'error')
        return
      }
      
      if (data.success && data.markets && data.markets.length > 0) {
        const market = data.markets[0]
        setMarketForm({
          question: market.question,
          outcomes: market.outcomes.join(', '),
          duration: market.durationHours || 72
        })
        showMessage('AI generated market suggestion! Fill in the details and create your market.', 'success')
      } else {
        showMessage('No markets were generated. Please try again.', 'error')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error'
      let userMessage = 'Failed to generate market'
      
      if (errorMessage.includes('fetch')) {
        userMessage = 'Unable to connect to the server. Please check your connection and try again.'
      } else if (errorMessage.includes('network')) {
        userMessage = 'Network error. Please check your internet connection.'
      } else {
        userMessage = `Error: ${errorMessage}`
      }
      
      showMessage(userMessage, 'error')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <MetaMaskWarning
          show={showWarning && !isConnected}
          onClose={() => setShowWarning(false)}
        />
        
        <Header />

        {!contractLoading && !contractAddress && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              ⚠️ Contract Not Deployed
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              To use Seer, you need to deploy the smart contract first.
            </Typography>
            <Typography variant="body2" component="pre" sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 1, borderRadius: 1, fontSize: '0.85rem', overflow: 'auto' }}>
{`1. Deploy contract:
   cd bnb
   npm run deploy

2. Add to expressjs/.env:
   CONTRACT_ADDRESS=0x... (from step 1)

3. Restart backend:
   cd expressjs
   npm start

See DEPLOY_CONTRACT.md for details.`}
            </Typography>
          </Box>
        )}

        <WalletConnection
          address={address}
          isConnected={isConnected}
          isConnecting={isConnecting}
          onConnect={onConnect}
        />

        <CryptoTable />

        <MarketCreationForm
          onSubmit={createMarket}
          onGenerateAI={generateAIMarket}
          isSubmitting={isWriting || isConfirming}
          isGeneratingAI={isGeneratingAI}
          form={marketForm}
          onFormChange={setMarketForm}
        />

        <MarketsList
          markets={markets}
          loading={marketsLoading}
          userAddress={address}
          onPlaceBet={placeBet}
          isPlacingBet={isWriting || isConfirming}
        />

        <NotificationSnackbar
          snackbar={snackbar}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </Container>
    </Box>
  )
}
