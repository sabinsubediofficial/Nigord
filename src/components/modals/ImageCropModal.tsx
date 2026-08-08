import { useState, useRef, useEffect } from "react"
import { ZoomIn, ZoomOut, Check, X, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageCropModalProps {
  imageSrc: string | null
  aspect?: number // e.g. 1 for 1:1 or 16/9 for banner
  cropShape?: 'circle' | 'rounded-square' | 'rect'
  title?: string
  onCropSave: (croppedFile: File) => void
  onClose: () => void
}

export default function ImageCropModal({
  imageSrc,
  aspect = 1,
  cropShape = 'circle',
  title = "Crop Image",
  onCropSave,
  onClose
}: ImageCropModalProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [imageSrc])

  if (!imageSrc) return null

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleApplyCrop = () => {
    if (!imgRef.current || !containerRef.current) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Output target dimensions
    const outputWidth = aspect === 1 ? 512 : 960
    const outputHeight = aspect === 1 ? 512 : 540
    canvas.width = outputWidth
    canvas.height = outputHeight

    const img = imgRef.current
    const cropBox = containerRef.current.getBoundingClientRect()
    const imgBox = img.getBoundingClientRect()

    // Calculate crop ratio relative to actual image dimensions
    const scaleX = img.naturalWidth / imgBox.width
    const scaleY = img.naturalHeight / imgBox.height

    const sourceX = (cropBox.left - imgBox.left) * scaleX
    const sourceY = (cropBox.top - imgBox.top) * scaleY
    const sourceWidth = cropBox.width * scaleX
    const sourceHeight = cropBox.height * scaleY

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight
    )

    // Export as highly optimized WebP format
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `cropped_image_${Date.now()}.webp`, { type: "image/webp" })
      onCropSave(file)
      onClose()
    }, "image/webp", 0.85)
  }

  const getShapeClass = () => {
    if (cropShape === 'circle') return 'rounded-full'
    if (cropShape === 'rounded-square') return 'rounded-[2.2rem]'
    return 'rounded-2xl'
  }

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[540px] bg-secondary border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-border/60 bg-background/50">
          <h3 className="text-lg font-bold text-white font-display">{title}</h3>
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Crop Viewport Container */}
        <div 
          className="relative h-[340px] bg-black/60 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Draggable & Scalable Image */}
          <img 
            ref={imgRef}
            src={imageSrc} 
            alt="Crop target" 
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            className="max-h-[300px] object-contain pointer-events-none"
          />

          {/* Crop Overlay Mask */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/50">
            <div 
              ref={containerRef}
              style={{
                width: aspect === 1 ? '240px' : '380px',
                height: aspect === 1 ? '240px' : '213px',
              }}
              className={`border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] relative overflow-hidden ${getShapeClass()}`}
            >
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>
            </div>
          </div>

          <div className="absolute bottom-3 left-4 text-[11px] text-white/60 font-semibold bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
            Drag image to reposition
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="p-4 px-6 bg-background/50 border-t border-border/60 flex items-center gap-4">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="text-white/70 hover:text-white p-1">
            <ZoomOut size={18} />
          </button>
          <input 
            type="range"
            min="0.5"
            max="3"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full accent-primary bg-secondary h-2 rounded-lg cursor-pointer"
          />
          <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="text-white/70 hover:text-white p-1">
            <ZoomIn size={18} />
          </button>

          <button 
            onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }} 
            className="text-xs text-white/50 hover:text-white flex items-center gap-1 shrink-0 ml-2 font-medium"
            title="Reset"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 bg-secondary flex justify-end gap-3 border-t border-border">
          <Button onClick={onClose} variant="ghost" className="text-white/70 hover:text-white rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleApplyCrop} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl px-6 gap-2">
            <Check size={16} /> Apply & Crop
          </Button>
        </div>
      </div>
    </div>
  )
}
