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
    <div className="flex min-h-screen bg-[#09090b] font-sans selection:bg-primary/30">
      
      {/* Left Side: Brand & Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black flex-col justify-between p-12">
        {/* Dynamic mesh gradient background */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/40 blur-[140px] mix-blend-screen animate-pulse duration-10000" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-rose-500/30 blur-[120px] mix-blend-screen animate-pulse duration-7000 delay-1000" />
          <div className="absolute top-[40%] right-[20%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[100px] mix-blend-screen" />
        </div>
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA0KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] z-0 opacity-50"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-[10px] bg-gradient-to-tr from-primary to-rose-400 p-[1px] shadow-lg shadow-primary/20">
              <div className="w-full h-full bg-[#09090b] rounded-[9px] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight display-font">Suhhp</span>
          </div>

          <div className="max-w-md mt-20">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 display-font leading-[1.1] tracking-tight mb-6">
              You've been invited.
            </h1>
            <p className="text-lg text-[#a1a1aa] leading-relaxed mb-8">
              Someone wants you to join their community. Accept the invite to start chatting immediately.
            </p>
            
            <div className="flex items-center gap-4 text-sm font-medium text-[#a1a1aa] bg-white/5 w-max px-4 py-2.5 rounded-full border border-white/10 backdrop-blur-md">
              <UserPlus className="w-4 h-4 text-primary" />
              Instant access
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-[#a1a1aa]/60 font-medium">
          © 2026 Suhhp. Redefining interaction.
        </div>
      </div>

      {/* Right Side: Invite Card (Full width on mobile) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        
        {/* Mobile Background Glow */}
        <div className="absolute inset-0 lg:hidden pointer-events-none overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-rose-500/10 blur-[120px]" />
        </div>

        <div className="w-full max-w-[400px]">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div className="w-12 h-12 rounded-[12px] bg-gradient-to-tr from-primary to-rose-400 p-[1.5px] shadow-lg shadow-primary/20">
              <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight display-font">Suhhp</span>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl border border-white/10 text-center relative overflow-hidden group">
            {/* Soft inner glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-primary/10 border border-primary/30 rounded-3xl mb-6 flex items-center justify-center text-primary text-4xl font-black uppercase overflow-hidden shadow-lg shadow-primary/20">
                {invite.server_icon ? (
                  <img src={getFileUrl(invite.server_icon)} alt={invite.server_name} className="w-full h-full object-cover" />
                ) : (
                  invite.server_name[0]
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-bold uppercase tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Server Invite
              </div>
              
              <h2 className="text-3xl font-extrabold text-white mb-8 display-font tracking-tight">{invite.server_name}</h2>
              
              <Button onClick={handleJoin} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 rounded-xl shadow-lg shadow-primary/25 transition-all text-lg">
                {user ? 'Accept Invite' : 'Login to Join'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
