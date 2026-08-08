import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DMChannel } from '@/hooks/useDMs'
import { Message } from '@/store/useMessageStore'

interface DMState {
  dms: DMChannel[]
  dmMessagesCache: Record<string, Message[]> // target_id / channel_id -> messages
  setDms: (dms: DMChannel[]) => void
  setDmMessages: (dmId: string, messages: Message[] | ((prev: Message[]) => Message[])) => void
  addDmMessage: (dmId: string, message: Message) => void
  prependDmMessages: (dmId: string, oldMessages: Message[]) => void
}

export const useDMStore = create<DMState>()(
  persist(
    (set) => ({
      dms: [],
      dmMessagesCache: {},
      setDms: (dms) => set({ dms }),
      setDmMessages: (dmId, messages) => set((state) => {
        const current = state.dmMessagesCache[dmId] || []
        const next = typeof messages === 'function' ? messages(current) : messages
        return {
          dmMessagesCache: { ...state.dmMessagesCache, [dmId]: next }
        }
      }),
      addDmMessage: (dmId, message) => set((state) => ({
        dmMessagesCache: {
          ...state.dmMessagesCache,
          [dmId]: [message, ...(state.dmMessagesCache[dmId] || []).filter(m => m.id !== message.id)]
        }
      })),
      prependDmMessages: (dmId, oldMessages) => set((state) => {
        const existing = state.dmMessagesCache[dmId] || []
        const existingIds = new Set(existing.map(m => m.id))
        const uniqueOld = oldMessages.filter(m => !existingIds.has(m.id))
        return {
          dmMessagesCache: {
            ...state.dmMessagesCache,
            [dmId]: [...existing, ...uniqueOld]
          }
        }
      }),
    }),
    {
      name: 'suhhp_dms_cache',
    }
  )
)
