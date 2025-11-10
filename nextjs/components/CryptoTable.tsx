'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'
import { getCryptoPrices, type CryptoPrice } from '@/lib/coingecko'

export default function CryptoTable() {
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCryptoData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCryptoPrices()
      
      if (data.success) {
        setCryptos(data.cryptos)
      } else {
        setError(data.error || 'Failed to load crypto data')
      }
    } catch (err: any) {
      setError('Error loading crypto data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCryptoData()
    const interval = setInterval(fetchCryptoData, 60000)
    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return `$${price.toFixed(6)}`
  }

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(2)}%`
  }

  if (loading && cryptos.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && cryptos.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" align="center" sx={{ mb: 3, color: 'white' }}>
        Crypto Prices & AI Predictions
      </Typography>
      
      <TableContainer component={Paper} sx={{ bgcolor: 'background.paper' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Symbol</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell align="right"><strong>Current Price</strong></TableCell>
              <TableCell align="right"><strong>24h Change</strong></TableCell>
              <TableCell align="right"><strong>AI Suggestion</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cryptos.map((crypto) => (
              <TableRow key={crypto.id} hover>
                <TableCell>
                  <Typography variant="body1" fontWeight="bold">
                    {crypto.symbol}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {crypto.name}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight="medium">
                    {formatPrice(crypto.price)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    {crypto.change24h >= 0 ? (
                      <TrendingUp sx={{ color: 'success.main', fontSize: 18 }} />
                    ) : (
                      <TrendingDown sx={{ color: 'error.main', fontSize: 18 }} />
                    )}
                    <Typography
                      variant="body1"
                      sx={{
                        color: crypto.change24h >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 'medium'
                      }}
                    >
                      {formatPercent(crypto.change24h)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {crypto.suggestion && crypto.suggestionPercent !== null ? (
                    <Box>
                      <Chip
                        label={`${crypto.suggestion === 'up' ? '↑' : '↓'} ${formatPercent(crypto.suggestionPercent)}`}
                        color={crypto.suggestion === 'up' ? 'success' : 'error'}
                        size="small"
                        sx={{ mb: 0.5 }}
                      />
                      {crypto.reasoning && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {crypto.reasoning}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {crypto.reasoning || 'No suggestion available'}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

