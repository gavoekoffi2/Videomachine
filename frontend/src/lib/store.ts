import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number; email: string; username: string; full_name: string;
  plan: string; videos_generated: number; videos_limit: number;
  is_admin: boolean; mp_config: any;
}

interface AuthState {
  user: User | null; token: string | null; isAuth: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  updateUser: (u: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null, token: null, isAuth: false,
    setAuth: (user, token) => { localStorage.setItem('token', token); set({ user, token, isAuth: true }) },
    logout: () => { localStorage.removeItem('token'); set({ user: null, token: null, isAuth: false }) },
    updateUser: (u) => { const cur = get().user; if (cur) set({ user: { ...cur, ...u } }) },
  }),
  { name: 'vm-auth', partialize: s => ({ user: s.user, token: s.token, isAuth: s.isAuth }) }
))
