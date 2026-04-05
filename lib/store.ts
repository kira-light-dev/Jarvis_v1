'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserProfile {
  id?: string
  name: string
  email: string
  branch: string
  semester: number
  targetCompanies: string[]
  dsaLevel: 'beginner' | 'intermediate' | 'advanced'
}

interface UserStore {
  user: UserProfile | null
  isOnboarded: boolean
  setUser: (user: UserProfile) => void
  clearUser: () => void
  setOnboarded: (value: boolean) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isOnboarded: false,
      setUser: (user) => set({ user, isOnboarded: true }),
      clearUser: () => set({ user: null, isOnboarded: false }),
      setOnboarded: (value) => set({ isOnboarded: value }),
    }),
    {
      name: 'jarvis-user-storage',
    }
  )
)
