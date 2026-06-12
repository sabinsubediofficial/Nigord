import { useState, useEffect } from "react"
import { Message } from "@/store/useMessageStore"

export interface DMChannel {
  id: string
  target_id: string
  name: string
  avatar?: string
  active_call?: number
}

export const useDMs = (activeDmId?: string) => {
  const [dms, setDms] = useState<DMChannel[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchDMs = async () => {
    try {
      const res = await fetch('/dms', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setDms(data.dms)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchMessages = async (initial = false) => {
    if (!activeDmId) return
    try {
      const res = await fetch(`/dms/${activeDmId}/messages?limit=50`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const fetchedMsgs: Message[] = data.messages
        
        if (initial) {
          setMessages(fetchedMsgs)
          setHasMore(data.messages.length === 50)
        } else {
          setMessages(prev => {
            const currentIds = new Set(prev.map(m => m.id))
            const uniqueNew = fetchedMsgs.filter(m => !currentIds.has(m.id))
            return uniqueNew.length > 0 ? [...uniqueNew, ...prev] : prev
          })
        }
        fetch(`/dms/${activeDmId}/read`, { method: 'POST', credentials: 'include' }).catch(console.error)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchMoreMessages = async () => {
    if (!activeDmId || isLoadingMore || !hasMore) return
    if (messages.length === 0) return

    const oldestId = messages[messages.length - 1].id
    setIsLoadingMore(true)
    try {
      const res = await fetch(`/dms/${activeDmId}/messages?before=${oldestId}&limit=50`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const fetchedMsgs: Message[] = data.messages
        setMessages(prev => {
          const currentIds = new Set(prev.map(m => m.id))
          const uniqueOld = fetchedMsgs.filter(m => !currentIds.has(m.id))
          return [...prev, ...uniqueOld]
        })
        setHasMore(data.messages.length === 50)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const sendMessage = async (content: string) => {
    if (!activeDmId) return
    try {
      const res = await fetch(`/dms/${activeDmId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [data.message, ...prev])
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchDMs()
    const interval = setInterval(fetchDMs, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setHasMore(true)
    fetchMessages(true)
    fetchDMs()
  }, [activeDmId])

  return { dms, messages, fetchDMs, fetchMessages, fetchMoreMessages, hasMore, isLoadingMore, sendMessage }
}
