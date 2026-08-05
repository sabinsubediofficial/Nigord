import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/useAuthStore"
import { ShieldAlert, Check, MessageSquare, ArrowRight, Sparkles } from "lucide-react"
import { apiFetch, saveToken } from "@/lib/api"
import { InteractiveBackground } from "@/components/ui/InteractiveBackground"

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
      setError("New password must be at least 6 characters.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
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
    <InteractiveBackground>
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-[12px] bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 shadow-xl backdrop-blur-md">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          {!isRecovering ? "Welcome back" : "Recover account"}
        </h1>
        <p className="text-[#a1a1aa] text-sm">
          {!isRecovering ? "Enter your details to sign in" : "Enter your recovery code to reset password"}
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

        {!isRecovering ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#a1a1aa]">Email or Username</label>
              <Input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-[#09090b]/50 border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-white/30 focus:bg-white/[0.02] h-11 rounded-lg transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[#a1a1aa]">Password</label>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsRecovering(true)
                    setError("")
                    setSuccess("")
                  }} 
                  className="text-xs text-white/70 hover:text-white transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#09090b]/50 border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-white/30 focus:bg-white/[0.02] h-11 rounded-lg transition-all"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading === "login"}
              className="w-full bg-white text-black hover:bg-white/90 font-medium h-11 mt-4 rounded-lg flex items-center justify-center gap-2 transition-colors hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] duration-300"
            >
              {loading === "login" ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRecoverPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#a1a1aa]">Username or Email</label>
              <Input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="johndoe"
                className="bg-[#09090b]/50 border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-white/30 focus:bg-white/[0.02] h-11 rounded-lg transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#a1a1aa]">Recovery Code</label>
              <Input
                type="text"
                placeholder="SUHHP-XXXX-XXXX"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                className="bg-[#09090b]/50 border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-white/30 focus:bg-white/[0.02] h-11 rounded-lg transition-all font-mono tracking-wider uppercase"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#a1a1aa]">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#09090b]/50 border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-white/30 focus:bg-white/[0.02] h-11 rounded-lg transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#a1a1aa]">Confirm</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#09090b]/50 border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-white/30 focus:bg-white/[0.02] h-11 rounded-lg transition-all"
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
                className="flex-1 text-[#a1a1aa] hover:text-white border border-white/10 hover:bg-white/5 h-11 rounded-lg transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading === "recover"}
                className="flex-1 bg-white text-black hover:bg-white/90 font-medium h-11 rounded-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] duration-300"
              >
                {loading === "recover" ? "Recovering..." : "Recover"}
              </Button>
            </div>
          </form>
        )}
      </div>
      
      {!isRecovering && (
        <div className="mt-8 text-center text-sm text-[#a1a1aa]">
          Need an account?{" "}
          <Link to="/register" className="text-white hover:underline transition-colors hover:text-white/80">
            Create one
          </Link>
        </div>
      )}
    </InteractiveBackground>
  )
}
