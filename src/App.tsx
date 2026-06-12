import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import HomePage from "./pages/HomePage"
import InvitePage from "./pages/InvitePage"
import VerificationPage from "./pages/VerificationPage"
import ProtectedRoute from "./components/ProtectedRoute"
import { useAuth } from "./hooks/useAuth"

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#141517] text-[#e3e1db] font-sans">
        Loading...
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/invite/:code" element={<InvitePage />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
