function getApiBaseUrl(): string {
  const allEnv = process.env
  const publicEnv = Object.keys(allEnv)
    .filter(key => key.startsWith('NEXT_PUBLIC_'))
    .reduce((obj, key) => {
      obj[key] = allEnv[key]
      return obj
    }, {} as Record<string, string | undefined>)
  console.log('All NEXT_PUBLIC_* env vars:', publicEnv)
  console.log('All process.env:', allEnv)
  const envValue = process.env.NEXT_PUBLIC_SEERY_BACKEND_DOMAIN || ''
  console.log('NEXT_PUBLIC_SEERY_BACKEND_DOMAIN:', envValue)
  
  if (!envValue) {
    return ''
  }
  
  if (envValue.endsWith('/api')) {
    return envValue.slice(0, -4)
  }
  
  return envValue
}

const API_BASE_URL = getApiBaseUrl()
console.log('API_BASE_URL:', API_BASE_URL)

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  console.log('Fetching URL:', url)
  const response = await fetch(url, options)
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}
