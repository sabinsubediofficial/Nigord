import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/useAuthStore"
import { ShieldAlert, Check, RefreshCw } from "lucide-react"
import { apiFetch } from "@/lib/api"

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
        setSuccess("A new verification code has been sent to your inbox.")
        setResendTimer(60) // 60 seconds cooldown
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
    <div className="flex min-h-screen items-center justify-center bg-[#141517] p-4 font-sans selection:bg-[#5865f2]/30">
      <div className="w-full max-w-[420px] rounded-xl bg-[#1e2022] p-8 shadow-2xl border border-[#2d2f31]/60">
        <h2 className="text-center text-2xl font-bold text-[#e3e1db]">Verify Email</h2>
        <p className="mb-6 text-center text-[#a3a29e] text-sm">
          Please enter the 6-digit verification code sent to your email address.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
            <ShieldAlert size={14} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
            <Check size={14} /> {success}
          </div>
        )}
        {debugCode && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert size={14} /> Fallback Verification Code
            </div>
            <p className="text-amber-400/80">Gmail credentials are not configured in your Cloudflare Worker environment variables. Your code is:</p>
            <div className="text-2xl font-black text-center mt-1 text-[#e3e1db] select-all tracking-[0.25em] bg-[#141517] py-2 rounded border border-[#2d2f31]/60">
              {debugCode}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[#a3a29e] tracking-wider">Verification Code</label>
            <Input
              type="text"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#5865f2] focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-center text-2xl tracking-[0.5em] font-bold"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading === "verify" || code.length !== 6}
            className="w-full bg-[#5865f2] text-white hover:bg-[#4752c4] font-semibold h-10 transition-all shadow-md mt-2 rounded-[4px]"
          >
            {loading === "verify" ? "Verifying..." : "Verify"}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              disabled={loading === "resend" || resendTimer > 0}
              onClick={handleResend}
              className="text-xs text-[#5865f2] hover:underline cursor-pointer disabled:text-[#767572] disabled:no-underline transition-colors flex items-center gap-1.5 justify-center w-full"
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
