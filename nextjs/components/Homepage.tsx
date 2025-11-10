'use client'

import { useState, useEffect } from 'react'
import { Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3016'

interface NewsItem {
  title: string
  summary: string
  date?: string
  source?: string
  url?: string
  sentiment?: string
  image?: string | null
}

function getCryptoImageUrl(item: NewsItem, index: number): string {
  if (item.image) {
    return item.image
  }
  const keywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'defi', 'nft', 'solana', 'cardano', 'polkadot']
  const lowerTitle = item.title.toLowerCase()
  const matchedKeyword = keywords.find(k => lowerTitle.includes(k)) || 'cryptocurrency'
  const imageId = (index * 100) % 1000
  return `https://source.unsplash.com/800x600/?${matchedKeyword},blockchain&sig=${imageId}`
}

export default function Homepage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const fetchNews = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_URL}/api/news/trending`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success && data.news && Array.isArray(data.news) && data.news.length > 0) {
          setNews(data.news)
        } else {
          setError(data.message || 'No news available')
          setNews([])
        }
      } catch (err: any) {
        console.error('Error fetching news:', err)
        setError('Error loading news: ' + err.message)
        setNews([])
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [mounted])

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          News feed temporarily unavailable
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We're having trouble loading the latest crypto news. Please try again later.
        </Typography>
      </Box>
    )
  }

  if (news.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No news available at the moment
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Check back soon for the latest cryptocurrency updates.
        </Typography>
      </Box>
    )
  }

  const rowPatterns = [
    [{ xs: 12, md: 8 }, { xs: 12, md: 4 }],
    [{ xs: 12, md: 4 }, { xs: 12, md: 8 }],
    [{ xs: 12, md: 6 }, { xs: 12, md: 6 }],
  ]

  const getGridSizes = () => {
    const sizes: Array<{ xs: number; md: number }> = []
    let itemIndex = 0
    const recentPatterns: number[] = []
    const minDistance = 2
    
    while (itemIndex < news.length) {
      let patternIndex
      let attempts = 0
      
      do {
        const seed = itemIndex * 7 + (news[itemIndex]?.title?.charCodeAt(0) || 0) + attempts
        patternIndex = seed % rowPatterns.length
        attempts++
      } while (recentPatterns.includes(patternIndex) && attempts < 20)
      
      const pattern = rowPatterns[patternIndex]
      recentPatterns.push(patternIndex)
      if (recentPatterns.length > minDistance) {
        recentPatterns.shift()
      }
      
      pattern.forEach((size) => {
        if (itemIndex < news.length) {
          sizes.push(size)
          itemIndex++
        }
      })
    }
    
    return sizes
  }

  const gridSizes = getGridSizes()

  return (
    <Box>
      <Grid container spacing={2}>
        {news.map((item, index) => {
        const size = gridSizes[index] || { xs: 12, md: 12 }
        const imageUrl = getCryptoImageUrl(item, index)
        
        return (
          <Grid item {...size} key={index}>
            <Card
              component={item.url ? 'a' : 'div'}
              href={item.url || undefined}
              target={item.url ? '_blank' : undefined}
              rel={item.url ? 'noopener noreferrer' : undefined}
              sx={{
                height: '100%',
                minHeight: 300,
                position: 'relative',
                overflow: 'hidden',
                cursor: item.url ? 'pointer' : 'default',
                textDecoration: 'none',
                '&:hover': {
                  transform: item.url ? 'scale(1.02)' : 'none',
                  transition: 'transform 0.3s ease-in-out',
                },
              }}
            >
              {imageUrl && (
              <Box
                  component="img"
                  src={imageUrl}
                  alt={item.title}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  opacity: 0.3,
                  zIndex: 0,
                }}
              />
              )}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
                  zIndex: 1,
                }}
              />
              <CardContent
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  color: 'white',
                  minHeight: 300,
                }}
              >
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 2,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.summary}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  {item.source && (
                    <Typography 
                      component="span"
                      variant="caption" 
                      sx={{ 
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                      }}
                    >
                      {item.source}
                    </Typography>
                  )}
                  {item.date && (
                    <Typography variant="caption" sx={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      {item.date}
                    </Typography>
                  )}
                  {item.url && (
                    <Typography variant="caption" sx={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)', color: 'primary.light' }}>
                      Read more →
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )
      })}
      </Grid>
    </Box>
  )
}

