import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/useAuthStore"
import { ShieldAlert, Check, Gamepad2, ArrowRight } from "lucide-react"
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
      setError("Connection lost. Please try again.")
    } finally {
      setLoading("")
    }
  }

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.")
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
        setSuccess("Password recovered successfully. You can now log in.")
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
      setError("Connection lost. Please try again.")
    } finally {
      setLoading("")
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background flex flex-col">
      <InteractiveBackground fullScreen={true} />
      
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-8">
        <div className="bg-white rounded-[2rem] p-8 sm:p-12 shadow-2xl max-w-[440px] w-full flex flex-col relative z-20">
          
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-serif text-foreground font-bold tracking-tight">
              {!isRecovering ? "Welcome Back" : "Recover Access"}
            </h1>
            <p className="text-foreground/60 mt-3 text-sm">
              {!isRecovering 
                ? "Sign in to continue to your communities."
                : "Reset your password to regain access."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-center gap-3 font-medium">
              <ShieldAlert size={18} /> 
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm flex items-center gap-3 font-medium">
              <Check size={18} /> 
              <span>{success}</span>
            </div>
          )}

          {!isRecovering ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-background border-none rounded-2xl h-14 px-5 text-foreground placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-semibold text-foreground/80">Password</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsRecovering(true)
                      setError("")
                      setSuccess("")
                    }} 
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-background border-none rounded-2xl h-14 px-5 text-foreground placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                  required
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading === "login"}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-14 rounded-full text-base font-semibold shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
                >
                  {loading === "login" ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRecoverPassword} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Email or Username</label>
                <Input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-background border-none rounded-2xl h-14 px-5 text-foreground placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Recovery Code</label>
                <Input
                  type="text"
                  placeholder="XXXX-XXXX"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  className="bg-background border-none rounded-2xl h-14 px-5 text-foreground placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-primary/20 tracking-widest uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80 ml-1">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-background border-none rounded-2xl h-14 px-5 text-foreground placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80 ml-1">Confirm</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-background border-none rounded-2xl h-14 px-5 text-foreground placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsRecovering(false)
                    setError("")
                  }}
                  className="flex-1 bg-background hover:bg-background/80 text-foreground h-14 rounded-full font-semibold transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading === "recover"}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-14 rounded-full font-semibold shadow-lg shadow-primary/25 transition-all"
                >
                  {loading === "recover" ? "Resetting..." : "Reset"}
                </Button>
              </div>
            </form>
          )}

          {!isRecovering && (
            <div className="mt-8 text-center text-sm font-medium text-foreground/60">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Join the community
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
