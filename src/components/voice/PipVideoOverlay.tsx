import { useState } from "react"
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Maximize2, Minimize2 } from "lucide-react"
import { getFileUrl } from "@/lib/api"

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

  const hasVideo = participants.some(p => !!p.stream)
  const count = participants.length

  // 1. Voice-Only Mode: Sleek, compact single pill card with zero wasted space
  if (!hasVideo || isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-black/90 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] px-3.5 py-2.5 flex items-center gap-3 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse shrink-0" />
          <div className="flex flex-col min-w-0 max-w-[130px]">
            <span className="text-[12px] font-bold text-white tracking-wide truncate">{channelName}</span>
            <span className="text-[10px] text-white/50 truncate font-medium">Voice Active</span>
          </div>
        </div>

        {/* Participant Avatars in single unified row */}
        <div className="flex items-center -space-x-2 shrink-0">
          {participants.map((p) => {
            const isSpeaking = activeSpeakerId === p.id || activeSpeakerId === p.id.replace('-screen', '');
            return (
              <div 
                key={p.id}
                className={`relative w-8 h-8 rounded-full bg-primary/20 border flex items-center justify-center text-xs font-bold uppercase text-white shadow-sm transition-all ${
                  isSpeaking 
                    ? 'ring-2 ring-emerald-400 border-transparent shadow-[0_0_10px_#10b981] z-10 scale-105' 
                    : 'border-white/15'
                }`}
                title={p.username}
              >
                {p.avatar ? (
                  <img src={getFileUrl(p.avatar)} alt={p.username} className="w-full h-full object-cover rounded-full" />
                ) : (
                  p.username?.[0] || 'U'
                )}
              </div>
            );
          })}
        </div>

        <div className="w-[1px] h-6 bg-white/10 shrink-0" />

        {/* Integrated Quick Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isMuted 
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30" 
                : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
          </button>

          <button
            onClick={onToggleCamera}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isCameraOn 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30" 
                : "bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 hover:text-white"
            }`}
            title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
          >
            {isCameraOn ? <Video size={14} /> : <VideoOff size={14} />}
          </button>

          <button
            onClick={onToggleScreenShare}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isScreenSharing 
                ? "bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30" 
                : "bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 hover:text-white"
            }`}
            title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
          >
            <MonitorUp size={14} />
          </button>

          {hasVideo && (
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-xl bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-all cursor-pointer"
              title="Expand Video"
            >
              <Maximize2 size={14} />
            </button>
          )}

          <button
            onClick={onDisconnect}
            className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 ml-0.5"
            title="Disconnect"
          >
            <PhoneOff size={14} />
          </button>
        </div>
      </div>
    )
  }

  // 2. Video / Screen Share Mode: Edge-to-Edge Seamless Floating Card with Integrated Overlay Controls
  const gridClass = count === 1 ? "grid-cols-1" : "grid-cols-2"

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 aspect-video bg-black/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] overflow-hidden relative group/pip select-none animate-in fade-in duration-200">
      
      {/* Floating Top Header Pill */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-30 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 shadow-md">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse shrink-0" />
          <span className="text-[11px] font-bold text-white tracking-wide truncate max-w-[130px]">{channelName}</span>
        </div>
        <button 
          onClick={() => setIsMinimized(true)} 
          className="pointer-events-auto p-1.5 text-white/70 hover:text-white rounded-full bg-black/75 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all shadow-md cursor-pointer"
          title="Minimize to Voice Pill"
        >
          <Minimize2 size={13} />
        </button>
      </div>

      {/* Edge-to-Edge Video / Stream Surface */}
      <div className={`w-full h-full grid ${gridClass} gap-0.5 bg-black`}>
        {participants.map((p) => {
          const isSpeaking = activeSpeakerId === p.id || activeSpeakerId === p.id.replace('-screen', '');
          return (
            <div 
              key={p.id}
              className={`relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center transition-all ${
                isSpeaking ? "ring-2 ring-emerald-500 z-10" : ""
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
                    <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500 shadow-[inset_0_0_15px_rgba(16,185,129,0.4)]" />
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
                  <div className={`w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-lg font-extrabold text-white uppercase shadow-inner transition-all ${
                    isSpeaking ? "ring-2 ring-emerald-400 shadow-[0_0_15px_#10b981] scale-105" : ""
                  }`}>
                    {p.username?.[0] || 'U'}
                  </div>
                </div>
              )}
              
              {/* Bottom-Left Floating Username Tag */}
              <div className={`absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold text-white truncate max-w-[70%] flex items-center gap-1.5 backdrop-blur-md shadow-md transition-all ${
                isSpeaking ? "bg-emerald-950/85 border border-emerald-500/50 text-emerald-300" : "bg-black/75 border border-white/15"
              }`}>
                {isSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_6px_#10b981]" />}
                <span className="truncate">{p.username}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Bottom Action Toolbar Overlay */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center gap-1.5 z-30 opacity-90 group-hover/pip:opacity-100 transition-opacity">
        <button
          onClick={onToggleMute}
          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
            isMuted 
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30" 
              : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
          }`}
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
        </button>

        <button
          onClick={onToggleCamera}
          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
            isCameraOn 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30" 
              : "bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 hover:text-white"
          }`}
          title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
        >
          {isCameraOn ? <Video size={14} /> : <VideoOff size={14} />}
        </button>

        <button
          onClick={onToggleScreenShare}
          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
            isScreenSharing 
              ? "bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30" 
              : "bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 hover:text-white"
          }`}
          title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
        >
          <MonitorUp size={14} />
        </button>

        <button
          onClick={onDisconnect}
          className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
          title="Disconnect Voice"
        >
          <PhoneOff size={14} />
        </button>
      </div>
    </div>
  )
}


