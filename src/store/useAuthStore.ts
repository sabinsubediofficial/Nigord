import { create } from 'zustand'

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  display_name?: string
  bio?: string
  status_message?: string
  status?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setIsLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setIsLoading: (isLoading) => set({ isLoading }),
}))
