import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getCryptoPriceDirect } from '@/lib/coingecko/prices'

interface PriceState {
  bnbPrice: number | null
  lastFetched: number | null
  isLoading: boolean
  error: string | null
}

const initialState: PriceState = {
  bnbPrice: null,
  lastFetched: null,
  isLoading: false,
  error: null,
}

const PRICE_CACHE_TTL = 300000

export const fetchBnbPrice = createAsyncThunk(
  'price/fetchBnbPrice',
  async (_, { rejectWithValue }) => {
    try {
      const price = await getCryptoPriceDirect('binancecoin', 'usd')
      if (price === null) {
        return rejectWithValue('Failed to fetch BNB price')
      }
      return price
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch BNB price')
    }
  }
)

const priceSlice = createSlice({
  name: 'price',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBnbPrice.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchBnbPrice.fulfilled, (state, action: PayloadAction<number>) => {
        state.isLoading = false
        state.bnbPrice = action.payload
        state.lastFetched = Date.now()
        state.error = null
      })
      .addCase(fetchBnbPrice.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const shouldFetchPrice = (state: PriceState): boolean => {
  if (!state.bnbPrice || !state.lastFetched) {
    return true
  }
  const now = Date.now()
  return now - state.lastFetched > PRICE_CACHE_TTL
}

export default priceSlice.reducer

