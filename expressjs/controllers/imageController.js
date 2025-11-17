const s3Images = require('../lib/s3/images')
const axios = require('axios')

const getCoinImage = async (req, res) => {
  const { cryptoId, size = 'small' } = req.query
  
  if (!cryptoId) {
    return res.status(400).json({
      success: false,
      error: 'cryptoId is required'
    })
  }
  
  try {
    const imageUrl = await s3Images.getCoinImageUrl(cryptoId, size)
    
    try {
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'stream',
        timeout: 10000
      })
      
      res.setHeader('Content-Type', imageResponse.headers['content-type'] || 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=31536000')
      imageResponse.data.pipe(res)
    } catch (proxyError) {
      const fallbackUrl = s3Images.getCoinGeckoImageUrl(cryptoId, size)
      const fallbackResponse = await axios.get(fallbackUrl, {
        responseType: 'stream',
        timeout: 10000
      })
      
      res.setHeader('Content-Type', fallbackResponse.headers['content-type'] || 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=31536000')
      fallbackResponse.data.pipe(res)
    }
  } catch (error) {
    console.error('Error getting coin image:', error)
    const fallbackUrl = s3Images.getCoinGeckoImageUrl(cryptoId, size)
    
    try {
      const fallbackResponse = await axios.get(fallbackUrl, {
        responseType: 'stream',
        timeout: 10000
      })
      
      res.setHeader('Content-Type', fallbackResponse.headers['content-type'] || 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=31536000')
      fallbackResponse.data.pipe(res)
    } catch (finalError) {
      res.status(404).json({
        success: false,
        error: 'Image not found'
      })
    }
  }
}

module.exports = {
  getCoinImage
}

