import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/useAuthStore"
import { ShieldAlert } from "lucide-react"
import { apiFetch } from "@/lib/api"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  const setUser = useAuthStore((state) => state.setUser)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
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
    <div className="flex min-h-screen items-center justify-center bg-[#141517] p-4 font-sans selection:bg-[#bc9f84]/30">
      <div className="w-full max-w-[420px] rounded-xl bg-[#1e2022] p-8 shadow-2xl border border-[#2d2f31]/60">
        <h2 className="mb-2 text-center text-2xl font-bold text-[#e3e1db]">Create an account</h2>
        <p className="mb-6 text-center text-[#a3a29e] text-sm">Join the community in a few clicks</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
            <ShieldAlert size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[#a3a29e] tracking-wider">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#bc9f84] focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[#a3a29e] tracking-wider">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#bc9f84] focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[#a3a29e] tracking-wider">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#bc9f84] focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71] font-bold h-10 transition-all shadow-md mt-4"
          >
            {loading ? "Registering..." : "Continue"}
          </Button>

          <p className="text-xs text-[#a3a29e] text-center pt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-[#bc9f84] hover:underline font-semibold ml-0.5">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
