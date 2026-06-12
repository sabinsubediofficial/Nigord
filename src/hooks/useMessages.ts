import { useEffect, useState } from "react"
import { useMessageStore, Message } from "@/store/useMessageStore"

export const useMessages = (channelId?: string) => {
  const { messages, setMessages, addMessage, prependMessages } = useMessageStore()
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchMessages = async (initial = false) => {
    if (!channelId) return
    try {
      const res = await fetch(`/channels/${channelId}/messages?limit=50`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const fetchedMsgs: Message[] = data.messages
        
        if (initial) {
          setMessages(channelId, fetchedMsgs)
          setHasMore(data.messages.length === 50)
        } else {
          // Merge newly polled messages with existing ones (both newest first)
          const current = messages[channelId] || []
          const currentIds = new Set(current.map(m => m.id))
          const uniqueNew = fetchedMsgs.filter(m => !currentIds.has(m.id))
          if (uniqueNew.length > 0) {
            setMessages(channelId, [...uniqueNew, ...current])
          }
        }
        
        fetch(`/channels/${channelId}/read`, { method: 'POST', credentials: 'include' }).catch(console.error)
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
      const res = await fetch(`/channels/${channelId}/messages?before=${oldestId}&limit=50`, { credentials: 'include' })
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

  const sendMessage = async (content: string, attachments: any[] = []) => {
    if (!channelId) return
    try {
      const res = await fetch(`/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, attachments }),
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
