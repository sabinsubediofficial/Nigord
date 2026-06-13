import { useState, useEffect, useRef } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { apiFetch } from "@/lib/api"

export interface GlobalNotifications {
  servers: { server_id: string, channel_id: string, unread_count: number }[]
  dms: { channel_id: string, unread_count: number }[]
}

export const useGlobalNotifications = () => {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<GlobalNotifications>({ servers: [], dms: [] })
  const notificationSound = useRef(new Audio('/sounds/new-message.mp3'))
  const lastTotalUnread = useRef(0)

  const fetchNotifications = async (activeChannelId?: string, activeDmId?: string) => {
    if (!user) return
    try {
      const res = await apiFetch('/users/me/notifications', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        
        // Filter out unreads for the channel/DM the user is currently LOOKING at
        // This prevents sound from playing for the conversation you are active in
        const relevantServers = data.servers.filter((s: { channel_id: string }) => s.channel_id !== activeChannelId)
        const relevantDms = data.dms.filter((d: { channel_id: string }) => d.channel_id !== activeDmId)

        const currentTotal = [...relevantServers, ...relevantDms].reduce((acc, curr) => acc + curr.unread_count, 0)
        
        if (currentTotal > lastTotalUnread.current) {
          notificationSound.current.play().catch(() => {})
        }
        
        lastTotalUnread.current = currentTotal
        setNotifications(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // We will now call fetchNotifications manually from HomePage to pass active state
  return { notifications, fetchNotifications }
}
