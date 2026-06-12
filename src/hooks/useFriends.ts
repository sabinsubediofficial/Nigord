import { useState, useEffect } from "react"

export interface Friend {
  id: string
  username: string
  avatar?: string
  status: 'pending' | 'accepted' | 'blocked'
  direction: 'incoming' | 'outgoing'
  presence_status?: string
  display_name?: string
  status_message?: string
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])

  const fetchFriends = async () => {
    try {
      const res = await fetch('/friends', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setFriends(data.friends)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const searchUsers = async (q: string) => {
    if (!q.trim()) return setSearchResults([])
    try {
      const res = await fetch(`/users/search?q=${encodeURIComponent(q)}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.users)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const sendRequest = async (targetId: string) => {
    try {
      const res = await fetch('/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId }),
        credentials: 'include'
      })
      if (res.ok) await fetchFriends()
    } catch (e) {
      console.error(e)
    }
  }

  const acceptRequest = async (targetId: string) => {
    try {
      const res = await fetch('/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId }),
        credentials: 'include'
      })
      if (res.ok) await fetchFriends()
    } catch (e) {
      console.error(e)
    }
  }

  const removeFriend = async (targetId: string) => {
    try {
      const res = await fetch('/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId }),
        credentials: 'include'
      })
      if (res.ok) await fetchFriends()
    } catch (e) {
      console.error(e)
    }
  }

  const blockUser = async (targetId: string) => {
    try {
      const res = await fetch('/friends/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId }),
        credentials: 'include'
      })
      if (res.ok) await fetchFriends()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchFriends()
    const interval = setInterval(fetchFriends, 5000)
    return () => clearInterval(interval)
  }, [])

  return { friends, searchResults, searchUsers, sendRequest, acceptRequest, removeFriend, blockUser, fetchFriends }
}
