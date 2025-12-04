import { useState, useEffect } from 'react'
import { request } from '@/lib/seery/api'

export function useContract() {
  const [contractAddress, setContractAddress] = useState<string | null>(null)
  const [predictionStakingAddress, setPredictionStakingAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadContractAddress = async () => {
      const cleanAddress = (addr: string | null | undefined): string | null => {
        if (!addr) return null
        return addr.trim().replace(/^["']|["']$/g, '')
      }

      // First try to get from build-time env variable
      const buildTimeAddress = cleanAddress(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || null)
      
      if (buildTimeAddress) {
        setPredictionStakingAddress(buildTimeAddress)
        setContractAddress(buildTimeAddress)
        setLoading(false)
        return
      }

      // Fallback: fetch from backend API
      try {
        const config = await request<{
          success: boolean
          predictionStakingAddress?: string
          contractAddress?: string
        }>('/api/config')
        
        if (config.success) {
          const address = cleanAddress(config.contractAddress || config.predictionStakingAddress || null)
          if (address) {
            setPredictionStakingAddress(address)
            setContractAddress(address)
          }
        }
      } catch (error) {
        console.error('Failed to fetch contract address from API:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContractAddress()
  }, [])

  return { 
    contractAddress, 
    predictionStakingAddress,
    loading 
  }
}

