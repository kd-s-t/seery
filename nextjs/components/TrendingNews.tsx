'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material'
import { Article, TrendingUp } from '@mui/icons-material'

import { getTrendingNews } from '@/lib/seery'

interface NewsItem {
  title: string
  summary: string
  date?: string
  source?: string
}

export default function TrendingNews() {
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
      const cacheKey = 'news_trending_cache_trending'
      const cachedData = localStorage.getItem(cacheKey)
      
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData)
          const cacheAge = Date.now() - timestamp
          const CACHE_TTL = 86400000
          
          if (cacheAge < CACHE_TTL) {
            setNews(data)
            setLoading(false)
            return
          }
        } catch (e) {
        }
      }
      
      setLoading(true)
      setError(null)
      try {
        const data = await getTrendingNews('cryptocurrency', 5)
        
        if (data.success && data.news) {
          console.log('List of news:', data.news.length, 'items')
          setNews(data.news)
          localStorage.setItem(cacheKey, JSON.stringify({
            data: data.news,
            timestamp: Date.now()
          }))
        } else {
          setError('Failed to load news')
        }
      } catch (err: any) {
        setError('Error loading news: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
    const interval = setInterval(fetchNews, 24 * 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [mounted])

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error || news.length === 0) {
    return null
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <TrendingUp color="primary" />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Trending Crypto News
          </Typography>
        </Stack>
        
        <Stack spacing={2}>
          {news.map((item, index) => (
            <Box
              key={index}
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1 }}>
                <Article sx={{ color: 'text.secondary', fontSize: 20, mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {item.summary}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {item.source && (
                      <Chip
                        label={item.source}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                    {item.date && (
                      <Typography variant="caption" color="text.secondary">
                        {item.date}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

