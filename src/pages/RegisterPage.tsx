import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldAlert, Check, Gamepad2 } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { InteractiveBackground } from "@/components/ui/InteractiveBackground"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Client side validation
    if (username.length < 3) {
      setError("Username must be at least 3 characters.")
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
        body: JSON.stringify({ 
          email, 
          username, 
          password,
          display_name: displayName || undefined
        }),
      })

      const data = await res.json()

      if (res.ok) {
        navigate("/verify", { state: { userId: data.userId } })
      } else {
        setError(data.error || "Registration failed. Please try again.")
      }
    } catch (err) {
      setError("Connection lost. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full min-h-screen overflow-y-auto bg-background flex flex-col">
      <InteractiveBackground fullScreen={true} />
      
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-8 min-h-screen overflow-y-auto">
        <div className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 sm:p-12 shadow-2xl shadow-black/80 max-w-[440px] w-full flex flex-col relative z-20 my-auto">
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-primary/15 border border-primary/30 text-primary rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-primary/10">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
              Join the Community
            </h1>
            <p className="text-white/70 mt-2 text-sm font-medium">
              Create an account to connect with others.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl text-sm flex items-center gap-3 font-medium">
              <ShieldAlert size={18} className="shrink-0" /> 
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-white/80 ml-1">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-secondary/60 border border-white/10 rounded-xl h-12 px-4 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-white/80 ml-1">Public Alias (Optional)</label>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others see you"
                className="bg-secondary/60 border border-white/10 rounded-xl h-12 px-4 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-white/80 ml-1">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                placeholder="Unique identifier"
                className="bg-secondary/60 border border-white/10 rounded-xl h-12 px-4 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-white/80 ml-1">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary/60 border border-white/10 rounded-xl h-12 px-4 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                required
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-white/70">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-bold transition-all ml-1">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
