import { useState, useRef, useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { useChannelStore } from "@/store/useChannelStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, LogOut, Upload, ShieldAlert, Check, Volume2, Mic } from "lucide-react"
import { apiFetch, getFileUrl, clearToken, saveToken } from "@/lib/api"
import { useAudioStore } from "@/store/useAudioStore"
import ImageCropModal from "./ImageCropModal"

export default function UserSettingsModal({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuthStore()
  
  // Tab control with state management persistence
  const [activeSubTab, setActiveSubTab] = useState<'account' | 'profile' | 'voice'>(() => {
    const saved = localStorage.getItem('suhhp_userSettingsSubTab');
    return (saved as any) || 'account';
  });

  useEffect(() => {
    localStorage.setItem('suhhp_userSettingsSubTab', activeSubTab);
  }, [activeSubTab]);

  // Profile fields state
  const [displayName, setDisplayName] = useState(user?.display_name || "")
  const [bio, setBio] = useState(user?.bio || "")
  const [statusMessage, setStatusMessage] = useState(user?.status_message || "")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "")

  const { 
    micVolume, 
    outputVolume, 
    inputDeviceId, 
    outputDeviceId, 
    setMicVolume, 
    setOutputVolume, 
    setInputDeviceId, 
    setOutputDeviceId 
  } = useAudioStore()

  // Voice & Video state
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [isTestingMic, setIsTestingMic] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  
  const testStreamRef = useRef<MediaStream | null>(null)
  const testAudioContextRef = useRef<AudioContext | null>(null)
  const testAnimationRef = useRef<number | null>(null)

  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {})
        const devList = await navigator.mediaDevices.enumerateDevices()
        setDevices(devList)
      } catch (err) {
        console.error("Failed to get audio devices:", err)
      }
    }
    getDevices()
  }, [])

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: inputDeviceId && inputDeviceId !== 'default' ? { deviceId: { exact: inputDeviceId } } : true
      })
      testStreamRef.current = stream

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContextClass()
      testAudioContextRef.current = ctx

      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength
        const level = Math.min(100, Math.round((average / 128) * 100))
        setMicLevel(level)
        testAnimationRef.current = requestAnimationFrame(updateLevel)
      }
      testAnimationRef.current = requestAnimationFrame(updateLevel)
      setIsTestingMic(true)
    } catch (err) {
      console.error("Failed to start mic test:", err)
    }
  }

  const stopMicTest = () => {
    if (testAnimationRef.current) {
      cancelAnimationFrame(testAnimationRef.current)
      testAnimationRef.current = null
    }
    if (testAudioContextRef.current) {
      testAudioContextRef.current.close().catch(() => {})
      testAudioContextRef.current = null
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach(t => t.stop())
      testStreamRef.current = null
    }
    setIsTestingMic(false)
    setMicLevel(0)
  }

  useEffect(() => {
    return () => {
      if (testAnimationRef.current) cancelAnimationFrame(testAnimationRef.current)
      if (testAudioContextRef.current) testAudioContextRef.current.close().catch(() => {})
      if (testStreamRef.current) testStreamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  useEffect(() => {
    if (activeSubTab !== 'voice') {
      stopMicTest()
    }
  }, [activeSubTab])
  
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
        if (data.token) saveToken(data.token)
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
        clearToken()
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

  // Image Crop State
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 25 * 1024 * 1024) {
      setProfileError("File size exceeds maximum limit of 25MB")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result as string)
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const uploadCroppedAvatar = async (croppedFile: File) => {
    const formData = new FormData()
    formData.append('file', croppedFile)
    
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
      }
    } catch (err) {
      setProfileError("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', credentials: 'include' })
      clearToken()
      useChannelStore.getState().clearCache()
      setUser(null)
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-[280px] bg-secondary flex flex-col items-center md:items-end py-4 md:py-14 px-4 md:pr-4 border-b md:border-b-0 md:border-r border-border shrink-0">
        <div className="w-full max-w-[200px] flex md:flex-col gap-2 md:gap-1 items-center md:items-stretch overflow-x-auto no-scrollbar py-2 md:py-0">
          <div className="hidden md:block px-2 mb-2">
            <h3 className="text-xs font-bold uppercase text-white/70">User Settings</h3>
          </div>
          
          <div 
            onClick={() => setActiveSubTab('account')}
            className={`px-3 py-1.5 md:px-2 rounded cursor-pointer transition-colors text-center md:text-left shrink-0 ${activeSubTab === 'account' ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
          >
            My Account
          </div>
          <div 
            onClick={() => setActiveSubTab('profile')}
            className={`px-3 py-1.5 md:px-2 rounded cursor-pointer transition-colors text-center md:text-left shrink-0 ${activeSubTab === 'profile' ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
          >
            Profiles
          </div>
          <div 
            onClick={() => setActiveSubTab('voice')}
            className={`px-3 py-1.5 md:px-2 rounded cursor-pointer transition-colors text-center md:text-left shrink-0 ${activeSubTab === 'voice' ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
          >
            Voice & Video
          </div>

          <div className="hidden md:block w-full h-[1px] bg-border my-2" />
          <div onClick={handleLogout} className="px-3 py-1.5 md:px-2 rounded text-rose-400 hover:bg-rose-500/20 cursor-pointer flex items-center justify-center md:justify-between gap-1 md:gap-0 transition-all shrink-0">
            Logout <LogOut size={16} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-background p-4 py-8 md:p-10 md:py-14 overflow-y-auto relative">
        <div className="max-w-[740px]">
          {activeSubTab === 'account' ? (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white font-display">My Account</h2>

              {accountError && (
                <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl text-sm flex items-center gap-2 font-medium">
                  <ShieldAlert size={16} /> {accountError}
                </div>
              )}
              {accountSuccess && (
                <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm flex items-center gap-2 font-medium">
                  <Check size={16} /> {accountSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateAccount} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Username</label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-secondary/60 border border-border text-white focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-11 max-w-md" />
                </div>

                <div className="w-full h-[1px] bg-border/50" />

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Change Password</h3>
                  <div className="space-y-4 max-w-lg">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Current Password</label>
                      <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-secondary/60 border border-border text-white focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-11" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-white/80 tracking-wider">New Password</label>
                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-secondary/60 border border-border text-white focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-11" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Confirm Password</label>
                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-secondary/60 border border-border text-white focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-11" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-start">
                  <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl px-6 h-10 shadow-md">
                    Save Account Changes
                  </Button>
                </div>
              </form>

              {/* Password Recovery Code Generator */}
              <div className="w-full h-[1px] bg-border/50" />
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Password Recovery</h3>
                <p className="text-xs text-white/70 leading-relaxed max-w-lg">
                  Set up or generate a new Recovery Code. In case you lose your password, you can use this code to recover your account without email APIs.
                </p>
                
                {recoveryCode ? (
                  <div className="bg-secondary/60 p-4 rounded-xl border border-border flex flex-col items-center gap-2 select-text shadow-inner max-w-md">
                    <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Your Recovery Code (Save this safely!)</span>
                    <span className="font-mono text-xl tracking-wider text-white font-bold">{recoveryCode}</span>
                  </div>
                ) : (
                  <Button onClick={handleGenerateRecoveryCode} disabled={loading} className="bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl h-10 px-5">
                    Generate Recovery Code
                  </Button>
                )}
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="w-full h-[1px] bg-rose-500/20" />
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Danger Zone</h3>
                
                {!showDeleteConfirm ? (
                  <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" className="bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 rounded-xl font-semibold">
                    Delete Account
                  </Button>
                ) : (
                  <div className="p-5 bg-rose-500/10 border border-rose-500/25 rounded-2xl space-y-4 max-w-lg">
                    <p className="text-xs text-rose-400 font-semibold leading-relaxed">
                      Warning: This action is permanent! Deleting your account will delete your servers, messages, friends list, and profile.
                    </p>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-rose-400">Enter Password to Confirm</label>
                      <Input type="password" value={deleteConfirmPassword} onChange={(e) => setDeleteConfirmPassword(e.target.value)} className="bg-background border border-rose-500/40 text-white focus-visible:ring-1 focus-visible:ring-rose-500 rounded-xl h-11" placeholder="Password" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button onClick={() => setShowDeleteConfirm(false)} variant="ghost" className="text-white/70 hover:text-white rounded-xl">
                        Cancel
                      </Button>
                      <Button onClick={handleDeleteAccount} disabled={loading} className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-5">
                        Confirm Delete Account
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeSubTab === 'profile' ? (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white font-display">Profiles</h2>

              {profileError && (
                <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl text-sm flex items-center gap-2 font-medium">
                  <ShieldAlert size={16} /> {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm flex items-center gap-2 font-medium">
                  <Check size={16} /> {profileSuccess}
                </div>
              )}

              {/* Profile Avatar Header */}
              <div className="flex items-center gap-5 pb-6 border-b border-border/50">
                <div className="w-20 h-20 rounded-full bg-secondary p-1 relative shrink-0 shadow-lg border border-border">
                  {avatarUrl ? (
                    <img src={getFileUrl(avatarUrl)} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-2xl font-bold uppercase text-white">
                      {user?.username[0]}
                    </div>
                  )}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Upload size={18} className="text-white" />
                  </button>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-white leading-tight font-display">{displayName || user?.username}</h3>
                  <p className="text-white/70 text-sm font-medium">@{user?.username}</p>
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-primary font-semibold hover:underline mt-1 self-start"
                  >
                    Change Avatar
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Display Name</label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-secondary/60 border border-border text-white focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full min-h-[110px] p-3 rounded-xl bg-secondary/60 border border-border text-white text-sm focus:outline-none resize-none focus:ring-1 focus:ring-primary" placeholder="Tell us about yourself" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Status Message</label>
                  <Input value={statusMessage} onChange={(e) => setStatusMessage(e.target.value)} className="bg-secondary/60 border border-border text-white focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-11" placeholder="What's on your mind?" />
                </div>
                <div className="flex justify-start">
                  <Button type="submit" disabled={loading || uploading} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl px-6 h-10 shadow-md">
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white font-display">Voice & Video Settings</h2>
              
              {/* Audio Devices configuration */}
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Input Device</label>
                    <select
                      value={inputDeviceId}
                      onChange={(e) => setInputDeviceId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-secondary/60 border border-border text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="default">Default Input Device</option>
                      {devices.filter(d => d.kind === 'audioinput').map(dev => (
                        <option key={dev.deviceId} value={dev.deviceId}>
                          {dev.label || `Microphone (${dev.deviceId.slice(0, 5)})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Output Device</label>
                    <select
                      value={outputDeviceId}
                      onChange={(e) => setOutputDeviceId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-secondary/60 border border-border text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="default">Default Output Device</option>
                      {devices.filter(d => d.kind === 'audiooutput').map(dev => (
                        <option key={dev.deviceId} value={dev.deviceId}>
                          {dev.label || `Speaker/Headphones (${dev.deviceId.slice(0, 5)})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-border/50" />

                {/* Audio Volume Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Input Volume (Mic)</label>
                      <span className="text-xs text-white/80 font-semibold">{Math.round(micVolume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mic size={18} className="text-white/70" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={micVolume}
                        onChange={(e) => setMicVolume(parseFloat(e.target.value))}
                        className="w-full accent-primary bg-secondary/60 h-2 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Output Volume (Master)</label>
                      <span className="text-xs text-white/80 font-semibold">{Math.round(outputVolume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 size={18} className="text-white/70" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={outputVolume}
                        onChange={(e) => setOutputVolume(parseFloat(e.target.value))}
                        className="w-full accent-primary bg-secondary/60 h-2 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-border/50" />

                {/* Mic Level Test Meter */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mic Test</h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Having trouble? Let's check your mic level. Click the button below to start monitoring.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Button
                      onClick={isTestingMic ? stopMicTest : startMicTest}
                      className={`w-full sm:w-auto font-semibold rounded-xl h-10 min-w-[120px] transition-colors ${
                        isTestingMic 
                          ? "bg-rose-600 text-white hover:bg-rose-700" 
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {isTestingMic ? "Stop Test" : "Test Mic"}
                    </Button>

                    <div className="flex-1 w-full bg-secondary/60 h-3 rounded-full overflow-hidden relative border border-border">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-75"
                        style={{ width: `${micLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="absolute top-4 right-4 md:top-14 md:right-10 flex flex-col items-center gap-2 z-50">
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full border border-border text-white/80 hover:bg-white/10 hover:text-white" onClick={onClose}>
            <X size={18} />
          </Button>
          <span className="hidden md:block text-[10px] font-bold text-white/60">ESC</span>
        </div>

        {/* Interactive Image Frame Selector / Cropper Modal */}
        {cropImageSrc && (
          <ImageCropModal
            imageSrc={cropImageSrc}
            aspect={1}
            cropShape="circle"
            title="Select Profile Avatar Frame"
            onCropSave={(file) => uploadCroppedAvatar(file)}
            onClose={() => setCropImageSrc(null)}
          />
        )}
      </div>
    </div>
  )
}
