import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  me: () => api.get('/auth/me'),
  updateMe: (data: { full_name?: string; avatar_url?: string }) => api.put('/auth/me', null, { params: data }),
  changePassword: (current_password: string, new_password: string) =>
    api.post('/auth/change-password', { current_password, new_password }),
}

// Videos
export const videosApi = {
  generate: (data: VideoGenerateParams) => api.post('/videos/generate', data),
  list: (skip = 0, limit = 20) => api.get('/videos/', { params: { skip, limit } }),
  get: (id: number) => api.get(`/videos/${id}`),
  status: (id: number) => api.get(`/videos/${id}/status`),
  delete: (id: number) => api.delete(`/videos/${id}`),
  download: (id: number) => api.post(`/videos/${id}/download`),
  options: () => api.get('/videos/options'),
}

// Payments
export const paymentsApi = {
  plans: () => api.get('/payments/plans'),
  initiate: (plan: string, currency = 'XOF') => api.post('/payments/initiate', { plan, currency }),
  verify: (transaction_id: string) => api.post('/payments/verify', { transaction_id }),
  history: () => api.get('/payments/history'),
  demoComplete: (transaction_id: string) => api.post(`/payments/demo-complete/${transaction_id}`),
}

// Types
export interface VideoGenerateParams {
  topic: string
  language: string
  style: string
  voice_name: string
  resolution: string
  music_type: string
}

export interface User {
  id: number
  email: string
  username: string
  full_name: string
  avatar_url: string
  plan: string
  videos_generated: number
  videos_limit: number
  is_admin: boolean
  created_at: string
}

export interface Video {
  id: number
  title: string
  topic: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  video_url: string | null
  thumbnail_url: string | null
  duration: number | null
  file_size: number | null
  language: string
  style: string
  views: number
  downloads: number
  created_at: string
  completed_at: string | null
}
