import { useChannelStore } from "@/store/useChannelStore"

const API_URL = ''

export const useChannels = () => {
  const { channels, setChannels, addChannel, setCurrentChannel } = useChannelStore()

  const fetchChannels = async (serverId: string) => {
    try {
      const res = await fetch(`${API_URL}/servers/${serverId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setChannels(data.channels)
        if (data.channels.length > 0) {
          setCurrentChannel(data.channels[0])
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  const createChannel = async (serverId: string, name: string, type: 'text' | 'voice') => {
    try {
      const res = await fetch(`${API_URL}/servers/${serverId}/channels`, {
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
