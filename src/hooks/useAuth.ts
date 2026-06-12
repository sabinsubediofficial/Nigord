import { useAuthStore } from "@/store/useAuthStore"
import { useEffect } from "react"
import { apiFetch } from "@/lib/api"

export const useAuth = () => {
  const { user, setUser, isLoading, setIsLoading } = useAuthStore()

  const checkAuth = async () => {
    try {
      setIsLoading(true)
      const res = await apiFetch('/auth/me', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return { user, isLoading, checkAuth }
}
