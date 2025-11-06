'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, Typography } from '@mui/material'

export default function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h3" component="h1" gutterBottom>
            Seer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-Assisted Market Creation & Resolution
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  )
}

