import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import { useServerSettings } from "@/hooks/useServerSettings"
import { Button } from "@/components/ui/button"

export default function InvitePage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuthStore()
  const { joinServer } = useServerSettings()
  const [invite, setInvite] = useState<any>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await fetch(`/invites/${code}`)
        const data = await res.json()
        if (res.ok) {
          setInvite(data.invite)
        } else {
          setError(data.error || "Invalid invite link")
        }
      } catch (e) {
        setError("Failed to fetch invite")
      } finally {
        setLoading(false)
      }
    }
    fetchInvite()
  }, [code])

  const handleJoin = async () => {
    if (!user) {
      navigate(`/login?redirect=/invite/${code}`)
      return
    }

    setLoading(true)
    const res = await joinServer(code!)
    if (res && !res.error) {
      navigate("/")
    } else {
      setError(res?.error || "Failed to join server")
      setLoading(false)
    }
  }

  if (loading || authLoading) {
    return <div className="min-h-screen bg-[#313338] flex items-center justify-center text-white text-xl font-bold">Loading...</div>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#313338] flex items-center justify-center p-4">
        <div className="bg-[#2b2d31] p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Invite</h2>
          <p className="text-[#b5bac1] mb-6">{error}</p>
          <Button onClick={() => navigate("/")} className="w-full bg-[#5865f2] text-white">Continue to Nigord</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#313338] flex items-center justify-center p-4">
      <div className="bg-[#2b2d31] p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
        <div className="w-20 h-20 bg-[#5865f2] rounded-3xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold uppercase">
          {invite.server_name[0]}
        </div>
        <p className="text-[#b5bac1] text-xs font-bold uppercase mb-1">You've been invited to join</p>
        <h2 className="text-2xl font-bold text-white mb-6">{invite.server_name}</h2>
        <Button onClick={handleJoin} className="w-full bg-[#23a559] hover:bg-[#1a8344] text-white font-bold h-11">
          {user ? 'Accept Invite' : 'Login to Join'}
        </Button>
      </div>
    </div>
  )
}
