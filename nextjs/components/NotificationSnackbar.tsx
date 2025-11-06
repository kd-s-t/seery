'use client'

import { Snackbar, Alert } from '@mui/material'
import { SnackbarState } from '@/types'

interface NotificationSnackbarProps {
  snackbar: SnackbarState
  onClose: () => void
}

export default function NotificationSnackbar({
  snackbar,
  onClose,
}: NotificationSnackbarProps) {
  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={snackbar.severity}
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  )
}

