import { ExternalLink } from "lucide-react"

interface RichLinkEmbedProps {
  url: string
}

export default function RichLinkEmbed({ url }: RichLinkEmbedProps) {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch (e) {
    return null
  }

  const hostname = parsedUrl.hostname.replace('www.', '')
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`

  // Check if URL is an image directly
  const isDirectImage = /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(parsedUrl.pathname)

  if (isDirectImage) {
    return (
      <div className="mt-2 max-w-sm rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/40">
        <img src={url} alt="Attached Media" className="w-full max-h-64 object-cover" />
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 group flex flex-col sm:flex-row max-w-md bg-secondary/40 hover:bg-secondary/70 border border-white/10 hover:border-primary/50 rounded-xl overflow-hidden transition-all shadow-md text-left"
    >
      <div className="p-3 flex-1 flex flex-col justify-between gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <img src={faviconUrl} alt={hostname} className="w-4 h-4 rounded-sm object-contain shrink-0" />
          <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider truncate">{hostname}</span>
        </div>
        <div className="font-semibold text-xs text-white group-hover:text-primary transition-colors truncate">
          {parsedUrl.pathname !== '/' ? parsedUrl.pathname.substring(1) : hostname}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-white/50 font-medium">
          <span>{url}</span>
          <ExternalLink size={10} className="shrink-0" />
        </div>
      </div>
    </a>
  )
}
