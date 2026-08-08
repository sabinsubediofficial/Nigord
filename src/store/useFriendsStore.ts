import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Friend } from '@/hooks/useFriends'

interface FriendsState {
  friends: Friend[]
  setFriends: (friends: Friend[]) => void
  addFriend: (friend: Friend) => void
  updateFriend: (id: string, updates: Partial<Friend>) => void
  removeFriendFromStore: (id: string) => void
}

export const useFriendsStore = create<FriendsState>()(
  persist(
    (set) => ({
      friends: [],
      setFriends: (friends) => set({ friends }),
      addFriend: (friend) => set((state) => ({
        friends: [...state.friends.filter(f => f.id !== friend.id), friend]
      })),
      updateFriend: (id, updates) => set((state) => ({
        friends: state.friends.map(f => f.id === id ? { ...f, ...updates } : f)
      })),
      removeFriendFromStore: (id) => set((state) => ({
        friends: state.friends.filter(f => f.id !== id)
      })),
    }),
    {
      name: 'suhhp_friends_cache',
    }
  )
)
