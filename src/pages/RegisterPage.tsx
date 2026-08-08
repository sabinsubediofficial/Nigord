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
        <div className="bg-white rounded-[2rem] p-8 sm:p-12 shadow-2xl max-w-[440px] w-full flex flex-col relative z-20 my-auto">
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-serif text-foreground font-bold tracking-tight">
              Join the Community
            </h1>
            <p className="text-foreground/60 mt-3 text-sm">
              Create an account to connect with others.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-center gap-3 font-medium">
              <ShieldAlert size={18} className="shrink-0" /> 
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground/80 ml-1">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-background border-none rounded-2xl h-14 px-5 text-foreground placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground/80 ml-1">Public Alias (Optional)</label>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others see you"
                className="bg-background border-none rounded-2xl h-14 px-5 text-foreground placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground/80 ml-1">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                placeholder="Unique identifier"
                className="bg-background border-none rounded-2xl h-14 px-5 text-foreground placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground/80 ml-1">Password</label>
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
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white h-14 rounded-full text-base font-semibold shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-foreground/60">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
