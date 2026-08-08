import React from "react"
import { ChevronDown, Settings, UserPlus, LogOut, Plus } from "lucide-react"
import { getFileUrl } from "@/lib/api"
export interface Server {
  id: string
  name: string
  icon?: string
  banner?: string
  owner_id: string
}

interface SidebarHeaderProps {
  activeTab: 'home' | 'server'
  currentServer: Server | null
  showServerMenu: boolean
  setShowServerMenu: (show: boolean) => void
  setShowInviteModal: (show: boolean) => void
  setShowServerSettingsModal: (show: boolean) => void
  onLeaveServer: () => void
  isOwner: boolean
  isAdmin: boolean
  isManageChannels?: boolean
  onCreateChannel?: () => void
}

export const SidebarHeader = React.memo(function SidebarHeader({
  activeTab,
  currentServer,
  showServerMenu,
  setShowServerMenu,
  setShowInviteModal,
  setShowServerSettingsModal,
  onLeaveServer,
  isOwner,
  isAdmin,
  isManageChannels = false,
  onCreateChannel
}: SidebarHeaderProps) {
  return (
    <div 
      className="relative flex flex-col justify-end group cursor-pointer hover:bg-secondary/30 transition-all duration-200 border-b border-border shrink-0 select-none" 
      style={{ height: activeTab === 'server' && currentServer?.banner ? '120px' : '48px' }}
      onClick={() => activeTab === 'server' && setShowServerMenu(!showServerMenu)}
    >
      {activeTab === 'server' && currentServer?.banner && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none rounded-t-lg">
          <img 
            src={getFileUrl(currentServer.banner)} 
            className="w-full h-full object-cover brightness-[0.5] group-hover:brightness-[0.6] transition-all duration-200" 
            alt="" 
          />
        </div>
      )}
      <div className="flex items-center px-4 h-12 w-full relative z-10">
        {activeTab === 'server' && currentServer?.icon && (
          <img 
            src={getFileUrl(currentServer.icon)} 
            className="w-5 h-5 rounded-full object-cover mr-2 border border-border" 
            alt="" 
          />
        )}
        <h2 className="font-bold truncate flex-1 text-foreground transition-colors group-hover:text-white drop-shadow-md">
          {activeTab === 'server' ? currentServer?.name : "Find or start a conversation"}
        </h2>
        {activeTab === 'server' && (
          <ChevronDown 
            size={18} 
            className={`text-muted-foreground shrink-0 transition-transform duration-200 drop-shadow-md ${showServerMenu ? 'rotate-180 text-white' : ''}`} 
          />
        )}
      </div>
      
      {showServerMenu && activeTab === 'server' && (
        <div className="absolute top-[52px] left-2 right-2 bg-popover/95 backdrop-blur-md rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.6)] border border-border/80 p-1.5 z-50 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150 ease-out">
          <div 
            className="flex items-center justify-between p-2 rounded-md text-primary hover:bg-primary hover:text-white cursor-pointer transition-all duration-150 font-medium active:scale-[0.98]"
            onClick={(e) => { e.stopPropagation(); setShowServerMenu(false); setShowInviteModal(true); }}
          >
            <span className="text-xs font-semibold">Invite People</span>
            <UserPlus size={15} />
          </div>
          {(isOwner || isAdmin || isManageChannels) && (
            <div 
              className="flex items-center justify-between p-2 rounded-md text-muted-foreground hover:bg-primary hover:text-white cursor-pointer transition-all duration-150 font-medium active:scale-[0.98]"
              onClick={(e) => { e.stopPropagation(); setShowServerMenu(false); onCreateChannel?.(); }}
            >
              <span className="text-xs font-semibold">Create Channel</span>
              <Plus size={15} />
            </div>
          )}
          {(isOwner || isAdmin) && (
            <div 
              className="flex items-center justify-between p-2 rounded-md text-muted-foreground hover:bg-primary hover:text-white cursor-pointer transition-all duration-150 font-medium active:scale-[0.98]"
              onClick={(e) => { e.stopPropagation(); setShowServerMenu(false); setShowServerSettingsModal(true); }}
            >
              <span className="text-xs font-semibold">Server Settings</span>
              <Settings size={15} />
            </div>
          )}
          {!isOwner && (
            <div 
              className="flex items-center justify-between p-2 rounded-md text-red-400 hover:bg-red-500 hover:text-white cursor-pointer transition-all duration-150 font-medium active:scale-[0.98]"
              onClick={(e) => { e.stopPropagation(); setShowServerMenu(false); onLeaveServer(); }}
            >
              <span className="text-xs font-semibold">Leave Server</span>
              <LogOut size={15} />
            </div>
          )}
        </div>
      )}
    </div>
  )
})
