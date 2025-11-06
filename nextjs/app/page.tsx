'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Grid,
  Snackbar,
  Alert,
  Chip,
  Stack,
} from '@mui/material'
import { AccountBalanceWallet, AutoAwesome } from '@mui/icons-material'
import MarketCard from '@/components/MarketCard'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3016'

// Contract ABI
const CONTRACT_ABI = [
  "function createMarket(string question, string[] outcomes, uint256 durationHours) returns (uint256)",
  "function placeBet(uint256 marketId, uint256 outcome) payable",
  "function getMarket(uint256 marketId) view returns (address creator, string question, uint256 endTime, bool resolved, uint256 winningOutcome, uint256 totalPool)",
  "function getMarketOutcomes(uint256 marketId) view returns (string[])",
  "function getOutcomePool(uint256 marketId, uint256 outcome) view returns (uint256)",
  "event MarketCreated(uint256 indexed marketId, address indexed creator, string question)"
]

export default function Home() {
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [markets, setMarkets] = useState<any[]>([])
  const [contractAddress, setContractAddress] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })
  const [marketForm, setMarketForm] = useState({
    question: '',
    outcomes: '',
    duration: 72
  })

  // Check MetaMask
  const checkMetaMask = () => {
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      showMessage('Please install MetaMask to use this app', 'error')
      return false
    }
    return true
  }

  // Connect wallet
  const connectWallet = async () => {
    if (!checkMetaMask()) return

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setUserAddress(accounts[0])
      showMessage('Wallet connected!', 'success')
      loadMarkets()
    } catch (error: any) {
      showMessage('Failed to connect wallet: ' + error.message, 'error')
    }
  }

  // Get contract address
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/api/config`)
        const config = await response.json()
        if (config.contractAddress) {
          setContractAddress(config.contractAddress)
        }
      } catch (error) {
        console.error('Error fetching config:', error)
      }
    }
    fetchConfig()
  }, [])

  // Auto-connect if already connected
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setUserAddress(accounts[0])
          loadMarkets()
        }
      })
    }
  }, [])

  // Show message
  const showMessage = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  // Load markets
  const loadMarkets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/markets`)
      const data = await response.json()
      
      if (data.success) {
        setMarkets(data.markets)
      }
    } catch (error: any) {
      showMessage('Error loading markets: ' + error.message, 'error')
    }
  }

  // Create market
  const createMarket = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userAddress) {
      showMessage('Please connect your wallet first', 'error')
      return
    }

    if (!checkMetaMask()) return

    const outcomes = marketForm.outcomes.split(',').map(s => s.trim())
    if (outcomes.length < 2) {
      showMessage('At least 2 outcomes are required', 'error')
      return
    }

    if (!contractAddress) {
      showMessage('Contract not deployed. Please deploy contract first.', 'error')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer)

      showMessage('Confirm transaction in MetaMask...', 'success')

      const tx = await contract.createMarket(marketForm.question, outcomes, marketForm.duration)
      showMessage(`Transaction sent! Hash: ${tx.hash}`, 'success')
      showMessage('Waiting for confirmation...', 'success')

      const receipt = await tx.wait()
      
      if (receipt.status === 1) {
        const event = receipt.logs.find((log: any) => {
          try {
            const parsed = contract.interface.parseLog(log)
            return parsed && parsed.name === 'MarketCreated'
          } catch {
            return false
          }
        })
        
        let marketId = null
        if (event) {
          const parsed = contract.interface.parseLog(event)
          marketId = parsed.args.marketId.toString()
        }
        
        showMessage(`Market created successfully! ID: ${marketId || 'pending'}`, 'success')
        setMarketForm({ question: '', outcomes: '', duration: 72 })
        loadMarkets()
      } else {
        showMessage('Transaction failed', 'error')
      }
    } catch (error: any) {
      if (error.code === 4001) {
        showMessage('Transaction rejected by user', 'error')
      } else {
        showMessage('Error: ' + error.message, 'error')
      }
    }
  }

  // Place bet
  const placeBet = async (marketId: number, outcome: number, amount: number) => {
    if (!userAddress) {
      showMessage('Please connect your wallet first', 'error')
      return
    }

    if (!checkMetaMask()) return

    if (!amount || amount < 0.001) {
      showMessage('Minimum bet is 0.001', 'error')
      return
    }

    if (!contractAddress) {
      showMessage('Contract not deployed. Please deploy contract first.', 'error')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer)

      const amountWei = ethers.parseEther(amount.toString())
      showMessage('Confirm transaction in MetaMask...', 'success')

      const tx = await contract.placeBet(marketId, outcome, { value: amountWei })
      showMessage(`Transaction sent! Hash: ${tx.hash}`, 'success')
      showMessage('Waiting for confirmation...', 'success')

      const receipt = await tx.wait()
      
      if (receipt.status === 1) {
        showMessage('Bet placed successfully!', 'success')
        loadMarkets()
      } else {
        showMessage('Transaction failed', 'error')
      }
    } catch (error: any) {
      if (error.code === 4001) {
        showMessage('Transaction rejected by user', 'error')
      } else {
        showMessage('Error: ' + error.message, 'error')
      }
    }
  }

  // AI Generate market
  const generateAIMarket = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai/generate-markets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'cryptocurrency', count: 3 })
      })

      const data = await response.json()
      if (data.success && data.markets.length > 0) {
        const market = data.markets[0]
        setMarketForm({
          question: market.question,
          outcomes: market.outcomes.join(', '),
          duration: market.durationHours || 72
        })
        showMessage('AI generated market suggestion!', 'success')
      }
    } catch (error: any) {
      showMessage('Error generating market: ' + error.message, 'error')
    }
  }

  // Load markets on mount
  useEffect(() => {
    loadMarkets()
  }, [])

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h3" component="h1" gutterBottom>
                🔮 Seer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI-Assisted Market Creation & Resolution
              </Typography>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Wallet:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {userAddress ? `${userAddress.substring(0, 6)}...${userAddress.substring(38)}` : 'Not connected'}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AccountBalanceWallet />}
                  onClick={connectWallet}
                >
                  Connect Wallet
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Create New Market
              </Typography>
              <Box component="form" onSubmit={createMarket} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Question"
                  value={marketForm.question}
                  onChange={(e) => setMarketForm({...marketForm, question: e.target.value})}
                  placeholder="Will Bitcoin reach $100k by end of 2024?"
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Outcomes (comma-separated)"
                  value={marketForm.outcomes}
                  onChange={(e) => setMarketForm({...marketForm, outcomes: e.target.value})}
                  placeholder="Yes, No"
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (hours)"
                  value={marketForm.duration}
                  onChange={(e) => setMarketForm({...marketForm, duration: parseInt(e.target.value)})}
                  inputProps={{ min: 1, max: 168 }}
                  required
                  sx={{ mb: 2 }}
                />
                <Stack direction="row" spacing={2}>
                  <Button type="submit" variant="contained">
                    Create Market
                  </Button>
                  <Button
                    type="button"
                    variant="contained"
                    color="secondary"
                    startIcon={<AutoAwesome />}
                    onClick={generateAIMarket}
                  >
                    Generate with AI
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        <Typography variant="h4" align="center" sx={{ mb: 3, color: 'white' }}>
          Active Markets
        </Typography>

        <Grid container spacing={3}>
          <AnimatePresence>
            {markets.length === 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography align="center" color="text.secondary">
                      Loading markets...
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              markets.map((market, index) => (
                <Grid item xs={12} sm={6} md={4} key={market.market_id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <MarketCard
                      market={market}
                      userAddress={userAddress}
                      onPlaceBet={placeBet}
                    />
                  </motion.div>
                </Grid>
              ))
            )}
          </AnimatePresence>
        </Grid>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  )
}
