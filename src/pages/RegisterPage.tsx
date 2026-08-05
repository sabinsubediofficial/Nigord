import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldAlert, MessageSquare, ArrowRight, Sparkles } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { InteractiveBackground } from "@/components/ui/InteractiveBackground"

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
      setError("Username must be alphanumeric (underscores/dashes allowed) and 3-20 characters.")
      return
    }

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
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
    <InteractiveBackground>
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-[12px] bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 shadow-xl backdrop-blur-md">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Create your account</h1>
        <p className="text-[#a1a1aa] text-sm">Welcome to Suhhp</p>
      </div>
      
      <div className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-start gap-3">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" /> 
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#a1a1aa]">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="bg-[#09090b]/50 border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-white/30 focus:bg-white/[0.02] h-11 rounded-lg transition-all"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#a1a1aa]">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              className="bg-[#09090b]/50 border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-white/30 focus:bg-white/[0.02] h-11 rounded-lg transition-all"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#a1a1aa]">Password</label>
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
            disabled={loading}
            className="w-full bg-white text-black hover:bg-white/90 font-medium h-11 mt-4 rounded-lg flex items-center justify-center gap-2 transition-colors hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] duration-300"
          >
            {loading ? "Creating account..." : "Continue"}
          </Button>
        </form>
      </div>

      <div className="mt-8 text-center text-sm text-[#a1a1aa]">
        Already have an account?{" "}
        <Link to="/login" className="text-white hover:underline transition-colors hover:text-white/80">
          Sign in
        </Link>
      </div>
    </InteractiveBackground>
  )
}
