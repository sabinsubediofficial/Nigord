import { useEffect, useState, useRef } from "react"
import { apiFetch, getFileUrl } from "@/lib/api"
import { useAuthStore } from "@/store/useAuthStore"
import { useMessageStore } from "@/store/useMessageStore"
import { useServers } from "@/hooks/useServers"
import { useServerStore } from "@/store/useServerStore"
import { useChannels } from "@/hooks/useChannels"
import { useChannelStore } from "@/store/useChannelStore"
import { useMessages } from "@/hooks/useMessages"
import { useWebRTC } from "@/hooks/useWebRTC"
import { useFriends } from "@/hooks/useFriends"
import { useDMs } from "@/hooks/useDMs"
import { useServerSettings } from "@/hooks/useServerSettings"
import { useNotifications } from "@/hooks/useNotifications"
import { useSearch } from "@/hooks/useSearch"
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import InviteModal from "@/components/modals/InviteModal"
import ServerSettingsModal from "@/components/modals/ServerSettingsModal"
import UserSettingsModal from "@/components/modals/UserSettingsModal"
import ChannelSettingsModal from "@/components/modals/ChannelSettingsModal"
import MessageContent from "@/components/MessageContent"
import { ServerList } from "@/components/navigation/ServerList"
import { SidebarHeader } from "@/components/navigation/SidebarHeader"
import { Plus, LogOut, Settings, Hash, Volume2, Shield, User, Users, Mic, MicOff, Headphones, Video, VideoOff, Phone, PhoneOff, MonitorUp, MessageSquare, Check, X as XIcon, Search, UserMinus, Ban, ChevronDown, UserPlus, Gamepad2, CornerUpLeft, Edit3, Trash2, Pin, Smile, MoreHorizontal, Compass, Megaphone, Pencil } from "lucide-react"

export default function HomePage() {
  const { user, setUser } = useAuthStore()
  const { servers, fetchServers, createServer } = useServers()
  const { currentServer, setCurrentServer } = useServerStore()
  const { channels, fetchChannels, createChannel } = useChannels()
  const { currentChannel, setCurrentChannel, setChannels } = useChannelStore()
  
  const { channelMessages, fetchMessages, fetchMoreMessages, hasMore: channelHasMore, isLoadingMore: channelLoadingMore, sendMessage } = useMessages(currentChannel?.id)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dmMessagesEndRef = useRef<HTMLDivElement>(null)
  
  const [activeVoiceChannel, setActiveVoiceChannel] = useState<any | null>(null)
  const { 
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
  } = useWebRTC(activeVoiceChannel?.id || undefined)

  const [sidebarWidth, setSidebarWidth] = useState<number>(240) // Default 240px

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(160, Math.min(480, startWidth + deltaX)); // clamp between 160px and 480px
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<any>(null)

  const handleMouseMoveVoice = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  // Robust cleanup of voice channel state when calls are terminated, declined, or cancelled
  const wasJoinedRef = useRef(false)
  const wasOutgoingRef = useRef(false)
  const wasIncomingRef = useRef(false)

  useEffect(() => {
    const wasJoined = wasJoinedRef.current
    const wasOutgoing = wasOutgoingRef.current
    const wasIncoming = wasIncomingRef.current

    wasJoinedRef.current = isJoined
    wasOutgoingRef.current = !!outgoingCall
    wasIncomingRef.current = !!incomingCall

    if (wasJoined && !isJoined) {
      setActiveVoiceChannel(null)
    }
    if (wasOutgoing && !outgoingCall && !isJoined) {
      setActiveVoiceChannel(null)
    }
    if (wasIncoming && !incomingCall && !isJoined) {
      setActiveVoiceChannel(null)
    }
  }, [isJoined, outgoingCall, incomingCall])

  // Modals
  const [showCreateServerModal, setShowCreateServerModal] = useState(false)
  const [newServerName, setNewServerName] = useState("")
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text')
  
  const [showServerMenu, setShowServerMenu] = useState(false)
  const [showServerSettingsModal, setShowServerSettingsModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showUserSettingsModal, setShowUserSettingsModal] = useState(false)
  const [showChannelSettingsModal, setShowChannelSettingsModal] = useState(false)
  const [channelToEdit, setChannelToEdit] = useState<any | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null)
  const [channelStatuses, setChannelStatuses] = useState<Record<string, string>>({})
  const [editingStatusChannelId, setEditingStatusChannelId] = useState<string | null>(null)
  const [newChannelStatus, setNewChannelStatus] = useState("")
  const [isTabActive, setIsTabActive] = useState(true)

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabActive(!document.hidden)
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

  const [messageContent, setMessageContent] = useState("")
  const [dmMessageContent, setDmMessageContent] = useState("")
  const [members, setMembers] = useState<any[]>([])
  const [voiceParticipants, setVoiceParticipants] = useState<any[]>([])
  const [focusedParticipantId, setFocusedParticipantId] = useState<string | null>(null)

  // Friends & DMs State
  const [activeTab, setActiveTab] = useState<'home' | 'server'>('home')
  const [activeHomeView, setActiveHomeView] = useState<'friends' | 'dm'>('friends')
  const [friendsFilter, setFriendsFilter] = useState<'all' | 'pending' | 'add' | 'blocked'>('all')
  const [activeDmId, setActiveDmId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { friends, searchResults, searchUsers, sendRequest, acceptRequest, removeFriend, blockUser } = useFriends()
  const { dms, messages: dmMessages, setMessages: setDmMessages, sendMessage: sendDmMessage, fetchMessages: fetchDmMessages, fetchMoreMessages: fetchMoreDmMessages, hasMore: dmHasMore, isLoadingMore: dmLoadingMore, fetchDMs } = useDMs(activeDmId || undefined)
  const { unreads } = useNotifications(currentServer?.id)
  const { searchResults: msgSearchResults, searchMessages, isSearching, setSearchResults: setMsgSearchResults } = useSearch(currentServer?.id)
  const { notifications, fetchNotifications } = useGlobalNotifications()
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const [showMsgSearchResults, setShowMsgSearchResults] = useState(false)
  const [hasSearchedUsers, setHasSearchedUsers] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([])
  const [selectedUserProfileId, setSelectedUserProfileId] = useState<string | null>(null)
  const [userProfileData, setUserProfileData] = useState<any | null>(null)
  const [showDmProfile, setShowDmProfile] = useState(true)
  const [dmUserProfile, setDmUserProfile] = useState<any | null>(null)
  const [textChannelsCollapsed, setTextChannelsCollapsed] = useState(false)
  const [voiceChannelsCollapsed, setVoiceChannelsCollapsed] = useState(false)
  

  const allParticipants = [
    {
      id: 'local',
      username: user?.username || 'You',
      isLocal: true,
      isVideoEnabled,
      isAudioEnabled,
      isDeafened,
      stream: localStream,
      avatar: user?.avatar
    },
    ...(isScreenSharing && localScreenStream ? [{
      id: 'local-screen',
      username: `${user?.username || 'You'} (Screen)`,
      isLocal: true,
      isVideoEnabled: true,
      isAudioEnabled: false,
      isDeafened: false,
      stream: localScreenStream,
      isScreenShare: true,
      avatar: user?.avatar
    }] : []),
    ...Object.entries(remoteStreams).map(([peerId, stream]) => {
      const actualUserId = peerId.replace('-screen', '');
      const isScreenShare = peerId.endsWith('-screen');
      const peer = voiceParticipants.find(p => p.user_id === actualUserId) 
        || members.find(m => m.id === actualUserId) 
        || dms.find(d => d.target_id === actualUserId)
        || { username: 'Unknown' };
      const hasVideo = stream.getVideoTracks().some(track => track.enabled && !track.muted && track.readyState !== 'ended');
      const isMuted = voiceParticipants.find(p => p.user_id === actualUserId)?.is_muted === 1;
      const isDeaf = voiceParticipants.find(p => p.user_id === actualUserId)?.is_deafened === 1;
      return {
        id: peerId,
        username: ((peer as any).username || (peer as any).name || 'Unknown') + (isScreenShare ? " (Screen)" : ""),
        isLocal: false,
        isVideoEnabled: hasVideo,
        isAudioEnabled: !isMuted,
        isDeafened: isDeaf,
        stream,
        isScreenShare,
        avatar: (peer as any).avatar
      }
    })
  ];

  const renderParticipantCard = (p: any, size: 'large' | 'small' | 'normal') => {
    const isLocal = p.isLocal;
    const hasVideo = p.isVideoEnabled;
    const isAudioEnabled = p.isAudioEnabled;
    const isDeafened = p.isDeafened;
    const stream = p.stream;
    const isScreenShare = p.isScreenShare;
    const isFocused = focusedParticipantId === p.id;
    const isSpeaking = p.isLocal 
      ? (speakingUsers[user?.id || 'local'] || speakingUsers['local'])
      : speakingUsers[p.id.replace('-screen', '')] === true;

    const cardClasses = `bg-[#1e1f22] rounded-[8px] flex flex-col items-center justify-center relative overflow-hidden border-2 transition-all cursor-pointer group shadow-md ${
      isSpeaking 
        ? 'border-[#23a55a]' 
        : (isFocused && size !== 'small' ? 'border-[#b5bac1]' : 'border-[#2b2d31] hover:border-[#35373c]')
    } ${
      size === 'small' ? 'w-48 aspect-video shrink-0 text-[10px]' : 'w-full h-full aspect-video'
    }`;

    const avatarSizeClass = size === 'small' ? 'w-12 h-12 text-sm' : 'w-20 h-20 text-2xl';

    return (
      <div 
        key={p.id} 
        onClick={() => {
          if (size === 'small') {
            setFocusedParticipantId(p.id);
          } else {
            setFocusedParticipantId(isFocused ? null : p.id);
          }
        }} 
        className={cardClasses}
      >
        {hasVideo && stream ? (
          <video 
            ref={el => { if (el && el.srcObject !== stream) el.srcObject = stream }} 
            autoPlay 
            muted={isLocal} 
            playsInline 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2b2d31]">
            <div className={`relative z-10 rounded-full bg-[#1e1f22] text-[#e3e1db] flex items-center justify-center font-bold uppercase transition-all duration-150 overflow-hidden ${avatarSizeClass} ${
              isSpeaking 
                ? 'ring-[3px] ring-[#23a55a] ring-offset-2 ring-offset-[#2b2d31]' 
                : ''
            }`}>
              {p.avatar ? (
                <img src={getFileUrl(p.avatar)} alt={p.username} className="w-full h-full object-cover" />
              ) : (
                p.username[0]
              )}
            </div>
          </div>
        )}
        <div className={`absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-[4px] text-xs font-medium text-white flex items-center gap-1.5 z-10 ${
          size === 'small' ? 'text-[10px] px-1.5 py-0.5 bottom-1.5 left-1.5 gap-1' : ''
        }`}>
          {!isScreenShare && !isAudioEnabled && <MicOff size={size === 'small' ? 10 : 12} className="text-[#f23f43]" />}
          {!isScreenShare && isDeafened && (
            <div className="relative flex items-center justify-center">
              <Headphones size={size === 'small' ? 10 : 12} className="text-[#f23f43]" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[1.2px] h-[12px] bg-[#f23f43] rotate-45" />
              </div>
            </div>
          )}
          <span className="truncate max-w-[100px]">{p.username} {isLocal ? '(You)' : ''}</span>
        </div>
      </div>
    );
  }

  // Advanced Messaging States
  const [replyToMsg, setReplyToMsg] = useState<any | null>(null)
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [showPins, setShowPins] = useState(false)
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([])
  const [typingUsers, setTypingUsers] = useState<any[]>([])
  const lastTypingSentRef = useRef<number>(0)
  
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
  }
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  useEffect(() => {
    setTypingUsers([])
  }, [currentChannel?.id, activeDmId])

  const fetchPins = async () => {
    const isDm = activeTab === 'home'
    const channelId = isDm ? activeDmId : currentChannel?.id
    if (!channelId) return
    try {
      const res = await apiFetch(isDm ? `/dms/${channelId}/pins` : `/channels/${channelId}/pins`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setPinnedMessages(data.pinned)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const togglePin = async (msgId: string, isPinnedNow: boolean) => {
    const isDm = activeTab === 'home'
    const channelId = isDm ? activeDmId : currentChannel?.id
    if (!channelId) return

    const nextPinVal = !isPinnedNow ? 1 : 0
    if (isDm) {
      setDmMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: nextPinVal } : m))
    } else {
      useMessageStore.getState().updateMessage(channelId, msgId, { is_pinned: nextPinVal })
    }

    try {
      const res = await apiFetch(`/messages/${msgId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !isPinnedNow }),
        credentials: 'include'
      })
      if (res.ok) {
        showToast(!isPinnedNow ? "Message pinned!" : "Message unpinned!")
        fetchPins()
      } else {
        // Rollback
        if (isDm) {
          setDmMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: isPinnedNow ? 1 : 0 } : m))
        } else {
          useMessageStore.getState().updateMessage(channelId, msgId, { is_pinned: isPinnedNow ? 1 : 0 })
        }
      }
    } catch (e) {
      console.error(e)
      // Rollback
      if (isDm) {
        setDmMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: isPinnedNow ? 1 : 0 } : m))
      } else {
        useMessageStore.getState().updateMessage(channelId, msgId, { is_pinned: isPinnedNow ? 1 : 0 })
      }
    }
  }

  const handleDeleteMsg = async (msgId: string) => {
    const isDm = activeTab === 'home'
    const channelId = isDm ? activeDmId : currentChannel?.id
    if (!channelId) return

    let previousMsgs: any[] = []
    if (isDm) {
      setDmMessages(prev => {
        previousMsgs = prev
        return prev.filter(m => m.id !== msgId)
      })
    } else {
      previousMsgs = useMessageStore.getState().messages[channelId] || []
      useMessageStore.getState().deleteMessage(channelId, msgId)
    }

    try {
      const res = await apiFetch(isDm ? `/dms/${channelId}/messages/${msgId}` : `/channels/${channelId}/messages/${msgId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!res.ok) {
        if (isDm) setDmMessages(previousMsgs)
        else useMessageStore.getState().setMessages(channelId, previousMsgs)
      }
    } catch (e) {
      console.error(e)
      if (isDm) setDmMessages(previousMsgs)
      else useMessageStore.getState().setMessages(channelId, previousMsgs)
    }
  }

  const handleEditMsg = async (msgId: string, newContent: string) => {
    const isDm = activeTab === 'home'
    const channelId = isDm ? activeDmId : currentChannel?.id
    if (!channelId) return

    setEditingMsgId(null)

    let oldMsg: any = null
    if (isDm) {
      setDmMessages(prev => {
        oldMsg = prev.find(m => m.id === msgId)
        return prev.map(m => m.id === msgId ? { ...m, content: newContent, edited_at: new Date().toISOString() } : m)
      })
    } else {
      const current = useMessageStore.getState().messages[channelId] || []
      oldMsg = current.find(m => m.id === msgId)
      useMessageStore.getState().updateMessage(channelId, msgId, { content: newContent, edited_at: new Date().toISOString() })
    }

    try {
      const res = await apiFetch(isDm ? `/dms/${channelId}/messages/${msgId}` : `/channels/${channelId}/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
        credentials: 'include'
      })
      if (!res.ok) {
        if (isDm) {
          setDmMessages(prev => prev.map(m => m.id === msgId ? oldMsg : m))
        } else {
          useMessageStore.getState().updateMessage(channelId, msgId, oldMsg)
        }
      }
    } catch (e) {
      console.error(e)
      if (isDm) {
        setDmMessages(prev => prev.map(m => m.id === msgId ? oldMsg : m))
      } else {
        useMessageStore.getState().updateMessage(channelId, msgId, oldMsg)
      }
    }
  }

  const toggleReaction = async (msgId: string, emoji: string, hasReacted: boolean) => {
    const isDm = activeTab === 'home'
    const channelId = isDm ? activeDmId : currentChannel?.id
    if (!channelId) return

    const updateLocalReactions = (prev: any[]) => {
      return prev.map(m => {
        if (m.id === msgId) {
          const reactions = m.reactions || []
          if (hasReacted) {
            return {
              ...m,
              reactions: reactions.filter((r: any) => !(r.emoji === emoji && r.user_id === user?.id))
            }
          } else {
            return {
              ...m,
              reactions: [...reactions, { message_id: msgId, emoji, user_id: user?.id, username: user?.username }]
            }
          }
        }
        return m
      })
    }

    let previousMsgs: any[] = []
    if (isDm) {
      setDmMessages(prev => {
        previousMsgs = prev
        return updateLocalReactions(prev)
      })
    } else {
      previousMsgs = useMessageStore.getState().messages[channelId] || []
      const updated = updateLocalReactions(previousMsgs)
      useMessageStore.getState().setMessages(channelId, updated)
    }

    try {
      const res = await apiFetch(`/messages/${msgId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, action: hasReacted ? 'remove' : 'add' }),
        credentials: 'include'
      })
      if (!res.ok) {
        if (isDm) setDmMessages(previousMsgs)
        else useMessageStore.getState().setMessages(channelId, previousMsgs)
      }
    } catch (e) {
      console.error(e)
      if (isDm) setDmMessages(previousMsgs)
      else useMessageStore.getState().setMessages(channelId, previousMsgs)
    }
  }

  const sendTypingStatus = async (isTyping: boolean) => {
    const channelId = currentChannel?.id || activeDmId
    if (!channelId) return
    try {
      await apiFetch(`/channels/${channelId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_typing: isTyping }),
        credentials: 'include'
      })
    } catch (e) {
      console.error(e)
    }
  }

  const fetchTypingUsers = async () => {
    const channelId = currentChannel?.id || activeDmId
    if (!channelId) return
    try {
      const res = await apiFetch(`/channels/${channelId}/typing`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setTypingUsers(data.typing_users)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newPending = [...pendingAttachments]

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 25 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size allowed is 25MB.`)
        continue
      }
      const formData = new FormData()
      formData.append('file', file)

      try {
        console.log("Starting upload for", file.name)
        const res = await apiFetch('/files/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })
        console.log("Upload response status:", res.status)
        if (res.ok) {
          const data = await res.json()
          newPending.push(data)
        } else {
          const errorText = await res.text()
          console.error("Upload failed with error:", errorText)
          alert(`Upload failed for ${file.name}: ${res.statusText}`)
        }
      } catch (error) {
        console.error("Upload failed", error)
      }
    }

    setPendingAttachments(newPending)
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePendingAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id))
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageContent.trim() && pendingAttachments.length === 0) return
    
    sendTypingStatus(false)
    const attachmentsToSend = [...pendingAttachments]
    setPendingAttachments([]) 
    const contentToSend = messageContent
    const replyId = replyToMsg?.id
    setReplyToMsg(null)
    setMessageContent("")

    try {
      await sendMessage(contentToSend, attachmentsToSend, replyId)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendDmMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dmMessageContent.trim() && pendingAttachments.length === 0) return
    
    sendTypingStatus(false)
    const attachmentsToSend = [...pendingAttachments]
    setPendingAttachments([])
    const contentToSend = dmMessageContent
    const replyId = replyToMsg?.id
    setReplyToMsg(null)
    setDmMessageContent("")

    try {
      await sendDmMessage(contentToSend, attachmentsToSend, replyId)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchServers()
  }, [])

  useEffect(() => {
    const isVoiceCallActive = !!activeVoiceChannel
    const pollInterval = (isTabActive || isVoiceCallActive) ? 1500 : 4000

    const interval = setInterval(() => {
      // 1. Fetch global notifications (badges + sound)
      // Pass the IDs of what we are currently LOOKING AT to suppress notifications for them
      fetchNotifications(currentChannel?.id, activeDmId || undefined)

      // If tab is backgrounded and user is not in a voice call, skip intensive queries
      if (!isTabActive && !isVoiceCallActive) {
        return
      }

      // 2. Fetch messages for the ACTIVE conversation
      if (activeTab === 'server' && currentChannel) {
        fetchMessages()
      } else if (activeTab === 'home' && activeHomeView === 'dm' && activeDmId) {
        fetchDmMessages()
      }

      // 3. Fetch voice participants & server members if in a server
      if (currentServer) {
        fetchVoiceParticipants(currentServer.id, 'server')
        fetchMembers(currentServer.id)
      } else if (activeVoiceChannel) {
        fetchVoiceParticipants(activeVoiceChannel.id, 'channel')
      }

      // 4. Fetch typing users
      if (currentChannel || activeDmId) {
        fetchTypingUsers()
      }
    }, pollInterval)

    return () => clearInterval(interval)
  }, [user, currentChannel, activeDmId, activeTab, activeHomeView, currentServer, activeVoiceChannel, isTabActive])

  const fetchMembers = async (serverId: string) => {
    try {
      const res = await apiFetch(`/servers/${serverId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members)
        if (data.permissions) {
          setPermissions(data.permissions)
        }
        if (data.channels) {
          setChannels(data.channels)
          
          if (currentChannel && currentChannel.server_id === serverId) {
            const currentStillExists = data.channels.some((c: any) => c.id === currentChannel.id)
            if (!currentStillExists) {
              const textChans = data.channels.filter((c: any) => c.type === 'text')
              if (textChans.length > 0) {
                setCurrentChannel(textChans[0])
              } else {
                setCurrentChannel(null)
              }
            }
          }
          
          if (activeVoiceChannel && activeVoiceChannel.server_id === serverId) {
            const voiceStillExists = data.channels.some((c: any) => c.id === activeVoiceChannel.id)
            if (!voiceStillExists) {
              await handleLeaveVoice()
            }
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchVoiceParticipants = async (id: string, type: 'server' | 'channel' = 'server') => {
    try {
      const endpoint = type === 'server' ? `/servers/${id}/voice/participants` : `/channels/${id}/voice/participants`
      const res = await apiFetch(endpoint, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setVoiceParticipants(data.participants)
      } else if (res.status === 404) {
        await handleLeaveVoice()
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (currentServer) {
      fetchMembers(currentServer.id)
      fetchChannels(currentServer.id)
    }
  }, [currentServer])

  useEffect(() => {
    if (currentChannel && currentChannel.type === 'text') {
      fetchMessages()
    }
  }, [currentChannel])

  const findLocalUserInfo = (userId: string) => {
    if (userId === user?.id) {
      return {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar: user.avatar,
        bio: user.bio,
        status_message: user.status_message,
        status: user.status,
      }
    }
    
    const member = members.find(m => m.id === userId)
    if (member) {
      return {
        id: member.id,
        username: member.username,
        display_name: member.display_name,
        avatar: member.avatar,
        status_message: member.status_message,
        status: member.status,
      }
    }

    const friend = friends.find(f => f.id === userId)
    if (friend) {
      return {
        id: friend.id,
        username: friend.username,
        display_name: friend.display_name || friend.username,
        avatar: friend.avatar,
        status_message: friend.status_message,
        status: friend.presence_status,
      }
    }

    const dm = dms.find(d => d.target_id === userId)
    if (dm) {
      return {
        id: dm.target_id,
        username: dm.name,
        display_name: dm.display_name || dm.name,
        avatar: dm.avatar,
        status: dm.status,
      }
    }

    const msg = [...channelMessages, ...dmMessages].find(m => m.author_id === userId)
    if (msg) {
      return {
        id: msg.author_id,
        username: msg.username,
        display_name: msg.username,
        status: 'online',
      }
    }

    return null
  }

  useEffect(() => {
    if (!selectedUserProfileId) {
      setUserProfileData(null)
      return
    }

    const localUser = findLocalUserInfo(selectedUserProfileId)
    if (localUser) {
      setUserProfileData({
        ...localUser,
        bio: (localUser as any).bio || '',
        isLoading: true
      })
    } else {
      setUserProfileData({ isLoading: true })
    }

    const fetchProfile = async () => {
      try {
        const res = await apiFetch(`/users/${selectedUserProfileId}/profile`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setUserProfileData({
            ...data.user,
            isLoading: false
          })
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchProfile()
  }, [selectedUserProfileId])

  useEffect(() => {
    if (!activeDmId) {
      setDmUserProfile(null)
      return
    }
    const dmChannel = dms.find(d => d.id === activeDmId)
    if (!dmChannel) return

    const fetchDmProfile = async () => {
      try {
        const res = await apiFetch(`/users/${dmChannel.target_id}/profile`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setDmUserProfile(data.user)
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchDmProfile()
  }, [activeDmId, dms])

  const handleDmScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const isAtTop = Math.abs(container.scrollTop) + container.clientHeight >= container.scrollHeight - 10
    if (isAtTop && dmHasMore && !dmLoadingMore) {
      await fetchMoreDmMessages()
    }
  }

  const handleChannelScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const isAtTop = Math.abs(container.scrollTop) + container.clientHeight >= container.scrollHeight - 10
    if (isAtTop && channelHasMore && !channelLoadingMore) {
      await fetchMoreMessages()
    }
  }

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault()
    const nameToUse = newServerName.trim() || `${user?.username}'s server`
    const server = await createServer(nameToUse)
    if (server) {
      setNewServerName("")
      setShowCreateServerModal(false)
      setCurrentServer(server)
      setActiveTab('server')
    }
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentServer) return
    const nameToUse = newChannelName.trim() || 'new-channel'
    const channel = await createChannel(currentServer.id, nameToUse, newChannelType)
    if (channel) {
      setNewChannelName("")
      setShowCreateChannelModal(false)
      setCurrentChannel(channel)
    }
  }

  const handleJoinVoice = async (channel: any) => {
    if (activeVoiceChannel?.id === channel.id) return
    if (activeVoiceChannel) await leave()
    setActiveVoiceChannel(channel)
  }

  useEffect(() => {
    if (activeVoiceChannel && user) {
      join()
      setVoiceParticipants(prev => [
        ...prev.filter(p => p.user_id !== user.id),
        {
          user_id: user.id,
          username: user.username,
          avatar: user.avatar,
          channel_id: activeVoiceChannel.id,
          is_muted: !isAudioEnabled ? 1 : 0,
          is_deafened: isDeafened ? 1 : 0
        }
      ])
      if (currentServer) {
        fetchVoiceParticipants(currentServer.id)
      }
    }
  }, [activeVoiceChannel])

  const handleLeaveVoice = async () => {
    await leave()
    setActiveVoiceChannel(null)
    setFocusedParticipantId(null)
    if (user) {
      setVoiceParticipants(prev => prev.filter(p => p.user_id !== user.id))
    }
    if (currentServer) {
      fetchVoiceParticipants(currentServer.id)
    }
  }

  useEffect(() => {
    if (user && activeVoiceChannel) {
      setVoiceParticipants(prev => prev.map(p => {
        if (p.user_id === user.id) {
          return {
            ...p,
            is_muted: !isAudioEnabled ? 1 : 0,
            is_deafened: isDeafened ? 1 : 0
          }
        }
        return p
      }))
    }
  }, [isAudioEnabled, isDeafened, user, activeVoiceChannel])

  // Reset focus state if the focused participant leaves
  useEffect(() => {
    if (focusedParticipantId) {
      const activeIds = [
        'local',
        ...Object.keys(remoteStreams)
      ]
      if (!activeIds.includes(focusedParticipantId)) {
        setFocusedParticipantId(null)
      }
    }
  }, [remoteStreams, focusedParticipantId])

  const handleSearchUsers = (e: React.FormEvent) => {
    e.preventDefault()
    setHasSearchedUsers(true)
    searchUsers(searchQuery)
  }

  useEffect(() => {
    setHasSearchedUsers(false)
  }, [searchQuery, friendsFilter])

  const goHome = () => {
    sendTypingStatus(false)
    setCurrentServer(null)
    setCurrentChannel(null)
    setActiveTab('home')
    setActiveHomeView('friends')
  }

  const openDm = (dmId: string) => {
    sendTypingStatus(false)
    setCurrentServer(null)
    setCurrentChannel(null)
    setActiveTab('home')
    setActiveHomeView('dm')
    setActiveDmId(dmId)
  }

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await apiFetch('/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (e) {
      console.error(e)
    }
    setShowStatusMenu(false)
  }

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'online': return 'bg-[#23a559]';
      case 'idle': return 'bg-[#f0b232]';
      case 'dnd': return 'bg-[#f23f43]';
      default: return 'bg-[#80848e]';
    }
  }

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', credentials: 'include' })
      useChannelStore.getState().clearCache()
      setUser(null)
    } catch (e) {
      console.error(e)
    }
  }

  const handleLeaveServer = async () => {
    if (!currentServer) return;
    if (window.confirm("Are you sure you want to leave this server?")) {
      try {
        const res = await apiFetch(`/servers/${currentServer.id}/leave`, {
          method: 'POST',
          credentials: 'include'
        });
        if (res.ok) {
          window.location.reload();
        } else {
          const data = await res.json();
          alert(data.error || "Failed to leave server");
        }
      } catch (err) {
        alert("Failed to leave server due to network error.");
      }
    }
  }

  const textChannels = channels.filter(c => c.type === 'text')
  const voiceChannels = channels.filter(c => c.type === 'voice')

  return (
    <div className="flex h-screen bg-[#141517] text-[#e3e1db] overflow-hidden p-0 gap-0">
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <RemoteStream key={peerId} stream={stream} />
      ))}

      {/* Server Sidebar (Far Left, full height) */}
      <ServerList
        servers={servers}
        currentServer={currentServer}
        activeTab={activeTab}
        notifications={notifications}
        goHome={goHome}
        onSelectServer={(server) => {
          setCurrentServer(server);
          setActiveTab('server');
        }}
        onAddServer={() => setShowCreateServerModal(true)}
        sendTypingStatus={sendTypingStatus}
      />

      {/* Main Bordered Dashboard Layout Container */}
      <div className="flex-1 flex my-2 mr-2 ml-0 rounded-[12px] border border-[#2d2f31] bg-[#141517] overflow-hidden relative">
        
        {/* Column 2: Resizable Secondary Sidebar (Channels/DMs List) */}
        <div 
          style={{ width: `${sidebarWidth}px` }}
          className="relative flex flex-col h-full bg-[#1e2022] border-r border-[#2d2f31] shrink-0 overflow-hidden"
        >
        <SidebarHeader
          activeTab={activeTab}
          currentServer={currentServer}
          showServerMenu={showServerMenu}
          setShowServerMenu={setShowServerMenu}
          setShowInviteModal={setShowInviteModal}
          setShowServerSettingsModal={setShowServerSettingsModal}
          onLeaveServer={handleLeaveServer}
          isOwner={currentServer?.owner_id === user?.id}
          isAdmin={!!(currentServer as any)?.permissions?.includes('ADMINISTRATOR')}
        />
        
        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
          {activeTab === 'home' ? (
            <div className="space-y-2">
              <div 
                onClick={() => setActiveHomeView('friends')}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer ${activeHomeView === 'friends' ? 'bg-[#2d2f31] text-[#e3e1db] border border-[#343638]/50' : 'text-[#a3a29e] hover:bg-[#2d2f31]/50 hover:text-[#e3e1db]'}`}
              >
                <User size={20} />
                <span className="font-medium">Friends</span>
              </div>
              <div className="pt-4">
                <span className="text-xs font-bold uppercase text-[#767572] px-2 mb-2 block hover:text-[#e3e1db] cursor-pointer">Direct Messages</span>
                {dms.map(dm => {
                  const unreadCount = notifications.dms.find(d => d.channel_id === dm.id)?.unread_count || 0;
                  return (
                  <div 
                    key={dm.id} 
                    onClick={() => openDm(dm.id)}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer group relative ${activeHomeView === 'dm' && activeDmId === dm.id ? 'bg-[#2d2f31] text-[#e3e1db] border border-[#343638]/50' : 'text-[#a3a29e] hover:bg-[#2d2f31]/50 hover:text-[#e3e1db]'}`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full bg-[#2d2f31] flex items-center justify-center text-xs font-bold uppercase text-[#e3e1db] border border-[#343638] overflow-hidden">
                        {dm.avatar ? (
                          <img src={getFileUrl(dm.avatar)} alt={dm.name} className="w-full h-full object-cover" />
                        ) : (
                          dm.name[0]
                        )}
                      </div>
                      {dm.active_call && dm.active_call > 0 ? (
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#bc9f84] border border-[#1e2022] flex items-center justify-center text-[#141517]">
                          <Phone size={6} className="fill-current" />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 text-left">
                      <span className={`font-medium text-sm truncate ${unreadCount > 0 && activeDmId !== dm.id ? 'text-[#e3e1db] font-bold' : ''}`}>{dm.name}</span>
                      {dm.active_call && dm.active_call > 0 ? (
                        <span className="text-[10px] text-[#bc9f84] font-semibold flex items-center gap-1 leading-none mt-0.5">
                          <Phone size={8} className="fill-current text-[#bc9f84]" />
                          In a call
                        </span>
                      ) : null}
                    </div>
                    {unreadCount > 0 && activeDmId !== dm.id && (
                      <div className="absolute right-2 bg-[#bc9f84] text-[#141517] text-[10px] font-bold px-1.5 h-4 rounded-full flex items-center justify-center">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </div>
          ) : currentServer ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between px-1.5 mb-1 group/header select-none">
                  <button 
                    onClick={() => setTextChannelsCollapsed(!textChannelsCollapsed)}
                    className="flex items-center gap-1 text-[11px] font-bold uppercase text-[#767572] hover:text-[#dbdee1] transition-colors"
                  >
                    <ChevronDown 
                      size={12} 
                      className={`transition-transform duration-200 ${textChannelsCollapsed ? '-rotate-90' : ''}`} 
                    />
                    <span>Text Channels</span>
                  </button>
                  {(currentServer.owner_id === user?.id || (currentServer as any).permissions?.includes('ADMINISTRATOR') || (currentServer as any).permissions?.includes('MANAGE_CHANNELS')) && (
                    <Plus 
                      size={14} 
                      className="text-[#a3a29e] cursor-pointer hover:text-[#dbdee1] hover:scale-110 active:scale-95 opacity-0 group-hover/header:opacity-100 transition-all duration-200" 
                      onClick={(e) => { e.stopPropagation(); setNewChannelType('text'); setShowCreateChannelModal(true); }} 
                    />
                  )}
                </div>
                {!textChannelsCollapsed && (
                  <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {textChannels.map(channel => {
                      const isUnread = unreads[channel.id] > 0;
                      const isActive = currentChannel?.id === channel.id;
                      return (
                        <div 
                          key={channel.id} 
                          onClick={() => { sendTypingStatus(false); setCurrentChannel(channel); }} 
                          className={`relative flex items-center justify-between pl-5 pr-2 py-1.5 rounded-md cursor-pointer group transition-all duration-200 ${
                            isActive 
                              ? 'bg-[#2d2f31] text-[#e3e1db]' 
                              : 'text-[#949ba4] hover:bg-[#2d2f31]/50 hover:text-[#e3e1db]'
                          }`}
                        >
                          {/* Left accent pill */}
                          <div 
                            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200 ${
                              isActive 
                                ? 'h-5 bg-[#bc9f84]' 
                                : isUnread 
                                  ? 'h-2.5 bg-[#949ba4] group-hover:h-3.5' 
                                  : 'h-0 bg-[#bc9f84]/40 group-hover:h-3'
                            }`} 
                          />
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Hash 
                              size={18} 
                              className={`transition-colors shrink-0 ${
                                isActive 
                                  ? 'text-[#e3e1db]' 
                                  : (isUnread ? 'text-[#f2f3f5]' : 'text-[#767572] group-hover:text-[#dbdee1]')
                              }`} 
                            />
                            <span className={`text-[14px] truncate transition-all duration-200 group-hover:translate-x-0.5 ${
                              isActive
                                ? 'font-medium text-[#e3e1db]'
                                : isUnread 
                                  ? 'font-bold text-[#f2f3f5]' 
                                  : 'font-medium text-[#949ba4] group-hover:text-[#dbdee1]'
                            }`}>{channel.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 transition-all duration-200 shrink-0 ml-1 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0">
                            <span title="Create Invite" className="flex items-center">
                              <UserPlus
                                size={14}
                                className="text-[#a3a29e] hover:text-[#e3e1db] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowInviteModal(true);
                                }}
                              />
                            </span>
                            {(currentServer?.owner_id === user?.id || permissions.includes('ADMINISTRATOR') || permissions.includes('MANAGE_CHANNELS')) && (
                              <span title="Edit Channel" className="flex items-center">
                                <Settings
                                  size={14}
                                  className="text-[#a3a29e] hover:text-[#e3e1db] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setChannelToEdit(channel);
                                    setShowChannelSettingsModal(true);
                                  }}
                                />
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between px-1.5 mb-1 group/header select-none">
                  <button 
                    onClick={() => setVoiceChannelsCollapsed(!voiceChannelsCollapsed)}
                    className="flex items-center gap-1 text-[11px] font-bold uppercase text-[#767572] hover:text-[#dbdee1] transition-colors"
                  >
                    <ChevronDown 
                      size={12} 
                      className={`transition-transform duration-200 ${voiceChannelsCollapsed ? '-rotate-90' : ''}`} 
                    />
                    <span>Voice Channels</span>
                  </button>
                  {(currentServer.owner_id === user?.id || (currentServer as any).permissions?.includes('ADMINISTRATOR') || (currentServer as any).permissions?.includes('MANAGE_CHANNELS')) && (
                    <Plus 
                      size={14} 
                      className="text-[#a3a29e] cursor-pointer hover:text-[#dbdee1] hover:scale-110 active:scale-95 opacity-0 group-hover/header:opacity-100 transition-all duration-200" 
                      onClick={(e) => { e.stopPropagation(); setNewChannelType('voice'); setShowCreateChannelModal(true); }} 
                    />
                  )}
                </div>
                {!voiceChannelsCollapsed && (
                  <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {voiceChannels.map(channel => {
                      const participants = voiceParticipants.filter(p => {
                        if (p.channel_id !== channel.id) return false
                        if (p.user_id === user?.id) return isJoined
                        return true
                      });
                      const isActive = currentChannel?.id === channel.id;
                      const isConnected = activeVoiceChannel?.id === channel.id;
                      return (
                        <div key={channel.id} className="flex flex-col">
                          <div 
                            onClick={() => { sendTypingStatus(false); setCurrentChannel(channel); handleJoinVoice(channel); }} 
                            className={`relative flex items-center justify-between pl-5 pr-2 py-1.5 rounded-md cursor-pointer group transition-all duration-200 ${
                              isConnected
                                ? 'bg-[#2d2f31]/40 text-[#e3e1db]'
                                : (isActive 
                                  ? 'bg-[#2d2f31] text-[#e3e1db]' 
                                  : 'text-[#949ba4] hover:bg-[#2d2f31]/50 hover:text-[#e3e1db]')
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              <Volume2 
                                size={18} 
                                className={`transition-colors shrink-0 mt-[2px] ${
                                  isConnected
                                    ? 'text-[#23a55a]'
                                    : (isActive 
                                      ? 'text-[#e3e1db]' 
                                      : 'text-[#767572] group-hover:text-[#dbdee1]')
                                }`} 
                              />
                              <div className="flex flex-col min-w-0 flex-1 select-none">
                                <span className={`text-[14px] truncate transition-all duration-200 ${
                                  isConnected
                                    ? 'font-medium text-[#e3e1db]'
                                    : (isActive
                                      ? 'font-medium text-[#e3e1db]'
                                      : 'font-medium text-[#949ba4] group-hover:text-[#dbdee1]')
                                }`}>{channel.name}</span>
                                
                                {/* Voice Channel Status */}
                                {(isConnected || channelStatuses[channel.id]) && (
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isConnected) {
                                        setEditingStatusChannelId(channel.id);
                                        setNewChannelStatus(channelStatuses[channel.id] || "");
                                      }
                                    }}
                                    className="flex items-center gap-1 group/status text-[11px] text-[#949ba4] hover:text-[#dbdee1] transition-colors mt-0.5 min-w-0 cursor-pointer"
                                  >
                                    {editingStatusChannelId === channel.id ? (
                                      <input
                                        type="text"
                                        value={newChannelStatus}
                                        onChange={(e) => setNewChannelStatus(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.stopPropagation();
                                            setChannelStatuses(prev => ({ ...prev, [channel.id]: newChannelStatus }));
                                            setEditingStatusChannelId(null);
                                          } else if (e.key === 'Escape') {
                                            e.stopPropagation();
                                            setEditingStatusChannelId(null);
                                          }
                                        }}
                                        onBlur={() => {
                                          setChannelStatuses(prev => ({ ...prev, [channel.id]: newChannelStatus }));
                                          setEditingStatusChannelId(null);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-[#1e2022] text-[#dbdee1] px-1 py-0.5 rounded outline-none border border-[#bc9f84] w-full"
                                        placeholder="Set status..."
                                        autoFocus
                                      />
                                    ) : (
                                      <>
                                        <span className="truncate max-w-[130px] font-normal">
                                          {channelStatuses[channel.id] || "Set a channel status"}
                                        </span>
                                        {isConnected && (
                                          <Pencil 
                                            size={10} 
                                            className="opacity-0 group-hover/status:opacity-100 transition-opacity shrink-0 ml-0.5 text-[#949ba4]" 
                                          />
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 transition-all duration-200 shrink-0 ml-1 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0">
                              <span title="Create Invite" className="flex items-center">
                                <UserPlus
                                  size={14}
                                  className="text-[#a3a29e] hover:text-[#e3e1db] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowInviteModal(true);
                                  }}
                                />
                              </span>
                              {(currentServer?.owner_id === user?.id || permissions.includes('ADMINISTRATOR') || permissions.includes('MANAGE_CHANNELS')) && (
                                <span title="Edit Channel" className="flex items-center">
                                  <Settings
                                    size={14}
                                    className="text-[#a3a29e] hover:text-[#e3e1db] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setChannelToEdit(channel);
                                      setShowChannelSettingsModal(true);
                                    }}
                                  />
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Participant List */}
                          {participants.length > 0 && (
                            <div className="ml-6 pl-2.5 space-y-1 my-1 animate-in slide-in-from-top-1 duration-150">
                              {participants.map(p => {
                                const isUserSpeaking = p.user_id === user?.id 
                                  ? (speakingUsers[user?.id || 'local'] || speakingUsers['local'])
                                  : speakingUsers[p.user_id] === true;
                                return (
                                  <div 
                                    key={p.user_id} 
                                    onClick={() => setSelectedUserProfileId(p.user_id)}
                                    className="flex items-center justify-between p-1 rounded-md hover:bg-[#2d2f31]/50 cursor-pointer group/p transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className={`w-5 h-5 rounded-full bg-[#2b2d31] flex items-center justify-center text-[9px] uppercase font-bold text-[#e3e1db] shrink-0 overflow-hidden transition-all duration-150 ${
                                        isUserSpeaking 
                                          ? 'ring-2 ring-[#23a55a] border-transparent shadow-[0_0_8px_rgba(35,165,90,0.6)] scale-105' 
                                          : 'border border-[#3f4147]'
                                      }`}>
                                        {p.avatar ? (
                                          <img src={getFileUrl(p.avatar)} alt={p.username} className="w-full h-full object-cover" />
                                        ) : (
                                          p.username[0]
                                        )}
                                      </div>
                                      <span className={`text-xs truncate transition-colors duration-150 font-medium ${
                                        isUserSpeaking ? 'text-[#23a55a] font-semibold' : 'text-[#949ba4] group-hover/p:text-[#dbdee1]'
                                      }`}>{p.username}</span>
                                    </div>
                                    <div className="flex items-center gap-1 pr-1 shrink-0">
                                      {p.is_muted === 1 && <MicOff size={13} className="text-[#949ba4]" />}
                                      {p.is_deafened === 1 && (
                                        <div className="relative flex items-center justify-center text-[#949ba4]">
                                          <Headphones size={13} />
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-[1px] h-[13px] bg-[#949ba4] rotate-45" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Bottom Panels (Voice Connected Status & User Card) */}
        <div className="flex flex-col shrink-0 mt-auto bg-[#1e2022] w-full">
          {/* Voice Connection Status */}
          {activeVoiceChannel && (() => {
            const voiceServer = servers.find(s => s.id === activeVoiceChannel.server_id);
            const voiceSubtitle = voiceServer ? `${activeVoiceChannel.name} / ${voiceServer.name}` : `${activeVoiceChannel.name} / Direct Call`;
            return (
              <div className="mx-2 mb-2 p-2 bg-[#111214] border border-[#2d2f31] rounded-[8px] flex flex-col gap-2 shrink-0 shadow-sm text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#23a55a]">
                    <Volume2 size={20} className="text-[#23a55a]" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold leading-tight text-[#23a55a]">Voice Connected</span>
                      <span className="text-[10px] leading-tight text-[#949ba4] truncate">{voiceSubtitle}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handleLeaveVoice} className="h-8 w-8 text-[#b5bac1] hover:text-[#ed4245]"><PhoneOff size={18} /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="icon" onClick={toggleVideo} className={`flex-1 h-8 bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] border-none rounded-[6px] ${isVideoEnabled ? 'bg-[#bc9f84] text-[#141517] hover:bg-[#bc9f84]/80' : ''}`} title={isVideoEnabled ? 'Stop Video' : 'Video'}>
                    {isVideoEnabled ? <VideoOff size={16} /> : <Video size={16} />}
                  </Button>
                  <Button variant="secondary" size="icon" onClick={toggleScreenShare} className={`flex-1 h-8 bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] border-none rounded-[6px] ${isScreenSharing ? 'bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71]' : ''}`} title={isScreenSharing ? 'Stop Screen Share' : 'Screen Share'}>
                    <MonitorUp size={16} />
                  </Button>
                  <div className="flex-1 h-8 bg-[#2b2d31] text-[#767572] flex items-center justify-center rounded-[6px] cursor-not-allowed opacity-50" title="Activities (Not Available)">
                    <Compass size={16} />
                  </div>
                  <div className="flex-1 h-8 bg-[#2b2d31] text-[#767572] flex items-center justify-center rounded-[6px] cursor-not-allowed opacity-50" title="Soundboard (Not Available)">
                    <Megaphone size={16} />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* User Panel Card */}
          <div className="mx-2 mb-2 p-2 bg-[#111214] border border-[#2d2f31] rounded-[8px] flex items-center justify-between shrink-0 relative select-none shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative group cursor-pointer shrink-0" onClick={() => setShowStatusMenu(!showStatusMenu)}>
                <div className="w-8 h-8 rounded-full bg-[#2d2f31] flex items-center justify-center text-xs font-bold uppercase text-[#e3e1db] border border-[#343638] overflow-hidden">
                  {user?.avatar ? (
                    <img src={getFileUrl(user.avatar)} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    user?.username[0]
                  )}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111214] ${getStatusColor(user?.status)}`} />
                
                {showStatusMenu && (
                  <div className="absolute bottom-12 left-0 w-48 bg-[#1e2022] rounded-lg shadow-xl border border-[#2d2f31] p-1.5 z-50 flex flex-col gap-0.5">
                    <div onClick={(e) => { e.stopPropagation(); handleUpdateStatus('online'); }} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#2d2f31] hover:text-[#e3e1db] cursor-pointer group/status">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#23a559]" />
                      <span className="text-xs font-medium text-[#e3e1db]">Online</span>
                    </div>
                    <div onClick={(e) => { e.stopPropagation(); handleUpdateStatus('idle'); }} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#2d2f31] hover:text-[#e3e1db] cursor-pointer group/status">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#f0b232]" />
                      <span className="text-xs font-medium text-[#e3e1db]">Idle</span>
                    </div>
                    <div onClick={(e) => { e.stopPropagation(); handleUpdateStatus('dnd'); }} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#2d2f31] hover:text-[#e3e1db] cursor-pointer group/status">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#f23f43]" />
                      <span className="text-xs font-medium text-[#e3e1db]">Do Not Disturb</span>
                    </div>
                    <div onClick={(e) => { e.stopPropagation(); handleUpdateStatus('invisible'); }} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#2d2f31] hover:text-[#e3e1db] cursor-pointer group/status">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#80848e]" />
                      <span className="text-xs font-medium text-[#e3e1db]">Invisible</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col min-w-0 cursor-pointer" onClick={() => setShowUserSettingsModal(true)}>
                <span className="text-xs font-semibold truncate leading-tight text-[#f2f3f5]">{user?.display_name || user?.username}</span>
                {isJoined ? (
                  <span className="text-[10px] text-[#23a55a] truncate leading-tight font-medium flex items-center gap-1">
                    <Volume2 size={10} className="text-[#23a55a] shrink-0" />
                    In voice
                  </span>
                ) : (
                  <span className="text-[10px] text-[#949ba4] truncate leading-tight font-normal">{user?.status_message || user?.status || 'Online'}</span>
                )}
              </div>
            </div>

            <div className="flex items-center shrink-0">
              <Button variant="ghost" size="icon" onClick={toggleAudio} className={`h-8 w-8 rounded hover:bg-[#2d2f31]/60 ${!isAudioEnabled ? 'text-[#ed4245]' : 'text-[#b5bac1]'}`}>
                {isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleDeafen} className={`h-8 w-8 rounded relative hover:bg-[#2d2f31]/60 ${isDeafened ? 'text-[#ed4245]' : 'text-[#b5bac1]'}`}>
                <Headphones size={18} />
                {isDeafened && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[2px] h-[18px] bg-[#ed4245] rotate-45" />
                  </div>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-[#b5bac1] hover:bg-[#2d2f31]/60" onClick={() => setShowUserSettingsModal(true)}>
                <Settings size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* Resizable Sidebar Drag Handle */}
        <div 
          onMouseDown={handleMouseDown}
          className="absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-[#bc9f84]/30 active:bg-[#bc9f84]/50 z-30 transition-colors"
        />
      </div>

      {/* Column 3: Main Chat Content */}
      <div className="flex-1 flex flex-col bg-[#141517] overflow-hidden">
        {activeTab === 'home' && activeHomeView === 'friends' ? (
          <div className="flex-1 flex flex-col">
            <div className="h-12 border-b border-[#2d2f31] flex items-center px-4 shadow-sm shrink-0 gap-4 overflow-x-auto">
              <div className="flex items-center gap-2 font-bold text-[#e3e1db] border-r border-[#2d2f31] pr-4 shrink-0">
                <User size={20} className="text-[#a3a29e]" /> Friends
              </div>
              <Button variant="ghost" className={`h-8 px-2 shrink-0 ${friendsFilter === 'all' ? 'bg-[#2d2f31] text-[#e3e1db] border border-[#343638]/50' : 'text-[#a3a29e] hover:bg-[#2d2f31]/50 hover:text-[#e3e1db]'}`} onClick={() => setFriendsFilter('all')}>All</Button>
              <Button variant="ghost" className={`h-8 px-2 shrink-0 ${friendsFilter === 'pending' ? 'bg-[#2d2f31] text-[#e3e1db] border border-[#343638]/50' : 'text-[#a3a29e] hover:bg-[#2d2f31]/50 hover:text-[#e3e1db]'}`} onClick={() => setFriendsFilter('pending')}>Pending</Button>
              <Button variant="ghost" className={`h-8 px-2 shrink-0 ${friendsFilter === 'blocked' ? 'bg-[#2d2f31] text-[#e3e1db] border border-[#343638]/50' : 'text-[#a3a29e] hover:bg-[#2d2f31]/50 hover:text-[#e3e1db]'}`} onClick={() => setFriendsFilter('blocked')}>Blocked</Button>
              <Button variant="ghost" className={`h-8 px-2 shrink-0 ${friendsFilter === 'add' ? 'bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71] font-bold' : 'text-[#bc9f84] bg-transparent hover:bg-[#2d2f31]/50'}`} onClick={() => setFriendsFilter('add')}>Add Friend</Button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              {friendsFilter === 'add' ? (
                <div className="max-w-[600px]">
                  <h2 className="text-[#e3e1db] font-bold mb-2">ADD FRIEND</h2>
                  <p className="text-[#a3a29e] text-sm mb-4">You can add friends with their Nigord username.</p>
                  <form onSubmit={handleSearchUsers} className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                      <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="You can add friends with their Nigord username." className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] pl-4 pr-10 focus-visible:ring-1 focus-visible:ring-[#bc9f84] focus-visible:ring-offset-0" />
                      <Button type="submit" size="icon" variant="ghost" className="absolute right-0 top-0 text-[#a3a29e] hover:text-[#e3e1db]"><Search size={18} /></Button>
                    </div>
                  </form>
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-[#a3a29e] text-xs font-bold uppercase mb-2">Search Results</h3>
                      {searchResults.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-[#2d2f31] bg-[#1e2022]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#2d2f31] flex items-center justify-center text-[#e3e1db] font-bold uppercase border border-[#343638] overflow-hidden">
                              {u.avatar ? (
                                <img src={getFileUrl(u.avatar)} alt={u.username} className="w-full h-full object-cover" />
                              ) : (
                                u.username?.[0] || '?'
                              )}
                            </div>
                            <span className="font-bold text-[#e3e1db]">{u.username}</span>
                          </div>
                          <Button size="sm" className="bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71]" onClick={async () => { const ok = await sendRequest(u.id); if (ok) showToast("Friend request sent!"); }}>Send Request</Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {hasSearchedUsers && searchResults.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-[#a3a29e] text-sm">No users found with that username.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {friends.filter(f => friendsFilter === 'all' ? f.status === 'accepted' : f.status === friendsFilter).map(friend => (
                    <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg border-b border-[#2d2f31]/40 hover:bg-[#2d2f31]/30 group cursor-pointer" onClick={() => setSelectedUserProfileId(friend.id)}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-[#2d2f31] flex items-center justify-center text-[#e3e1db] font-bold uppercase border border-[#343638] overflow-hidden">
                            {friend.avatar ? (
                              <img src={getFileUrl(friend.avatar)} alt={friend.username} className="w-full h-full object-cover" />
                            ) : (
                              friend.username[0]
                            )}
                          </div>
                          {friend.status === 'accepted' && (
                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#1e2022] ${getStatusColor(friend.presence_status)}`} />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[#e3e1db] truncate">{friend.display_name || friend.username}</span>
                          <span className="text-xs text-[#a3a29e] truncate">
                            {friend.status === 'pending' ? (friend.direction === 'incoming' ? 'Incoming Friend Request' : 'Outgoing Friend Request') : 
                             friend.status === 'blocked' ? 'Blocked' : (friend.status_message || (friend.presence_status || 'offline').toUpperCase())}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {friend.status === 'pending' && friend.direction === 'incoming' && (
                          <>
                            <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-[#2d2f31] border border-[#343638]/40 hover:text-[#bc9f84]" onClick={async () => {
                              const success = await acceptRequest(friend.id)
                              if (success) {
                                const latestDms = await fetchDMs()
                                const newDm = latestDms?.find((d: any) => d.target_id === friend.id)
                                if (newDm) {
                                  openDm(newDm.id)
                                }
                              }
                            }} title="Accept"><Check size={16} /></Button>
                            <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-[#2d2f31] border border-[#343638]/40 hover:text-[#bc9f84]" onClick={() => removeFriend(friend.id)} title="Decline"><XIcon size={16} /></Button>
                          </>
                        )}
                        {friend.status === 'pending' && friend.direction === 'outgoing' && (
                          <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-[#2d2f31] border border-[#343638]/40 hover:text-[#bc9f84]" onClick={() => removeFriend(friend.id)} title="Cancel Request"><XIcon size={16} /></Button>
                        )}
                        {friend.status === 'accepted' && (
                          <>
                            <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-[#2d2f31] border border-[#343638]/40 hover:text-[#bc9f84]" onClick={async () => {
                              let existingDm = dms.find(d => d.target_id === friend.id)
                              if (!existingDm) {
                                const latestDms = await fetchDMs()
                                existingDm = latestDms?.find((d: any) => d.target_id === friend.id)
                              }
                              if (existingDm) {
                                openDm(existingDm.id)
                              } else {
                                alert("Failed to find or create DM channel. Please try again.")
                              }
                            }} title="Message"><MessageSquare size={16} /></Button>
                            <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-[#2d2f31] border border-[#343638]/40 hover:text-[#bc9f84]" onClick={() => removeFriend(friend.id)} title="Remove Friend"><UserMinus size={16} /></Button>
                            <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-[#2d2f31] border border-[#343638]/40 hover:text-[#bc9f84]" onClick={() => blockUser(friend.id)} title="Block User"><Ban size={16} /></Button>
                          </>
                        )}
                        {friend.status === 'blocked' && (
                           <Button size="sm" variant="secondary" className="h-8 rounded bg-[#2d2f31] border border-[#343638]/40 hover:text-[#e3e1db]" onClick={() => removeFriend(friend.id)}>Unblock</Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {friends.filter(f => friendsFilter === 'all' ? f.status === 'accepted' : f.status === friendsFilter).length === 0 && (
                    <div className="flex items-center justify-center h-40 text-[#a3a29e]">
                      Wumpus is waiting for friends.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'home' && activeHomeView === 'dm' && activeDmId ? (
          <>
            <div className="h-12 border-b border-[#2d2f31] flex items-center justify-between px-4 shadow-sm shrink-0">
              <div className="flex flex-col text-left">
                <span className="font-bold text-[#e3e1db]">@{dms.find(d => d.id === activeDmId)?.name}</span>
                {isJoined && activeVoiceChannel?.id === activeDmId && (
                  <span className="text-[10px] text-[#bc9f84] font-semibold flex items-center gap-1 leading-none">
                    <Phone size={8} className="fill-current text-[#bc9f84]" />
                    In a call
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-[#a3a29e]">
                <button 
                  onClick={() => {
                    const dmChannel = dms.find(d => d.id === activeDmId)
                    if (dmChannel) {
                      setActiveVoiceChannel({ id: dmChannel.id, name: `@${dmChannel.name}`, type: 'voice' })
                      startCall(dmChannel.target_id, dmChannel.name, dmChannel.id, false)
                    }
                  }}
                  className="hover:text-[#e3e1db] transition-colors cursor-pointer"
                  title="Start Voice Call"
                >
                  <Phone size={20} />
                </button>
                <button 
                  onClick={() => {
                    const dmChannel = dms.find(d => d.id === activeDmId)
                    if (dmChannel) {
                      setActiveVoiceChannel({ id: dmChannel.id, name: `@${dmChannel.name}`, type: 'voice' })
                      startCall(dmChannel.target_id, dmChannel.name, dmChannel.id, true)
                    }
                  }}
                  className="hover:text-[#e3e1db] transition-colors cursor-pointer"
                  title="Start Video Call"
                >
                  <Video size={20} />
                </button>
                <button 
                  onClick={() => {
                    setShowPins(!showPins)
                    if (!showPins) fetchPins()
                  }}
                  className={`hover:text-[#e3e1db] transition-colors cursor-pointer ${showPins ? 'text-white' : ''}`}
                  title="Pinned Messages"
                >
                  <Pin size={20} className={showPins ? 'fill-white' : ''} />
                </button>
                <button 
                  onClick={() => setShowDmProfile(!showDmProfile)}
                  className={`transition-colors cursor-pointer ${showDmProfile ? 'text-white hover:text-[#e3e1db]' : 'text-[#a3a29e] hover:text-white'}`}
                  title={showDmProfile ? "Hide User Profile" : "Show User Profile"}
                >
                  <User size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 flex overflow-hidden relative">
              <div className="flex-1 flex flex-col">
                {isJoined && activeVoiceChannel?.id === activeDmId && (
                  <div className="bg-[#141517] p-4 flex flex-col items-center justify-center border-b border-[#2d2f31] select-none shrink-0 relative transition-all duration-300 w-full">
                    {/* Participant Grid */}
                    <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {allParticipants.map(p => renderParticipantCard(p, 'normal'))}
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center gap-4">
                      {/* Audio, Video, Deafen Controls Container */}
                      <div className="bg-[#1e1f22] border border-[#2d2f31] p-1.5 rounded-[8px] flex items-center gap-1.5 shadow-md">
                        {/* Mic */}
                        <div className="flex items-center">
                          <button 
                            onClick={toggleAudio}
                            className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                              !isAudioEnabled 
                                ? 'bg-[#ed4245]/20 text-[#ed4245] hover:bg-[#ed4245] hover:text-white' 
                                : 'text-[#a3a29e] hover:bg-[#2d2f31] hover:text-[#e3e1db]'
                            }`}
                            title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                            aria-label={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                          >
                            {isAudioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                          </button>
                          <button className="p-1 text-[#a3a29e] hover:text-white transition-colors" aria-label="Audio settings">
                            <ChevronDown size={12} />
                          </button>
                        </div>
                        
                        <div className="w-[1px] h-5 bg-[#2d2f31] mx-1" />

                        {/* Video */}
                        <div className="flex items-center">
                          <button 
                            onClick={toggleVideo}
                            className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                              isVideoEnabled 
                                ? 'bg-[#5865f2] text-white hover:bg-[#4752c4]' 
                                : 'text-[#a3a29e] hover:bg-[#2d2f31] hover:text-[#e3e1db]'
                            }`}
                            title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                            aria-label={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                          >
                            {isVideoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                          </button>
                          <button className="p-1 text-[#a3a29e] hover:text-white transition-colors" aria-label="Camera settings">
                            <ChevronDown size={12} />
                          </button>
                        </div>

                        <div className="w-[1px] h-5 bg-[#2d2f31] mx-1" />

                        {/* Deafen */}
                        <div className="flex items-center">
                          <button 
                            onClick={toggleDeafen}
                            className={`p-2 rounded-lg transition-all flex items-center justify-center relative ${
                              isDeafened 
                                ? 'bg-[#ed4245]/20 text-[#ed4245] hover:bg-[#ed4245] hover:text-white' 
                                : 'text-[#a3a29e] hover:bg-[#2d2f31] hover:text-[#e3e1db]'
                            }`}
                            title={isDeafened ? "Undeafen" : "Deafen"}
                            aria-label={isDeafened ? "Undeafen" : "Deafen"}
                          >
                            <Headphones size={16} />
                            {isDeafened && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[1.5px] h-[14px] bg-current rotate-45" />
                              </div>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Screen, Grid, Soundboard Options Container */}
                      <div className="bg-[#1e1f22] border border-[#2d2f31] p-1.5 rounded-[8px] flex items-center gap-1.5 shadow-md">
                        <button 
                          onClick={toggleScreenShare}
                          className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                            isScreenSharing 
                              ? 'bg-[#5865f2] text-white hover:bg-[#4752c4]' 
                              : 'text-[#a3a29e] hover:bg-[#2d2f31] hover:text-[#e3e1db]'
                          }`}
                          title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
                        >
                          <MonitorUp size={16} />
                        </button>
                        
                        <button className="p-2 text-[#a3a29e] hover:bg-[#2d2f31] hover:text-white rounded-lg transition-colors" title="Participants Grid">
                          <Users size={16} />
                        </button>

                        <button className="p-2 text-[#a3a29e] hover:bg-[#2d2f31] hover:text-white rounded-lg transition-colors" title="Soundboard">
                          <Gamepad2 size={16} />
                        </button>

                        <button className="p-2 text-[#a3a29e] hover:bg-[#2d2f31] hover:text-white rounded-lg transition-colors" title="More Options">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>

                      {/* Red End Call Button */}
                      <button 
                        onClick={handleLeaveVoice}
                        className="bg-[#ed4245] text-white hover:bg-[#c93b3e] p-2.5 rounded-[8px] transition-all flex items-center justify-center shadow-md cursor-pointer"
                        title="Disconnect"
                      >
                        <PhoneOff size={18} className="rotate-[135deg]" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex-1 p-4 overflow-y-auto flex flex-col-reverse gap-4" onScroll={handleDmScroll}>
                  {dmMessages.map((msg) => (
                    <MessageItem
                      key={msg.id}
                      msg={msg}
                      currentUser={user}
                      onReply={(m) => setReplyToMsg(m)}
                      onEditStart={(id, content) => {
                        setEditingMsgId(id)
                        setEditingContent(content)
                      }}
                      editingMsgId={editingMsgId}
                      editingContent={editingContent}
                      setEditingContent={setEditingContent}
                      onEditSubmit={handleEditMsg}
                      onEditCancel={() => setEditingMsgId(null)}
                      onDelete={handleDeleteMsg}
                      onTogglePin={togglePin}
                      onReact={toggleReaction}
                      onProfileClick={setSelectedUserProfileId}
                    />
                  ))}
                </div>
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-[#1e2022] border border-[#2d2f31] rounded-[8px] overflow-hidden">
                    {replyToMsg && (
                      <div className="bg-[#2b2d31]/50 px-3 py-1.5 flex items-center justify-between border-b border-[#1e1f22] text-xs">
                        <span className="text-[#b5bac1]">Replying to <span className="font-semibold text-white">@{replyToMsg.username}</span></span>
                        <button onClick={() => setReplyToMsg(null)} className="text-[#b5bac1] hover:text-white"><XIcon size={14} /></button>
                      </div>
                    )}
                    {pendingAttachments.length > 0 && (
                      <div className="p-3 pb-0 flex flex-wrap gap-2">
                        {pendingAttachments.map(att => (
                          <div key={att.id} className="relative group bg-[#2b2d31] rounded-md p-2 w-48 h-48 flex items-center justify-center border border-[#1e1f22]">
                            {att.content_type.startsWith('image/') ? (
                              <img src={att.url} className="max-w-full max-h-full rounded object-contain" />
                            ) : (
                              <div className="text-center">
                                <div className="w-12 h-16 bg-[#1e1f22] rounded mx-auto mb-2 flex items-center justify-center text-[#949ba4] font-bold uppercase text-[10px]">
                                  {att.filename.split('.').pop()}
                                </div>
                                <p className="text-xs text-[#dbdee1] truncate w-32">{att.filename}</p>
                              </div>
                            )}
                            <button 
                              onClick={() => removePendingAttachment(att.id)}
                              className="absolute -top-2 -right-2 bg-[#ed4245] text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XIcon size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="p-3 flex items-center gap-4">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-6 h-6 rounded-full bg-[#b5bac1] hover:bg-white flex items-center justify-center text-[#313338] transition-colors shrink-0 disabled:opacity-50"
                      >
                        <Plus size={16} strokeWidth={4} />
                      </button>
                      <form onSubmit={handleSendDmMessage} className="flex-1">
                        <Input 
                          value={dmMessageContent} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setDmMessageContent(val);
                            if (!val.trim()) {
                              sendTypingStatus(false);
                            } else {
                              const now = Date.now();
                              if (now - lastTypingSentRef.current > 3000) {
                                lastTypingSentRef.current = now;
                                sendTypingStatus(true);
                              }
                            }
                          }} 
                          className="bg-transparent border-none ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white p-0" 
                          placeholder={uploading ? "Uploading..." : `Message @${dms.find(d => d.id === activeDmId)?.name || 'user'}`} 
                        />
                      </form>
                    </div>
                  </div>
                  {typingUsers.length > 0 && (
                    <div className="text-[11px] text-[#b5bac1] mt-1 pl-1">
                      <span className="font-bold">{typingUsers.map(u => u.username).join(', ')}</span> {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </div>
                  )}
                </div>
              </div>
              
              {/* Pinned Messages Sidebar */}
              {showPins && (
                <div className="w-80 bg-[#2b2d31] border-l border-[#1e1f22] flex flex-col absolute right-0 top-0 bottom-0 z-20 shadow-xl animate-in slide-in-from-right duration-200">
                  <div className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 shrink-0 bg-[#2b2d31]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Pin size={16} className="text-[#f5a623] fill-[#f5a623]" />
                      <span>Pinned Messages</span>
                    </div>
                    <Button variant="ghost" size="icon" className="w-6 h-6 hover:text-white text-[#b5bac1]" onClick={() => setShowPins(false)}><XIcon size={14} /></Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-sidebar-scrollbar">
                    {pinnedMessages.length === 0 ? (
                      <div className="text-center text-xs text-[#949ba4] mt-10">No pinned messages yet. Pin messages from the hover toolbar!</div>
                    ) : (
                      pinnedMessages.map((msg: any) => (
                        <div key={msg.id} className="bg-[#1e1f22] p-3 rounded shadow-sm border border-[#1e1f22] relative group/pin-item text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-[#5865f2] flex items-center justify-center text-[10px] font-bold uppercase shrink-0 overflow-hidden">
                              {msg.avatar ? (
                                <img src={getFileUrl(msg.avatar)} alt={msg.username} className="w-full h-full object-cover" />
                              ) : (
                                msg.username?.[0] || 'U'
                              )}
                            </div>
                            <span className="font-bold text-xs truncate">{msg.username}</span>
                            <span className="text-[10px] text-[#949ba4] whitespace-nowrap ml-auto">{new Date(msg.created_at).toLocaleDateString()}</span>
                          </div>
                          <MessageContent content={msg.content} attachments={msg.attachments} />
                          <button
                            onClick={() => togglePin(msg.id, true)}
                            className="absolute top-2 right-2 opacity-0 group-hover/pin-item:opacity-100 text-xs text-[#ed4245] hover:underline transition-opacity"
                          >
                            Unpin
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'server' && currentChannel && currentChannel.type === 'text' ? (
          <>
            <div className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 shadow-sm shrink-0">
              <div className="flex items-center">
                <Hash size={24} className="text-[#949ba4] mr-2" />
                <span className="font-bold">{currentChannel.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    setShowPins(!showPins)
                    if (!showPins) fetchPins()
                  }}
                  className={`hover:text-[#dbdee1] transition-colors cursor-pointer ${showPins ? 'text-white' : 'text-[#b5bac1]'}`}
                  title="Pinned Messages"
                >
                  <Pin size={20} className={showPins ? 'fill-white' : ''} />
                </button>
                <div className="relative w-48">
                  <Input value={messageSearchQuery} onChange={(e) => setMessageSearchQuery(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); setShowMsgSearchResults(true); searchMessages(messageSearchQuery); } }} placeholder="Search" className="h-7 text-xs bg-[#141517] border border-[#2d2f31] rounded-[8px] text-[#e3e1db] focus-visible:ring-0 focus-visible:ring-offset-0 pr-8" />
                  <Search size={14} className="absolute right-2 top-1.5 text-[#a3a29e]" />
                </div>
              </div>
            </div>
            <div className="flex-1 flex overflow-hidden relative">
              <div className="flex-1 flex flex-col">
                <div className="flex-1 p-4 overflow-y-auto flex flex-col-reverse gap-4" onScroll={handleChannelScroll}>
                  {channelMessages.map((msg) => (
                    msg.author_id === 'system' ? (
                      <div key={msg.id} className="flex items-center gap-4 py-2 px-4 -mx-4 hover:bg-[#2e3035] group/system">
                        <div className="w-10 flex justify-center text-[#23a559] shrink-0">
                          <Plus size={18} />
                        </div>
                        <MessageContent content={msg.content} attachments={(msg as any).attachments} />
                      </div>
                    ) : (
                      <MessageItem
                        key={msg.id}
                        msg={msg}
                        currentUser={user}
                        onReply={(m) => setReplyToMsg(m)}
                        onEditStart={(id, content) => {
                          setEditingMsgId(id)
                          setEditingContent(content)
                        }}
                        editingMsgId={editingMsgId}
                        editingContent={editingContent}
                        setEditingContent={setEditingContent}
                        onEditSubmit={handleEditMsg}
                        onEditCancel={() => setEditingMsgId(null)}
                        onDelete={handleDeleteMsg}
                        onTogglePin={togglePin}
                        onReact={toggleReaction}
                        onProfileClick={setSelectedUserProfileId}
                      />
                    )
                  ))}
                </div>
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-[#1e2022] border border-[#2d2f31] rounded-[8px] overflow-hidden">
                    {replyToMsg && (
                      <div className="bg-[#2b2d31]/50 px-3 py-1.5 flex items-center justify-between border-b border-[#1e1f22] text-xs">
                        <span className="text-[#b5bac1]">Replying to <span className="font-semibold text-white">@{replyToMsg.username}</span></span>
                        <button onClick={() => setReplyToMsg(null)} className="text-[#b5bac1] hover:text-white"><XIcon size={14} /></button>
                      </div>
                    )}
                    {pendingAttachments.length > 0 && (
                      <div className="p-3 pb-0 flex flex-wrap gap-2">
                        {pendingAttachments.map(att => (
                          <div key={att.id} className="relative group bg-[#2b2d31] rounded-md p-2 w-48 h-48 flex items-center justify-center border border-[#1e1f22]">
                            {att.content_type.startsWith('image/') ? (
                              <img src={att.url} className="max-w-full max-h-full rounded object-contain" />
                            ) : (
                              <div className="text-center">
                                <div className="w-12 h-16 bg-[#1e1f22] rounded mx-auto mb-2 flex items-center justify-center text-[#949ba4] font-bold uppercase text-[10px]">
                                  {att.filename.split('.').pop()}
                                </div>
                                <p className="text-xs text-[#dbdee1] truncate w-32">{att.filename}</p>
                              </div>
                            )}
                            <button 
                              onClick={() => removePendingAttachment(att.id)}
                              className="absolute -top-2 -right-2 bg-[#ed4245] text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XIcon size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="p-3 flex items-center gap-4">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-6 h-6 rounded-full bg-[#b5bac1] hover:bg-white flex items-center justify-center text-[#313338] transition-colors shrink-0 disabled:opacity-50"
                      >
                        <Plus size={16} strokeWidth={4} />
                      </button>
                      <form onSubmit={handleSendMessage} className="flex-1">
                        <Input 
                          value={messageContent} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setMessageContent(val);
                            if (!val.trim()) {
                              sendTypingStatus(false);
                            } else {
                              const now = Date.now();
                              if (now - lastTypingSentRef.current > 3000) {
                                lastTypingSentRef.current = now;
                                sendTypingStatus(true);
                              }
                            }
                          }} 
                          className="bg-transparent border-none ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white p-0" 
                          placeholder={uploading ? "Uploading..." : `Message #${currentChannel.name}`} 
                        />
                      </form>
                    </div>
                  </div>
                  {typingUsers.length > 0 && (
                    <div className="text-[11px] text-[#b5bac1] mt-1 pl-1">
                      <span className="font-bold">{typingUsers.map(u => u.username).join(', ')}</span> {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </div>
                  )}
                </div>
              </div>
              
              {/* Pinned Messages Sidebar */}
              {showPins && (
                <div className="w-80 obsidian-card flex flex-col absolute right-2.5 top-2.5 bottom-2.5 z-20 shadow-2xl animate-in slide-in-from-right duration-200 border-none">
                  <div className="h-12 border-b border-[#2d2f31] flex items-center justify-between px-4 shrink-0 bg-[#1e2022]">
                    <div className="flex items-center gap-1.5 font-bold text-[#bc9f84]">
                      <Pin size={16} className="text-[#bc9f84] fill-[#bc9f84]" />
                      <span className="text-[#e3e1db]">Pinned Messages</span>
                    </div>
                    <Button variant="ghost" size="icon" className="w-6 h-6 hover:text-white text-[#a3a29e]" onClick={() => setShowPins(false)}><XIcon size={14} /></Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-sidebar-scrollbar">
                    {pinnedMessages.length === 0 ? (
                      <div className="text-center text-xs text-[#a3a29e] mt-10">No pinned messages yet. Pin messages from the hover toolbar!</div>
                    ) : (
                      pinnedMessages.map((msg: any) => (
                        <div key={msg.id} className="bg-[#141517] p-3 rounded shadow-sm border border-[#2d2f31] relative group/pin-item text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-[#2d2f31] flex items-center justify-center text-[10px] font-bold uppercase text-[#e3e1db] border border-[#343638] shrink-0 overflow-hidden">
                              {msg.avatar ? (
                                <img src={getFileUrl(msg.avatar)} alt={msg.username} className="w-full h-full object-cover" />
                              ) : (
                                msg.username?.[0] || 'U'
                              )}
                            </div>
                            <span className="font-bold text-xs truncate text-[#e3e1db]">{msg.username}</span>
                            <span className="text-[10px] text-[#a3a29e] whitespace-nowrap ml-auto">{new Date(msg.created_at).toLocaleDateString()}</span>
                          </div>
                          <MessageContent content={msg.content} attachments={msg.attachments} />
                          <button
                            onClick={() => togglePin(msg.id, true)}
                            className="absolute top-2 right-2 opacity-0 group-hover/pin-item:opacity-100 text-xs text-[#bc9f84] hover:underline transition-opacity"
                          >
                            Unpin
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {/* Search Results Sidebar */}
              {showMsgSearchResults && (
                <div className="w-80 obsidian-card flex flex-col absolute right-2.5 top-2.5 bottom-2.5 z-10 shadow-2xl border-none">
                  <div className="h-12 border-b border-[#2d2f31] flex items-center justify-between px-4 shrink-0 bg-[#1e2022]">
                    <span className="font-bold text-[#e3e1db]">Search Results</span>
                    <Button variant="ghost" size="icon" className="w-6 h-6 hover:text-white text-[#a3a29e]" onClick={() => { setMsgSearchResults([]); setMessageSearchQuery(''); setShowMsgSearchResults(false); }}><XIcon size={14} /></Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isSearching ? (
                      <p className="text-[#a3a29e] text-center mt-10">Searching...</p>
                    ) : msgSearchResults.length === 0 ? (
                      <p className="text-[#a3a29e] text-center mt-10">No results found.</p>
                    ) : (
                      msgSearchResults.map((msg: any) => (
                        <div key={msg.id} className="bg-[#141517] p-3 rounded hover:bg-[#2d2f31]/40 cursor-pointer shadow-sm border border-[#2d2f31]">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-[#2d2f31] flex items-center justify-center text-[10px] font-bold uppercase text-[#e3e1db] border border-[#343638] shrink-0 overflow-hidden">
                              {msg.avatar ? (
                                <img src={getFileUrl(msg.avatar)} alt={msg.username} className="w-full h-full object-cover" />
                              ) : (
                                msg.username?.[0] || '?'
                              )}
                            </div>
                            <span className="font-bold text-sm truncate text-[#e3e1db]">{msg.username}</span>
                            <span className="text-[10px] text-[#a3a29e] whitespace-nowrap">in #{msg.channel_name}</span>
                          </div>
                          <p className="text-sm text-[#a3a29e] break-words line-clamp-3">{msg.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (activeTab === 'server' && currentChannel && currentChannel.type === 'voice') ? (
          <>
            {isJoined ? (
              (() => {
            const focusedParticipant = allParticipants.find(p => p.id === focusedParticipantId);
            const otherParticipants = allParticipants.filter(p => p.id !== focusedParticipantId);

            const renderInviteCard = () => {
              return (
                <div className="aspect-video bg-[#1e1f22] rounded-[8px] flex flex-col items-center justify-center p-6 relative overflow-hidden border border-[#2d2f31] border-dashed shadow group">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <svg width="100" height="75" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#949ba4] opacity-70 group-hover:scale-105 transition-transform duration-300">
                      <path d="M40 50C40 60 48 65 60 65C72 65 80 60 80 50V25H40V50Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
                      <path d="M40 30H32C28 30 25 33 25 37V40C25 44 28 47 32 47H40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M80 30H88C92 30 95 33 95 37V40C95 44 92 47 88 47H80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M60 65V75" stroke="currentColor" strokeWidth="2" />
                      <path d="M48 75H72" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <rect x="75" y="55" width="22" height="15" rx="7.5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
                      <circle cx="81" cy="62.5" r="1.5" fill="currentColor" />
                      <circle cx="91" cy="62.5" r="1.5" fill="currentColor" />
                      <path d="M30 65L32 60L37 59L33 55L34 50L30 53L26 50L27 55L23 59L28 60L30 65Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <span className="text-xs text-[#949ba4]">Invite friends to join this voice call!</span>
                      <button 
                        onClick={() => setShowInviteModal(true)} 
                        className="bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold text-xs px-4 py-2 rounded-[3px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                      >
                        <UserPlus size={14} />
                        Invite to Voice
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            

            return (
              <div 
                className="flex-1 flex flex-col bg-[#141517] relative group/voice"
                onMouseMove={handleMouseMoveVoice}
                onMouseLeave={() => setShowControls(false)}
              >
                <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto relative pb-24 gap-4 w-full">
                      {focusedParticipant ? (
                        /* Spotlight / Focused Speaker Layout */
                        <div className="flex-1 flex flex-col items-center justify-between gap-4 w-full h-full max-h-[85%]">
                          <div className="w-full flex-1 flex items-center justify-center min-h-[300px]">
                            {renderParticipantCard(focusedParticipant, 'large')}
                          </div>
                          {otherParticipants.length > 0 && (
                            <div className="w-full max-w-5xl flex items-center justify-center gap-3 overflow-x-auto py-2 px-4 bg-[#1e1f22]/60 rounded-[8px] shrink-0 no-scrollbar">
                              {otherParticipants.map(p => renderParticipantCard(p, 'small'))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Discord-style Auto-Scaling Participant Grid */
                        <div className="w-full max-w-6xl flex flex-col items-center justify-center">
                          {allParticipants.length === 1 ? (
                            /* 1 User + 1 Invite Card */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
                              {renderParticipantCard(allParticipants[0], 'normal')}
                              {renderInviteCard()}
                            </div>
                          ) : allParticipants.length === 2 ? (
                            /* 2 Users side by side */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
                              {allParticipants.map(p => renderParticipantCard(p, 'normal'))}
                            </div>
                          ) : allParticipants.length === 3 ? (
                            /* 3 Users: 2 on top, 1 centered below */
                            <div className="flex flex-col gap-4 items-center w-full max-w-5xl">
                              <div className="grid grid-cols-2 gap-4 w-full">
                                {renderParticipantCard(allParticipants[0], 'normal')}
                                {renderParticipantCard(allParticipants[1], 'normal')}
                              </div>
                              <div className="w-full md:w-1/2 max-w-[50%] flex justify-center">
                                {renderParticipantCard(allParticipants[2], 'normal')}
                              </div>
                            </div>
                          ) : allParticipants.length === 4 ? (
                            /* 4 Users: 2 on top, 2 below */
                            <div className="grid grid-cols-2 gap-4 w-full max-w-5xl">
                              {allParticipants.map(p => renderParticipantCard(p, 'normal'))}
                            </div>
                          ) : allParticipants.length === 5 ? (
                            /* 5 Users: 3 on top, 2 centered below */
                            <div className="flex flex-col gap-4 items-center w-full max-w-6xl">
                              <div className="grid grid-cols-3 gap-4 w-full">
                                {renderParticipantCard(allParticipants[0], 'normal')}
                                {renderParticipantCard(allParticipants[1], 'normal')}
                                {renderParticipantCard(allParticipants[2], 'normal')}
                              </div>
                              <div className="grid grid-cols-2 gap-4 w-full md:w-2/3 max-w-[66.6%]">
                                {renderParticipantCard(allParticipants[3], 'normal')}
                                {renderParticipantCard(allParticipants[4], 'normal')}
                              </div>
                            </div>
                          ) : (
                            /* 6+ Users: standard responsive grid */
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                              {allParticipants.map(p => renderParticipantCard(p, 'normal'))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Floating Voice Control Bar */}
                    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 flex items-center gap-4 ${
                      showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}>
                      <div className="bg-[#1e1f22]/95 backdrop-blur-md px-4 py-2.5 rounded-[8px] flex items-center gap-3 shadow-2xl border border-[#2d2f31]">
                        {/* Mute Mic */}
                        <button 
                          onClick={toggleAudio}
                          className={`p-3 rounded-full transition-all ${
                            !isAudioEnabled 
                              ? 'bg-[#ed4245]/20 text-[#ed4245] hover:bg-[#ed4245] hover:text-white' 
                              : 'bg-[#313338] text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
                          }`}
                          title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                        >
                          {isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                        </button>

                        {/* Deafen */}
                        <button 
                          onClick={toggleDeafen}
                          className={`p-3 rounded-full transition-all ${
                            isDeafened 
                              ? 'bg-[#ed4245]/20 text-[#ed4245] hover:bg-[#ed4245] hover:text-white' 
                              : 'bg-[#313338] text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
                          }`}
                          title={isDeafened ? "Undeafen" : "Deafen"}
                        >
                          <Headphones size={18} />
                        </button>

                        {/* Video Camera */}
                        <button 
                          onClick={toggleVideo}
                          className={`p-3 rounded-full transition-all ${
                            isVideoEnabled 
                              ? 'bg-[#5865f2] text-white hover:bg-[#4752c4]' 
                              : 'bg-[#313338] text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
                          }`}
                          title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                        >
                          {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                        </button>

                        {/* Screen Share */}
                        <button 
                          onClick={toggleScreenShare}
                          className={`p-3 rounded-full transition-all ${
                            isScreenSharing 
                              ? 'bg-[#5865f2] text-white hover:bg-[#4752c4]' 
                              : 'bg-[#313338] text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
                          }`}
                          title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
                        >
                          <MonitorUp size={18} />
                        </button>

                        {/* Vertical Divider */}
                        <div className="w-[1px] h-6 bg-[#2d2f31]" />

                        {/* Disconnect Button */}
                        <button 
                          onClick={handleLeaveVoice}
                          className="bg-[#ed4245] text-white hover:bg-[#c93b3e] p-3 px-5 rounded-[8px] transition-all flex items-center justify-center shadow"
                          title="Disconnect"
                        >
                          <PhoneOff size={18} className="rotate-[135deg]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              (() => {
                const targetChannel = currentChannel || activeVoiceChannel
                if (!targetChannel) return null
                const activeParticipants = voiceParticipants.filter(p => {
                  if (p.channel_id !== targetChannel.id) return false
                  if (p.user_id === user?.id) return isJoined
                  return true
                })
                return (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#141517]">
                    <Volume2 size={64} className="text-[#bc9f84] mb-4 opacity-80" />
                    <h1 className="text-3xl font-extrabold text-[#e3e1db] mb-2">{targetChannel.name}</h1>
                    
                    {activeParticipants.length === 0 ? (
                      <p className="text-[#a3a29e] text-sm mb-8">No one is currently in voice</p>
                    ) : (
                      <div className="flex flex-col items-center gap-3 mb-8">
                        <div className="flex -space-x-2">
                          {activeParticipants.map(p => (
                            <div 
                              key={p.user_id} 
                              className="w-10 h-10 rounded-full bg-[#2d2f31] border-2 border-[#141517] flex items-center justify-center text-xs font-bold uppercase text-[#e3e1db] shadow overflow-hidden"
                              title={p.username}
                            >
                              {p.avatar ? (
                                <img src={getFileUrl(p.avatar)} alt={p.username} className="w-full h-full object-cover" />
                              ) : (
                                p.username[0]
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-[#e3e1db] text-sm font-medium">
                          {activeParticipants.length} {
                            activeParticipants.length === 1 ? "person is" : "people are"
                          } currently in voice
                        </p>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => handleJoinVoice(targetChannel)} 
                      className="bg-[#bc9f84] hover:bg-[#a88d71] text-[#141517] font-bold px-8 py-3 rounded-full transition-all shadow-xl text-sm cursor-pointer"
                    >
                      Join Voice
                    </button>
                  </div>
                )
              })()
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#949ba4]">Select a channel to start talking</div>
        )}
      </div>

      {/* Members Sidebar */}
      {activeTab === 'server' && currentServer && currentChannel?.type === 'text' && (
        <div className="w-60 bg-[#1e2022] flex flex-col overflow-hidden shrink-0 border-l border-[#2d2f31]">
          <div className="h-12 border-b border-[#2d2f31] flex items-center px-4 shadow-sm shrink-0">
            <Users size={20} className="text-[#a3a29e] mr-2" />
            <span className="font-bold text-[#e3e1db]">Members</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 no-scrollbar space-y-4">
            <div>
              <p className="text-xs font-bold uppercase text-[#767572] mb-2 px-1">Online — {members.length}</p>
              <div className="space-y-1">
                {members.map(member => (
                  <div key={member.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#2d2f31]/40 cursor-pointer group" onClick={() => setSelectedUserProfileId(member.id)}>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-[#2d2f31] flex items-center justify-center text-xs font-bold uppercase text-[#e3e1db] border border-[#343638] overflow-hidden">
                        {member.avatar ? (
                          <img src={getFileUrl(member.avatar)} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                          member.username[0]
                        )}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#1e2022] ${getStatusColor(member.status)}`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-[#a3a29e] group-hover:text-[#e3e1db] truncate">{member.display_name || member.username}</span>
                      {member.status_message && <span className="text-[10px] text-[#767572] truncate">{member.status_message}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DM User Profile Sidebar */}
      {activeTab === 'home' && activeHomeView === 'dm' && activeDmId && showDmProfile && dmUserProfile && (
        <div className="w-72 bg-[#1e2022] flex flex-col overflow-hidden shrink-0 border-l border-[#2d2f31] select-none text-left">
          {/* Header block (non-scrollable) to prevent avatar clipping */}
          <div className="relative shrink-0">
            <div className="h-16 bg-[#bc9f84]" />
            <div className="px-4 -mt-10 mb-2">
              <div className="w-20 h-20 rounded-full bg-[#1e2022] p-1.5 relative z-10">
                <div className="w-full h-full rounded-full bg-[#2d2f31] flex items-center justify-center text-3xl font-bold uppercase text-[#e3e1db] shadow-lg border border-[#343638] overflow-hidden">
                  {dmUserProfile.avatar ? (
                    <img src={getFileUrl(dmUserProfile.avatar)} alt={dmUserProfile.username} className="w-full h-full object-cover" />
                  ) : (
                    dmUserProfile.username[0]
                  )}
                </div>
                {dmUserProfile.status && (
                  <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[#1e2022] ${getStatusColor(dmUserProfile.status)}`} />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 pt-1 relative flex flex-col custom-sidebar-scrollbar min-h-0">
            {/* Profile Info block */}
            <div className="bg-[#141517] p-4 rounded-xl space-y-4 shadow-inner border border-[#2d2f31]">
              <div>
                <h2 className="text-lg font-bold text-[#e3e1db] leading-tight flex items-center gap-1.5">
                  {dmUserProfile.display_name || dmUserProfile.username}
                </h2>
                <p className="text-xs text-[#a3a29e]">@{dmUserProfile.username}</p>
              </div>

              {dmUserProfile.status_message && (
                <div className="border-t border-[#2d2f31] pt-3">
                  <p className="text-[#a3a29e] text-[9px] font-bold uppercase tracking-wider mb-1">Custom Status</p>
                  <p className="text-xs text-[#e3e1db] italic">"{dmUserProfile.status_message}"</p>
                </div>
              )}

              {dmUserProfile.bio && (
                <div className="border-t border-[#2d2f31] pt-3">
                  <p className="text-[#a3a29e] text-[9px] font-bold uppercase tracking-wider mb-1">About Me</p>
                  <p className="text-xs text-[#a3a29e] whitespace-pre-wrap break-words">{dmUserProfile.bio}</p>
                </div>
              )}

              {dmUserProfile.created_at && (
                <div className="border-t border-[#2d2f31] pt-3">
                  <p className="text-[#a3a29e] text-[9px] font-bold uppercase tracking-wider mb-1">Member Since</p>
                  <p className="text-xs text-[#a3a29e]">
                    {new Date(dmUserProfile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}

              <div className="border-t border-[#2d2f31] pt-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#e3e1db] hover:bg-[#2d2f31]/40 p-1.5 -mx-1.5 rounded transition-colors cursor-pointer">
                  <span className="font-semibold text-[#e3e1db]">Mutual Servers</span>
                  <span className="text-[#a3a29e] font-medium">{(dmUserProfile as any).mutual_servers || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#e3e1db] hover:bg-[#2d2f31]/40 p-1.5 -mx-1.5 rounded transition-colors cursor-pointer">
                  <span className="font-semibold text-[#e3e1db]">Mutual Friends</span>
                  <span className="text-[#a3a29e] font-medium">{(dmUserProfile as any).mutual_friends || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-[48px] bg-[#141517] border-t border-[#2d2f31] flex items-center justify-center shrink-0">
            <button 
              onClick={() => setSelectedUserProfileId(dmUserProfile.id)}
              className="text-xs font-bold text-[#e3e1db] hover:underline cursor-pointer"
            >
              View Full Profile
            </button>
          </div>
        </div>
      )}

      </div>

      {/* Modals... */}
      {showCreateServerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2022] w-full max-w-md rounded-xl overflow-hidden shadow-2xl border border-[#2d2f31] p-6 text-center">
            <h2 className="text-2xl font-bold mb-2 text-[#e3e1db]">Customize your server</h2>
            <form onSubmit={handleCreateServer} className="text-left space-y-4">
              <Input autoFocus value={newServerName} onChange={(e) => setNewServerName(e.target.value)} className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus-visible:ring-[#bc9f84]" placeholder={`${user?.username}'s server`} />
              <div className="flex justify-between pt-4"><Button variant="ghost" type="button" className="text-[#a3a29e] hover:text-[#e3e1db]" onClick={() => setShowCreateServerModal(false)}>Back</Button><Button type="submit" className="bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71] font-bold">Create</Button></div>
            </form>
          </div>
        </div>
      )}
      {showCreateChannelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2022] w-full max-w-md rounded-xl p-6 shadow-2xl border border-[#2d2f31]">
            <h2 className="text-2xl font-bold mb-6 text-[#e3e1db]">Create Channel</h2>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div onClick={() => setNewChannelType('text')} className={`p-3 rounded-lg bg-[#141517] cursor-pointer border-2 flex items-center gap-2 text-[#e3e1db] ${newChannelType === 'text' ? 'border-[#bc9f84]' : 'border-[#2d2f31]'}`}><Hash size={16} /> Text</div>
                <div onClick={() => setNewChannelType('voice')} className={`p-3 rounded-lg bg-[#141517] cursor-pointer border-2 flex items-center gap-2 text-[#e3e1db] ${newChannelType === 'voice' ? 'border-[#bc9f84]' : 'border-[#2d2f31]'}`}><Volume2 size={16} /> Voice</div>
              </div>
              <Input autoFocus value={newChannelName} onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))} className="bg-[#141517] border border-[#2d2f31] text-[#e3e1db] focus-visible:ring-[#bc9f84]" placeholder="new-channel" />
              <div className="flex justify-end pt-4 gap-4"><Button variant="ghost" type="button" className="text-[#a3a29e] hover:text-[#e3e1db]" onClick={() => setShowCreateChannelModal(false)}>Cancel</Button><Button type="submit" className="bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71] font-bold">Create Channel</Button></div>
            </form>
          </div>
        </div>
      )}

      {showInviteModal && currentServer && (
        <InviteModal serverId={currentServer.id} onClose={() => setShowInviteModal(false)} />
      )}

      {showServerSettingsModal && currentServer && (
        <ServerSettingsModal serverId={currentServer.id} serverName={currentServer.name} ownerId={currentServer.owner_id} onClose={() => setShowServerSettingsModal(false)} />
      )}

      {showChannelSettingsModal && channelToEdit && (
        <ChannelSettingsModal
          channelId={channelToEdit.id}
          channelName={channelToEdit.name}
          channelType={channelToEdit.type}
          onClose={() => {
            setShowChannelSettingsModal(false)
            setChannelToEdit(null)
          }}
          onUpdate={(newName) => {
            setChannels(channels.map(c => c.id === channelToEdit.id ? { ...c, name: newName } : c))
            if (currentChannel && currentChannel.id === channelToEdit.id) {
              setCurrentChannel({
                id: currentChannel.id,
                server_id: currentChannel.server_id,
                type: currentChannel.type,
                name: newName
              })
            }
          }}
          onDelete={async () => {
            setChannels(channels.filter(c => c.id !== channelToEdit.id))
            if (currentChannel?.id === channelToEdit.id) {
              const remaining = channels.filter(c => c.id !== channelToEdit.id)
              const firstText = remaining.find(c => c.type === 'text')
              setCurrentChannel(firstText || null)
            }
            if (activeVoiceChannel?.id === channelToEdit.id) {
              await handleLeaveVoice()
            }
          }}
        />
      )}

      {showUserSettingsModal && (
        <UserSettingsModal onClose={() => setShowUserSettingsModal(false)} />
      )}

      {selectedUserProfileId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUserProfileId(null)}>
          <div className="bg-[#1e2022] w-full max-w-[340px] rounded-xl overflow-hidden shadow-2xl border border-[#2d2f31] relative text-left" onClick={e => e.stopPropagation()}>
            {userProfileData && !(!userProfileData.username && userProfileData.isLoading) ? (
              <>
                {/* Header block (non-scrollable) to prevent avatar clipping */}
                <div className="relative shrink-0">
                  <div className="h-16 bg-[#bc9f84]" />
                  <div className="px-4 -mt-8 mb-2">
                    <div className="w-16 h-16 rounded-full bg-[#1e2022] p-1 relative z-10">
                      <div className="w-full h-full rounded-full bg-[#2d2f31] flex items-center justify-center text-2xl font-bold uppercase text-[#e3e1db] border border-[#343638] shadow-md overflow-hidden">
                        {userProfileData.avatar ? (
                          <img src={getFileUrl(userProfileData.avatar)} alt={userProfileData.username} className="w-full h-full object-cover" />
                        ) : (
                          userProfileData.username[0]
                        )}
                      </div>
                      {userProfileData.status && (
                        <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#1e2022] ${getStatusColor(userProfileData.status)}`} />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="px-4 pb-4 flex flex-col relative">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#e3e1db] leading-tight">{userProfileData.display_name || userProfileData.username}</h3>
                      <p className="text-xs text-[#a3a29e]">@{userProfileData.username}</p>
                    </div>
                    
                    {userProfileData.status_message && (
                      <div className="bg-[#141517] p-2 rounded border border-[#2d2f31] text-xs text-white">
                        <p className="text-[#a3a29e] text-[10px] font-bold uppercase mb-0.5">Custom Status</p>
                        <p className="italic text-[#e3e1db]">"{userProfileData.status_message}"</p>
                      </div>
                    )}

                    <div className="bg-[#141517] p-3 rounded border border-[#2d2f31] space-y-2.5">
                      <div>
                        <p className="text-[#a3a29e] text-[10px] font-bold uppercase">About Me</p>
                        <p className="text-xs text-[#a3a29e] whitespace-pre-wrap">
                          {userProfileData.isLoading && !userProfileData.bio 
                            ? "Loading bio..." 
                            : (userProfileData.bio || "No bio yet.")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-[#a3a29e]">Loading profile...</div>
            )}
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white/75 hover:text-white rounded-full bg-black/20 hover:bg-black/40 h-7 w-7" onClick={() => setSelectedUserProfileId(null)}>
              <XIcon size={14} />
            </Button>
          </div>
        </div>
      )}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-[#1e2022] p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm w-full border border-[#2d2f31]">
            <div className="w-20 h-20 rounded-full bg-[#2d2f31] flex items-center justify-center text-3xl font-bold uppercase text-[#e3e1db] border border-[#343638] mb-4 shadow-lg animate-bounce">
              {incomingCall.callerName[0]}
            </div>
            <h3 className="text-xl font-bold text-[#e3e1db] mb-1">{incomingCall.callerName}</h3>
            <p className="text-sm text-[#a3a29e] mb-6 flex items-center gap-1.5 animate-pulse">
              Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call...
            </p>
            <div className="flex gap-4 w-full">
              <button 
                onClick={declineCall}
                className="flex-1 py-3 bg-[#ed4245]/20 text-[#ed4245] hover:bg-[#ed4245] hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <PhoneOff size={18} />
                Decline
              </button>
              <button 
                onClick={() => {
                  const dmName = dms.find(d => d.id === incomingCall.channelId)?.name || incomingCall.callerName
                  setActiveVoiceChannel({ id: incomingCall.channelId, name: `@${dmName}`, type: 'voice' })
                  openDm(incomingCall.channelId)
                  acceptCall()
                }}
                className="flex-1 py-3 bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71] font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg animate-pulse"
              >
                <Phone size={18} />
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {outgoingCall && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-[#1e2022] p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm w-full border border-[#2d2f31]">
            <div className="w-20 h-20 rounded-full bg-[#2d2f31] flex items-center justify-center text-3xl font-bold uppercase text-[#e3e1db] border border-[#343638] mb-4 shadow-lg animate-pulse">
              {outgoingCall.targetName[0]}
            </div>
            <h3 className="text-xl font-bold text-[#e3e1db] mb-1">Calling {outgoingCall.targetName}</h3>
            <p className="text-sm text-[#a3a29e] mb-8 animate-pulse">Ringing...</p>
            <button 
              onClick={cancelCall}
              className="w-full py-3 bg-[#ed4245]/20 text-[#ed4245] hover:bg-[#ed4245] hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <PhoneOff size={18} />
              Cancel Call
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#bc9f84] text-[#141517] px-4 py-2.5 rounded-lg shadow-2xl font-semibold border border-[#a88d71] z-[110] animate-in slide-in-from-bottom duration-200">
          {toast}
        </div>
      )}
    </div>
  )
}

function RemoteStream({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = stream
  }, [stream])
  return <audio ref={audioRef} autoPlay />
}

interface MessageItemProps {
  msg: any;
  currentUser: any;
  onReply: (msg: any) => void;
  onEditStart: (msgId: string, content: string) => void;
  editingMsgId: string | null;
  editingContent: string;
  setEditingContent: (val: string) => void;
  onEditSubmit: (msgId: string, content: string) => void;
  onEditCancel: () => void;
  onDelete: (msgId: string) => void;
  onTogglePin: (msgId: string, isPinned: boolean) => void;
  onReact: (msgId: string, emoji: string, hasReacted: boolean) => void;
  onProfileClick?: (userId: string) => void;
}

function MessageItem({
  msg,
  currentUser,
  onReply,
  onEditStart,
  editingMsgId,
  editingContent,
  setEditingContent,
  onEditSubmit,
  onEditCancel,
  onDelete,
  onTogglePin,
  onReact,
  onProfileClick
}: MessageItemProps) {
  const isAuthor = msg.author_id === currentUser?.id;
  const isEditing = editingMsgId === msg.id;

  // Find unique reactions
  const reactionsList = msg.reactions || [];
  const groupedReactions = reactionsList.reduce((acc: any, curr: any) => {
    if (!acc[curr.emoji]) {
      acc[curr.emoji] = { emoji: curr.emoji, count: 0, users: [], hasReacted: false };
    }
    acc[curr.emoji].count += 1;
    acc[curr.emoji].users.push(curr.username);
    if (curr.user_id === currentUser?.id) {
      acc[curr.emoji].hasReacted = true;
    }
    return acc;
  }, {} as Record<string, any>);

  const uniqueReactions = Object.values(groupedReactions);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  return (
    <div className="flex flex-col group message-group-container relative hover:bg-[#2e3035] -mx-4 px-4 py-1.5 transition-colors duration-100 ease-in-out">
      {/* Reply header */}
      {msg.reply_to_id && (
        <div className="flex items-center gap-1.5 text-xs text-[#b5bac1] ml-14 mb-1 select-none">
          <CornerUpLeft size={12} className="rotate-180 text-[#949ba4] shrink-0" />
          <span className="font-bold text-[#dbdee1]">@{msg.reply_username}</span>
          <span className="truncate max-w-[240px] opacity-75">{msg.reply_content}</span>
        </div>
      )}

      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center shrink-0 mt-0.5 uppercase font-bold text-white shadow-sm cursor-pointer hover:opacity-85 overflow-hidden" onClick={() => onProfileClick?.(msg.author_id)}>
          {msg.avatar ? (
            <img src={getFileUrl(msg.avatar)} alt={msg.username} className="w-full h-full object-cover" />
          ) : (
            msg.username?.[0] || 'U'
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-bold hover:underline cursor-pointer text-white" onClick={() => onProfileClick?.(msg.author_id)}>{msg.username}</span>
            <span className="text-[10px] font-medium text-[#949ba4] uppercase">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {msg.is_pinned === 1 && (
              <span title="Pinned">
                <Pin size={10} className="text-[#f5a623] fill-[#f5a623] shrink-0" />
              </span>
            )}
          </div>

          {/* Message Content / Editing mode */}
          {isEditing ? (
            <div className="mt-1 flex flex-col gap-1">
              <input
                autoFocus
                type="text"
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onEditSubmit(msg.id, editingContent);
                  } else if (e.key === 'Escape') {
                    onEditCancel();
                  }
                }}
                className="w-full bg-[#383a40] text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5865f2] border-none"
              />
              <span className="text-[10px] text-[#949ba4]">
                escape to <span className="text-[#ed4245] hover:underline cursor-pointer" onClick={onEditCancel}>cancel</span> • enter to <span className="text-[#23a559] hover:underline cursor-pointer" onClick={() => onEditSubmit(msg.id, editingContent)}>save</span>
              </span>
            </div>
          ) : (
            <div className="text-sm text-[#dbdee1] flex flex-col gap-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <MessageContent content={msg.content} attachments={msg.attachments} />
                {msg.edited_at && (
                  <span className="text-[10px] text-[#949ba4] select-none">(edited)</span>
                )}
              </div>
            </div>
          )}

          {/* Reactions list */}
          {uniqueReactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {uniqueReactions.map((r: any) => (
                <button
                  key={r.emoji}
                  onClick={() => onReact(msg.id, r.emoji, r.hasReacted)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-colors cursor-pointer ${
                    r.hasReacted 
                      ? 'bg-[#5865f2]/15 border-[#5865f2] text-[#dbdee1] hover:bg-[#5865f2]/25' 
                      : 'bg-[#2b2d31] border-[#3f4147] text-[#b5bac1] hover:bg-[#35373c] hover:border-[#4e5058]'
                  }`}
                  title={r.users.join(', ')}
                >
                  <span>{r.emoji}</span>
                  <span className="font-bold text-[#dbdee1]">{r.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Toolbar on Hover */}
      {!isEditing && (
        <div className="absolute right-4 -top-3.5 bg-[#313338] border border-[#232428] rounded shadow-lg flex items-center p-0.5 opacity-0 group-hover:opacity-100 message-hover-toolbar transition-opacity z-10">
          {/* Reaction Picker Icon */}
          <div className="relative">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 hover:bg-[#35373c] text-[#b5bac1] hover:text-white rounded transition-colors cursor-pointer"
              title="Add Reaction"
            >
              <Smile size={16} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-8 right-0 bg-[#1e1f22] border border-[#2b2d31] rounded shadow-2xl p-2 z-50 flex gap-2 w-48 flex-wrap justify-center">
                {['👍', '❤️', '🔥', '🎉', '😂', '😢', '😮', '🙏'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => {
                      const hasReacted = groupedReactions[emoji]?.hasReacted || false;
                      onReact(msg.id, emoji, hasReacted);
                      setShowEmojiPicker(false);
                    }}
                    className="hover:scale-125 transition-transform text-lg cursor-pointer animate-in fade-in zoom-in-50 duration-75"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply */}
          <button 
            onClick={() => onReply(msg)}
            className="p-1.5 hover:bg-[#35373c] text-[#b5bac1] hover:text-white rounded transition-colors cursor-pointer"
            title="Reply"
          >
            <CornerUpLeft size={16} />
          </button>

          {/* Pin */}
          <button 
            onClick={() => onTogglePin(msg.id, msg.is_pinned === 1)}
            className={`p-1.5 hover:bg-[#35373c] rounded transition-colors cursor-pointer ${
              msg.is_pinned === 1 ? 'text-[#f5a623]' : 'text-[#b5bac1] hover:text-white'
            }`}
            title={msg.is_pinned === 1 ? "Unpin Message" : "Pin Message"}
          >
            <Pin size={16} className={msg.is_pinned === 1 ? 'fill-[#f5a623]' : ''} />
          </button>

          {/* Edit / Delete (for authors) */}
          {isAuthor && (
            <>
              <button 
                onClick={() => onEditStart(msg.id, msg.content)}
                className="p-1.5 hover:bg-[#35373c] text-[#b5bac1] hover:text-white rounded transition-colors cursor-pointer"
                title="Edit Message"
              >
                <Edit3 size={16} />
              </button>
              <button 
                onClick={() => {
                  if (confirm("Are you sure you want to delete this message?")) {
                    onDelete(msg.id);
                  }
                }}
                className="p-1.5 hover:bg-[#35373c] text-[#ed4245] rounded transition-colors cursor-pointer"
                title="Delete Message"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
