import { create } from 'zustand'

export interface Message {
  id: string
  channel_id: string
  author_id: string
  content: string
  username: string
  avatar?: string
  created_at: string
  edited_at?: string
  is_pinned?: number
  reply_to_id?: string
  reply_username?: string
  reply_content?: string
  attachments?: any[]
  reactions?: any[]
}

interface MessageState {
  messages: Record<string, Message[]> // channelId -> messages
  setMessages: (channelId: string, messages: Message[]) => void
  addMessage: (channelId: string, message: Message) => void
  prependMessages: (channelId: string, oldMessages: Message[]) => void
  updateMessage: (channelId: string, messageId: string, updates: Partial<Message>) => void
  deleteMessage: (channelId: string, messageId: string) => void
}

export const deletedMessageIds = new Set<string>()

export const useMessageStore = create<MessageState>((set) => ({
  messages: {},
  setMessages: (channelId, messages) => 
    set((state) => ({ messages: { ...state.messages, [channelId]: messages } })),
  addMessage: (channelId, message) => 
    set((state) => ({ 
      messages: { 
        ...state.messages, 
        [channelId]: [message, ...(state.messages[channelId] || []).filter(m => m.id !== message.id)] 
      } 
    })),
  prependMessages: (channelId, oldMessages) =>
    set((state) => {
      const existing = state.messages[channelId] || []
      const existingIds = new Set(existing.map(m => m.id))
      const uniqueOld = oldMessages.filter(m => !existingIds.has(m.id))
      return {
        messages: {
          ...state.messages,
          [channelId]: [...existing, ...uniqueOld]
        }
      }
    }),
  updateMessage: (channelId, messageId, updates) =>
    set((state) => {
      const current = state.messages[channelId] || []
      const updated = current.map(m => m.id === messageId ? { ...m, ...updates } : m)
      return {
        messages: {
          ...state.messages,
          [channelId]: updated
        }
      }
    }),
  deleteMessage: (channelId, messageId) =>
    set((state) => {
      deletedMessageIds.add(messageId)
      const current = state.messages[channelId] || []
      const filtered = current.filter(m => m.id !== messageId)
      return {
        messages: {
          ...state.messages,
          [channelId]: filtered
        }
      }
    }),
}))
