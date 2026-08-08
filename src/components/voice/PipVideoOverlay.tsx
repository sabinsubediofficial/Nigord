import { useState } from "react"
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Maximize2, Minimize2 } from "lucide-react"

interface PipVideoOverlayProps {
  channelName: string
  participants: any[]
  isMuted: boolean
  isDeafened?: boolean
  isCameraOn?: boolean
  isScreenSharing?: boolean
  activeSpeakerId?: string | null
  onToggleMute: () => void
  onToggleDeafen?: () => void
  onToggleCamera?: () => void
  onToggleScreenShare?: () => void
  onDisconnect: () => void
}

export default function PipVideoOverlay({
  channelName,
  participants,
  isMuted,
  isDeafened = false,
  isCameraOn = false,
  isScreenSharing = false,
  activeSpeakerId,
  onToggleMute,
  onToggleDeafen,
  onToggleCamera,
  onToggleScreenShare,
  onDisconnect,
}: PipVideoOverlayProps) {
  const [isMinimized, setIsMinimized] = useState(false)

  if (participants.length === 0) return null

  const count = participants.length
  // Dynamic auto-adjusting grid: 1 person = 1 column full width, 2+ = 2 columns
  const gridClass = count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : "grid-cols-2"

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? "w-64" : count === 1 ? "w-80 sm:w-96" : "w-80 sm:w-96"
    } bg-black/90 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col group/pip select-none`}>
      
      {/* Floating Top Header Bar */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-30 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 shadow-md">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse shrink-0" />
          <span className="text-[11px] font-bold text-white tracking-wide truncate max-w-[130px]">{channelName}</span>
          {count > 1 && (
            <span className="text-[10px] text-white/60 font-semibold">({count})</span>
          )}
        </div>
        <button 
          onClick={() => setIsMinimized(!isMinimized)} 
          className="pointer-events-auto p-1.5 text-white/70 hover:text-white rounded-full bg-black/70 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all shadow-md cursor-pointer"
          title={isMinimized ? "Expand" : "Minimize"}
        >
          {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
        </button>
      </div>

      {/* Seamless Auto-Adjusting Video / Screen / Avatar Surface */}
      {!isMinimized && (
        <div className={`w-full grid ${gridClass} gap-1 p-1 bg-black/80 aspect-video relative`}>
          {participants.map((p) => {
            const isSpeaking = activeSpeakerId === p.id || activeSpeakerId === p.id.replace('-screen', '')
            return (
              <div 
                key={p.id}
                className={`relative w-full h-full rounded-xl overflow-hidden bg-neutral-900/90 flex items-center justify-center transition-all ${
                  isSpeaking 
                    ? "ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] z-10" 
                    : "border border-white/10"
                }`}
              >
                {p.stream ? (
                  <div className="w-full h-full relative bg-black flex items-center justify-center">
                    <video
                      autoPlay
                      muted={true}
                      playsInline
                      ref={(el) => { if (el && el.srcObject !== p.stream) el.srcObject = p.stream }}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                    {isSpeaking && (
                      <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/80 shadow-[inset_0_0_15px_rgba(16,185,129,0.4)]" />
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
                    <div className={`w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-lg font-extrabold text-white uppercase shadow-inner transition-all ${
                      isSpeaking ? "ring-2 ring-emerald-400 shadow-[0_0_15px_#10b981] scale-105" : ""
                    }`}>
                      {p.username?.[0] || 'U'}
                    </div>
                  </div>
                )}
                
                {/* Floating Bottom-Left Username Tag */}
                <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-white truncate max-w-[80%] flex items-center gap-1.5 backdrop-blur-md shadow-md transition-all ${
                  isSpeaking ? "bg-emerald-950/85 border border-emerald-500/50 text-emerald-300" : "bg-black/75 border border-white/15"
                }`}>
                  {isSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_6px_#10b981]" />}
                  <span className="truncate">{p.username}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Floating Bottom Action Toolbar */}
      <div className="px-3 py-2 bg-neutral-950/90 border-t border-white/10 flex items-center justify-center gap-2">
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isMuted 
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30" 
              : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
          }`}
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
        </button>

        <button
          onClick={onToggleCamera}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isCameraOn 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30" 
              : "bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 hover:text-white"
          }`}
          title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
        >
          {isCameraOn ? <Video size={15} /> : <VideoOff size={15} />}
        </button>

        <button
          onClick={onToggleScreenShare}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isScreenSharing 
              ? "bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30" 
              : "bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 hover:text-white"
          }`}
          title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
        >
          <MonitorUp size={15} />
        </button>

        <button
          onClick={onDisconnect}
          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
          title="Disconnect Voice"
        >
          <PhoneOff size={15} />
        </button>
      </div>
    </div>
  )
}

