import { useState, useRef, useEffect } from "react"
import { ChevronDown, Plus, MessageSquare, Compass, Settings, LogOut, Check, UserPlus } from "lucide-react"
import { getFileUrl } from "@/lib/api"
import { useAuthStore } from "@/store/useAuthStore"

interface WorkspaceSwitcherProps {
  servers: any[]
  currentServer: any | null
  activeTab: 'home' | 'server'
  goHome: () => void
  onSelectServer: (server: any) => void
  onAddServer: () => void
  onLogout?: () => void
  onInvite?: () => void
  onSettings?: () => void
  onCreateChannel?: () => void
  onLeave?: () => void
  isOwner?: boolean
  isAdmin?: boolean
  isManageChannels?: boolean
}

export function WorkspaceSwitcher({
  servers,
  currentServer,
  activeTab,
  goHome,
  onSelectServer,
  onAddServer,
  onLogout,
  onInvite,
  onSettings,
  onCreateChannel,
  onLeave,
  isOwner,
  isAdmin,
  isManageChannels
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const currentName = activeTab === 'home' ? 'Direct Messages' : currentServer?.name || 'Suhhp'
  
  return (
    <div className="relative z-50 w-full shrink-0" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-transparent hover:bg-white/5 transition-colors border-b border-[#27292d]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-[8px] bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden text-primary font-bold">
            {activeTab === 'home' ? (
              <MessageSquare size={16} />
            ) : currentServer?.icon ? (
              <img src={getFileUrl(currentServer.icon)} alt={currentServer.name} className="w-full h-full object-cover" />
            ) : (
              currentServer?.name?.[0]
            )}
          </div>
          <span className="font-bold text-white truncate display-font">{currentName}</span>
        </div>
        <ChevronDown size={16} className={`text-[#a1a1aa] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-2 right-2 mt-2 bg-[#09090b]/95 backdrop-blur-xl border border-[#27292d] rounded-xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Server Actions if we are in a server */}
          {activeTab === 'server' && currentServer && (
            <div className="mb-2 px-2 py-1">
              <div className="text-[10px] font-bold uppercase text-primary tracking-widest mb-2">{currentServer.name} Actions</div>
              
              <button 
                onClick={() => { onInvite?.(); setIsOpen(false); }}
                className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors"
              >
                <span>Invite People</span>
                <UserPlus size={16} />
              </button>
              
              {(isOwner || isAdmin || isManageChannels) && (
                <button 
                  onClick={() => { onCreateChannel?.(); setIsOpen(false); }}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm font-medium text-[#a1a1aa] hover:bg-primary hover:text-white transition-colors"
                >
                  <span>Create Channel</span>
                  <Plus size={16} />
                </button>
              )}
              
              {(isOwner || isAdmin) && (
                <button 
                  onClick={() => { onSettings?.(); setIsOpen(false); }}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm font-medium text-[#a1a1aa] hover:bg-primary hover:text-white transition-colors"
                >
                  <span>Server Settings</span>
                  <Settings size={16} />
                </button>
              )}
              
              {!isOwner && (
                <button 
                  onClick={() => { onLeave?.(); setIsOpen(false); }}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500 hover:text-white transition-colors mt-1"
                >
                  <span>Leave Server</span>
                  <LogOut size={16} />
                </button>
              )}
              
              <div className="w-full h-[1px] bg-white/5 my-2" />
            </div>
          )}


          <div className="mb-2 px-2 py-1">
            <div className="text-[10px] font-bold uppercase text-[#a1a1aa] tracking-widest mb-2">Navigation</div>
            
            <button 
              onClick={() => { goHome(); setIsOpen(false); }}
              className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'home' ? 'bg-primary/20 text-primary' : 'text-[#a1a1aa] hover:bg-white/5 hover:text-white'}`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={16} /> Direct Messages
              </div>
              {activeTab === 'home' && <Check size={16} />}
            </button>
          </div>

          <div className="w-full h-[1px] bg-white/5 my-1" />

          <div className="mt-2 px-2 py-1 max-h-[250px] overflow-y-auto no-scrollbar">
            <div className="text-[10px] font-bold uppercase text-[#a1a1aa] tracking-widest mb-2 flex items-center justify-between">
              Your Servers
            </div>
            
            {servers.map(server => (
              <button
                key={server.id}
                onClick={() => { onSelectServer(server); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'server' && currentServer?.id === server.id ? 'bg-primary/20 text-primary' : 'text-[#a1a1aa] hover:bg-white/5 hover:text-white'}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-[6px] bg-white/10 flex items-center justify-center shrink-0 overflow-hidden text-xs font-bold text-white">
                    {server.icon ? (
                      <img src={getFileUrl(server.icon)} alt={server.name} className="w-full h-full object-cover" />
                    ) : (
                      server.name[0]
                    )}
                  </div>
                  <span className="truncate">{server.name}</span>
                </div>
                {activeTab === 'server' && currentServer?.id === server.id && <Check size={16} />}
              </button>
            ))}

            <button 
              onClick={() => { onAddServer(); setIsOpen(false); }}
              className="w-full flex items-center justify-between px-2 py-2 mt-1 rounded-lg text-sm font-medium text-emerald-400 hover:bg-emerald-400/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[6px] bg-emerald-400/20 flex items-center justify-center shrink-0">
                  <Plus size={14} />
                </div>
                Add Server
              </div>
            </button>
          </div>
          
          <div className="w-full h-[1px] bg-white/5 my-1" />
          
          <div className="px-2 py-1">
            <button 
              onClick={() => { onLogout?.(); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-400/10 transition-colors"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
