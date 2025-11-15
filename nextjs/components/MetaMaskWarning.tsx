'use client'

import { Alert, Link } from '@mui/material'
import { AccountBalanceWallet } from '@mui/icons-material'

interface MetaMaskWarningProps {
  show: boolean
  onClose: () => void
}

export default function MetaMaskWarning({ show, onClose }: MetaMaskWarningProps) {
  if (!show) return null

  return (
    <Alert
      severity="error"
      onClose={onClose}
      sx={{ mb: 3 }}
      icon={<AccountBalanceWallet />}
    >
      MetaMask not found. Please{' '}
      <Link href="https://metamask.io/" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 'bold' }}>
        install MetaMask
      </Link>
      .
    </Alert>
  )
}

