import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/useAuthStore"
import { ShieldAlert, Check, RefreshCw, MessageSquare, Sparkles, ArrowRight } from "lucide-react"
import { apiFetch, saveToken } from "@/lib/api"

export default function VerificationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get userId from router state
  const state = location.state as { userId?: string; debugCode?: string } | null
  const userId = state?.userId || new URLSearchParams(location.search).get("userId")

  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const [debugCode, setDebugCode] = useState(state?.debugCode || "")

  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    if (!userId) {
      navigate("/login")
    }
  }, [userId, navigate])

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [resendTimer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading("verify")

    try {
      const res = await apiFetch("/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.token) saveToken(data.token)
        setUser(data.user)
        navigate("/")
      } else {
        setError(data.error || "Verification failed")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading("")
    }
  }

  const handleResend = async () => {
    setError("")
    setSuccess("")
    setLoading("resend")
    try {
      const res = await apiFetch("/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      const data = await res.json()
      if (res.ok) {
        if (data.debugCode) {
          setDebugCode(data.debugCode)
        }
        setSuccess("A new verification code has been generated.")
        setResendTimer(60)
      } else {
        setError(data.error || "Failed to resend code")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading("")
    }
  }

  return (
    <div className="flex min-h-screen bg-[#09090b] font-sans selection:bg-primary/30">
      
      {/* Left Side: Brand & Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black flex-col justify-between p-12">
        {/* Dynamic mesh gradient background */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/40 blur-[140px] mix-blend-screen animate-pulse duration-10000" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-rose-500/30 blur-[120px] mix-blend-screen animate-pulse duration-7000 delay-1000" />
          <div className="absolute top-[40%] right-[20%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[100px] mix-blend-screen" />
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
              Almost there.
            </h1>
            <p className="text-lg text-[#a1a1aa] leading-relaxed mb-8">
              Verify your identity to unlock the full Suhhp experience. Your community awaits.
            </p>
            
            <div className="flex items-center gap-4 text-sm font-medium text-[#a1a1aa] bg-white/5 w-max px-4 py-2.5 rounded-full border border-white/10 backdrop-blur-md">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Secure verification process
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-[#a1a1aa]/60 font-medium">
          © 2026 Suhhp. Redefining interaction.
        </div>
      </div>

      {/* Right Side: Form (Full width on mobile) */}
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

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white display-font mb-2">Verify Account</h2>
            <p className="text-[#a1a1aa]">Enter the 6-digit code we sent you.</p>
          </div>
          
          {error && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-start gap-3 backdrop-blur-md">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" /> 
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-start gap-3 backdrop-blur-md">
              <Check size={18} className="shrink-0 mt-0.5" /> 
              <span>{success}</span>
            </div>
          )}
          
          {debugCode && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex flex-col gap-2 backdrop-blur-md">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sparkles size={16} /> Verification Code Generated
              </div>
              <p className="text-amber-400/80 text-xs">Use the code below to activate your account:</p>
              <div className="text-2xl font-black text-center mt-2 text-white select-all tracking-[0.25em] bg-black/40 py-3 rounded-xl border border-amber-500/20 shadow-inner">
                {debugCode}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-[#a1a1aa] tracking-widest text-center block mb-4">
                6-Digit Verification Code
              </label>
              <Input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="bg-white/[0.03] border-white/10 text-white placeholder:text-[#a1a1aa]/20 focus:border-primary focus:bg-white/[0.05] focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 h-16 text-center text-4xl tracking-[0.5em] font-black rounded-xl transition-all font-mono"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading === "verify" || code.length !== 6}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 transition-all shadow-lg shadow-primary/25 rounded-xl flex items-center justify-center gap-2 group"
            >
              {loading === "verify" ? "Verifying..." : (
                <>
                  Verify Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <div className="text-center pt-4">
              <button
                type="button"
                disabled={loading === "resend" || resendTimer > 0}
                onClick={handleResend}
                className="text-sm text-primary hover:text-primary/80 transition-colors font-medium cursor-pointer disabled:text-[#a1a1aa] disabled:opacity-50 flex items-center gap-2 justify-center w-full"
              >
                <RefreshCw size={14} className={loading === "resend" ? "animate-spin" : ""} />
                {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Resend Verification Code"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
