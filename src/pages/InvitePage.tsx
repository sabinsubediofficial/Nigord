import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import { useServerSettings } from "@/hooks/useServerSettings"
import { Button } from "@/components/ui/button"
import { MessageSquare, Sparkles, UserPlus } from "lucide-react"
import { apiFetch, getFileUrl } from "@/lib/api"

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
        const res = await apiFetch(`/invites/${code}`)
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
    return (
      <div className="flex min-h-screen bg-[#09090b] font-sans items-center justify-center">
        <div className="flex items-center gap-3 text-white font-bold font-['Plus_Jakarta_Sans',sans-serif] text-xl">
          <MessageSquare className="w-8 h-8 text-primary animate-pulse" /> Loading invite...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#09090b] font-sans items-center justify-center p-6">
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-10 rounded-[2rem] shadow-2xl text-center max-w-sm w-full">
          <h2 className="text-3xl font-bold text-white mb-3 display-font">Invalid Invite</h2>
          <p className="text-[#a1a1aa] mb-8">{error}</p>
          <Button onClick={() => navigate("/")} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-12 shadow-lg shadow-primary/25">
            Return Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#09090b] font-sans items-center justify-center p-4 relative overflow-hidden">
      
      {/* Extremely subtle background light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAxKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] z-0 opacity-40"></div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-[12px] bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 shadow-xl backdrop-blur-md">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">You've been invited</h1>
          <p className="text-[#a1a1aa] text-sm text-center">
            Someone wants you to join their community.<br/>Accept the invite to start chatting.
          </p>
        </div>
        
        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col items-center">
          <div className="w-24 h-24 bg-[#09090b]/50 border border-white/10 rounded-2xl mb-6 flex items-center justify-center text-white text-3xl font-bold uppercase overflow-hidden shadow-inner">
            {invite.server_icon ? (
              <img src={getFileUrl(invite.server_icon)} alt={invite.server_name} className="w-full h-full object-cover" />
            ) : (
              invite.server_name[0]
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">{invite.server_name}</h2>
          
          <Button 
            onClick={handleJoin} 
            className="w-full bg-white text-black hover:bg-white/90 font-medium h-11 rounded-lg transition-colors"
          >
            {user ? 'Accept Invite' : 'Log in to Join'}
          </Button>
        </div>
      </div>
    </div>
  )
}
