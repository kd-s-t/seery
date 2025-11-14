'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Autocomplete,
  Stack,
  Typography,
} from '@mui/material'
import { Search, Clear, Refresh } from '@mui/icons-material'
import { getCryptoLibrary, searchCrypto, type CryptoLibraryItem } from '@/lib/coingecko'

interface CryptoFiltersProps {
  selectedCryptos: string[]
  onCryptosChange: (cryptos: string[]) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh?: () => void
}

export default function CryptoFilters({
  selectedCryptos,
  onCryptosChange,
  searchQuery,
  onSearchChange,
  onRefresh,
}: CryptoFiltersProps) {
  const [searchInput, setSearchInput] = useState('')
  const [cryptoLibrary, setCryptoLibrary] = useState<CryptoLibraryItem[]>([])
  const [searchResults, setSearchResults] = useState<CryptoLibraryItem[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [libraryLoading, setLibraryLoading] = useState(true)

  useEffect(() => {
    const loadLibrary = async () => {
      setLibraryLoading(true)
      try {
        const data = await getCryptoLibrary()
        if (data.success) {
          setCryptoLibrary(data.library || [])
        }
      } catch (error) {
        console.error('Error loading crypto library:', error)
      } finally {
        setLibraryLoading(false)
      }
    }
    loadLibrary()
  }, [])

  const handleSearchCrypto = async (query: string) => {
    if (!query || query.length < 1) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const data = await searchCrypto(query)
      if (data.success && data.results) {
        const formatted = data.results.map((coin: any) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          marketCap: 0
        }))
        setSearchResults(formatted)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching crypto:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const autocompleteOptions = useMemo((): CryptoLibraryItem[] => {
    if (searchInput.length >= 2 && searchResults.length > 0) {
      return searchResults
    }
    if (searchInput.length >= 1) {
      const query = searchInput.toLowerCase()
      return cryptoLibrary.filter(crypto => 
        crypto.name.toLowerCase().includes(query) ||
        crypto.symbol.toLowerCase().includes(query) ||
        crypto.id.toLowerCase().includes(query)
      ).slice(0, 20)
    }
    return cryptoLibrary.slice(0, 20)
  }, [searchInput, searchResults, cryptoLibrary])

  const handleAddCrypto = (value: string | CryptoLibraryItem | null) => {
    if (!value) return

    let cryptoId: string
    
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase()
      if (trimmed.length === 0) return
      
      const found = cryptoLibrary.find(c => 
        c.id.toLowerCase() === trimmed ||
        c.symbol.toLowerCase() === trimmed ||
        c.name.toLowerCase() === trimmed
      )
      
      if (found) {
        cryptoId = found.id
      } else {
        cryptoId = trimmed
      }
    } else {
      cryptoId = value.id
    }

    if (cryptoId && !selectedCryptos.includes(cryptoId)) {
      onCryptosChange([...selectedCryptos, cryptoId])
      setSearchInput('')
      setSearchResults([])
    }
  }

  const handleRemoveCrypto = (cryptoId: string) => {
    onCryptosChange(selectedCryptos.filter(id => id !== cryptoId))
  }

  const handleClearFilters = () => {
    onCryptosChange([])
    onSearchChange('')
    setSearchInput('')
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filters
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              {onRefresh && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={onRefresh}
                >
                  Refresh
                </Button>
              )}
              {(selectedCryptos.length > 0 || searchQuery) && (
                <Button
                  size="small"
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Autocomplete<CryptoLibraryItem, false, true, true>
              freeSolo
              options={autocompleteOptions}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option
                return `${option.name} (${option.symbol})`
              }}
              loading={searchLoading || libraryLoading}
              inputValue={searchInput}
              onInputChange={(_, newValue) => {
                setSearchInput(newValue)
                if (newValue.length >= 2) {
                  handleSearchCrypto(newValue)
                } else {
                  setSearchResults([])
                }
              }}
              onChange={(_, value) => {
                handleAddCrypto(value)
              }}
              filterOptions={(options: CryptoLibraryItem[], params) => {
                const query = params.inputValue.toLowerCase()
                return options.filter((option: CryptoLibraryItem) => 
                  option.name.toLowerCase().includes(query) ||
                  option.symbol.toLowerCase().includes(query) ||
                  option.id.toLowerCase().includes(query)
                ).slice(0, 20)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Add Crypto"
                  placeholder="Type crypto name, symbol, or ID..."
                  size="small"
                  helperText="Type to search or enter crypto ID directly"
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {option.name} ({option.symbol})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {option.id}
                    </Typography>
                  </Box>
                </Box>
              )}
              sx={{ flex: 1, minWidth: 200 }}
            />

            <TextField
              label="Filter Results"
              placeholder="Search in name, symbol, or AI reasoning..."
              size="small"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              helperText="Filters displayed results (client-side)"
              sx={{ flex: 1, minWidth: 200 }}
            />
          </Box>

          {selectedCryptos.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Tracking {selectedCryptos.length} crypto{selectedCryptos.length !== 1 ? 's' : ''}:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedCryptos.map((cryptoId) => (
                  <Chip
                    key={cryptoId}
                    label={cryptoId}
                    onDelete={() => handleRemoveCrypto(cryptoId)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

