import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageLightboxModalProps {
  imageUrl: string | null
  onClose: () => void
}

export default function ImageLightboxModal({ imageUrl, onClose }: ImageLightboxModalProps) {
  if (!imageUrl) return null

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = imageUrl
    a.download = imageUrl.split("/").pop() || "downloaded-image"
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Floating Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-10" onClick={e => e.stopPropagation()}>
        <Button
          onClick={handleDownload}
          variant="ghost"
          size="sm"
          className="bg-white/10 hover:bg-white/20 text-white gap-2 rounded-xl px-4 py-2 border border-white/10 shadow-lg text-xs font-semibold"
        >
          <Download size={16} />
          <span>Save Image</span>
        </Button>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10 shadow-lg transition-all hover:scale-105 active:scale-95"
          title="Close (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Centered Image Container */}
      <div 
        className="relative max-w-[90vw] max-h-[88vh] overflow-hidden flex items-center justify-center rounded-2xl shadow-2xl border border-white/10 bg-secondary/50"
        onClick={e => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt="Full View" 
          className="max-w-full max-h-[85vh] object-contain rounded-xl select-none" 
        />
      </div>
    </div>
  )
}
