import { useState } from "react"
import { useServerSettings, Role } from "@/hooks/useServerSettings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Search } from "lucide-react"

export default function ServerSettingsModal({ serverId, serverName, onClose }: { serverId: string, serverName: string, onClose: () => void }) {
  const { roles, createRole, members, updateMemberRole } = useServerSettings(serverId)
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'members'>('overview')
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleColor, setNewRoleColor] = useState("#99aab5")

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) return
    await createRole(newRoleName, newRoleColor, ['VIEW_CHANNEL', 'SEND_MESSAGES'])
    setNewRoleName("")
  }

  return (
    <div className="fixed inset-0 bg-[#313338] z-50 flex overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-[280px] bg-[#2b2d31] flex flex-col items-end py-14 pr-4 border-r border-[#1e1f22]">
        <div className="w-full max-w-[200px] space-y-1">
          <div className="px-2 mb-2">
            <h3 className="text-xs font-bold uppercase text-[#949ba4] truncate">{serverName}</h3>
          </div>
          <div onClick={() => setActiveTab('overview')} className={`px-2 py-1.5 rounded cursor-pointer ${activeTab === 'overview' ? 'bg-[#3f4147] text-white' : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}>Overview</div>
          <div onClick={() => setActiveTab('roles')} className={`px-2 py-1.5 rounded cursor-pointer ${activeTab === 'roles' ? 'bg-[#3f4147] text-white' : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}>Roles</div>
          <div onClick={() => setActiveTab('members')} className={`px-2 py-1.5 rounded cursor-pointer ${activeTab === 'members' ? 'bg-[#3f4147] text-white' : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}>Members</div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 bg-[#313338] p-10 py-14 overflow-y-auto relative">
        <div className="max-w-[740px]">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white">Server Overview</h2>
              <p className="text-[#949ba4]">This is where you would edit the server name, icon, and banner.</p>
            </div>
          )}

          {activeTab === 'roles' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white">Roles</h2>
              <div className="bg-[#2b2d31] p-4 rounded-lg mb-6 border border-[#1e1f22]">
                <h3 className="text-sm font-bold text-white mb-4 uppercase">Create Role</h3>
                <form onSubmit={handleCreateRole} className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold uppercase text-[#b5bac1]">Role Name</label>
                    <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="bg-[#1e1f22] border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0" placeholder="New Role" />
                  </div>
                  <div className="w-24 space-y-2">
                    <label className="text-xs font-bold uppercase text-[#b5bac1]">Color</label>
                    <Input type="color" value={newRoleColor} onChange={(e) => setNewRoleColor(e.target.value)} className="h-9 p-1 bg-[#1e1f22] border-none cursor-pointer" />
                  </div>
                  <Button type="submit" className="bg-[#5865f2] text-white hover:bg-[#4752c4]">Create</Button>
                </form>
              </div>

              <div className="space-y-2">
                {roles.map(role => (
                  <div key={role.id} className="flex items-center justify-between p-3 rounded bg-[#2b2d31] border border-[#1e1f22]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></div>
                      <span className="font-medium text-white">{role.name}</span>
                    </div>
                    <span className="text-xs text-[#949ba4]">{role.permissions.length} permissions</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white">Server Members</h2>
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded bg-[#2b2d31] border border-[#1e1f22]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-xs font-bold uppercase text-white shrink-0">
                        {member.username[0]}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-white truncate">{member.display_name || member.username}</span>
                        <span className="text-xs text-[#949ba4]">@{member.username}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#b5bac1]">Role:</span>
                      <select 
                        value={member.role_id || ""} 
                        onChange={(e) => updateMemberRole(member.id, e.target.value || null)}
                        className="bg-[#1e1f22] border-none rounded text-xs text-white p-1.5 focus:outline-none cursor-pointer"
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
                  <p className="text-[#949ba4] text-center py-8">No members found.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="absolute top-14 right-10 flex flex-col items-center gap-2">
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full border-2 border-[#b5bac1] text-[#b5bac1] hover:bg-[#35373c] hover:text-white" onClick={onClose}>
            <X size={18} />
          </Button>
          <span className="text-[10px] font-bold text-[#b5bac1]">ESC</span>
        </div>
      </div>
    </div>
  )
}
