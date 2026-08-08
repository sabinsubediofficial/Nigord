import { MessageSquare, Plus } from "lucide-react"
import { getFileUrl } from "@/lib/api"

interface BottomDockProps {
  servers: any[]
  currentServer: any | null
  activeTab: 'home' | 'server'
  goHome: () => void
  onSelectServer: (server: any) => void
  onAddServer: () => void
}

export function BottomDock({
  servers,
  currentServer,
  activeTab,
  goHome,
  onSelectServer,
  onAddServer,
}: BottomDockProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl">
      {/* Home / Direct Messages */}
      <button 
        onClick={goHome}
        className="relative group flex items-center justify-center shrink-0"
        title="Direct Messages"
      >
        <div className={`w-14 h-14 flex items-center justify-center transition-all duration-300 overflow-hidden shadow-lg hover:-translate-y-2 ${activeTab === 'home' ? 'bg-white/20 text-white rounded-[1.25rem]' : 'bg-white/5 text-white/70 hover:bg-white/20 hover:text-white rounded-[1.75rem] hover:rounded-[1.25rem]'}`}>
          <MessageSquare size={28} />
        </div>
        {activeTab === 'home' && <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />}
      </button>

      <div className="w-[1px] h-8 bg-white/10 shrink-0 mx-2" />

      {/* Servers */}
      {servers.map(server => {
        const isActive = activeTab === 'server' && currentServer?.id === server.id;
        return (
          <button
            key={server.id}
            onClick={() => onSelectServer(server)}
            className="relative group flex items-center justify-center shrink-0"
            title={server.name}
          >
            <div className={`w-14 h-14 flex items-center justify-center transition-all duration-300 overflow-hidden shadow-lg border border-white/5 hover:-translate-y-2 ${isActive ? 'bg-white/20 text-white rounded-[1.25rem]' : 'bg-black/60 text-white/70 hover:bg-white/20 hover:text-white rounded-[1.75rem] hover:rounded-[1.25rem]'}`}>
              {server.icon ? (
                <img src={getFileUrl(server.icon)} alt={server.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-xl display-font">{server.name[0]}</span>
              )}
            </div>
            {isActive && <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />}
          </button>
        )
      })}

      {/* Add Server */}
      <button 
        onClick={onAddServer}
        className="relative group flex items-center justify-center shrink-0 ml-2"
        title="Add Server"
      >
        <div className="w-14 h-14 flex items-center justify-center transition-all duration-300 overflow-hidden shadow-lg border border-white/10 bg-white/5 text-white/50 hover:bg-white/20 hover:text-white rounded-[1.75rem] hover:rounded-[1.25rem] hover:-translate-y-2">
          <Plus size={28} />
        </div>
      </button>
    </div>
  )
}
