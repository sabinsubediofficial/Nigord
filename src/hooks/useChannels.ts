import { useChannelStore } from "@/store/useChannelStore"
import { apiFetch } from "@/lib/api"

export const useChannels = () => {
  const { channels, setChannels, addChannel, setCurrentChannel } = useChannelStore()

  const fetchChannels = async (serverId: string) => {
    // 1. Instantly load from cache if available
    const cache = useChannelStore.getState().channelsCache
    const cached = cache[serverId]
    if (cached && cached.length > 0) {
      setChannels(cached)
      
      // If currentChannel is not already on this server, set it to the first cached channel
      const current = useChannelStore.getState().currentChannel
      if (!current || current.server_id !== serverId) {
        setCurrentChannel(cached[0])
      }
    }

    // 2. Revalidate in the background (Stale-While-Revalidate)
    try {
      const res = await apiFetch(`/servers/${serverId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const latestChannels = data.channels
        
        // Update both the active channel list and the cache
        setChannels(latestChannels)
        useChannelStore.getState().cacheChannels(serverId, latestChannels)
        
        // Ensure currentChannel remains valid
        const current = useChannelStore.getState().currentChannel
        const isCurrentValid = current && latestChannels.some((c: any) => c.id === current.id)
        if (!isCurrentValid && latestChannels.length > 0) {
          setCurrentChannel(latestChannels[0])
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  const createChannel = async (serverId: string, name: string, type: 'text' | 'voice') => {
    try {
      const res = await apiFetch(`/servers/${serverId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        addChannel(data.channel)
        return data.channel
      }
    } catch (error) {
      console.error(error)
    }
    return null
  }

  return { channels, fetchChannels, createChannel }
}
