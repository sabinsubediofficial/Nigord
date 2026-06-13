import { useState, useEffect, useRef } from "react"
import { useServerSettings } from "@/hooks/useServerSettings"
import { useAuthStore } from "@/store/useAuthStore"
import { useServerStore } from "@/store/useServerStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { apiFetch, getFileUrl } from "@/lib/api"

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

  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'members'>('overview')
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

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg("Icon size exceeds maximum limit of 25MB")
      if (iconInputRef.current) iconInputRef.current.value = ""
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    
    setUploadingIcon(true)
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
        setIconUrl(data.url)
        setSuccessMsg("Icon uploaded! Click Save Changes to apply.")
      } else {
        const data = await res.json()
        setErrorMsg(data.error || "Upload failed")
        if (iconInputRef.current) iconInputRef.current.value = ""
      }
    } catch (err) {
      setErrorMsg("Upload failed")
      if (iconInputRef.current) iconInputRef.current.value = ""
    } finally {
      setUploadingIcon(false)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg("Banner size exceeds maximum limit of 25MB")
      if (bannerInputRef.current) bannerInputRef.current.value = ""
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    
    setUploadingBanner(true)
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
        setBannerUrl(data.url)
        setSuccessMsg("Banner uploaded! Click Save Changes to apply.")
      } else {
        const data = await res.json()
        setErrorMsg(data.error || "Upload failed")
        if (bannerInputRef.current) bannerInputRef.current.value = ""
      }
    } catch (err) {
      setErrorMsg("Upload failed")
      if (bannerInputRef.current) bannerInputRef.current.value = ""
    } finally {
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
    <div className="fixed inset-0 bg-[#141517] z-50 flex overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-[280px] bg-[#1e2022] flex flex-col items-end py-14 pr-4 border-r border-[#2d2f31]">
        <div className="w-full max-w-[200px] space-y-1">
          <div className="px-2 mb-2">
            <h3 className="text-xs font-bold uppercase text-[#a3a29e] truncate">{serverName}</h3>
          </div>
          <div 
            onClick={() => setActiveTab('overview')} 
            className={`px-2 py-1.5 rounded cursor-pointer transition-colors ${activeTab === 'overview' ? 'bg-[#2d2f31] text-[#e3e1db]' : 'text-[#a3a29e] hover:bg-[#2d2f31] hover:text-[#e3e1db]'}`}
          >
            Overview
          </div>
          <div 
            onClick={() => setActiveTab('roles')} 
            className={`px-2 py-1.5 rounded cursor-pointer transition-colors ${activeTab === 'roles' ? 'bg-[#2d2f31] text-[#e3e1db]' : 'text-[#a3a29e] hover:bg-[#2d2f31] hover:text-[#e3e1db]'}`}
          >
            Roles
          </div>
          <div 
            onClick={() => setActiveTab('members')} 
            className={`px-2 py-1.5 rounded cursor-pointer transition-colors ${activeTab === 'members' ? 'bg-[#2d2f31] text-[#e3e1db]' : 'text-[#a3a29e] hover:bg-[#2d2f31] hover:text-[#e3e1db]'}`}
          >
            Members
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 bg-[#141517] p-10 py-14 overflow-y-auto relative">
        <div className="max-w-[740px]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6 text-[#e3e1db]">Server Overview</h2>

              {successMsg && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg text-sm">
                  {errorMsg}
                </div>
              )}

              {isOwner ? (
                <div className="bg-[#1e2022] rounded-xl p-6 border border-[#2d2f31] space-y-6">
                  {/* Server Settings Form */}
                  <form onSubmit={handleUpdateServerSettings} className="space-y-6">
                    {/* Upload Settings (Icon and Banner) */}
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Server Icon */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-[#a3a29e] tracking-wider block">Server Icon</label>
                        <div 
                          onClick={() => iconInputRef.current?.click()}
                          className="relative group w-24 h-24 rounded-full overflow-hidden bg-[#141517] border-2 border-[#2d2f31] flex items-center justify-center cursor-pointer hover:border-[#5865f2] transition-all"
                        >
                          {iconUrl ? (
                            <img src={getFileUrl(iconUrl)} className="w-full h-full object-cover" alt="Server Icon" />
                          ) : (
                            <span className="text-xl font-bold text-[#a3a29e] uppercase">{name.substring(0, 2)}</span>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-bold transition-opacity">
                            <span>{uploadingIcon ? "UPLOADING..." : "CHANGE"}</span>
                          </div>
                        </div>
                        <input 
                          type="file" 
                          ref={iconInputRef} 
                          onChange={handleIconUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        {iconUrl && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-transparent p-0"
                            onClick={(e) => { e.stopPropagation(); setIconUrl(""); }}
                          >
                            Remove Icon
                          </Button>
                        )}
                      </div>

                      {/* Server Banner */}
                      <div className="flex-1 space-y-2 w-full">
                        <label className="text-xs font-bold uppercase text-[#a3a29e] tracking-wider block">Server Banner</label>
                        <div 
                          onClick={() => bannerInputRef.current?.click()} 
                          className="relative group h-24 w-full rounded-lg bg-[#141517] border-2 border-[#2d2f31] border-dashed flex items-center justify-center cursor-pointer hover:border-[#5865f2] overflow-hidden transition-all"
                        >
                          {bannerUrl ? (
                            <img src={getFileUrl(bannerUrl)} className="w-full h-full object-cover" alt="Server Banner" />
                          ) : (
                            <div className="text-center text-xs text-[#a3a29e] p-4">
                              <p className="font-semibold">{uploadingBanner ? "Uploading..." : "Click to upload banner"}</p>
                              <p className="text-[10px] opacity-70 mt-1">Recommended size: 960x540</p>
                            </div>
                          )}
                          {bannerUrl && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-bold transition-opacity">
                              CHANGE BANNER
                            </div>
                          )}
                        </div>
                        <input 
                          type="file" 
                          ref={bannerInputRef} 
                          onChange={handleBannerUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        {bannerUrl && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-transparent p-0"
                            onClick={(e) => { e.stopPropagation(); setBannerUrl(""); }}
                          >
                            Remove Banner
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-[#a3a29e] tracking-wider">Server Name</label>
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#5865f2]" 
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" className="bg-[#5865f2] text-white hover:bg-[#4752c4] font-semibold rounded-[4px]">
                        Save Changes
                      </Button>
                    </div>
                  </form>

                  {/* Transfer Ownership */}
                  <div className="w-full h-[1px] bg-[#2d2f31]" />
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[#e3e1db] uppercase">Transfer Ownership</h3>
                    <p className="text-xs text-[#a3a29e]">
                      Transfer this server to another member. This action cannot be undone.
                    </p>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold uppercase text-[#a3a29e]">Select Member</label>
                        <select
                          value={transferTargetUserId}
                          onChange={(e) => setTransferTargetUserId(e.target.value)}
                          className="w-full bg-[#141517] border border-[#2d2f31] rounded-md text-[#e3e1db] p-2 focus:outline-none focus:border-[#5865f2]"
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
                        className="bg-[#5865f2] text-white hover:bg-[#4752c4] font-semibold rounded-[4px]"
                      >
                        Transfer
                      </Button>
                    </div>

                    {showTransferConfirm && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-4">
                        <p className="text-xs text-amber-500 font-semibold">
                          Are you sure you want to transfer server ownership? You will lose owner permissions.
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button onClick={() => setShowTransferConfirm(false)} variant="ghost" className="text-[#a3a29e] hover:text-[#e3e1db]">
                            Cancel
                          </Button>
                          <Button onClick={handleTransferOwnership} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                            Confirm Transfer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Danger Zone: Delete Server */}
                  <div className="w-full h-[1px] bg-red-500/20" />
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-red-400 uppercase">Danger Zone</h3>
                    {!showDeleteConfirm ? (
                      <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" className="bg-red-950 text-red-400 border border-red-800/40 hover:bg-red-900">
                        Delete Server
                      </Button>
                    ) : (
                      <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl space-y-4">
                        <p className="text-xs text-red-400 font-semibold">
                          Warning: This action is permanent! Deleting the server will permanently delete all channels, messages, invites, and settings.
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button onClick={() => setShowDeleteConfirm(false)} variant="ghost" className="text-[#a3a29e] hover:text-[#e3e1db]">
                            Cancel
                          </Button>
                          <Button onClick={handleDeleteServer} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                            Confirm Delete Server
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#1e2022] rounded-xl p-6 border border-[#2d2f31] space-y-4 text-center">
                  <p className="text-sm text-[#a3a29e]">You are viewing server settings as an administrator.</p>
                  <p className="text-xs text-[#767572]">Only the server owner can rename the server, transfer ownership, or delete it.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'roles' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-[#e3e1db]">Roles</h2>
              <div className="bg-[#1e2022] p-4 rounded-lg mb-6 border border-[#2d2f31]">
                <h3 className="text-sm font-bold text-[#e3e1db] mb-4 uppercase">Create Role</h3>
                <form onSubmit={handleCreateRole} className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold uppercase text-[#a3a29e]">Role Name</label>
                    <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus:border-[#5865f2]" placeholder="New Role" />
                  </div>
                  <div className="w-24 space-y-2">
                    <label className="text-xs font-bold uppercase text-[#a3a29e]">Color</label>
                    <Input type="color" value={newRoleColor} onChange={(e) => setNewRoleColor(e.target.value)} className="h-9 p-1 bg-[#141517] border border-[#2d2f31] cursor-pointer" />
                  </div>
                  <Button type="submit" className="bg-[#5865f2] text-white hover:bg-[#4752c4] font-semibold rounded-[4px]">Create</Button>
                </form>
              </div>

              <div className="space-y-2">
                {roles.map(role => (
                  <div key={role.id} className="flex items-center justify-between p-3 rounded bg-[#1e2022] border border-[#2d2f31]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></div>
                      <span className="font-medium text-[#e3e1db]">{role.name}</span>
                    </div>
                    <span className="text-xs text-[#a3a29e]">{role.permissions.length} permissions</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-[#e3e1db]">Server Members</h2>
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded bg-[#1e2022] border border-[#2d2f31]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#2d2f31] flex items-center justify-center text-xs font-bold uppercase text-[#e3e1db] shrink-0 overflow-hidden">
                        {member.avatar ? (
                          <img src={getFileUrl(member.avatar)} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                          member.username[0]
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-[#e3e1db] truncate">{member.display_name || member.username}</span>
                        <span className="text-xs text-[#a3a29e]">@{member.username}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#a3a29e]">Role:</span>
                      <select 
                        value={member.role_id || ""} 
                        onChange={(e) => updateMemberRole(member.id, e.target.value || null)}
                        disabled={member.id === ownerId}
                        className="bg-[#141517] border border-[#2d2f31] rounded text-xs text-[#e3e1db] p-1.5 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <p className="text-[#a3a29e] text-center py-8">No members found.</p>
                )}
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
