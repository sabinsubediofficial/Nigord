import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldAlert, MessageSquare, ArrowRight, Sparkles } from "lucide-react"
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
              Where communities truly connect.
            </h1>
            <p className="text-lg text-[#a1a1aa] leading-relaxed mb-8">
              Experience the next generation of voice, video, and text communication. Designed for performance. Built for you.
            </p>
            
            <div className="flex items-center gap-4 text-sm font-medium text-[#a1a1aa] bg-white/5 w-max px-4 py-2.5 rounded-full border border-white/10 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-rose-400" />
              Crystal clear audio & 4K video sharing
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
            <h2 className="text-3xl font-bold text-white display-font mb-2">Create an account</h2>
            <p className="text-[#a1a1aa]">Enter your details to get started.</p>
          </div>
          
          {error && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-start gap-3 backdrop-blur-md">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" /> 
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-[#a1a1aa] tracking-widest">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-white/[0.03] border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-primary focus:bg-white/[0.05] focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 h-12 rounded-xl transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-[#a1a1aa] tracking-widest">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="bg-white/[0.03] border-white/10 text-white placeholder:text-[#a1a1aa]/40 focus:border-primary focus:bg-white/[0.05] focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 h-12 rounded-xl transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-[#a1a1aa] tracking-widest">Password</label>
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
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 transition-all shadow-lg shadow-primary/25 mt-2 rounded-xl flex items-center justify-center gap-2 group"
            >
              {loading ? "Creating account..." : (
                <>
                  Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <div className="pt-6 text-center">
              <p className="text-[#a1a1aa]">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:text-primary/80 hover:underline font-semibold ml-1 transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
