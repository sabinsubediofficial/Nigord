import { useState } from "react"

export const useSearch = (serverId?: string) => {
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const searchMessages = async (query: string) => {
    if (!serverId || !query.trim()) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch(`/servers/${serverId}/search?q=${encodeURIComponent(query)}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.messages)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSearching(false)
    }
  }

  return { searchResults, searchMessages, isSearching, setSearchResults }
}
