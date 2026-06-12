import { useState, useEffect } from "react"
import { Message } from "@/store/useMessageStore"
import { apiFetch } from "@/lib/api"

export interface DMChannel {
  id: string
  target_id: string
  name: string
  avatar?: string
  active_call?: number
  display_name?: string
  status?: string
}

export const useDMs = (activeDmId?: string) => {
  const [dms, setDms] = useState<DMChannel[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchDMs = async () => {
    try {
      const res = await apiFetch('/dms', { credentials: 'include' })
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
      const res = await apiFetch(`/dms/${activeDmId}/messages?limit=50`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const fetchedMsgs: Message[] = data.messages
        
        if (initial) {
          setMessages(fetchedMsgs)
          setHasMore(data.messages.length === 50)
        } else {
          setMessages(prev => {
            const fetchedIds = new Set(fetchedMsgs.map(m => m.id))
            
            let oldestFetchedTime = 0
            if (fetchedMsgs.length > 0) {
              oldestFetchedTime = new Date(fetchedMsgs[fetchedMsgs.length - 1].created_at).getTime()
            }
            
            const updatedCurrent = prev.map(m => {
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
            
            return [...uniqueNew, ...updatedCurrent]
          })
        }
        apiFetch(`/dms/${activeDmId}/read`, { method: 'POST', credentials: 'include' }).catch(console.error)
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
      const res = await apiFetch(`/dms/${activeDmId}/messages?before=${oldestId}&limit=50`, { credentials: 'include' })
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

  const sendMessage = async (content: string, attachments: any[] = [], replyToId?: string) => {
    if (!activeDmId) return
    try {
      const res = await apiFetch(`/dms/${activeDmId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, attachments, reply_to_id: replyToId }),
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [data.message, ...prev])
        return data.message
      }
    } catch (e) {
      console.error(e)
    }
    return null
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

  return { dms, messages, setMessages, fetchDMs, fetchMessages, fetchMoreMessages, hasMore, isLoadingMore, sendMessage }
}
