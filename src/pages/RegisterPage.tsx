import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldAlert, Sparkles, MessageSquare } from "lucide-react"
import { apiFetch } from "@/lib/api"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!usernameRegex.test(username) || username.length < 3 || username.length > 20) {
      setError("Username must be alphanumeric (can include underscores and dashes) and between 3 and 20 characters.")
      return
    }

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters in length.")
      return
    }

    setLoading(true)

    try {
      const res = await apiFetch('/auth/register', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        navigate("/verify", { state: { userId: data.user.id, debugCode: data.debugCode } })
      } else {
        setError(data.error || "Failed to register")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
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
          <p className="text-xs text-[#8f96a3] mt-1">Join the community in seconds</p>
        </div>

        <h2 className="text-center text-lg font-semibold text-[#e3e6ed] mb-4">Create your account</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert size={14} className="shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-[#8f96a3] tracking-wider">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#0b0c0e] border border-[#27292d] text-[#f1f3f5] focus:border-[#6366f1] focus-visible:ring-1 focus-visible:ring-[#6366f1] focus-visible:ring-offset-0 h-10 rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-[#8f96a3] tracking-wider">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold h-10 transition-all shadow-lg shadow-[#6366f1]/25 mt-4 rounded-xl"
          >
            {loading ? "Registering..." : "Continue"}
          </Button>

          <p className="text-xs text-[#8f96a3] text-center pt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-[#818cf8] hover:underline font-semibold ml-0.5">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
