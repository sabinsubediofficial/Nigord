import { useState, useEffect } from "react"

export const useNotifications = (serverId?: string) => {
  const [unreads, setUnreads] = useState<Record<string, number>>({})

  const fetchUnreads = async () => {
    if (!serverId) return
    try {
      const res = await fetch(`/servers/${serverId}/unread`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const map: Record<string, number> = {}
        data.unread.forEach((u: any) => {
          map[u.channel_id] = u.unread_count
        })
        setUnreads(map)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchUnreads()
    const interval = setInterval(fetchUnreads, 5000)
    return () => clearInterval(interval)
  }, [serverId])

  return { unreads, fetchUnreads }
}
