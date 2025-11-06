import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3016'

export function useContract() {
  const [contractAddress, setContractAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/api/config`)
        const config = await response.json()
        if (config.contractAddress) {
          setContractAddress(config.contractAddress)
        }
      } catch (error) {
        console.error('Error fetching config:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  return { contractAddress, loading }
}

