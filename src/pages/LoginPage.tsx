import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/useAuthStore"
import { ShieldAlert, Check, Sparkles, MessageSquare } from "lucide-react"
import { apiFetch, saveToken } from "@/lib/api"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState("")
  
  // Recovery Mode States
  const [isRecovering, setIsRecovering] = useState(false)
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const setUser = useAuthStore((state) => state.setUser)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectUrl = searchParams.get("redirect") || "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading("login")

    try {
      const res = await apiFetch('/auth/login', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.token) saveToken(data.token)
        setUser(data.user)
        navigate(redirectUrl)
      } else {
        if (data.unverified) {
          navigate("/verify", { state: { userId: data.userId } })
          return
        }
        setError(data.error || "Invalid credentials")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading("")
    }
  }

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters in length.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading("recover")
    try {
      const res = await apiFetch('/auth/recover-password', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, recoveryCode, newPassword }),
      })

      if (res.ok) {
        setSuccess("Password recovered successfully! You can now log in.")
        setIsRecovering(false)
        setEmail(usernameOrEmail)
        setPassword("")
        setUsernameOrEmail("")
        setRecoveryCode("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const data = await res.json()
        setError(data.error || "Failed to recover password")
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
          <p className="text-xs text-[#8f96a3] mt-1">Real-time community voice & chat</p>
        </div>

        {!isRecovering ? (
          <div>
            <h2 className="text-center text-lg font-semibold text-[#e3e6ed] mb-1">Welcome Back</h2>
            <p className="mb-6 text-center text-[#8f96a3] text-xs">We're excited to see you again!</p>
            
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-[#8f96a3] tracking-wider">Email or Username</label>
                <Input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0b0c0e] border border-[#27292d] text-[#f1f3f5] focus:border-[#6366f1] focus-visible:ring-1 focus-visible:ring-[#6366f1] focus-visible:ring-offset-0 h-10 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-[#8f96a3] tracking-wider">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0b0c0e] border border-[#27292d] text-[#f1f3f5] focus:border-[#6366f1] focus-visible:ring-1 focus-visible:ring-[#6366f1] focus-visible:ring-offset-0 h-10 rounded-xl"
                  required
                />
              </div>

              <div className="text-right">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsRecovering(true)
                    setError("")
                    setSuccess("")
                  }} 
                  className="text-xs text-[#818cf8] hover:text-[#a5b4fc] hover:underline cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading === "login"}
                className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold h-10 transition-all shadow-lg shadow-[#6366f1]/25 mt-2 rounded-xl"
              >
                {loading === "login" ? "Logging in..." : "Log In"}
              </Button>

              <p className="text-xs text-[#8f96a3] text-center pt-2">
                Need an account?{" "}
                <Link to="/register" className="text-[#818cf8] hover:underline font-semibold ml-0.5">
                  Register
                </Link>
              </p>
            </form>
          </div>
        ) : (
          <div>
            <h2 className="text-center text-lg font-semibold text-[#e3e6ed] mb-1">Recover Account</h2>
            <p className="mb-6 text-center text-[#8f96a3] text-xs">Enter your recovery code to reset password</p>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert size={14} className="shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleRecoverPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-[#8f96a3] tracking-wider">Username or Email</label>
                <Input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="bg-[#0b0c0e] border border-[#27292d] text-[#f1f3f5] focus:border-[#6366f1] focus-visible:ring-1 focus-visible:ring-[#6366f1] focus-visible:ring-offset-0 h-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-[#8f96a3] tracking-wider">Recovery Code</label>
                <Input
                  type="text"
                  placeholder="SUHHP-XXXX-XXXX"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  className="bg-[#0b0c0e] border border-[#27292d] text-[#f1f3f5] focus:border-[#6366f1] focus-visible:ring-1 focus-visible:ring-[#6366f1] focus-visible:ring-offset-0 h-10 font-mono tracking-wider rounded-xl uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-[#8f96a3] tracking-wider">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-[#0b0c0e] border border-[#27292d] text-[#f1f3f5] focus:border-[#6366f1] focus-visible:ring-1 focus-visible:ring-[#6366f1] focus-visible:ring-offset-0 h-10 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-[#8f96a3] tracking-wider">Confirm Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-[#0b0c0e] border border-[#27292d] text-[#f1f3f5] focus:border-[#6366f1] focus-visible:ring-1 focus-visible:ring-[#6366f1] focus-visible:ring-offset-0 h-10 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsRecovering(false)
                    setError("")
                  }}
                  className="flex-1 text-[#8f96a3] hover:text-[#f1f3f5] border border-[#27292d] h-10 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading === "recover"}
                  className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold h-10 transition-all shadow-lg shadow-[#6366f1]/25 rounded-xl"
                >
                  {loading === "recover" ? "Recovering..." : "Recover"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
