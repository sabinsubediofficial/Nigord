import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getFileUrl } from '@/lib/api'

export interface Attachment {
  id: string
  filename: string
  url: string
  content_type: string
  size: number
}

export default function MessageContent({ content, attachments }: { content: string, attachments?: Attachment[] }) {
  const isImage = (type: string) => type.startsWith('image/')
  const isVideo = (type: string) => type.startsWith('video/')

  return (
    <div className="flex flex-col gap-2">
      {content && (
        <div className="text-[#dbdee1] text-[15px] leading-relaxed break-words prose prose-invert prose-sm max-w-none !text-[15px]">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="inline">{children}</p>,
              code: ({ inline, children, ...props }: any) => {
                return inline ? (
                  <code className="bg-[#1e1f22] rounded px-1 py-0.5 text-[#e3e5e8]" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="bg-[#1e1f22] p-4 rounded-md my-2 overflow-x-auto border border-[#1e1f22]">
                    <code className="text-[#e3e5e8]" {...props}>
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
      
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {attachments.map(att => (
            <div key={att.id} className="max-w-[400px]">
              {isImage(att.content_type) ? (
                <img 
                  src={getFileUrl(att.url)} 
                  alt={att.filename} 
                  className="rounded-lg max-h-[300px] object-contain border border-[#1e1f22] cursor-pointer hover:opacity-90 transition-opacity" 
                  onClick={() => window.open(getFileUrl(att.url), '_blank')}
                />
              ) : isVideo(att.content_type) ? (
                <video controls className="rounded-lg max-h-[300px] border border-[#1e1f22]">
                  <source src={getFileUrl(att.url)} type={att.content_type} />
                </video>
              ) : (
                <a 
                  href={getFileUrl(att.url)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded bg-[#2b2d31] border border-[#1e1f22] hover:bg-[#35373c] transition-colors w-64"
                >
                  <div className="w-10 h-12 bg-[#1e1f22] rounded flex items-center justify-center text-[#949ba4] font-bold text-xs uppercase">
                    {att.filename.split('.').pop()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#00a8fc] truncate hover:underline">{att.filename}</p>
                    <p className="text-xs text-[#949ba4]">{(att.size / 1024).toFixed(1)} KB</p>
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
