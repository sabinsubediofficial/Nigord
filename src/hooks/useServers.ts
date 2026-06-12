import { useServerStore } from "@/store/useServerStore"
import { apiFetch } from "@/lib/api"

export const useServers = () => {
  const { servers, setServers, isLoading, setIsLoading, addServer } = useServerStore()

  const fetchServers = async () => {
    try {
      setIsLoading(true)
      const res = await apiFetch('/servers', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setServers(data.servers)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const createServer = async (name: string) => {
    try {
      const res = await apiFetch('/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        addServer(data.server)
        return data.server
      }
    } catch (error) {
      console.error(error)
    }
    return null
  }

  return { servers, isLoading, fetchServers, createServer }
}
