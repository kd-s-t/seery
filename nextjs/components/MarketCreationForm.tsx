'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Stack,
} from '@mui/material'
import { AutoAwesome } from '@mui/icons-material'
import { MarketForm } from '@/types'

interface MarketCreationFormProps {
  onSubmit: (form: MarketForm) => void
  onGenerateAI: () => void
  isSubmitting: boolean
  isGeneratingAI?: boolean
  form?: MarketForm
  onFormChange?: (form: MarketForm) => void
}

export default function MarketCreationForm({
  onSubmit,
  onGenerateAI,
  isSubmitting,
  isGeneratingAI = false,
  form: externalForm,
  onFormChange,
}: MarketCreationFormProps) {
  const [internalForm, setInternalForm] = useState<MarketForm>({
    question: '',
    outcomes: '',
    duration: 72,
  })

  const form = externalForm ?? internalForm
  const setForm = onFormChange ?? setInternalForm

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
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
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Question"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="Will Bitcoin reach $100k by end of 2024?"
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Outcomes (comma-separated)"
              value={form.outcomes}
              onChange={(e) => setForm({ ...form, outcomes: e.target.value })}
              placeholder="Yes, No"
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Duration (hours)"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
              inputProps={{ min: 1, max: 168 }}
              required
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || isGeneratingAI}
              >
                {isSubmitting ? 'Processing...' : 'Create Market'}
              </Button>
              <Button
                type="button"
                variant="contained"
                color="secondary"
                startIcon={<AutoAwesome />}
                onClick={onGenerateAI}
                disabled={isGeneratingAI || isSubmitting}
              >
                {isGeneratingAI ? 'Generating...' : 'Generate with AI'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )
}

