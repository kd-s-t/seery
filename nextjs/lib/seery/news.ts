import { request } from './api'

export async function getTrendingNews(topic?: string, count?: number) {
  const params = new URLSearchParams()
  if (topic) params.append('topic', topic)
  if (count) params.append('count', count.toString())
  const query = params.toString()
  return request<{
    success: boolean
    news: any[]
    count?: number
    timestamp?: string
  }>(`/api/news/trending${query ? `?${query}` : ''}`)
}

