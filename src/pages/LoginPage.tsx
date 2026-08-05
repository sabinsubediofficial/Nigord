import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/useAuthStore"
import { ShieldAlert, Check, MessageSquare, ArrowRight, Sparkles } from "lucide-react"
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
              Welcome back to your space.
            </h1>
            <p className="text-lg text-[#a1a1aa] leading-relaxed mb-8">
              Jump back in. The conversation is waiting for you.
            </p>
            
            <div className="flex items-center gap-4 text-sm font-medium text-[#a1a1aa] bg-white/5 w-max px-4 py-2.5 rounded-full border border-white/10 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-primary" />
              Lightning fast connectivity
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
            <h2 className="text-3xl font-bold text-white display-font mb-2">
              {!isRecovering ? "Sign in" : "Recover Account"}
            </h2>
            <p className="text-[#a1a1aa]">
              {!isRecovering ? "Enter your details to sign in." : "Enter your recovery code to reset password."}
            </p>
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

          {!isRecovering ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-[#a1a1aa] tracking-widest">Email or Username</label>
                <Input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-white/[0.03] border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-primary focus:bg-white/[0.05] focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 h-12 rounded-xl transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase text-[#a1a1aa] tracking-widest">Password</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsRecovering(true)
                      setError("")
                      setSuccess("")
                    }} 
                    className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/[0.03] border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-primary focus:bg-white/[0.05] focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 h-12 rounded-xl transition-all"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading === "login"}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 transition-all shadow-lg shadow-primary/25 mt-2 rounded-xl flex items-center justify-center gap-2 group"
              >
                {loading === "login" ? "Signing in..." : (
                  <>
                    Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <div className="pt-6 text-center">
                <p className="text-[#a1a1aa]">
                  Need an account?{" "}
                  <Link to="/register" className="text-primary hover:text-primary/80 hover:underline font-semibold ml-1 transition-colors">
                    Create one
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRecoverPassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-[#a1a1aa] tracking-widest">Username or Email</label>
                <Input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="johndoe"
                  className="bg-white/[0.03] border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-primary focus:bg-white/[0.05] focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 h-12 rounded-xl transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-[#a1a1aa] tracking-widest">Recovery Code</label>
                <Input
                  type="text"
                  placeholder="SUHHP-XXXX-XXXX"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  className="bg-white/[0.03] border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-primary focus:bg-white/[0.05] focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 h-12 rounded-xl transition-all font-mono tracking-wider uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-[#a1a1aa] tracking-widest">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-white/[0.03] border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-primary focus:bg-white/[0.05] focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 h-12 rounded-xl transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-[#a1a1aa] tracking-widest">Confirm</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-white/[0.03] border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-primary focus:bg-white/[0.05] focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 h-12 rounded-xl transition-all"
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
                  className="flex-1 text-[#a1a1aa] hover:text-white border border-white/10 hover:bg-white/5 h-12 rounded-xl transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading === "recover"}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold h-12 transition-all shadow-lg shadow-primary/25 rounded-xl"
                >
                  {loading === "recover" ? "Recovering..." : "Recover"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
