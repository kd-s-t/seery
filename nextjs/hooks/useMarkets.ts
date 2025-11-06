import { useState, useEffect, useCallback } from 'react'
import { Market } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3016'

export function useMarkets(isConnected: boolean) {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMarkets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/markets`)
      const data = await response.json()
      
      if (data.success) {
        setMarkets(data.markets)
      } else {
        setError('Failed to load markets')
      }
    } catch (err: any) {
      setError('Error loading markets: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMarkets()
  }, [loadMarkets])

  useEffect(() => {
    if (isConnected) {
      loadMarkets()
    }
  }, [isConnected, loadMarkets])

  return { markets, loading, error, reloadMarkets: loadMarkets }
}

