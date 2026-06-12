import { useEffect, useState } from "react"
import { useMessageStore, Message } from "@/store/useMessageStore"
import { apiFetch } from "@/lib/api"

export const useMessages = (channelId?: string) => {
  const { messages, setMessages, addMessage, prependMessages } = useMessageStore()
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchMessages = async (initial = false) => {
    if (!channelId) return
    try {
      const res = await apiFetch(`/channels/${channelId}/messages?limit=50`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const fetchedMsgs: Message[] = data.messages
        
        if (initial) {
          setMessages(channelId, fetchedMsgs)
          setHasMore(data.messages.length === 50)
        } else {
          const current = messages[channelId] || []
          const fetchedIds = new Set(fetchedMsgs.map(m => m.id))
          
          let oldestFetchedTime = 0
          if (fetchedMsgs.length > 0) {
            oldestFetchedTime = new Date(fetchedMsgs[fetchedMsgs.length - 1].created_at).getTime()
          }
          
          const updatedCurrent = current.map(m => {
            const fetched = fetchedMsgs.find(f => f.id === m.id)
            if (fetched) {
              const localEditTime = m.edited_at ? new Date(m.edited_at).getTime() : 0
              const fetchedEditTime = fetched.edited_at ? new Date(fetched.edited_at).getTime() : 0
              if (localEditTime > fetchedEditTime) {
                return {
                  ...fetched,
                  content: m.content,
                  edited_at: m.edited_at
                }
              }
              return { ...m, ...fetched }
            }
            return m
          }).filter(m => {
            const mTime = new Date(m.created_at).getTime()
            if (fetchedIds.has(m.id)) return true
            if (mTime < oldestFetchedTime) return true
            return false
          })
          
          const currentIds = new Set(updatedCurrent.map(m => m.id))
          const uniqueNew = fetchedMsgs.filter(m => !currentIds.has(m.id))
          
          setMessages(channelId, [...uniqueNew, ...updatedCurrent])
        }
        
        apiFetch(`/channels/${channelId}/read`, { method: 'POST', credentials: 'include' }).catch(console.error)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const fetchMoreMessages = async () => {
    if (!channelId || isLoadingMore || !hasMore) return
    const current = messages[channelId] || []
    if (current.length === 0) return

    const oldestId = current[current.length - 1].id
    setIsLoadingMore(true)
    try {
      const res = await apiFetch(`/channels/${channelId}/messages?before=${oldestId}&limit=50`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const fetchedMsgs = data.messages
        prependMessages(channelId, fetchedMsgs)
        setHasMore(data.messages.length === 50)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const sendMessage = async (content: string, attachments: any[] = [], replyToId?: string) => {
    if (!channelId) return
    try {
      const res = await apiFetch(`/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, attachments, reply_to_id: replyToId }),
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        addMessage(channelId, data.message)
        return data.message
      }
    } catch (error) {
      console.error(error)
    }
    return null
  }

  useEffect(() => {
    setHasMore(true)
    fetchMessages(true)
  }, [channelId])

  return { 
    channelMessages: channelId ? (messages[channelId] || []) : [], 
    fetchMessages, 
    fetchMoreMessages,
    hasMore,
    isLoadingMore,
    sendMessage 
  }
}
