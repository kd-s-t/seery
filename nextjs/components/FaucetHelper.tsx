'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, Typography, Button, Box, Stack, Alert, Link, Chip } from '@mui/material'
import { AccountBalance, OpenInNew, ContentCopy, CheckCircle } from '@mui/icons-material'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useNetwork } from '@/hooks/useNetwork'

export default function FaucetHelper() {
  const { address } = useAccount()
  const { isTestnet } = useNetwork()
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!address || !isTestnet) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent>
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <AccountBalance />
              <Typography variant="h6" fontWeight="bold">
                Get Testnet BNB (tBNB)
              </Typography>
            </Box>
            
            <Alert severity="info" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'inherit' }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Need testnet BNB? Most faucets require mainnet balance to use.
              </Typography>
            </Alert>

            <Box>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Your Wallet Address:
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    bgcolor: 'rgba(0,0,0,0.2)',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    flex: 1,
                    wordBreak: 'break-all'
                  }}
                >
                  {address}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={copyAddress}
                  startIcon={copied ? <CheckCircle /> : <ContentCopy />}
                  sx={{ 
                    color: 'inherit', 
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.8)' }
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </Stack>
            </Box>

            <Alert severity="warning" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'inherit', mt: 1 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Most testnet faucets require mainnet balance to use. 
                To get testnet BNB, you&apos;ll need to either:
                <br />
                • Get some BNB on mainnet first (buy from an exchange)
                <br />
                • Ask someone with mainnet BNB to send you testnet tokens
                <br />
                • Use a local Hardhat node for development (no real tokens needed)
              </Typography>
            </Alert>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  )
}

