import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/useAuthStore"

const API_URL = ''

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
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        setUser(data.user)
        navigate("/")
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
    <div className="flex min-h-screen items-center justify-center bg-[#313338] p-4">
      <div className="w-full max-w-md rounded-lg bg-[#1e1f22] p-8 shadow-lg">
        <h2 className="mb-2 text-center text-2xl font-bold text-white">Create an account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[#b5bac1]">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#1e1f22] border-none ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-[#313338] text-white"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[#b5bac1]">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#1e1f22] border-none ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-[#313338] text-white"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[#b5bac1]">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#1e1f22] border-none ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-[#313338] text-white"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white"
          >
            {loading ? "Registering..." : "Continue"}
          </Button>
          <p className="text-sm text-[#949ba4]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#00a8fc] hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
