import { useState, useRef, useEffect } from "react"
import { Search, X, Loader2 } from "lucide-react"

interface GifPickerProps {
  onSelectGif: (gifUrl: string) => void
  onClose: () => void
}

const TRENDING_GIFS = [
  { id: "1", title: "GG WP", url: "https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif" },
  { id: "2", title: "Let's Go", url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif" },
  { id: "3", title: "Mind Blown", url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif" },
  { id: "4", title: "Dance Party", url: "https://media.giphy.com/media/l2JIdnF6aJXA6Bf1S/giphy.gif" },
  { id: "5", title: "Vibing Cat", url: "https://media.giphy.com/media/GeimqsH0TLDt4tScGw/giphy.gif" },
  { id: "6", title: "Victory", url: "https://media.giphy.com/media/ddHhhUBn25cuRGzn38/giphy.gif" },
  { id: "7", title: "Gaming", url: "https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif" },
  { id: "8", title: "Shocked", url: "https://media.giphy.com/media/5vkp9G72p2tSDa8h4p/giphy.gif" }
]

export default function GifPickerPopover({ onSelectGif, onClose }: GifPickerProps) {
  const [search, setSearch] = useState("")
  const [gifs, setGifs] = useState(TRENDING_GIFS)
  const [loading, setLoading] = useState(false)
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

  const handleSearch = async (q: string) => {
    setSearch(q)
    if (!q.trim()) {
      setGifs(TRENDING_GIFS)
      return
    }
    setLoading(true)
    try {
      // Free public Giphy API endpoint or fallback curated list
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=cw09M3W0zzhWw5eK5j5R25y652X5z0z1&q=${encodeURIComponent(q)}&limit=12`)
      if (res.ok) {
        const data = await res.json()
        if (data.data && data.data.length > 0) {
          const parsed = data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            url: item.images?.fixed_height?.url || item.images?.original?.url
          }))
          setGifs(parsed)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

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
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full bg-secondary/80 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
            autoFocus
          />
          {search && (
            <button onClick={() => handleSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>
        <button onClick={onClose} className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/10">
          <X size={14} />
        </button>
      </div>

      {/* GIFs Grid */}
      <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-white/50 gap-2">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-xs">Searching GIFs...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => {
                  onSelectGif(gif.url)
                  onClose()
                }}
                className="relative group rounded-xl overflow-hidden aspect-video bg-black/40 border border-white/5 hover:border-primary/50 hover:scale-[1.02] transition-all cursor-pointer shadow-md"
              >
                <img src={gif.url} alt={gif.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-end p-1.5 transition-opacity">
                  <span className="text-[10px] font-bold text-white truncate">{gif.title}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
