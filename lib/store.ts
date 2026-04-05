'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CharacterDNA {
  energyLevel: 'high' | 'moderate' | 'low'
  currentMood: 'driven' | 'overwhelmed' | 'anxious' | 'focused' | 'neutral'
  avoidancePatterns: string[]
  focusWindow: string
  dominantTrait: string
  communicationStyle: 'direct' | 'gentle' | 'analytical' | 'tough-love'
  biggestFear: string
  coreMotivation: string
  lastUpdated: string
  // Zep rolling summary fields
  conversationSummary?: string
  summaryUpdatedAt?: string
  totalMessageCount?: number
}

export interface UserProfile {
  id: string
  name: string
  email: string
  branch: string
  semester: number
  targetCompanies: string[]
  dsaLevel: 'beginner' | 'intermediate' | 'advanced'
  onboardingAnswers: string[]
  characterDNA: CharacterDNA | null
  totalXP: number
  streak: number
  lastActiveDate: string
  leetcodeUsername?: string
}

interface UserStore {
  user: UserProfile | null
  isOnboarded: boolean
  setUser: (user: UserProfile) => void
  clearUser: () => void
  setOnboarded: (value: boolean) => void
  updateCharacterDNA: (dna: CharacterDNA) => void
  addXP: (amount: number) => void
  incrementStreak: () => void
  updateMood: (mood: CharacterDNA['currentMood']) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isOnboarded: false,
      setUser: (user) => set({ user, isOnboarded: true }),
      clearUser: () => set({ user: null, isOnboarded: false }),
      setOnboarded: (value) => set({ isOnboarded: value }),
      updateCharacterDNA: (dna) => {
        const user = get().user
        if (user) {
          set({ 
            user: { 
              ...user, 
              characterDNA: { ...dna, lastUpdated: new Date().toISOString() } 
            } 
          })
        }
      },
      addXP: (amount) => {
        const user = get().user
        if (user) {
          set({ user: { ...user, totalXP: (user.totalXP || 0) + amount } })
        }
      },
      incrementStreak: () => {
        const user = get().user
        if (user) {
          const today = new Date().toISOString().split('T')[0]
          const lastActive = user.lastActiveDate
          
          let newStreak = user.streak || 0
          
          if (lastActive !== today) {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toISOString().split('T')[0]
            
            if (lastActive === yesterdayStr) {
              newStreak += 1
            } else {
              newStreak = 1
            }
          }
          
          set({ 
            user: { 
              ...user, 
              streak: newStreak, 
              lastActiveDate: today 
            } 
          })
        }
      },
      updateMood: (mood) => {
        const user = get().user
        if (user && user.characterDNA) {
          set({
            user: {
              ...user,
              characterDNA: {
                ...user.characterDNA,
                currentMood: mood,
                lastUpdated: new Date().toISOString()
              }
            }
          })
        }
      },
    }),
    {
      name: 'jarvis-user-storage',
    }
  )
)
