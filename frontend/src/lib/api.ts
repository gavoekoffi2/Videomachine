import axios from 'axios'

// In dev/Docker: relative '/api' (proxied by Vite or nginx).
// In Netlify production: VITE_API_URL points to the backend VPS/server.
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

export const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }
  return Promise.reject(err)
})

export const authApi = {
  register: (d: any) => api.post('/auth/register', d),
  login: (email: string, pw: string) => {
    const fd = new FormData(); fd.append('username', email); fd.append('password', pw)
    return api.post('/auth/login', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  me: () => api.get('/auth/me'),
  updateMe: (full_name: string) => api.put('/auth/me', null, { params: { full_name } }),
  changePwd: (current_password: string, new_password: string) =>
    api.post('/auth/change-password', { current_password, new_password }),
}

export const configApi = {
  get: () => api.get('/config/'),
  save: (cfg: any) => api.put('/config/', cfg),
  ollamaModels: () => api.get('/config/ollama-models'),
}

export const youtubeApi = {
  generate: (niche: string, language: string) => api.post('/youtube/generate', { niche, language }),
  upload: (taskId: number) => api.post(`/youtube/${taskId}/upload`),
  tasks: (skip=0, limit=30) => api.get('/youtube/tasks', { params: { skip, limit } }),
  task: (id: number) => api.get(`/youtube/tasks/${id}`),
  status: (id: number) => api.get(`/youtube/tasks/${id}/status`),
  delete: (id: number) => api.delete(`/youtube/tasks/${id}`),
  languages: () => api.get('/youtube/languages'),
}

export const twitterApi = {
  post: (topic: string, custom_text?: string) => api.post('/twitter/post', { topic, custom_text }),
  posts: (skip=0, limit=50) => api.get('/twitter/posts', { params: { skip, limit } }),
  status: (id: number) => api.get(`/twitter/posts/${id}/status`),
}

export const afmApi = {
  run: (affiliate_link: string, twitter_topic: string) => api.post('/afm/run', { affiliate_link, twitter_topic }),
  tasks: () => api.get('/afm/tasks'),
  status: (id: number) => api.get(`/afm/tasks/${id}/status`),
}

export const tiktokApi = {
  post: (video_path: string, topic: string, custom_caption?: string, privacy?: string) =>
    api.post('/tiktok/post', { video_path, topic, custom_caption, privacy }),
  postFromYouTube: (youtube_task_id: number, topic?: string, custom_caption?: string, privacy?: string) =>
    api.post(`/tiktok/post-from-task/${youtube_task_id}`, null, {
      params: { topic, custom_caption, privacy }
    }),
  posts: (skip=0, limit=50) => api.get('/tiktok/posts', { params: { skip, limit } }),
  status: (id: number) => api.get(`/tiktok/posts/${id}/status`),
}

export const socialApi = {
  post: (video_path: string, topic: string, platforms?: string[], captions?: Record<string, string>) =>
    api.post('/social/post', { video_path, topic, platforms, captions }),
  postFromYouTube: (youtube_task_id: number, topic?: string, platforms?: string[]) =>
    api.post(`/social/post-from-task/${youtube_task_id}`, null, {
      params: { topic, platforms: platforms?.join(',') }
    }),
  posts: (skip=0, limit=50) => api.get('/social/posts', { params: { skip, limit } }),
  status: (id: number) => api.get(`/social/posts/${id}/status`),
}

export const paymentsApi = {
  plans: () => api.get('/payments/plans'),
  initiate: (plan: string, currency='XOF') => api.post('/payments/initiate', { plan, currency }),
  demoComplete: (tid: string) => api.post(`/payments/demo-complete/${tid}`),
  history: () => api.get('/payments/history'),
}
