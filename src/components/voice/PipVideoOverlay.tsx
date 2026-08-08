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

  return (
    <div className={`fixed bottom-20 right-6 z-50 transition-all duration-300 ${
      isMinimized ? "w-64" : "w-80 md:w-96"
    } bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
      {/* Header Bar */}
      <div className="px-3 py-2 bg-secondary/80 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-bold text-white truncate">{channelName}</span>
          <span className="text-[10px] text-white/50 font-medium shrink-0">({participants.length})</span>
        </div>
        <button 
          onClick={() => setIsMinimized(!isMinimized)} 
          className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
        </button>
      </div>

      {/* Video / Avatar Grid */}
      {!isMinimized && (
        <div className="p-2 grid grid-cols-2 gap-2 max-h-56 overflow-y-auto bg-black/40">
          {participants.map((p) => {
            const isSpeaking = activeSpeakerId === p.id || activeSpeakerId === p.id.replace('-screen', '')
            return (
              <div 
                key={p.id}
                className={`relative aspect-video rounded-xl overflow-hidden bg-secondary/60 flex items-center justify-center border transition-all ${
                  isSpeaking ? "border-emerald-500 ring-2 ring-emerald-500/50 shadow-[0_0_16px_rgba(16,185,129,0.6)]" : "border-white/10"
                }`}
              >
                {p.stream ? (
                  <div className="w-full h-full relative bg-black flex items-center justify-center">
                    <video
                      autoPlay
                      playsInline
                      ref={(el) => { if (el && el.srcObject !== p.stream) el.srcObject = p.stream }}
                      className="w-full h-full object-contain"
                    />
                    {isSpeaking && (
                      <div className="absolute inset-0 pointer-events-none border border-emerald-500 shadow-[inset_0_0_12px_rgba(16,185,129,0.5)]" />
                    )}
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-sm font-bold text-white font-display uppercase transition-all ${
                    isSpeaking ? "ring-2 ring-emerald-500 shadow-[0_0_10px_#10b981]" : ""
                  }`}>
                    {p.username?.[0] || 'U'}
                  </div>
                )}
                <div className={`absolute bottom-1 left-1 bg-black/75 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-white font-semibold truncate max-w-[85%] flex items-center gap-1 border transition-all ${
                  isSpeaking ? "border-emerald-500 text-emerald-400" : "border-white/10"
                }`}>
                  {isSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
                  <span className="truncate">{p.username}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Controls Bar */}
      <div className="p-2 bg-secondary/60 border-t border-white/10 flex items-center justify-center gap-2">
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-xl border transition-all ${
            isMuted 
              ? "bg-rose-600/20 text-rose-400 border-rose-500/40 hover:bg-rose-600/30" 
              : "bg-white/5 text-white border-white/10 hover:bg-white/10"
          }`}
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        <button
          onClick={onToggleCamera}
          className={`p-2 rounded-xl border transition-all ${
            isCameraOn 
              ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-600/30" 
              : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
          }`}
          title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
        >
          {isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
        </button>

        <button
          onClick={onToggleScreenShare}
          className={`p-2 rounded-xl border transition-all ${
            isScreenSharing 
              ? "bg-primary/20 text-primary border-primary/40 hover:bg-primary/30" 
              : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
          }`}
          title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
        >
          <MonitorUp size={16} />
        </button>

        <button
          onClick={onDisconnect}
          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md"
          title="Disconnect Call"
        >
          <PhoneOff size={16} />
        </button>
      </div>
    </div>
  )
}
