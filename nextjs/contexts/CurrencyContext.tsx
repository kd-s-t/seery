'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Currency = 'usd' | 'php'

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  getCurrencySymbol: () => string
  formatPrice: (price: number) => string
  convertPrice: (usdPrice: number) => number
  usdToPhpRate: number | null
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const EXCHANGE_RATE_CACHE_KEY = 'usd_php_rate'
const EXCHANGE_RATE_CACHE_TTL = 3600000

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('usd')
  const [usdToPhpRate, setUsdToPhpRate] = useState<number | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('currency') as Currency
    if (saved === 'usd' || saved === 'php') {
      setCurrencyState(saved)
    }
  }, [])

  useEffect(() => {
    const loadExchangeRate = async () => {
      const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY)
      if (cached) {
        try {
          const { rate, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < EXCHANGE_RATE_CACHE_TTL) {
            setUsdToPhpRate(rate)
            return
          }
        } catch (e) {
          // Invalid cache, fetch new
        }
      }

      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        const data = await response.json()
        const rate = data?.rates?.PHP || 56.0
        
        if (rate && !isNaN(rate)) {
          setUsdToPhpRate(rate)
          localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify({
            rate,
            timestamp: Date.now()
          }))
        }
      } catch (error) {
        console.warn('Failed to fetch exchange rate, using fallback')
        setUsdToPhpRate(56.0)
      }
    }

    loadExchangeRate()
  }, [])

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency)
    localStorage.setItem('currency', newCurrency)
  }

  const getCurrencySymbol = () => {
    return currency === 'usd' ? '$' : '₱'
  }

  const convertPrice = (usdPrice: number): number => {
    if (currency === 'usd' || !usdToPhpRate) {
      return usdPrice
    }
    return usdPrice * usdToPhpRate
  }

  const formatPrice = (price: number) => {
    const convertedPrice = convertPrice(price)
    const symbol = getCurrencySymbol()
    if (convertedPrice >= 1) {
      return `${symbol}${convertedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return `${symbol}${convertedPrice.toFixed(6)}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, getCurrencySymbol, formatPrice, convertPrice, usdToPhpRate }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

