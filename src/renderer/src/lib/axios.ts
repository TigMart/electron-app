import axios from 'axios'

let backendUrl: string | null = null

async function getBackendUrl(): Promise<string> {
  if (!backendUrl) {
    backendUrl = await window.api.getBackendUrl()
  }
  return backendUrl
}

// Create axios instance
const api = axios.create({
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Set the base URL dynamically
    const url = await getBackendUrl()
    config.baseURL = url

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorMessage = error.response.data?.error || error.response.statusText
      throw new Error(errorMessage)
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server. Please check your connection.')
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(error.message || 'An unexpected error occurred')
    }
  }
)

export default api
