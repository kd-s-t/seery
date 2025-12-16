'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Link
} from '@mui/material'
import { Assessment, TrendingUp, CheckCircle, People, EmojiEvents } from '@mui/icons-material'
import { usePublicClient } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { useWallet } from '@/hooks'
import Header from '@/components/Header'
import { useAnalytics, formatTotalStaked, calculateAccuracyRate } from '../index'

const CONTRACT_ADDRESS = '0x42067558c48f8c74c819461a9105cd47b90b098f' as `0x${string}`
const BSCSCAN_URL = `https://testnet.bscscan.com/address/${CONTRACT_ADDRESS}`

export default function AnalyticsPage() {
  const router = useRouter()
  const { address, isConnected } = useWallet()
  const { analytics, loading, error, mounted, isAdmin } = useAnalytics()
  const publicClient = usePublicClient({ chainId: bscTestnet.id })
  const [contractBalance, setContractBalance] = useState<string | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)

  useEffect(() => {
    if (mounted && !isConnected) {
      router.push('/')
      return
    }

    if (mounted && !isAdmin) {
      router.push('/')
      return
    }
  }, [mounted, isConnected, isAdmin, router])

  useEffect(() => {
    const fetchContractBalance = async () => {
      if (!publicClient) {
        setBalanceError('Public client not available')
        setBalanceLoading(false)
        return
      }

      setBalanceLoading(true)
      setBalanceError(null)
      try {
        const balance = await publicClient.getBalance({
          address: CONTRACT_ADDRESS,
        })
        const balanceInBNB = (Number(balance) / 1e18).toFixed(6)
        setContractBalance(balanceInBNB)
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fetch contract balance'
        setBalanceError(errorMessage)
        console.error('Error fetching contract balance:', err)
      } finally {
        setBalanceLoading(false)
      }
    }

    if (mounted && publicClient) {
      fetchContractBalance()
      const interval = setInterval(fetchContractBalance, 30000)
      return () => clearInterval(interval)
    }
  }, [mounted, publicClient])

  if (!mounted || !isConnected) {
    return null
  }

  if (!isAdmin) {
    return null
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Header
          address={address}
          isConnected={isConnected}
          isConnecting={false}
          onConnect={() => {}}
          onDisconnect={() => {}}
        />

        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mt: 4, mb: 2 }}>
          Analytics Dashboard
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && analytics && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                        {analytics.ongoingStakes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ongoing Stakes
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                    <Box>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                        {analytics.resolvedStakes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Resolved Stakes
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <People sx={{ fontSize: 40, color: 'info.main' }} />
                    <Box>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                        {analytics.uniqueStakers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Unique Stakers
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <EmojiEvents sx={{ fontSize: 40, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                        {analytics.correctPredictions} / {analytics.resolvedStakes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Correct Predictions
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Summary
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Stakes
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {analytics.totalStakes}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount Staked
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {formatTotalStaked(analytics.totalAmountStaked)} BNB
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Contract Balance
                        </Typography>
                        <Link
                          href={BSCSCAN_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textDecoration: 'none', fontSize: '0.875rem' }}
                        >
                          (View on BSCScan)
                        </Link>
                      </Stack>
                      {balanceLoading ? (
                        <CircularProgress size={20} sx={{ mt: 1 }} />
                      ) : balanceError ? (
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                          Error
                        </Typography>
                      ) : (
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {contractBalance ? `${contractBalance} BNB` : '--'}
                        </Typography>
                      )}
                    </Grid>
                    {analytics.resolvedStakes > 0 && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Accuracy Rate
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {calculateAccuracyRate(analytics)}%
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  )
}

