import { useState, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void
  onClose: () => void
}

const EMOJI_CATEGORIES = [
  {
    name: "Popular",
    emojis: ["🔥", "❤️", "😂", "👍", "🚀", "🎉", "💀", "✨", "💯", "🙏", "😍", "🤩", "😎", "💩", "🥳", "🙌"]
  },
  {
    name: "Gaming & Tech",
    emojis: ["🎮", "🕹️", "🎯", "👾", "💻", "⚡", "👑", "🏆", "💎", "⚔️", "🛡️", "🔮", "🎲", "🚀", "🤖", "🎧"]
  },
  {
    name: "Expressions",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥳", "😏"]
  },
  {
    name: "Gestures & Symbols",
    emojis: ["👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "✊", "👊", "💪", "🧠"]
  },
  {
    name: "Objects & Vibes",
    emojis: ["🔥", "⭐", "🌟", "💫", "✨", "💥", "💢", "💦", "💧", "💤", "🎵", "🎶", "🎈", "🎁", "🎉", "🎊", "🔮", "🧿", "💰", "💵", "💎", "❤️", "💖", "🖤"]
  }
]

export default function EmojiPickerPopover({ onSelectEmoji, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("Popular")
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  const filteredCategories = EMOJI_CATEGORIES.map(cat => ({
    ...cat,
    emojis: cat.emojis.filter(emoji => 
      !search.trim() || cat.name.toLowerCase().includes(search.toLowerCase()) || emoji.includes(search)
    )
  })).filter(cat => cat.emojis.length > 0)

  return (
    <div 
      ref={popoverRef}
      className="absolute bottom-full mb-3 right-0 z-[100] w-72 md:w-80 bg-[#1e1f22]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Search Header */}
      <div className="p-2.5 border-b border-white/10 flex items-center gap-2 bg-secondary/40">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="w-full bg-secondary/80 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>
        <button onClick={onClose} className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/10">
          <X size={14} />
        </button>
      </div>

      {/* Category Tabs */}
      {!search && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/5 bg-secondary/20 overflow-x-auto no-scrollbar text-[11px] font-semibold">
          {EMOJI_CATEGORIES.map(cat => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${
                activeCategory === cat.name 
                  ? "bg-primary/20 text-primary border border-primary/30" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {cat.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-2.5 max-h-60 overflow-y-auto space-y-3 custom-scrollbar">
        {filteredCategories.map(cat => (
          <div key={cat.name} className="space-y-1">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block px-1">
              {cat.name}
            </span>
            <div className="grid grid-cols-8 gap-1">
              {cat.emojis.map((emoji, idx) => (
                <button
                  key={`${cat.name}-${idx}`}
                  onClick={() => {
                    onSelectEmoji(emoji)
                    onClose()
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white/10 hover:scale-125 transition-all cursor-pointer active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
