'use client'

import { useState, useEffect } from 'react'
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
  Chip,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import { TrendingUp, TrendingDown, AccountBalance, EmojiEvents, AttachMoney, CheckCircle, Cancel, Schedule, CurrencyBitcoin, CalendarToday, Assessment } from '@mui/icons-material'
import { useWallet } from '@/hooks'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { getUserStats, getUserStakes } from '@/lib/seery'
import { getCryptoLibrary } from '@/lib/coingecko'
import Header from '@/components/Header'

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { address, isConnected, handleConnect, handleDisconnect } = useWallet()
  const { address: wagmiAddress } = useAccount()
  
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userStakes, setUserStakes] = useState<any[]>([])
  const [loadingStakes, setLoadingStakes] = useState(true)
  const [cryptoImageMap, setCryptoImageMap] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    setMounted(true)
    console.log('Page load: Profile')
    
    const loadCryptoImages = async () => {
      try {
        const libraryData = await getCryptoLibrary()
        if (libraryData.success && libraryData.library) {
          const imageMap = new Map<string, string>()
          libraryData.library.forEach((crypto: any) => {
            if (crypto.image) {
              imageMap.set(crypto.id.toLowerCase(), crypto.image)
              imageMap.set(crypto.symbol.toLowerCase(), crypto.image)
            }
          })
          setCryptoImageMap(imageMap)
        }
      } catch (err) {
        console.error('Error loading crypto images:', err)
      }
    }
    
    loadCryptoImages()
  }, [])

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  useEffect(() => {
    let cancelled = false

    const fetchStats = async () => {
      if (!wagmiAddress) {
        if (!cancelled) {
          setLoading(false)
        }
        return
      }

      try {
        if (!cancelled) {
          setLoading(true)
          setError(null)
        }

        const data = await getUserStats(wagmiAddress)
        console.log('Response: getUserStats', data)
        
        if (!cancelled && data.success && data.stats) {
          setStats({
            wins: BigInt(data.stats.wins),
            losses: BigInt(data.stats.losses),
            totalStaked: BigInt(data.stats.totalStaked),
            totalWon: BigInt(data.stats.totalWon),
            totalLost: BigInt(data.stats.totalLost),
            winRate: BigInt(data.stats.winRate)
          })
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error fetching user stats:', err)
          setError(err.message || 'Failed to fetch user stats')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (isConnected && wagmiAddress) {
      fetchStats()
    }

    return () => {
      cancelled = true
    }
  }, [wagmiAddress, isConnected])

  useEffect(() => {
    let cancelled = false

    const fetchUserStakes = async () => {
      if (!wagmiAddress) {
        if (!cancelled) {
          setLoadingStakes(false)
        }
        return
      }

      try {
        if (!cancelled) {
          setLoadingStakes(true)
        }
        
        const apiData = await getUserStakes(wagmiAddress)
        console.log('Response: getUserStakes API', apiData)
        
        if (cancelled) return
        
        if (!apiData.success || !apiData.stakes) {
          setUserStakes([])
          if (!cancelled) {
            setLoadingStakes(false)
          }
          return
        }

        if (!cancelled) {
          setUserStakes(apiData.stakes)
        }
      } catch (err: any) {
        console.error('Error fetching user stakes:', err)
      } finally {
        if (!cancelled) {
          setLoadingStakes(false)
        }
      }
    }

    if (isConnected && wagmiAddress) {
      fetchUserStakes()
    }

    return () => {
      cancelled = true
    }
  }, [wagmiAddress, isConnected])

  if (!mounted || !isConnected) {
    return null
  }

  const winRatePercent = stats ? (Number(stats.winRate) / 100).toFixed(2) : '0.00'
  const netProfit = stats ? Number(formatEther(stats.totalWon)) - Number(formatEther(stats.totalLost)) : 0

  return (
    <Box sx={{ minHeight: '100vh', py: 4, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Header
          address={address}
          isConnected={isConnected}
          isConnecting={false}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />

        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mt: 4, mb: 2 }}>
          Profile
        </Typography>


        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : stats ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Win/Loss Record
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUp color="success" />
                        <Typography>Wins</Typography>
                      </Box>
                      <Chip label={stats.wins.toString()} color="success" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingDown color="error" />
                        <Typography>Losses</Typography>
                      </Box>
                      <Chip label={stats.losses.toString()} color="error" />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEvents color="primary" />
                        <Typography fontWeight="bold">Win Rate</Typography>
                      </Box>
                      <Chip 
                        label={`${winRatePercent}%`} 
                        color={Number(winRatePercent) >= 50 ? 'success' : 'default'}
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Financial Summary
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountBalance color="primary" />
                        <Typography>Total Staked</Typography>
                      </Box>
                      <Typography fontWeight="bold">
                        {formatEther(stats.totalStaked)} BNB
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUp color="success" />
                        <Typography>Total Won</Typography>
                      </Box>
                      <Typography fontWeight="bold" color="success.main">
                        {formatEther(stats.totalWon)} BNB
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingDown color="error" />
                        <Typography>Total Lost</Typography>
                      </Box>
                      <Typography fontWeight="bold" color="error.main">
                        {formatEther(stats.totalLost)} BNB
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoney color={netProfit >= 0 ? 'success' : 'error'} />
                        <Typography fontWeight="bold">Net Profit/Loss</Typography>
                      </Box>
                      <Typography 
                        fontWeight="bold" 
                        color={netProfit >= 0 ? 'success.main' : 'error.main'}
                      >
                        {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(4)} BNB
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info">
            No stats available. Start staking to see your profile statistics!
          </Alert>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            My Stakes
          </Typography>
          
          {loadingStakes ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : userStakes.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No stakes found. Start staking to see your activity here!
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Crypto</strong></TableCell>
                    <TableCell><strong>Direction</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>Predicted</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Created</strong></TableCell>
                    <TableCell><strong>Result</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userStakes.map((stake, index) => {
                    const getStatus = () => {
                      if (stake.isResolved) {
                        return stake.rewarded ? 'Won' : 'Lost'
                      }
                      if (stake.isExpired) {
                        return 'Expired'
                      }
                      return 'Active'
                    }

                    const getStatusColor = () => {
                      if (stake.isResolved) {
                        return stake.rewarded ? 'success' : 'error'
                      }
                      if (stake.isExpired) {
                        return 'warning'
                      }
                      return 'info'
                    }

                    const getStatusIcon = () => {
                      if (stake.isResolved) {
                        return stake.rewarded ? <CheckCircle /> : <Cancel />
                      }
                      if (stake.isExpired) {
                        return <Schedule />
                      }
                      return <Schedule />
                    }

                    return (
                      <TableRow key={`${stake.stakeId}-${stake.stakerId}-${index}`}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {(() => {
                              const cryptoIdLower = stake.cryptoId.toLowerCase()
                              const imageUrl = cryptoImageMap.get(cryptoIdLower) || cryptoImageMap.get(cryptoIdLower.replace(/-/g, ''))
                              
                              if (imageUrl) {
                                return (
                                  <Box
                                    component="img"
                                    src={imageUrl}
                                    alt={stake.cryptoId}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: '50%',
                                      objectFit: 'cover',
                                      flexShrink: 0
                                    }}
                                  />
                                )
                              }
                              return <CurrencyBitcoin fontSize="small" />
                            })()}
                            <Typography variant="body2" fontWeight="bold">
                              {stake.cryptoId.toUpperCase()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={stake.direction.toUpperCase()}
                            color={stake.direction === 'up' ? 'success' : 'error'}
                            size="small"
                            icon={stake.direction === 'up' ? <TrendingUp /> : <TrendingDown />}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {parseFloat(stake.amount).toFixed(4)} BNB
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            ${parseFloat(formatEther(BigInt(stake.predictedPrice))).toFixed(6)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({stake.percentChange > 0 ? '+' : ''}{stake.percentChange.toFixed(2)}%)
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatus()}
                            color={getStatusColor() as any}
                            size="small"
                            icon={getStatusIcon()}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(stake.createdAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(stake.createdAt).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {stake.isResolved && stake.actualPrice ? (
                            <Box>
                              <Typography variant="body2">
                                ${parseFloat(stake.actualPrice).toFixed(2)}
                              </Typography>
                              {stake.predictionCorrect !== null && stake.predictionCorrect !== undefined && (
                                <Chip
                                  label={stake.predictionCorrect ? 'Correct' : 'Incorrect'}
                                  color={stake.predictionCorrect ? 'success' : 'error'}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Pending
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Container>
    </Box>
  )
}

