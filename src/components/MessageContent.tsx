import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getFileUrl } from '@/lib/api'
import RichLinkEmbed from './chat/RichLinkEmbed'

export interface Attachment {
  id: string
  filename: string
  url: string
  content_type: string
  size: number
}

export default function MessageContent({ 
  content, 
  attachments,
  onImageClick 
}: { 
  content: string, 
  attachments?: Attachment[],
  onImageClick?: (url: string) => void
}) {
  const isImage = (type: string) => type.startsWith('image/')
  const isVideo = (type: string) => type.startsWith('video/')

  // Extract HTTP/HTTPS links for rich embed previews
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const matchedUrls = content ? (content.match(urlRegex) || []) : []
  const uniqueUrls = Array.from(new Set(matchedUrls)).slice(0, 3)

  return (
    <div className="flex flex-col gap-2">
      {content && (
        <div className="text-white/90 text-[15px] leading-relaxed break-words prose prose-invert prose-sm max-w-none !text-[15px]">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="inline">{children}</p>,
              code: ({ inline, children, ...props }: any) => {
                return inline ? (
                  <code className="bg-background/80 border border-white/10 rounded px-1.5 py-0.5 text-white/90 font-mono text-xs" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="bg-background/90 p-4 rounded-lg my-2 overflow-x-auto border border-white/10 font-mono text-xs">
                    <code className="text-white/90" {...props}>
                      {children}
                    </code>
                  </pre>
                )
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}

      {/* Rich URL Embed Cards */}
      {uniqueUrls.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {uniqueUrls.map((url, idx) => (
            <RichLinkEmbed key={`${url}-${idx}`} url={url} />
          ))}
        </div>
      )}
      
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {attachments.map(att => (
            <div key={att.id} className="max-w-[400px]">
              {isImage(att.content_type) ? (
                <img 
                  src={getFileUrl(att.url)} 
                  alt={att.filename} 
                  className="rounded-lg max-h-[300px] object-contain border border-white/10 cursor-pointer hover:opacity-90 transition-opacity" 
                  onClick={() => {
                    if (onImageClick) {
                      onImageClick(getFileUrl(att.url))
                    } else {
                      window.open(getFileUrl(att.url), '_blank')
                    }
                  }}
                />
              ) : isVideo(att.content_type) ? (
                <video controls className="rounded-lg max-h-[300px] border border-white/10">
                  <source src={getFileUrl(att.url)} type={att.content_type} />
                </video>
              ) : (
                <a 
                  href={getFileUrl(att.url)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-white/10 hover:bg-white/[0.06] transition-colors w-64"
                >
                  <div className="w-10 h-12 bg-background border border-white/10 rounded-md flex items-center justify-center text-white/70 font-bold text-xs uppercase">
                    {att.filename.split('.').pop()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate hover:underline">{att.filename}</p>
                    <p className="text-xs text-white/60">{(att.size / 1024).toFixed(1)} KB</p>
                  </div>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
