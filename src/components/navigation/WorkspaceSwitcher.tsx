import { MessageSquare, Plus } from "lucide-react"
import { getFileUrl } from "@/lib/api"

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
}: WorkspaceSwitcherProps) {
  return (
    <nav className="w-[68px] h-full bg-background shrink-0 flex flex-col items-center py-3 gap-1.5 overflow-y-auto no-scrollbar border-r border-border/50" aria-label="Servers">
      {/* Home */}
      <button 
        onClick={goHome}
        className="relative group w-11 h-11 flex items-center justify-center shrink-0 mb-1"
        title="Home"
        aria-label="Home"
      >
        {/* Active indicator pill */}
        <div className={`absolute -left-1.5 w-[3px] rounded-r-full transition-all duration-300 ease-out ${activeTab === 'home' ? 'h-8 bg-primary' : 'h-0 group-hover:h-4 bg-foreground/40'}`} />
        <div className={`w-11 h-11 flex items-center justify-center transition-all duration-200 ${
          activeTab === 'home' 
            ? 'bg-primary text-white rounded-[14px] shadow-[0_0_20px_rgba(255,94,108,0.25)]' 
            : 'bg-secondary text-muted-foreground rounded-[18px] hover:rounded-[14px] hover:bg-primary/15 hover:text-primary'
        }`}>
          <MessageSquare size={20} />
        </div>
      </button>

      {/* Divider */}
      <div className="w-7 h-px bg-border mb-1 shrink-0" />

      {/* Servers */}
      {servers.map(server => {
        const isActive = activeTab === 'server' && currentServer?.id === server.id;
        return (
          <button
            key={server.id}
            onClick={() => onSelectServer(server)}
            className="relative group w-11 h-11 flex items-center justify-center shrink-0"
            title={server.name}
            aria-label={server.name}
          >
            <div className={`absolute -left-1.5 w-[3px] rounded-r-full transition-all duration-300 ease-out ${isActive ? 'h-8 bg-primary' : 'h-0 group-hover:h-4 bg-foreground/40'}`} />
            <div className={`w-11 h-11 flex items-center justify-center transition-all duration-200 overflow-hidden ${
              isActive 
                ? 'bg-primary text-white rounded-[14px] shadow-[0_0_20px_rgba(255,94,108,0.25)]' 
                : 'bg-secondary text-muted-foreground rounded-[18px] hover:rounded-[14px] hover:bg-primary/15 hover:text-primary'
            }`}>
              {server.icon ? (
                <img src={getFileUrl(server.icon)} alt={server.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-semibold text-sm tracking-tight">{server.name[0]?.toUpperCase()}</span>
              )}
            </div>
          </button>
        )
      })}

      {/* Add Server */}
      <button 
        onClick={onAddServer}
        className="relative group w-11 h-11 flex items-center justify-center shrink-0 mt-1"
        title="Create Server"
        aria-label="Create Server"
      >
        <div className={`w-11 h-11 flex items-center justify-center transition-all duration-200 bg-secondary text-emerald-400 rounded-[18px] hover:rounded-[14px] hover:bg-emerald-500/15 hover:text-emerald-400`}>
          <Plus size={20} />
        </div>
      </button>
    </nav>
  )
}
