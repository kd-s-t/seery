'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, Typography, Button, Box, Stack, Alert, Chip } from '@mui/material'
import { AccountBalanceWallet, SwapHoriz } from '@mui/icons-material'
import { useNetwork } from '@/hooks/useNetwork'

interface WalletConnectionProps {
  address: string | undefined
  isConnected: boolean
  isConnecting: boolean
  onConnect: () => void
}

export default function WalletConnection({
  address,
  isConnected,
  isConnecting,
  onConnect,
}: WalletConnectionProps) {
  const { networkName, isTestnet, isMainnet, isSwitching, switchToTestnet } = useNetwork()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only showing address after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {mounted && isConnected && !isTestnet && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={switchToTestnet}
                disabled={isSwitching}
                startIcon={<SwapHoriz />}
              >
                {isSwitching ? 'Switching...' : 'Switch to Testnet'}
              </Button>
            }
          >
            <strong>Wrong Network!</strong> This app only works on <strong>BNB Testnet</strong>. Please switch to testnet.
          </Alert>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Wallet:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {mounted && address ? `${address.substring(0, 6)}...${address.substring(38)}` : 'Not connected'}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AccountBalanceWallet />}
                  onClick={onConnect}
                  disabled={mounted && (isConnected || isConnecting)}
                >
                  {mounted && isConnecting ? 'Connecting...' : mounted && isConnected ? 'Connected' : 'Connect Wallet'}
                </Button>
              </Stack>
              {mounted && isConnected && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Network:
                  </Typography>
                  <Chip
                    label={networkName}
                    color={isTestnet ? 'success' : isMainnet ? 'warning' : 'default'}
                    size="small"
                  />
                  {!isTestnet && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={switchToTestnet}
                      disabled={isSwitching}
                      startIcon={<SwapHoriz />}
                    >
                      {isSwitching ? 'Switching...' : 'Switch to Testnet'}
                    </Button>
                  )}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}

