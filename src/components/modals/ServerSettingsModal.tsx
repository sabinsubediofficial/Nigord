import { useState, useEffect, useRef } from "react"
import { useServerSettings } from "@/hooks/useServerSettings"
import { useAuthStore } from "@/store/useAuthStore"
import { useServerStore } from "@/store/useServerStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { apiFetch, getFileUrl } from "@/lib/api"
import ImageCropModal from "./ImageCropModal"
import ImageLightboxModal from "./ImageLightboxModal"

export default function ServerSettingsModal({ 
  serverId, 
  serverName, 
  ownerId, 
  onClose 
}: { 
  serverId: string
  serverName: string
  ownerId: string
  onClose: () => void 
}) {
  const { user } = useAuthStore()
  const { servers, setServers, setCurrentServer } = useServerStore()
  const isOwner = user?.id === ownerId

  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  const server = servers.find(s => s.id === serverId)

  const { 
    roles, 
    createRole, 
    members, 
    updateMemberRole, 
    updateServer, 
    deleteServer, 
    transferOwnership 
  } = useServerSettings(serverId)

  // Tab control with state management persistence
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'members'>(() => {
    const saved = localStorage.getItem('suhhp_serverSettingsTab');
    return (saved as any) || 'overview';
  });

  useEffect(() => {
    localStorage.setItem('suhhp_serverSettingsTab', activeTab);
  }, [activeTab]);
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleColor, setNewRoleColor] = useState("#99aab5")

  // Overview States
  const [name, setName] = useState(serverName)
  const [iconUrl, setIconUrl] = useState(server?.icon || "")
  const [bannerUrl, setBannerUrl] = useState(server?.banner || "")

  const iconInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [transferTargetUserId, setTransferTargetUserId] = useState("")
  const [showTransferConfirm, setShowTransferConfirm] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
        } else if (showTransferConfirm) {
          setShowTransferConfirm(false)
        } else {
          if (!uploadingIcon && !uploadingBanner) {
            onClose()
          }
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, uploadingIcon, uploadingBanner, showDeleteConfirm, showTransferConfirm])

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) return
    await createRole(newRoleName, newRoleColor, ['VIEW_CHANNEL', 'SEND_MESSAGES'])
    setNewRoleName("")
  }

  // Image Crop & Lightbox Preview State
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [cropAspect, setCropAspect] = useState<number>(1)
  const [cropShape, setCropShape] = useState<'circle' | 'rounded-square' | 'rect'>('rounded-square')
  const [cropTitle, setCropTitle] = useState<string>("Crop Image")
  const [cropTarget, setCropTarget] = useState<'icon' | 'banner'>('icon')

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg("Icon size exceeds maximum limit of 25MB")
      if (iconInputRef.current) iconInputRef.current.value = ""
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result as string)
      setCropTarget('icon')
      setCropAspect(1)
      setCropShape('rounded-square')
      setCropTitle("Select Server Icon Frame")
    }
    reader.readAsDataURL(file)
    if (iconInputRef.current) iconInputRef.current.value = ""
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg("Banner size exceeds maximum limit of 25MB")
      if (bannerInputRef.current) bannerInputRef.current.value = ""
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result as string)
      setCropTarget('banner')
      setCropAspect(16 / 9)
      setCropShape('rect')
      setCropTitle("Select Server Banner Frame")
    }
    reader.readAsDataURL(file)
    if (bannerInputRef.current) bannerInputRef.current.value = ""
  }

  const uploadCroppedFile = async (croppedFile: File) => {
    const formData = new FormData()
    formData.append('file', croppedFile)
    
    if (cropTarget === 'icon') setUploadingIcon(true)
    else setUploadingBanner(true)
    
    setErrorMsg("")
    setSuccessMsg("")
    try {
      const res = await apiFetch('/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        if (cropTarget === 'icon') {
          setIconUrl(data.url)
          setSuccessMsg("Icon uploaded! Click Save Changes to apply.")
        } else {
          setBannerUrl(data.url)
          setSuccessMsg("Banner uploaded! Click Save Changes to apply.")
        }
      } else {
        const data = await res.json()
        setErrorMsg(data.error || "Upload failed")
      }
    } catch (err) {
      setErrorMsg("Upload failed")
    } finally {
      setUploadingIcon(false)
      setUploadingBanner(false)
    }
  }

  const handleUpdateServerSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setErrorMsg("")
    setSuccessMsg("")
    const ok = await updateServer({ 
      name: name.trim(), 
      icon: iconUrl || null, 
      banner: bannerUrl || null 
    })
    if (ok) {
      const updatedServers = servers.map(s => 
        s.id === serverId 
          ? { ...s, name: name.trim(), icon: iconUrl || null, banner: bannerUrl || null } 
          : s
      )
      setServers(updatedServers)
      const updatedCurrent = updatedServers.find(s => s.id === serverId)
      if (updatedCurrent) {
        setCurrentServer(updatedCurrent)
      }
      setSuccessMsg("Server settings updated successfully!")
    } else {
      setErrorMsg("Failed to update server settings.")
    }
  }

  const handleDeleteServer = async () => {
    setErrorMsg("")
    const ok = await deleteServer()
    if (ok) {
      onClose()
      window.location.reload()
    } else {
      setErrorMsg("Failed to delete server.")
    }
  }

  const handleTransferOwnership = async () => {
    if (!transferTargetUserId) return
    setErrorMsg("")
    const ok = await transferOwnership(transferTargetUserId)
    if (ok) {
      setSuccessMsg("Ownership transferred successfully!")
      setShowTransferConfirm(false)
      onClose()
      window.location.reload()
    } else {
      setErrorMsg("Failed to transfer ownership.")
    }
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-full md:w-[280px] bg-secondary flex flex-col items-center md:items-end py-4 md:py-14 px-4 md:pr-4 border-b md:border-b-0 md:border-r border-border shrink-0">
        <div className="w-full max-w-[200px] flex md:flex-col gap-2 md:gap-1 items-center md:items-stretch overflow-x-auto no-scrollbar py-2 md:py-0">
          <div className="hidden md:block px-2 mb-2">
            <h3 className="text-xs font-bold uppercase text-white/70 truncate">{serverName}</h3>
          </div>
          <div 
            onClick={() => setActiveTab('overview')} 
            className={`px-3 py-1.5 md:px-2 rounded cursor-pointer transition-colors text-center md:text-left shrink-0 ${activeTab === 'overview' ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
          >
            Overview
          </div>
          <div 
            onClick={() => setActiveTab('roles')} 
            className={`px-3 py-1.5 md:px-2 rounded cursor-pointer transition-colors text-center md:text-left shrink-0 ${activeTab === 'roles' ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
          >
            Roles
          </div>
          <div 
            onClick={() => setActiveTab('members')} 
            className={`px-3 py-1.5 md:px-2 rounded cursor-pointer transition-colors text-center md:text-left shrink-0 ${activeTab === 'members' ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
          >
            Members
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 bg-background p-4 py-8 md:p-10 md:py-14 overflow-y-auto relative">
        <div className="max-w-[740px]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6 text-white font-display">Server Overview</h2>

              {successMsg && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              {isOwner ? (
                <div className="space-y-8">
                  {/* Server Settings Form */}
                  <form onSubmit={handleUpdateServerSettings} className="space-y-8">
                    {/* Upload Settings (Icon and Banner) */}
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Server Icon */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-white/80 tracking-wider block">Server Icon</label>
                        <div 
                          onClick={() => {
                            if (iconUrl) {
                              setPreviewImageSrc(getFileUrl(iconUrl))
                            } else {
                              iconInputRef.current?.click()
                            }
                          }}
                          className="relative group w-24 h-24 rounded-2xl overflow-hidden bg-secondary/60 border border-border flex items-center justify-center cursor-pointer hover:border-primary transition-all shadow-md"
                        >
                          {iconUrl ? (
                            <img src={getFileUrl(iconUrl)} className="w-full h-full object-cover" alt="Server Icon" />
                          ) : (
                            <span className="text-2xl font-bold text-white uppercase font-display">{name.substring(0, 2)}</span>
                          )}
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-[11px] text-white font-bold transition-opacity backdrop-blur-[2px]">
                            {iconUrl ? (
                              <>
                                <span className="hover:text-primary transition-colors py-0.5 flex items-center gap-1">🔍 View Preview</span>
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setCropImageSrc(getFileUrl(iconUrl))
                                    setCropTarget('icon')
                                    setCropAspect(1)
                                    setCropShape('rounded-square')
                                    setCropTitle("Adjust Server Icon Frame")
                                  }}
                                  className="hover:text-primary transition-colors py-0.5 flex items-center gap-1"
                                >
                                  ✏️ Adjust Frame
                                </span>
                                <span 
                                  onClick={(e) => { e.stopPropagation(); iconInputRef.current?.click(); }}
                                  className="hover:text-primary transition-colors py-0.5 flex items-center gap-1"
                                >
                                  📷 Change
                                </span>
                              </>
                            ) : (
                              <span>{uploadingIcon ? "UPLOADING..." : "UPLOAD"}</span>
                            )}
                          </div>
                        </div>
                        <input 
                          type="file" 
                          ref={iconInputRef} 
                          onChange={handleIconUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        <div className="flex flex-wrap gap-2 pt-1 text-xs">
                          {iconUrl ? (
                            <>
                              <button
                                type="button"
                                className="text-white/80 hover:text-white font-semibold"
                                onClick={() => setPreviewImageSrc(getFileUrl(iconUrl))}
                              >
                                View
                              </button>
                              <span className="text-white/30">•</span>
                              <button
                                type="button"
                                className="text-primary hover:underline font-semibold"
                                onClick={() => iconInputRef.current?.click()}
                              >
                                Change
                              </button>
                              <span className="text-white/30">•</span>
                              <button
                                type="button"
                                className="text-white/70 hover:text-white font-semibold"
                                onClick={() => {
                                  setCropImageSrc(getFileUrl(iconUrl))
                                  setCropTarget('icon')
                                  setCropAspect(1)
                                  setCropShape('rounded-square')
                                  setCropTitle("Adjust Server Icon Frame")
                                }}
                              >
                                Adjust Frame
                              </button>
                              <span className="text-white/30">•</span>
                              <button
                                type="button"
                                className="text-rose-400 hover:text-rose-300 font-semibold"
                                onClick={() => setIconUrl("")}
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="text-primary hover:underline font-semibold"
                              onClick={() => iconInputRef.current?.click()}
                            >
                              Upload Icon
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Server Banner */}
                      <div className="flex-1 space-y-2 w-full">
                        <label className="text-xs font-bold uppercase text-white/80 tracking-wider block">Server Banner</label>
                        <div 
                          onClick={() => {
                            if (bannerUrl) {
                              setPreviewImageSrc(getFileUrl(bannerUrl))
                            } else {
                              bannerInputRef.current?.click()
                            }
                          }} 
                          className="relative group h-24 w-full rounded-xl bg-secondary/60 border border-border border-dashed flex items-center justify-center cursor-pointer hover:border-primary overflow-hidden transition-all shadow-inner"
                        >
                          {bannerUrl ? (
                            <img src={getFileUrl(bannerUrl)} className="w-full h-full object-cover" alt="Server Banner" />
                          ) : (
                            <div className="text-center text-xs text-white/70 p-4">
                              <p className="font-semibold">{uploadingBanner ? "Uploading..." : "Click to upload banner"}</p>
                              <p className="text-[10px] opacity-70 mt-1">Recommended size: 960x540</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-xs text-white font-bold transition-opacity backdrop-blur-[2px]">
                            {bannerUrl ? (
                              <>
                                <span className="hover:text-primary transition-colors">🔍 View Preview</span>
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setCropImageSrc(getFileUrl(bannerUrl))
                                    setCropTarget('banner')
                                    setCropAspect(16 / 9)
                                    setCropShape('rect')
                                    setCropTitle("Adjust Server Banner Frame")
                                  }}
                                  className="hover:text-primary transition-colors"
                                >
                                  ✏️ Adjust Frame
                                </span>
                                <span 
                                  onClick={(e) => { e.stopPropagation(); bannerInputRef.current?.click(); }}
                                  className="hover:text-primary transition-colors"
                                >
                                  📷 Change Banner
                                </span>
                              </>
                            ) : (
                              <span>UPLOAD BANNER</span>
                            )}
                          </div>
                        </div>
                        <input 
                          type="file" 
                          ref={bannerInputRef} 
                          onChange={handleBannerUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        <div className="flex flex-wrap gap-2 pt-1 text-xs">
                          {bannerUrl ? (
                            <>
                              <button
                                type="button"
                                className="text-white/80 hover:text-white font-semibold"
                                onClick={() => setPreviewImageSrc(getFileUrl(bannerUrl))}
                              >
                                View
                              </button>
                              <span className="text-white/30">•</span>
                              <button
                                type="button"
                                className="text-primary hover:underline font-semibold"
                                onClick={() => bannerInputRef.current?.click()}
                              >
                                Change Banner
                              </button>
                              <span className="text-white/30">•</span>
                              <button
                                type="button"
                                className="text-white/70 hover:text-white font-semibold"
                                onClick={() => {
                                  setCropImageSrc(getFileUrl(bannerUrl))
                                  setCropTarget('banner')
                                  setCropAspect(16 / 9)
                                  setCropShape('rect')
                                  setCropTitle("Adjust Server Banner Frame")
                                }}
                              >
                                Adjust Frame
                              </button>
                              <span className="text-white/30">•</span>
                              <button
                                type="button"
                                className="text-rose-400 hover:text-rose-300 font-semibold"
                                onClick={() => setBannerUrl("")}
                              >
                                Remove Banner
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="text-primary hover:underline font-semibold"
                              onClick={() => bannerInputRef.current?.click()}
                            >
                              Upload Banner
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 max-w-md">
                      <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Server Name</label>
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="bg-secondary/60 border border-border text-white focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-11" 
                      />
                    </div>
                    <div className="flex justify-start">
                      <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl px-6 h-10 shadow-md">
                        Save Changes
                      </Button>
                    </div>
                  </form>

                  {/* Transfer Ownership */}
                  <div className="w-full h-[1px] bg-border/50" />
                  <div className="space-y-4 max-w-lg">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Transfer Ownership</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Transfer this server to another member. This action cannot be undone.
                    </p>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Select Member</label>
                        <select
                          value={transferTargetUserId}
                          onChange={(e) => setTransferTargetUserId(e.target.value)}
                          className="w-full bg-secondary/60 border border-border rounded-xl text-white p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Choose a member...</option>
                          {members
                            .filter((m) => m.id !== user?.id)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.display_name || m.username} (@{m.username})
                              </option>
                            ))}
                        </select>
                      </div>
                      <Button 
                        onClick={() => transferTargetUserId && setShowTransferConfirm(true)} 
                        disabled={!transferTargetUserId} 
                        className="bg-white/10 text-white hover:bg-white/20 font-semibold rounded-xl h-11 px-5"
                      >
                        Transfer
                      </Button>
                    </div>

                    {showTransferConfirm && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-4">
                        <p className="text-xs text-amber-400 font-semibold leading-relaxed">
                          Are you sure you want to transfer server ownership? You will lose owner permissions.
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button onClick={() => setShowTransferConfirm(false)} variant="ghost" className="text-white/70 hover:text-white rounded-xl">
                            Cancel
                          </Button>
                          <Button onClick={handleTransferOwnership} className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl px-5">
                            Confirm Transfer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Danger Zone: Delete Server */}
                  <div className="w-full h-[1px] bg-rose-500/20" />
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Danger Zone</h3>
                    {!showDeleteConfirm ? (
                      <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" className="bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 rounded-xl font-semibold">
                        Delete Server
                      </Button>
                    ) : (
                      <div className="p-5 bg-rose-500/10 border border-rose-500/25 rounded-2xl space-y-4 max-w-lg">
                        <p className="text-xs text-rose-400 font-semibold leading-relaxed">
                          Warning: This action is permanent! Deleting the server will permanently delete all channels, messages, invites, and settings.
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button onClick={() => setShowDeleteConfirm(false)} variant="ghost" className="text-white/70 hover:text-white rounded-xl">
                            Cancel
                          </Button>
                          <Button onClick={handleDeleteServer} className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-5">
                            Confirm Delete Server
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <p className="text-sm text-white/80 font-medium">You are viewing server settings as an administrator.</p>
                  <p className="text-xs text-white/60">Only the server owner can rename the server, transfer ownership, or delete it.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white font-display">Roles</h2>
              
              <div className="space-y-4 max-w-xl pb-6 border-b border-border/50">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Role</h3>
                <form onSubmit={handleCreateRole} className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Role Name</label>
                    <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="bg-secondary/60 border border-border text-white focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-11" placeholder="New Role" />
                  </div>
                  <div className="w-24 space-y-2">
                    <label className="text-xs font-bold uppercase text-white/80 tracking-wider">Color</label>
                    <Input type="color" value={newRoleColor} onChange={(e) => setNewRoleColor(e.target.value)} className="h-11 p-1 bg-secondary/60 border border-border cursor-pointer rounded-xl" />
                  </div>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl h-11 px-6 shadow-md">Create</Button>
                </form>
              </div>

              <div className="space-y-2.5 max-w-xl">
                {roles.map(role => (
                  <div key={role.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-secondary/40">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: role.color }}></div>
                      <span className="font-semibold text-white">{role.name}</span>
                    </div>
                    <span className="text-xs text-white/70 font-medium">{role.permissions.length} permissions</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white font-display">Server Members</h2>
              <div className="space-y-2.5 max-w-xl">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-secondary/40">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold uppercase text-white shrink-0 overflow-hidden">
                        {member.avatar ? (
                          <img src={getFileUrl(member.avatar)} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                          member.username[0]
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-white truncate">{member.display_name || member.username}</span>
                        <span className="text-xs text-white/70">@{member.username}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/70 font-medium">Role:</span>
                      <select 
                        value={member.role_id || ""} 
                        onChange={(e) => updateMemberRole(member.id, e.target.value || null)}
                        disabled={member.id === ownerId}
                        className="bg-secondary/60 border border-border rounded-xl text-xs text-white p-2 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">No Role</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-white/70 text-center py-8 font-medium">No members found.</p>
                )}
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

        {/* Full Screen Image Lightbox Preview */}
        <ImageLightboxModal
          imageUrl={previewImageSrc}
          onClose={() => setPreviewImageSrc(null)}
        />

        {/* Interactive Image Frame Selector / Cropper Modal */}
        {cropImageSrc && (
          <ImageCropModal
            imageSrc={cropImageSrc}
            aspect={cropAspect}
            cropShape={cropShape}
            title={cropTitle}
            onCropSave={(file) => uploadCroppedFile(file)}
            onClose={() => setCropImageSrc(null)}
          />
        )}
      </div>
    </div>
  )
}
