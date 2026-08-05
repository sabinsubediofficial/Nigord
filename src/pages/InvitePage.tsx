import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import { useServerSettings } from "@/hooks/useServerSettings"
import { Button } from "@/components/ui/button"
import { MessageSquare, Sparkles } from "lucide-react"
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
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center text-[#f1f3f5] text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#6366f1] animate-pulse" /> Loading invite...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center p-4">
        <div className="bg-[#141518] p-8 rounded-2xl shadow-2xl border border-[#27292d] text-center max-w-sm w-full">
          <h2 className="text-2xl font-bold text-[#f1f3f5] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">Invalid Invite</h2>
          <p className="text-[#8f96a3] text-sm mb-6">{error}</p>
          <Button onClick={() => navigate("/")} className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold rounded-xl h-11">
            Continue to Suhhp
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center p-4 font-sans selection:bg-[#6366f1]/30">
      {/* Background Decorative Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-[#6366f1]/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[#818cf8]/10 blur-[120px]" />
      </div>

      <div className="relative bg-[#141518]/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-[#27292d] text-center max-w-sm w-full">
        {/* Brand Badge */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-[#818cf8] font-bold uppercase tracking-wider mb-4">
          <MessageSquare className="w-4 h-4 fill-current text-[#6366f1]" /> Suhhp Invite <Sparkles className="w-3.5 h-3.5 text-[#818cf8]" />
        </div>

        <div className="w-20 h-20 bg-[#6366f1]/10 border border-[#6366f1]/30 rounded-3xl mx-auto mb-4 flex items-center justify-center text-[#818cf8] text-3xl font-black uppercase overflow-hidden shadow-lg">
          {invite.server_icon ? (
            <img src={getFileUrl(invite.server_icon)} alt={invite.server_name} className="w-full h-full object-cover" />
          ) : (
            invite.server_name[0]
          )}
        </div>
        <p className="text-[#8f96a3] text-xs font-bold uppercase tracking-wider mb-1">You've been invited to join</p>
        <h2 className="text-2xl font-bold text-[#f1f3f5] mb-6 font-['Plus_Jakarta_Sans',sans-serif]">{invite.server_name}</h2>
        <Button onClick={handleJoin} className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold h-11 rounded-xl shadow-lg shadow-[#10b981]/20">
          {user ? 'Accept Invite' : 'Login to Join'}
        </Button>
      </div>
    </div>
  )
}
