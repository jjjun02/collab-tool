import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        if (token) localStorage.setItem('accessToken', token)
        set({ user, token })
      },
      setUser: (user) => set({ user }),
      clearAuth: () => {
        localStorage.removeItem('accessToken')
        set({ user: null, token: null })
      },
    }),
    { name: 'auth-storage' },
  ),
)
