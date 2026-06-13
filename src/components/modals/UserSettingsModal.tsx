import { useState, useRef, useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { useChannelStore } from "@/store/useChannelStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, LogOut, Upload, ShieldAlert, Check } from "lucide-react"
import { apiFetch, getFileUrl } from "@/lib/api"

export default function UserSettingsModal({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuthStore()
  
  // Tab control
  const [activeSubTab, setActiveSubTab] = useState<'account' | 'profile'>('account')

  // Profile fields state
  const [displayName, setDisplayName] = useState(user?.display_name || "")
  const [bio, setBio] = useState(user?.bio || "")
  const [statusMessage, setStatusMessage] = useState(user?.status_message || "")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "")
  
  // Account settings state
  const [username, setUsername] = useState(user?.username || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Status states
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [accountError, setAccountError] = useState("")
  const [accountSuccess, setAccountSuccess] = useState("")
  const [profileSuccess, setProfileSuccess] = useState("")
  const [profileError, setProfileError] = useState("")

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading && !uploading) {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [loading, uploading, onClose, showDeleteConfirm])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setProfileError("")
    setProfileSuccess("")
    try {
      const res = await apiFetch('/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, bio, status_message: statusMessage, avatar: avatarUrl }),
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setProfileSuccess("Profile updated successfully!")
      } else {
        const data = await res.json()
        setProfileError(data.error || "Failed to update profile")
      }
    } catch (e) {
      setProfileError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAccountError("")
    setAccountSuccess("")
    
    try {
      const payload: any = {}
      if (username !== user?.username) {
        payload.username = username
      }
      
      if (Object.keys(payload).length > 0) {
        const res = await apiFetch('/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include'
        })
        if (!res.ok) {
          const data = await res.json()
          setAccountError(data.error || "Failed to update username")
          setLoading(false)
          return
        }
        const data = await res.json()
        setUser(data.user)
        setAccountSuccess("Account details updated successfully!")
      }
      
      // Password change if fields are filled
      if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          setAccountError("New passwords do not match")
          setLoading(false)
          return
        }
        const passRes = await apiFetch('/users/me/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
          credentials: 'include'
        })
        if (!passRes.ok) {
          const data = await passRes.json()
          setAccountError(data.error || "Failed to change password")
          setLoading(false)
          return
        }
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setAccountSuccess("Password and username updated successfully!")
      }
    } catch (e) {
      setAccountError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateRecoveryCode = async () => {
    setLoading(true)
    setAccountError("")
    try {
      const res = await apiFetch('/users/me/recovery-code', {
        method: 'POST',
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setRecoveryCode(data.recoveryCode)
        setAccountSuccess("New recovery code generated!")
      } else {
        setAccountError("Failed to generate recovery code")
      }
    } catch (e) {
      setAccountError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      setAccountError("Please enter your password to confirm deletion")
      return
    }
    setLoading(true)
    setAccountError("")
    try {
      const res = await apiFetch('/users/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deleteConfirmPassword }),
        credentials: 'include'
      })
      if (res.ok) {
        setUser(null)
        onClose()
      } else {
        const data = await res.json()
        setAccountError(data.error || "Failed to delete account")
      }
    } catch (e) {
      setAccountError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 25 * 1024 * 1024) {
      setProfileError("File size exceeds maximum limit of 25MB")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    
    setUploading(true)
    setProfileError("")
    setProfileSuccess("")
    try {
      const res = await apiFetch('/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setAvatarUrl(data.url)
        setProfileSuccess("Avatar uploaded! Click Save to apply.")
      } else {
        const data = await res.json()
        setProfileError(data.error || "Upload failed")
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    } catch (err) {
      setProfileError("Upload failed")
      if (fileInputRef.current) fileInputRef.current.value = ""
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', credentials: 'include' })
      useChannelStore.getState().clearCache()
      setUser(null)
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#141517] z-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-[280px] bg-[#1e2022] flex flex-col items-end py-14 pr-4 border-r border-[#2d2f31]">
        <div className="w-full max-w-[200px] space-y-1">
          <div className="px-2 mb-2">
            <h3 className="text-xs font-bold uppercase text-[#a3a29e]">User Settings</h3>
          </div>
          
          <div 
            onClick={() => setActiveSubTab('account')}
            className={`px-2 py-1.5 rounded cursor-pointer transition-colors ${activeSubTab === 'account' ? 'bg-[#2d2f31] text-[#e3e1db]' : 'text-[#a3a29e] hover:bg-[#2d2f31] hover:text-[#e3e1db]'}`}
          >
            My Account
          </div>
          <div 
            onClick={() => setActiveSubTab('profile')}
            className={`px-2 py-1.5 rounded cursor-pointer transition-colors ${activeSubTab === 'profile' ? 'bg-[#2d2f31] text-[#e3e1db]' : 'text-[#a3a29e] hover:bg-[#2d2f31] hover:text-[#e3e1db]'}`}
          >
            Profiles
          </div>

          <div className="w-full h-[1px] bg-[#2d2f31] my-2" />
          <div onClick={handleLogout} className="px-2 py-1.5 rounded text-red-400 hover:bg-red-500/20 cursor-pointer flex items-center justify-between transition-all">
            Logout <LogOut size={16} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-[#141517] p-10 py-14 overflow-y-auto relative">
        <div className="max-w-[740px]">
          {activeSubTab === 'account' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6 text-[#e3e1db]">My Account</h2>

              {accountError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2">
                  <ShieldAlert size={16} /> {accountError}
                </div>
              )}
              {accountSuccess && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm flex items-center gap-2">
                  <Check size={16} /> {accountSuccess}
                </div>
              )}

              <div className="bg-[#1e2022] rounded-xl p-6 border border-[#2d2f31] space-y-6">
                <form onSubmit={handleUpdateAccount} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-[#a3a29e]">Username</label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#bc9f84]" />
                  </div>

                  <div className="w-full h-[1px] bg-[#2d2f31] my-4" />

                  <h3 className="text-sm font-bold text-[#e3e1db] uppercase">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-[#a3a29e]">Current Password</label>
                      <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#bc9f84]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-[#a3a29e]">New Password</label>
                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#bc9f84]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-[#a3a29e]">Confirm Password</label>
                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#bc9f84]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={loading} className="bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71] font-bold">
                      Save Account Changes
                    </Button>
                  </div>
                </form>

                {/* Password Recovery Code Generator */}
                <div className="w-full h-[1px] bg-[#2d2f31] my-4" />
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[#e3e1db] uppercase">Password Recovery</h3>
                  <p className="text-xs text-[#a3a29e]">
                    Set up or generate a new Recovery Code. In case you lose your password, you can use this code to recover your account without email APIs.
                  </p>
                  
                  {recoveryCode ? (
                    <div className="bg-[#141517] p-4 rounded-lg border border-[#2d2f31] flex flex-col items-center gap-2 select-text">
                      <span className="text-[10px] uppercase font-bold text-[#bc9f84]">Your Recovery Code (Save this safely!)</span>
                      <span className="font-mono text-xl tracking-wider text-[#e3e1db] font-bold">{recoveryCode}</span>
                    </div>
                  ) : (
                    <Button onClick={handleGenerateRecoveryCode} disabled={loading} className="bg-[#2d2f31] text-[#e3e1db] hover:bg-[#bc9f84] hover:text-[#141517]">
                      Generate Recovery Code
                    </Button>
                  )}
                </div>

                {/* Danger Zone: Delete Account */}
                <div className="w-full h-[1px] bg-red-500/20 my-4" />
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-red-400 uppercase">Danger Zone</h3>
                  
                  {!showDeleteConfirm ? (
                    <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" className="bg-red-950 text-red-400 border border-red-800/40 hover:bg-red-900">
                      Delete Account
                    </Button>
                  ) : (
                    <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl space-y-4">
                      <p className="text-xs text-red-400 font-semibold">
                        Warning: This action is permanent! Deleting your account will delete your servers, messages, friends list, and profile.
                      </p>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-red-400">Enter Password to Confirm</label>
                        <Input type="password" value={deleteConfirmPassword} onChange={(e) => setDeleteConfirmPassword(e.target.value)} className="bg-[#141517] border border-red-900/40 text-[#e3e1db] focus:border-red-500" placeholder="Password" />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button onClick={() => setShowDeleteConfirm(false)} variant="ghost" className="text-[#a3a29e] hover:text-[#e3e1db]">
                          Cancel
                        </Button>
                        <Button onClick={handleDeleteAccount} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                          Confirm Delete Account
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6 text-[#e3e1db]">Profiles</h2>

              {profileError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2">
                  <ShieldAlert size={16} /> {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm flex items-center gap-2">
                  <Check size={16} /> {profileSuccess}
                </div>
              )}

              <div className="bg-[#1e2022] rounded-xl overflow-hidden shadow-2xl border border-[#2d2f31]">
                <div className="h-24 bg-[#bc9f84]" />
                <div className="px-4 pb-4 -mt-12 flex items-end gap-4 relative">
                  <div className="w-24 h-24 rounded-full bg-[#1e2022] p-1.5 relative shrink-0 z-10">
                    {avatarUrl ? (
                      <img src={getFileUrl(avatarUrl)} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-[#1e2022]" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#2d2f31] flex items-center justify-center text-4xl font-bold uppercase text-[#e3e1db] border-4 border-[#1e2022]">
                        {user?.username[0]}
                      </div>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer border-4 border-[#1e2022]"
                    >
                      <Upload size={20} className="text-white" />
                    </button>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-[#e3e1db] leading-tight">{displayName || user?.username}</h3>
                    <p className="text-[#a3a29e]">@{user?.username}</p>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                  </div>
                </div>

                <div className="p-4 bg-[#141517] m-4 rounded-xl space-y-6 border border-[#2d2f31]">
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-[#a3a29e]">Display Name</label>
                      <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-[#1e2022] border border-[#2d2f31] text-[#e3e1db] focus:border-[#bc9f84]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-[#a3a29e]">Bio</label>
                      <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full min-h-[100px] p-3 rounded-md bg-[#1e2022] border border-[#2d2f31] text-[#e3e1db] text-sm focus:outline-none resize-none focus:border-[#bc9f84]" placeholder="Tell us about yourself" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-[#a3a29e]">Status Message</label>
                      <Input value={statusMessage} onChange={(e) => setStatusMessage(e.target.value)} className="bg-[#1e2022] border border-[#2d2f31] text-[#e3e1db] focus:border-[#bc9f84]" placeholder="What's on your mind?" />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading || uploading} className="bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71] font-bold">
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="absolute top-14 right-10 flex flex-col items-center gap-2">
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full border-2 border-[#a3a29e] text-[#a3a29e] hover:bg-[#2d2f31] hover:text-[#e3e1db]" onClick={onClose}>
            <X size={18} />
          </Button>
          <span className="text-[10px] font-bold text-[#a3a29e]">ESC</span>
        </div>
      </div>
    </div>
  )
}
