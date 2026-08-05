import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/useAuthStore"
import { ShieldAlert, Check, RefreshCw, MessageSquare, Sparkles } from "lucide-react"
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
    <div className="flex min-h-screen items-center justify-center bg-[#0b0c0e] p-4 font-sans selection:bg-[#6366f1]/30">
      {/* Background Decorative Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-[#6366f1]/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[#818cf8]/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[420px] rounded-2xl bg-[#141518]/90 backdrop-blur-xl p-8 shadow-2xl border border-[#27292d]">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#818cf8] p-0.5 shadow-lg shadow-[#6366f1]/20 mb-3 flex items-center justify-center">
            <div className="w-full h-full bg-[#141518] rounded-[14px] flex items-center justify-center text-[#6366f1]">
              <MessageSquare className="w-7 h-7 fill-current" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#f1f3f5] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight flex items-center gap-1.5">
            Suhhp <Sparkles className="w-4 h-4 text-[#818cf8]" />
          </h1>
          <p className="text-xs text-[#8f96a3] mt-1">Verify your account</p>
        </div>

        <p className="mb-6 text-center text-[#8f96a3] text-xs">
          Please enter the 6-digit verification code below to complete registration.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert size={14} className="shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
            <Check size={14} className="shrink-0" /> {success}
          </div>
        )}
        {debugCode && (
          <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles size={14} /> Verification Code
            </div>
            <p className="text-amber-400/80">Use the verification code below to activate your account:</p>
            <div className="text-2xl font-black text-center mt-1 text-[#f1f3f5] select-all tracking-[0.25em] bg-[#0b0c0e] py-2.5 rounded-lg border border-[#27292d]">
              {debugCode}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-[#8f96a3] tracking-wider">6-Digit Code</label>
            <Input
              type="text"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="bg-[#0b0c0e] border border-[#27292d] text-[#f1f3f5] focus:border-[#6366f1] focus-visible:ring-1 focus-visible:ring-[#6366f1] focus-visible:ring-offset-0 h-12 text-center text-2xl tracking-[0.5em] font-bold rounded-xl"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading === "verify" || code.length !== 6}
            className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold h-10 transition-all shadow-lg shadow-[#6366f1]/25 mt-2 rounded-xl"
          >
            {loading === "verify" ? "Verifying..." : "Verify & Continue"}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              disabled={loading === "resend" || resendTimer > 0}
              onClick={handleResend}
              className="text-xs text-[#818cf8] hover:underline cursor-pointer disabled:text-[#4e5461] disabled:no-underline transition-colors flex items-center gap-1.5 justify-center w-full"
            >
              <RefreshCw size={12} className={loading === "resend" ? "animate-spin" : ""} />
              {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Resend Verification Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
