import { useState, useEffect, useRef } from "react"
import { Search, MessageSquare, Users, Hash, Volume2, X } from "lucide-react"
import { Input } from "@/components/ui/input"

interface QuickSwitcherProps {
  isOpen: boolean
  onClose: () => void
  dms: any[]
  friends: any[]
  servers: any[]
  onSelectDm: (dmId: string) => void
  onSelectFriend: (friendId: string) => void
  onSelectChannel: (serverId: string, channelId: string) => void
}

export default function QuickSwitcherModal({
  isOpen,
  onClose,
  dms,
  friends,
  servers,
  onSelectDm,
  onSelectFriend,
  onSelectChannel
}: QuickSwitcherProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Collect matching items
  const q = query.trim().toLowerCase()

  const matchedDms = dms
    .filter(d => !q || d.name?.toLowerCase().includes(q))
    .map(d => ({ type: 'dm', id: d.id, name: `@${d.name}`, raw: d }))

  const matchedFriends = friends
    .filter(f => f.status === 'accepted' && (!q || (f.display_name || f.username).toLowerCase().includes(q)))
    .map(f => ({ type: 'friend', id: f.id, name: f.display_name || f.username, username: f.username, raw: f }))

  const matchedChannels: any[] = []
  servers.forEach(s => {
    s.channels?.forEach((c: any) => {
      if (!q || c.name.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) {
        matchedChannels.push({
          type: 'channel',
          id: c.id,
          name: `${c.type === 'voice' ? '🔊' : '#'} ${c.name}`,
          serverName: s.name,
          serverId: s.id,
          raw: c
        })
      }
    })
  })

  const results = [...matchedDms, ...matchedFriends, ...matchedChannels].slice(0, 12)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        executeSelection(results[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  const executeSelection = (item: any) => {
    if (item.type === 'dm') {
      onSelectDm(item.id)
    } else if (item.type === 'friend') {
      onSelectFriend(item.id)
    } else if (item.type === 'channel') {
      onSelectChannel(item.serverId, item.id)
    }
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[580px] bg-secondary border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Search Input */}
        <div className="relative border-b border-border/60 p-3.5 flex items-center gap-3 bg-background/50">
          <Search size={20} className="text-white/60 shrink-0 ml-1" />
          <Input 
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Where would you like to go? (Type to search DMs, friends, channels...)"
            className="bg-transparent border-0 text-white text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/50 h-10 p-0"
          />
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 no-scrollbar">
          {results.length > 0 ? (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => executeSelection(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground shadow-md font-semibold' 
                      : 'hover:bg-white/5 text-white/90'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.type === 'dm' && <MessageSquare size={18} className={isSelected ? 'text-primary-foreground' : 'text-primary'} />}
                    {item.type === 'friend' && <Users size={18} className={isSelected ? 'text-primary-foreground' : 'text-emerald-400'} />}
                    {item.type === 'channel' && (
                      item.name.startsWith('🔊') 
                        ? <Volume2 size={18} className={isSelected ? 'text-primary-foreground' : 'text-amber-400'} />
                        : <Hash size={18} className={isSelected ? 'text-primary-foreground' : 'text-white/70'} />
                    )}
                    
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold truncate leading-tight">{item.name}</span>
                      {item.type === 'channel' && (
                        <span className={`text-[11px] truncate ${isSelected ? 'text-primary-foreground/80' : 'text-white/50'}`}>
                          in {item.serverName}
                        </span>
                      )}
                      {item.type === 'friend' && (
                        <span className={`text-[11px] truncate ${isSelected ? 'text-primary-foreground/80' : 'text-white/50'}`}>
                          @{item.username}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded ${isSelected ? 'bg-black/20 text-white' : 'bg-white/10 text-white/60'}`}>
                    Jump
                  </span>
                </div>
              )
            })
          ) : (
            <div className="py-12 text-center text-white/50 text-sm font-medium">
              No matching chats, friends, or channels found
            </div>
          )}
        </div>

        {/* Footer Shortcut Info */}
        <div className="px-4 py-2.5 bg-background/80 border-t border-border/50 flex items-center justify-between text-xs text-white/50 font-medium">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">↑↓</span>
            <span>Navigate</span>
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px] ml-2">Enter</span>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Esc</span>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
