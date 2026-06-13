import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/useAuthStore"
import { ShieldAlert, Check } from "lucide-react"
import { apiFetch } from "@/lib/api"

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
    <div className="flex min-h-screen items-center justify-center bg-[#141517] p-4 font-sans selection:bg-[#5865f2]/30">
      <div className="w-full max-w-[420px] rounded-xl bg-[#1e2022] p-8 shadow-2xl border border-[#2d2f31]/60">
        {!isRecovering ? (
          <div>
            <h2 className="text-center text-2xl font-bold text-[#e3e1db]">Welcome Back</h2>
            <p className="mb-6 text-center text-[#a3a29e] text-sm">We're so excited to see you again!</p>
            
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#a3a29e] tracking-wider">Email or Username</label>
                <Input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#5865f2] focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#a3a29e] tracking-wider">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#5865f2] focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
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
                  className="text-xs text-[#5865f2] hover:underline cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading === "login"}
                className="w-full bg-[#5865f2] text-white hover:bg-[#4752c4] font-semibold h-10 transition-all shadow-md mt-2 rounded-[4px]"
              >
                {loading === "login" ? "Logging in..." : "Log In"}
              </Button>

              <p className="text-xs text-[#a3a29e] text-center pt-2">
                Need an account?{" "}
                <Link to="/register" className="text-[#5865f2] hover:underline font-semibold ml-0.5">
                  Register
                </Link>
              </p>
            </form>
          </div>
        ) : (
          <div>
            <h2 className="text-center text-2xl font-bold text-[#e3e1db]">Recover Account</h2>
            <p className="mb-6 text-center text-[#a3a29e] text-sm">Enter your recovery code to reset password</p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
                <ShieldAlert size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleRecoverPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#a3a29e] tracking-wider">Username or Email</label>
                <Input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#5865f2] focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#a3a29e] tracking-wider">Recovery Code</label>
                <Input
                  type="text"
                  placeholder="NIGORD-XXXX-XXXX"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#5865f2] focus-visible:ring-0 focus-visible:ring-offset-0 h-10 font-mono tracking-wider"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#a3a29e] tracking-wider">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#5865f2] focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#a3a29e] tracking-wider">Confirm Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#5865f2] focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
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
                  className="flex-1 text-[#a3a29e] hover:text-[#e3e1db] border border-[#2d2f31] h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading === "recover"}
                  className="flex-1 bg-[#5865f2] text-white hover:bg-[#4752c4] font-semibold h-10 transition-all shadow-md rounded-[4px]"
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
