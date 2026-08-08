import { useEffect, useRef, useState } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { apiFetch, API_BASE } from "@/lib/api"
import { useAudioStore } from "@/store/useAudioStore"
import { createVoiceProcessor, VoiceProcessorInstance } from "@/utils/audioProcessor"

const playSound = (src: string) => {
  new Audio(src).play().catch(() => {})
}

export const useWebRTC = (channelId?: string) => {
  const { user } = useAuthStore()
  const { 
    micVolume, 
    inputDeviceId,
    noiseSuppression,
    noiseGateThreshold,
    highpassFilter,
    voiceClarity
  } = useAudioStore()
  const voiceProcessorRef = useRef<VoiceProcessorInstance | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isDeafened, setIsDeafened] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  
  // Calling System States
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    channelId: string;
    isVideo: boolean;
  } | null>(null)
  const [outgoingCall, setOutgoingCall] = useState<{
    targetId: string;
    targetName: string;
    channelId: string;
    isVideo: boolean;
  } | null>(null)

  const [speakingUsers, setSpeakingUsers] = useState<Record<string, boolean>>({})

  const pcs = useRef<Record<string, RTCPeerConnection>>({})
  const isJoinedRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const pendingCandidates = useRef<Record<string, any[]>>({})
  const audioContextRef = useRef<AudioContext | null>(null)
  const callTimeoutRef = useRef<any>(null)
  const rawStreamRef = useRef<MediaStream | null>(null)
  const localGainNodeRef = useRef<GainNode | null>(null)
  
  const activeChannelIdRef = useRef<string | null>(null)
  const incomingCallRef = useRef<any>(null)
  const outgoingCallRef = useRef<any>(null)
  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null)

  const analysers = useRef<Record<string, AnalyserNode>>({})
  const checkSpeakingInterval = useRef<any>(null)
  const mainStreamIds = useRef<Record<string, string>>({})
  const isDeafenedRef = useRef(false)

  // Tracking refs for call log updates
  const isDmCall = useRef(false)
  const dmChannelIdRef = useRef<string | null>(null)
  const callConnectTime = useRef<number | null>(null)

  const clearCallTimeout = () => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current)
      callTimeoutRef.current = null
    }
  }

  const setCallTimeout = (action: () => void) => {
    clearCallTimeout()
    callTimeoutRef.current = setTimeout(() => {
      action()
    }, 30000)
  }

  const sendSystemMessage = async (channelId: string, content: string) => {
    try {
      await apiFetch(`/dms/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include'
      })
    } catch (e) {
      console.error("Failed to send call system message", e)
    }
  }

  useEffect(() => {
    incomingCallRef.current = incomingCall
  }, [incomingCall])

  useEffect(() => {
    outgoingCallRef.current = outgoingCall
  }, [outgoingCall])

  useEffect(() => {
    if (voiceProcessorRef.current) {
      voiceProcessorRef.current.gainNode.gain.value = micVolume
      voiceProcessorRef.current.setNoiseGateEnabled(noiseSuppression)
      voiceProcessorRef.current.setThreshold(noiseGateThreshold)
    } else if (localGainNodeRef.current) {
      localGainNodeRef.current.gain.value = micVolume
    }
  }, [micVolume, noiseSuppression, noiseGateThreshold])

  const startRingtone = (src: string) => {
    stopRingtone()
    const audio = new Audio(src)
    audio.loop = true
    audio.play().catch(() => {})
    ringtoneAudioRef.current = audio
  }

  const stopRingtone = () => {
    if (ringtoneAudioRef.current) {
      ringtoneAudioRef.current.pause()
      ringtoneAudioRef.current = null
    }
  }

  const monitorStream = (userId: string, stream: MediaStream) => {
    try {
      if (stream.getAudioTracks().length === 0) return
      if (analysers.current[userId]) return
      
      let ctx = audioContextRef.current
      if (!ctx || ctx.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        ctx = new AudioContextClass()
        audioContextRef.current = ctx
      }
      
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      analysers.current[userId] = analyser
    } catch (e) {
      console.error("Failed to monitor stream", e)
    }
  }

  const cleanupPeer = (targetId: string) => {
    const pc = pcs.current[targetId]
    if (pc) {
      pc.close()
      delete pcs.current[targetId]
      playSound('/sounds/user-leave.mp3')
    }
    setRemoteStreams(prev => {
      const next = { ...prev }
      delete next[targetId]
      delete next[`${targetId}-screen`]
      return next
    })
    if (analysers.current[targetId]) {
      delete analysers.current[targetId]
    }
    if (mainStreamIds.current[targetId]) {
      delete mainStreamIds.current[targetId]
    }
  }

  const syncStatus = async () => {
    const targetChannelId = activeChannelIdRef.current || channelId
    if (!targetChannelId || !isJoined) return
    try {
      await apiFetch(`/channels/${targetChannelId}/voice/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is_muted: !isAudioEnabled, 
          is_deafened: isDeafened 
        }),
        credentials: 'include'
      })
    } catch (e) {
      console.error("Failed to sync voice status", e)
    }
  }

  useEffect(() => {
    syncStatus()
  }, [isAudioEnabled, isDeafened, isJoined, channelId])

  useEffect(() => {
    isDeafenedRef.current = isDeafened
  }, [isDeafened])

  useEffect(() => {
    return () => {
      stopRingtone()
      clearCallTimeout()
      // Stop all camera and mic tracks on unmount
      streamRef.current?.getTracks().forEach(track => track.stop())
      rawStreamRef.current?.getTracks().forEach(track => track.stop())
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
      // Stop all screen share tracks on unmount
      screenStreamRef.current?.getTracks().forEach(track => track.stop())
      // Close all WebRTC peer connections on unmount
      Object.values(pcs.current).forEach(pc => pc.close())
      
      const targetChannelId = activeChannelIdRef.current
      if (targetChannelId) {
        fetch(`${API_BASE}/channels/${targetChannelId}/voice/leave`, {
          method: 'POST',
          credentials: 'include',
          keepalive: true
        }).catch(() => {})
      }
    }
  }, [])

  const toggleDeafen = () => {
    const newState = !isDeafened
    setIsDeafened(newState)
    
    // Mute all remote streams locally
    Object.values(remoteStreams).forEach(stream => {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !newState
      })
    })

    // If deafening, also mute local mic
    if (newState) {
      streamRef.current?.getAudioTracks().forEach(t => t.enabled = false)
      setIsAudioEnabled(false)
      playSound('/sounds/deaf.mp3')
    } else {
      streamRef.current?.getAudioTracks().forEach(t => t.enabled = true)
      setIsAudioEnabled(true)
      playSound('/sounds/non-deaf.mp3')
    }
  }

  const toggleAudio = () => {
    if (!streamRef.current) return
    const enabled = !isAudioEnabled
    streamRef.current.getAudioTracks().forEach(track => {
      track.enabled = enabled
    })
    setIsAudioEnabled(enabled)
    playSound(enabled ? '/sounds/non-muted.mp3' : '/sounds/muted.mp3')
    
    // If unmuting, undeafen automatically
    if (enabled && isDeafened) {
      setIsDeafened(false)
      // Also re-enable remote streams
      Object.values(remoteStreams).forEach(stream => {
        stream.getAudioTracks().forEach(track => {
          track.enabled = true
        })
      })
    }
  }

  const sendSignal = async (to_id: string, type: string, data: any) => {
    await apiFetch('/signaling/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_id, type, data }),
      credentials: 'include'
    })
  }

  const createPC = (targetId: string, stream: MediaStream) => {
    if (pcs.current[targetId]) return pcs.current[targetId]

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    stream.getTracks().forEach(track => pc.addTrack(track, stream))
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, screenStreamRef.current!)
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(targetId, 'ice-candidate', event.candidate)
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupPeer(targetId)
      }
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        cleanupPeer(targetId)
      }
    }

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0]
      if (!remoteStream) return

      if (!mainStreamIds.current[targetId]) {
        mainStreamIds.current[targetId] = remoteStream.id
      }

      const isScreenTrack = remoteStream.id !== mainStreamIds.current[targetId]
      const streamKey = isScreenTrack ? `${targetId}-screen` : targetId

      setRemoteStreams(prev => ({
        ...prev,
        [streamKey]: remoteStream
      }))

      if (!isScreenTrack) {
        if (isDeafenedRef.current) {
          remoteStream.getAudioTracks().forEach(track => {
            track.enabled = false
          })
        }
        monitorStream(targetId, remoteStream)
      }
    }

    // Handle negotiation needed
    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        await sendSignal(targetId, 'offer', offer)
      } catch (e) {
        console.error("Negotiation error", e)
      }
    }

    pcs.current[targetId] = pc
    return pc
  }

  const join = async (withVideo = false, customChannelId?: string) => {
    const targetChannelId = customChannelId || channelId
    if (!targetChannelId || !user || isJoinedRef.current) return
    isJoinedRef.current = true
    activeChannelIdRef.current = targetChannelId
    
    try {
      // Request audio with native echo cancellation, noise suppression, and auto gain control for instant 0ms latency
      const audioConstraints: any = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
      if (inputDeviceId && inputDeviceId !== 'default') {
        audioConstraints.deviceId = { exact: inputDeviceId }
      }
      
      const rawStream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints, 
        video: withVideo 
      })
      rawStreamRef.current = rawStream

      // Set up Web Audio API with Open-Source DSP Noise Processor & Noise Gate
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioCtx = new AudioContextClass()
      audioContextRef.current = audioCtx

      const processor = createVoiceProcessor(audioCtx, rawStream, {
        enableNoiseGate: noiseSuppression,
        noiseGateThreshold,
        enableHighPass: highpassFilter,
        enableVoicePresence: voiceClarity,
        enableCompressor: true,
        micGain: micVolume
      })
      voiceProcessorRef.current = processor
      localGainNodeRef.current = processor.gainNode

      // Combined stream containing processed audio track and raw video track
      const stream = new MediaStream()
      processor.destinationStream.getAudioTracks().forEach(track => stream.addTrack(track))
      rawStream.getVideoTracks().forEach(track => stream.addTrack(track))

      streamRef.current = stream
      setLocalStream(stream)
      monitorStream(user.id, stream)
      setIsJoined(true)
      setIsVideoEnabled(withVideo)
      setIsAudioEnabled(true)
      setIsDeafened(false)
      playSound('/sounds/incoming-user.mp3')
      if (isDmCall.current) {
        callConnectTime.current = Date.now()
      }

      const res = await apiFetch(`/channels/${targetChannelId}/voice/join`, {
        method: 'POST',
        credentials: 'include'
      })
      const data = await res.json()
      
      for (const p of data.participants) {
        const pc = createPC(p.id, stream)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        await sendSignal(p.id, 'offer', offer)
      }
    } catch (e) {
      isJoinedRef.current = false
      setIsJoined(false)
      activeChannelIdRef.current = null
      console.error("Failed to join", e)
    }
  }

  const leave = async (isAutomatic = false) => {
    const targetChannelId = activeChannelIdRef.current || channelId
    if (!targetChannelId || !isJoinedRef.current) return
    isJoinedRef.current = false
    clearCallTimeout()
    
    // Notify all peers that we are leaving instantly
    Object.keys(pcs.current).forEach(targetId => {
      sendSignal(targetId, 'leave', {}).catch(e => console.error("Failed to send leave signal", e))
    })
    
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    rawStreamRef.current?.getTracks().forEach(t => t.stop())
    rawStreamRef.current = null
    if (voiceProcessorRef.current) {
      voiceProcessorRef.current.cleanup()
      voiceProcessorRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    localGainNodeRef.current = null
    setLocalStream(null)
    setIsJoined(false)
    playSound('/sounds/deconnected.mp3')

    Object.values(pcs.current).forEach(pc => pc.close())
    pcs.current = {}
    setRemoteStreams({})
    analysers.current = {}
    setSpeakingUsers({})
    mainStreamIds.current = {}

    await apiFetch(`/channels/${targetChannelId}/voice/leave`, {
      method: 'POST',
      credentials: 'include'
    })
    activeChannelIdRef.current = null

    if (isDmCall.current && dmChannelIdRef.current && !isAutomatic) {
      let content = `📞 **${user?.username}** ended the call.`
      if (callConnectTime.current) {
        const durationSeconds = Math.round((Date.now() - callConnectTime.current) / 1000)
        const durationMinutes = Math.floor(durationSeconds / 60)
        const durationStr = durationMinutes > 0 ? `${durationMinutes} ${durationMinutes === 1 ? 'minute' : 'minutes'}` : 'less than a minute'
        content += ` The call lasted for ${durationStr}.`
        callConnectTime.current = null
      }
      sendSystemMessage(dmChannelIdRef.current, content)
    }
    isDmCall.current = false
    dmChannelIdRef.current = null
  }

  const toggleVideo = async () => {
    if (!streamRef.current) return

    if (isVideoEnabled) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.stop()
        streamRef.current?.removeTrack(track)
        Object.values(pcs.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track === track)
          if (sender) pc.removeTrack(sender)
        })
      })
      setIsVideoEnabled(false)
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        const videoTrack = videoStream.getVideoTracks()[0]
        streamRef.current.addTrack(videoTrack)
        
        Object.values(pcs.current).forEach(pc => {
          pc.addTrack(videoTrack, streamRef.current!)
        })
        setIsVideoEnabled(true)
      } catch (e) {
        console.error("Failed to enable video", e)
      }
    }
    setLocalStream(new MediaStream(streamRef.current.getTracks()))
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(track => {
        track.stop()
        Object.values(pcs.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track === track)
          if (sender) pc.removeTrack(sender)
        })
      })
      screenStreamRef.current = null
      setLocalScreenStream(null)
      setIsScreenSharing(false)
      playSound('/sounds/stream-ended.mp3')

      // Notify peers that screen share ended
      Object.keys(pcs.current).forEach(targetId => {
        sendSignal(targetId, 'screen-share-stopped', {})
      })
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenStreamRef.current = stream
        setLocalScreenStream(stream)
        setIsScreenSharing(true)
        playSound('/sounds/stream-started.mp3')

        const track = stream.getVideoTracks()[0]
        track.onended = () => {
          setIsScreenSharing(false)
          screenStreamRef.current = null
          setLocalScreenStream(null)
          playSound('/sounds/stream-ended.mp3')

          Object.values(pcs.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track === track)
            if (sender) pc.removeTrack(sender)
          })

          Object.keys(pcs.current).forEach(targetId => {
            sendSignal(targetId, 'screen-share-stopped', {})
          })
        }

        Object.values(pcs.current).forEach(pc => {
          pc.addTrack(track, stream)
        })
      } catch (e) {
        console.error("Failed to share screen", e)
      }
    }
  }

  useEffect(() => {
    if (!isJoined || !channelId) return

    const handleUnload = () => {
      const targetChannelId = activeChannelIdRef.current || channelId
      if (targetChannelId) {
        fetch(`${API_BASE}/channels/${targetChannelId}/voice/leave`, {
          method: 'POST',
          credentials: 'include',
          keepalive: true
        })
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('unload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      window.removeEventListener('unload', handleUnload)
    }
  }, [isJoined, channelId])

  // Call Signaling Methods
  const startCall = async (targetId: string, targetName: string, dmChannelId: string, withVideo = false) => {
    isDmCall.current = true
    dmChannelIdRef.current = dmChannelId
    callConnectTime.current = null
    setOutgoingCall({ targetId, targetName, channelId: dmChannelId, isVideo: withVideo })
    startRingtone('/sounds/outgoing-ring.mp3')
    
    setCallTimeout(async () => {
      await cancelCall()
    })

    await sendSignal(targetId, 'call-invite', {
      channelId: dmChannelId,
      isVideo: withVideo,
      callerName: user?.username || 'User'
    })
    sendSystemMessage(dmChannelId, `📞 **${user?.username}** started a call.`)
  }

  const cancelCall = async () => {
    clearCallTimeout()
    if (!outgoingCallRef.current) return
    const { targetId } = outgoingCallRef.current
    setOutgoingCall(null)
    stopRingtone()
    await sendSignal(targetId, 'call-cancel', {})
    await leave()
  }

  const acceptCall = async () => {
    clearCallTimeout()
    if (!incomingCallRef.current) return
    const { callerId, channelId, isVideo } = incomingCallRef.current
    isDmCall.current = true
    dmChannelIdRef.current = channelId
    callConnectTime.current = null
    setIncomingCall(null)
    stopRingtone()
    await sendSignal(callerId, 'call-accept', {})
    await join(isVideo, channelId)
  }

  const declineCall = async () => {
    clearCallTimeout()
    if (!incomingCallRef.current) return
    const { callerId, channelId } = incomingCallRef.current
    setIncomingCall(null)
    stopRingtone()
    await sendSignal(callerId, 'call-decline', {})
    if (channelId) {
      sendSystemMessage(channelId, `📞 **${user?.username}** ended the call.`)
    }
  }

  useEffect(() => {
    if (!isJoined) {
      if (checkSpeakingInterval.current) {
        clearInterval(checkSpeakingInterval.current)
        checkSpeakingInterval.current = null
      }
      return
    }

    checkSpeakingInterval.current = setInterval(() => {
      const nextSpeaking: Record<string, boolean> = {}
      Object.entries(analysers.current).forEach(([userId, analyser]) => {
        try {
          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          analyser.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const average = sum / dataArray.length
          nextSpeaking[userId] = average > 12 // speaking threshold volume level
        } catch (e) {
          // ignore issues with closed contexts
        }
      })
      setSpeakingUsers(nextSpeaking)
    }, 150)

    return () => {
      if (checkSpeakingInterval.current) {
        clearInterval(checkSpeakingInterval.current)
      }
    }
  }, [isJoined])

  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch('/signaling/receive', { credentials: 'include' })
        const { signals } = await res.json()

        for (const signal of signals) {
          const { from_id, type, data } = signal
          if (type === 'call-invite') {
            if (!isJoinedRef.current && !incomingCallRef.current && !outgoingCallRef.current) {
              setIncomingCall({
                callerId: from_id,
                callerName: data.callerName,
                channelId: data.channelId,
                isVideo: data.isVideo
              })
              isDmCall.current = true
              dmChannelIdRef.current = data.channelId
              startRingtone('/sounds/incoming-ring.mp3')

              setCallTimeout(async () => {
                await declineCall()
              })
            } else {
              sendSignal(from_id, 'call-decline', {}).catch(() => {})
            }
          } else if (type === 'call-cancel') {
            clearCallTimeout()
            setIncomingCall(null)
            stopRingtone()
          } else if (type === 'call-accept') {
            clearCallTimeout()
            stopRingtone()
            const callConfig = outgoingCallRef.current
            setOutgoingCall(null)
            if (callConfig) {
              await join(callConfig.isVideo, callConfig.channelId)
            }
          } else if (type === 'call-decline') {
            clearCallTimeout()
            setOutgoingCall(null)
            stopRingtone()
            playSound('/sounds/deconnected.mp3')
            await leave(true)
          } else if (type === 'offer') {
            if (!isJoinedRef.current) continue
            if (!pcs.current[from_id]) {
              playSound('/sounds/incoming-user.mp3')
            }
            const pc = createPC(from_id, streamRef.current!)
            await pc.setRemoteDescription(new RTCSessionDescription(data))
            
            // Process any queued candidates for this peer
            const queued = pendingCandidates.current[from_id] || []
            for (const cand of queued) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.error("Error adding queued candidate:", e))
            }
            delete pendingCandidates.current[from_id]
 
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            await sendSignal(from_id, 'answer', answer)
          } else if (type === 'answer') {
            if (!isJoinedRef.current) continue
            const pc = pcs.current[from_id]
            if (pc) {
              await pc.setRemoteDescription(new RTCSessionDescription(data))
              
              // Process any queued candidates for this peer
              const queued = pendingCandidates.current[from_id] || []
              for (const cand of queued) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.error("Error adding queued candidate:", e))
              }
              delete pendingCandidates.current[from_id]
            }
          } else if (type === 'ice-candidate') {
            if (!isJoinedRef.current) continue
            const pc = pcs.current[from_id]
            if (pc && pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(data)).catch(e => console.error("Error adding candidate:", e))
            } else {
              if (!pendingCandidates.current[from_id]) {
                pendingCandidates.current[from_id] = []
              }
              pendingCandidates.current[from_id].push(data)
            }
          } else if (type === 'leave') {
            if (!isJoinedRef.current) continue
            cleanupPeer(from_id)
            if (isDmCall.current) {
              await leave(true)
            }
          } else if (type === 'screen-share-stopped') {
            if (!isJoinedRef.current) continue
            setRemoteStreams(prev => {
              const key = `${from_id}-screen`
              if (prev[key]) {
                playSound('/sounds/stream-ended.mp3')
              }
              const next = { ...prev }
              delete next[key]
              return next
            })
          }
        }
      } catch (e) {
        console.error("Signaling error", e)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [user])

  return { 
    join, 
    leave, 
    toggleVideo, 
    toggleAudio, 
    toggleDeafen, 
    toggleScreenShare, 
    localStream, 
    localScreenStream, 
    remoteStreams, 
    isJoined, 
    isVideoEnabled, 
    isAudioEnabled, 
    isDeafened, 
    isScreenSharing,
    incomingCall,
    outgoingCall,
    startCall,
    cancelCall,
    acceptCall,
    declineCall,
    speakingUsers
  }
}
