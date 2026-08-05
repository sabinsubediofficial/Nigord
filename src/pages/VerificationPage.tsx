import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/useAuthStore"
import { ShieldAlert, Check, RefreshCw, MessageSquare, Sparkles, ArrowRight } from "lucide-react"
import { apiFetch, saveToken } from "@/lib/api"
import { InteractiveBackground } from "@/components/ui/InteractiveBackground"

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
    <InteractiveBackground>
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-[12px] bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 shadow-xl backdrop-blur-md">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Verify Account</h1>
        <p className="text-[#a1a1aa] text-sm text-center">
          Enter the 6-digit code we sent you.
        </p>
      </div>
      
      <div className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-start gap-3">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" /> 
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-start gap-3">
            <Check size={16} className="shrink-0 mt-0.5" /> 
            <span>{success}</span>
          </div>
        )}
        
        {debugCode && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Sparkles size={16} /> Verification Code Generated
            </div>
            <p className="text-amber-400/80 text-xs">Use the code below to activate your account:</p>
            <div className="text-xl font-bold text-center mt-2 text-white select-all tracking-[0.25em] bg-black/40 py-3 rounded-xl border border-amber-500/20 shadow-inner">
              {debugCode}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#a1a1aa] text-center block mb-4">
              6-Digit Verification Code
            </label>
            <Input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="bg-[#09090b]/50 border-white/10 text-white placeholder:text-[#a1a1aa]/20 focus:border-white/30 focus:bg-white/[0.02] h-14 text-center text-3xl tracking-[0.25em] font-bold rounded-lg transition-all font-mono"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading === "verify" || code.length !== 6}
            className="w-full bg-white text-black hover:bg-white/90 font-medium h-11 rounded-lg transition-colors hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] duration-300"
          >
            {loading === "verify" ? "Verifying..." : "Verify Account"}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              disabled={loading === "resend" || resendTimer > 0}
              onClick={handleResend}
              className="text-xs text-white/70 hover:text-white transition-colors cursor-pointer disabled:text-[#a1a1aa]/50 disabled:opacity-50 flex items-center gap-2 justify-center w-full"
            >
              <RefreshCw size={12} className={loading === "resend" ? "animate-spin" : ""} />
              {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Resend Verification Code"}
            </button>
          </div>
        </form>
      </div>
    </InteractiveBackground>
  )
}
