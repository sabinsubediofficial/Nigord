import React from "react"
import { Plus, MessageSquare } from "lucide-react"
import { getFileUrl } from "@/lib/api"

export interface Server {
  id: string
  name: string
  icon?: string | null
  banner?: string | null
  owner_id: string
}

export interface Notifications {
  dms: { channel_id: string; unread_count: number }[]
  servers: { server_id: string; channel_id: string; unread_count: number }[]
}

interface ServerListProps {
  servers: Server[]
  currentServer: Server | null
  activeTab: 'home' | 'server'
  notifications: Notifications
  goHome: () => void
  onSelectServer: (server: Server) => void
  onAddServer: () => void
  sendTypingStatus: (isTyping: boolean) => void
}

export const ServerList = React.memo(function ServerList({
  servers,
  currentServer,
  activeTab,
  notifications,
  goHome,
  onSelectServer,
  onAddServer,
  sendTypingStatus
}: ServerListProps) {
  const dmsUnread = notifications.dms.reduce((acc, curr) => acc + curr.unread_count, 0)

  return (
    <div className="w-[72px] obsidian-card flex flex-col items-center py-3 gap-2 overflow-y-auto no-scrollbar shrink-0 border-none">
      <div 
        onClick={goHome}
        className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all flex items-center justify-center text-[#e3e1db] cursor-pointer group mb-2 relative ${activeTab === 'home' ? 'bg-[#bc9f84] text-[#141517] rounded-[16px]' : 'bg-[#2d2f31] hover:bg-[#bc9f84] hover:text-[#141517]'}`}
      >
        <div className={`absolute left-0 bg-white rounded-r-full transition-all origin-left ${activeTab === 'home' ? 'h-10 scale-y-100' : 'h-5 scale-y-0 group-hover:scale-y-50'}`} style={{ width: '4px' }} />
        <MessageSquare size={24} />
        {dmsUnread > 0 && (
          <div className="absolute -bottom-1 -right-1 bg-[#f23f43] text-white text-[10px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center border-4 border-[#1e1f22] ring-0">
            {dmsUnread}
          </div>
        )}
      </div>
      <div className="w-8 h-[2px] bg-[#2d2f31] rounded-full mb-2" />
      {servers.map((server) => {
        const unreadCount = notifications.servers
          .filter(s => s.server_id === server.id)
          .reduce((acc, curr) => acc + curr.unread_count, 0);
        return (
          <div 
            key={server.id} 
            onClick={() => { sendTypingStatus(false); onSelectServer(server); }} 
            className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all flex items-center justify-center text-white cursor-pointer group relative mb-2 ${activeTab === 'server' && currentServer?.id === server.id ? 'rounded-[16px] bg-[#bc9f84] text-[#141517]' : 'bg-[#2d2f31] hover:bg-[#bc9f84] hover:text-[#141517]'}`}
          >
            <div className={`absolute left-0 bg-[#e3e1db] rounded-r-full transition-all origin-left ${activeTab === 'server' && currentServer?.id === server.id ? 'h-10 scale-y-100' : (unreadCount > 0 ? 'h-2 scale-y-100' : 'h-5 scale-y-0 group-hover:scale-y-50')}`} style={{ width: '4px' }} />
            {server.icon ? (
              <img 
                src={getFileUrl(server.icon)} 
                alt={server.name} 
                className="w-full h-full object-cover rounded-[inherit] transition-all"
              />
            ) : (
              <span className="text-sm font-medium">{server.name.substring(0, 2).toUpperCase()}</span>
            )}
            {unreadCount > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-[#bc9f84] text-[#141517] text-[10px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center border-4 border-[#1e2022] ring-0">
                {unreadCount}
              </div>
            )}
          </div>
        )
      })}
      <div onClick={onAddServer} className="w-12 h-12 bg-[#2d2f31] rounded-[24px] hover:rounded-[16px] transition-all flex items-center justify-center text-[#bc9f84] hover:bg-[#bc9f84] hover:text-[#141517] cursor-pointer group mb-2">
        <Plus size={24} />
      </div>
    </div>
  )
})
