import { useEffect, useState, useRef } from "react"
import { useAuthStore } from "@/store/useAuthStore"
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
import { Plus, LogOut, Settings, Hash, Volume2, Shield, User, Users, Mic, MicOff, Headphones, Video, VideoOff, Phone, PhoneOff, MonitorUp, MessageSquare, Check, X as XIcon, Search, UserMinus, Ban, ChevronDown, UserPlus, Gamepad2, CornerUpLeft, Edit3, Trash2, Pin, Smile, MoreHorizontal } from "lucide-react"

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
  const { dms, messages: dmMessages, sendMessage: sendDmMessage, fetchMessages: fetchDmMessages, fetchMoreMessages: fetchMoreDmMessages, hasMore: dmHasMore, isLoadingMore: dmLoadingMore } = useDMs(activeDmId || undefined)
  const { unreads } = useNotifications(currentServer?.id)
  const { searchResults: msgSearchResults, searchMessages, isSearching, setSearchResults: setMsgSearchResults } = useSearch(currentServer?.id)
  const { notifications, fetchNotifications } = useGlobalNotifications()
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([])
  const [selectedUserProfileId, setSelectedUserProfileId] = useState<string | null>(null)
  const [userProfileData, setUserProfileData] = useState<any | null>(null)
  const [showDmProfile, setShowDmProfile] = useState(true)
  const [dmUserProfile, setDmUserProfile] = useState<any | null>(null)
  
  // Advanced Messaging States
  const [replyToMsg, setReplyToMsg] = useState<any | null>(null)
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [showPins, setShowPins] = useState(false)
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([])
  const [typingUsers, setTypingUsers] = useState<any[]>([])
  const lastTypingSentRef = useRef<number>(0)

  const fetchPins = async () => {
    const channelId = currentChannel?.id || activeDmId
    if (!channelId) return
    const isDm = !currentChannel?.id
    try {
      const res = await fetch(isDm ? `/dms/${channelId}/pins` : `/channels/${channelId}/pins`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setPinnedMessages(data.pinned)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const togglePin = async (msgId: string, isPinnedNow: boolean) => {
    try {
      const res = await fetch(`/messages/${msgId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !isPinnedNow }),
        credentials: 'include'
      })
      if (res.ok) {
        if (currentChannel) fetchMessages()
        if (activeDmId) fetchDmMessages()
        fetchPins()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteMsg = async (msgId: string) => {
    const channelId = currentChannel?.id || activeDmId
    if (!channelId) return
    const isDm = !currentChannel?.id
    try {
      const res = await fetch(isDm ? `/dms/${channelId}/messages/${msgId}` : `/channels/${channelId}/messages/${msgId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (res.ok) {
        if (currentChannel) fetchMessages()
        if (activeDmId) fetchDmMessages()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleEditMsg = async (msgId: string, newContent: string) => {
    const channelId = currentChannel?.id || activeDmId
    if (!channelId) return
    const isDm = !currentChannel?.id
    try {
      const res = await fetch(isDm ? `/dms/${channelId}/messages/${msgId}` : `/channels/${channelId}/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
        credentials: 'include'
      })
      if (res.ok) {
        setEditingMsgId(null)
        if (currentChannel) fetchMessages()
        if (activeDmId) fetchDmMessages()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const toggleReaction = async (msgId: string, emoji: string, hasReacted: boolean) => {
    try {
      const res = await fetch(`/messages/${msgId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, action: hasReacted ? 'remove' : 'add' }),
        credentials: 'include'
      })
      if (res.ok) {
        if (currentChannel) fetchMessages()
        if (activeDmId) fetchDmMessages()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const sendTypingStatus = async (isTyping: boolean) => {
    const channelId = currentChannel?.id || activeDmId
    if (!channelId) return
    try {
      await fetch(`/channels/${channelId}/typing`, {
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
      const res = await fetch(`/channels/${channelId}/typing`, { credentials: 'include' })
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
      const formData = new FormData()
      formData.append('file', file)

      try {
        console.log("Starting upload for", file.name)
        const res = await fetch('/files/upload', {
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
    
    const attachmentsToSend = [...pendingAttachments]
    setPendingAttachments([]) 
    const contentToSend = messageContent
    const replyId = replyToMsg?.id
    setReplyToMsg(null)
    setMessageContent("")

    try {
      await fetch(`/channels/${currentChannel?.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentToSend, attachments: attachmentsToSend, reply_to_id: replyId }),
        credentials: 'include'
      })
      fetchMessages()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendDmMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dmMessageContent.trim() && pendingAttachments.length === 0) return
    
    const attachmentsToSend = [...pendingAttachments]
    setPendingAttachments([])
    const contentToSend = dmMessageContent
    const replyId = replyToMsg?.id
    setReplyToMsg(null)
    setDmMessageContent("")

    try {
      await fetch(`/dms/${activeDmId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentToSend, attachments: attachmentsToSend, reply_to_id: replyId }),
        credentials: 'include'
      })
      fetchDmMessages()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchServers()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Fetch global notifications (badges + sound)
      // Pass the IDs of what we are currently LOOKING AT to suppress notifications for them
      fetchNotifications(currentChannel?.id, activeDmId || undefined)

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
    }, 1500) // Consolidated 1.5s poll

    return () => clearInterval(interval)
  }, [user, currentChannel, activeDmId, activeTab, activeHomeView, currentServer, activeVoiceChannel])

  const fetchMembers = async (serverId: string) => {
    try {
      const res = await fetch(`/servers/${serverId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members)
        if (data.permissions) {
          setPermissions(data.permissions)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchVoiceParticipants = async (id: string, type: 'server' | 'channel' = 'server') => {
    try {
      const endpoint = type === 'server' ? `/servers/${id}/voice/participants` : `/channels/${id}/voice/participants`
      const res = await fetch(endpoint, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setVoiceParticipants(data.participants)
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

  useEffect(() => {
    if (!selectedUserProfileId) {
      setUserProfileData(null)
      return
    }
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/users/${selectedUserProfileId}/profile`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setUserProfileData(data.user)
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
        const res = await fetch(`/users/${dmChannel.target_id}/profile`, { credentials: 'include' })
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
    searchUsers(searchQuery)
  }

  const goHome = () => {
    setCurrentServer(null)
    setActiveTab('home')
    setActiveHomeView('friends')
  }

  const openDm = (dmId: string) => {
    setCurrentServer(null)
    setActiveTab('home')
    setActiveHomeView('dm')
    setActiveDmId(dmId)
  }

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await fetch('/users/me', {
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
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
      setUser(null)
    } catch (e) {
      console.error(e)
    }
  }

  const textChannels = channels.filter(c => c.type === 'text')
  const voiceChannels = channels.filter(c => c.type === 'voice')

  return (
    <div className="flex h-screen bg-[#141517] text-[#e3e1db] overflow-hidden p-2.5 gap-2.5">
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <RemoteStream key={peerId} stream={stream} />
      ))}

      {/* Server Sidebar */}
      <div className="w-[72px] obsidian-card flex flex-col items-center py-3 gap-2 overflow-y-auto no-scrollbar shrink-0 border-none">
        <div 
          onClick={goHome}
          className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all flex items-center justify-center text-[#e3e1db] cursor-pointer group mb-2 relative ${activeTab === 'home' ? 'bg-[#bc9f84] text-[#141517] rounded-[16px]' : 'bg-[#2d2f31] hover:bg-[#bc9f84] hover:text-[#141517]'}`}
        >
          <div className={`absolute left-0 bg-white rounded-r-full transition-all origin-left ${activeTab === 'home' ? 'h-10 scale-y-100' : 'h-5 scale-y-0 group-hover:scale-y-50'}`} style={{ width: '4px' }} />
          <MessageSquare size={24} />
          {notifications.dms.reduce((acc, curr) => acc + curr.unread_count, 0) > 0 && (
            <div className="absolute -bottom-1 -right-1 bg-[#f23f43] text-white text-[10px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center border-4 border-[#1e1f22] ring-0">
              {notifications.dms.reduce((acc, curr) => acc + curr.unread_count, 0)}
            </div>
          )}
        </div>
        <div className="w-8 h-[2px] bg-[#2d2f31] rounded-full mb-2" />
        {servers.map((server) => {
          const unreadCount = notifications.servers.find(s => s.server_id === server.id)?.unread_count || 0;
          return (
          <div 
            key={server.id} 
            onClick={() => { setCurrentServer(server); setActiveTab('server'); }} 
            className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all flex items-center justify-center text-white cursor-pointer group relative mb-2 ${activeTab === 'server' && currentServer?.id === server.id ? 'rounded-[16px] bg-[#bc9f84] text-[#141517]' : 'bg-[#2d2f31] hover:bg-[#bc9f84] hover:text-[#141517]'}`}
          >
            <div className={`absolute left-0 bg-[#e3e1db] rounded-r-full transition-all origin-left ${activeTab === 'server' && currentServer?.id === server.id ? 'h-10 scale-y-100' : (unreadCount > 0 ? 'h-2 scale-y-100' : 'h-5 scale-y-0 group-hover:scale-y-50')}`} style={{ width: '4px' }} />
            <span className="text-sm font-medium">{server.name.substring(0, 2).toUpperCase()}</span>
            {unreadCount > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-[#bc9f84] text-[#141517] text-[10px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center border-4 border-[#1e2022] ring-0">
                {unreadCount}
              </div>
            )}
          </div>
        )})}
        <div onClick={() => setShowCreateServerModal(true)} className="w-12 h-12 bg-[#2d2f31] rounded-[24px] hover:rounded-[16px] transition-all flex items-center justify-center text-[#bc9f84] hover:bg-[#bc9f84] hover:text-[#141517] cursor-pointer group mb-2">
          <Plus size={24} />
        </div>
      </div>

      {/* Secondary Sidebar */}
      <div className="w-60 obsidian-card flex flex-col overflow-hidden shrink-0 border-none">
        <div className="h-12 border-b border-[#2d2f31] flex items-center px-4 shadow-sm shrink-0 relative cursor-pointer hover:bg-[#2d2f31]/50 transition-colors" onClick={() => activeTab === 'server' && setShowServerMenu(!showServerMenu)}>
          <h2 className="font-bold truncate flex-1 text-[#e3e1db]">{activeTab === 'server' ? currentServer?.name : "Find or start a conversation"}</h2>
          {activeTab === 'server' && <ChevronDown size={18} className="text-[#a3a29e] shrink-0" />}
          
          {showServerMenu && activeTab === 'server' && (
            <div className="absolute top-12 left-2 right-2 bg-[#1e2022] rounded-lg shadow-xl border border-[#2d2f31] p-2 z-50 flex flex-col gap-1">
              <div 
                className="flex items-center justify-between p-2 rounded text-[#bc9f84] hover:bg-[#bc9f84] hover:text-[#141517] cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setShowServerMenu(false); setShowInviteModal(true); }}
              >
                <span className="text-sm font-medium">Invite People</span>
                <UserPlus size={16} />
              </div>
              {(currentServer?.owner_id === user?.id || (currentServer as any).permissions?.includes('ADMINISTRATOR')) && (
                <div 
                  className="flex items-center justify-between p-2 rounded text-[#a3a29e] hover:bg-[#bc9f84] hover:text-[#141517] cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setShowServerMenu(false); setShowServerSettingsModal(true); }}
                >
                  <span className="text-sm font-medium">Server Settings</span>
                  <Settings size={16} />
                </div>
              )}
            </div>
          )}
        </div>
        
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
                      <div className="w-8 h-8 rounded-full bg-[#2d2f31] flex items-center justify-center text-xs font-bold uppercase text-[#e3e1db] border border-[#343638]">
                        {dm.name[0]}
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
                <div className="flex items-center justify-between px-2 mb-1">
                  <span className="text-xs font-bold uppercase text-[#767572]">Text Channels</span>
                  {(currentServer.owner_id === user?.id || (currentServer as any).permissions?.includes('ADMINISTRATOR') || (currentServer as any).permissions?.includes('MANAGE_CHANNELS')) && <Plus size={14} className="text-[#a3a29e] cursor-pointer hover:text-white" onClick={() => { setNewChannelType('text'); setShowCreateChannelModal(true); }} />}
                </div>
                <div className="space-y-0.5">
                  {textChannels.map(channel => {
                    const isUnread = unreads[channel.id] > 0;
                    return (
                    <div key={channel.id} onClick={() => setCurrentChannel(channel)} onMouseEnter={() => setHoveredChannelId(channel.id)} onMouseLeave={() => setHoveredChannelId(null)} className={`flex items-center justify-between p-1.5 rounded cursor-pointer group ${currentChannel?.id === channel.id ? 'bg-[#2d2f31] text-[#e3e1db] border border-[#343638]/50' : 'text-[#a3a29e] hover:bg-[#2d2f31]/50 hover:text-[#e3e1db]'}`}>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <div className="relative flex items-center shrink-0">
                          {isUnread && currentChannel?.id !== channel.id && <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-1 h-2 bg-[#bc9f84] rounded-r-full" />}
                          <Hash size={18} className={currentChannel?.id === channel.id ? 'text-[#bc9f84]' : (isUnread ? 'text-[#e3e1db]' : 'text-[#a3a29e]')} />
                        </div>
                        <span className={`text-sm truncate ${isUnread && currentChannel?.id !== channel.id ? 'font-bold text-[#e3e1db]' : 'font-medium'}`}>{channel.name}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 transition-opacity shrink-0 ml-1 ${hoveredChannelId === channel.id ? 'opacity-100' : 'opacity-0'}`}>
                        <UserPlus
                          size={14}
                          className="text-[#a3a29e] hover:text-white transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowInviteModal(true);
                          }}
                        />
                        {(currentServer?.owner_id === user?.id || permissions.includes('ADMINISTRATOR') || permissions.includes('MANAGE_CHANNELS')) && (
                          <Settings
                            size={14}
                            className="text-[#a3a29e] hover:text-white transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setChannelToEdit(channel);
                              setShowChannelSettingsModal(true);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between px-2 mb-1">
                  <span className="text-xs font-bold uppercase text-[#767572]">Voice Channels</span>
                  {(currentServer.owner_id === user?.id || (currentServer as any).permissions?.includes('ADMINISTRATOR') || (currentServer as any).permissions?.includes('MANAGE_CHANNELS')) && <Plus size={14} className="text-[#a3a29e] cursor-pointer hover:text-white" onClick={() => { setNewChannelType('voice'); setShowCreateChannelModal(true); }} />}
                </div>
                <div className="space-y-0.5">
                  {voiceChannels.map(channel => {
                    const participants = voiceParticipants.filter(p => {
                      if (p.channel_id !== channel.id) return false
                      if (p.user_id === user?.id) return isJoined
                      return true
                    });
                    return (
                    <div key={channel.id} className="flex flex-col">
                      <div onClick={() => { setCurrentChannel(channel); handleJoinVoice(channel); }} onMouseEnter={() => setHoveredChannelId(channel.id)} onMouseLeave={() => setHoveredChannelId(null)} className={`flex items-center justify-between p-1.5 rounded cursor-pointer group ${currentChannel?.id === channel.id ? 'bg-[#2d2f31] text-[#e3e1db] border border-[#343638]/50' : 'text-[#a3a29e] hover:bg-[#2d2f31]/50 hover:text-[#e3e1db]'}`}>
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Volume2 size={18} className={currentChannel?.id === channel.id ? 'text-[#bc9f84]' : 'text-[#a3a29e]'} />
                          <span className="text-sm font-medium truncate">{channel.name}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 transition-opacity shrink-0 ml-1 ${hoveredChannelId === channel.id ? 'opacity-100' : 'opacity-0'}`}>
                          <UserPlus
                            size={14}
                            className="text-[#a3a29e] hover:text-white transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowInviteModal(true);
                            }}
                          />
                          {(currentServer?.owner_id === user?.id || permissions.includes('ADMINISTRATOR') || permissions.includes('MANAGE_CHANNELS')) && (
                            <Settings
                              size={14}
                              className="text-[#a3a29e] hover:text-white transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setChannelToEdit(channel);
                                setShowChannelSettingsModal(true);
                              }}
                            />
                          )}
                        </div>
                      </div>
                      {/* Participant List */}
                      <div className="ml-7 space-y-1 mb-1">
                        {participants.map(p => (
                          <div key={p.user_id} className="flex items-center justify-between group/p">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-[#2d2f31] flex items-center justify-center text-[10px] uppercase font-bold text-[#e3e1db] border border-[#343638]">{p.username[0]}</div>
                              <span className="text-xs text-[#a3a29e] truncate group-hover/p:text-[#e3e1db]">{p.username}</span>
                            </div>
                            <div className="flex items-center gap-0.5 pr-2">
                              {p.is_muted === 1 && <MicOff size={12} className="text-[#bc9f84]" />}
                              {p.is_deafened === 1 && <Headphones size={12} className="text-[#bc9f84]" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Voice Connection Status */}
        {activeVoiceChannel && (
          <div className="bg-[#141517]/80 border-t border-[#2d2f31] p-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#bc9f84]">
                <Volume2 size={20} />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold leading-tight">Voice Connected</span>
                  <span className="text-[10px] leading-tight text-[#a3a29e] truncate">{activeVoiceChannel.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handleLeaveVoice} className="h-8 w-8 text-[#a3a29e] hover:text-[#bc9f84]"><PhoneOff size={18} /></Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={toggleVideo} className={`flex-1 text-xs gap-1.5 h-7 bg-[#2d2f31] text-[#e3e1db] hover:bg-[#343638] ${isVideoEnabled ? 'bg-[#bc9f84] text-[#141517] hover:bg-[#bc9f84]/80' : ''}`}>
                {isVideoEnabled ? <VideoOff size={14} /> : <Video size={14} />}
                {isVideoEnabled ? 'Stop Video' : 'Video'}
              </Button>
              <Button variant="secondary" size="sm" onClick={toggleScreenShare} className={`flex-1 text-xs gap-1.5 h-7 bg-[#2d2f31] text-[#e3e1db] hover:bg-[#343638] ${isScreenSharing ? 'bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71]' : ''}`}>
                <MonitorUp size={14} /> {isScreenSharing ? 'Sharing' : 'Screen'}
              </Button>
            </div>
          </div>
        )}

        {/* User Panel */}
        <div className="h-[54px] bg-[#141517] border-t border-[#2d2f31] px-2 flex items-center gap-2 shrink-0 relative">
          <div className="relative group cursor-pointer" onClick={() => setShowStatusMenu(!showStatusMenu)}>
            <div className="w-8 h-8 rounded-full bg-[#2d2f31] flex items-center justify-center text-xs font-bold uppercase text-[#e3e1db] shrink-0 border border-[#343638]">
              {user?.username[0]}
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#141517] ${getStatusColor(user?.status)}`} />
            
            {showStatusMenu && (
              <div className="absolute bottom-12 left-0 w-48 bg-[#1e2022] rounded-lg shadow-xl border border-[#2d2f31] p-1.5 z-50 flex flex-col gap-0.5">
                <div onClick={(e) => { e.stopPropagation(); handleUpdateStatus('online'); }} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#2d2f31] hover:text-[#e3e1db] cursor-pointer group/status">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#23a559]" />
                  <span className="text-xs font-medium">Online</span>
                </div>
                <div onClick={(e) => { e.stopPropagation(); handleUpdateStatus('idle'); }} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#2d2f31] hover:text-[#e3e1db] cursor-pointer group/status">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f0b232]" />
                  <span className="text-xs font-medium">Idle</span>
                </div>
                <div onClick={(e) => { e.stopPropagation(); handleUpdateStatus('dnd'); }} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#2d2f31] hover:text-[#e3e1db] cursor-pointer group/status">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f23f43]" />
                  <span className="text-xs font-medium">Do Not Disturb</span>
                </div>
                <div onClick={(e) => { e.stopPropagation(); handleUpdateStatus('invisible'); }} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#2d2f31] hover:text-[#e3e1db] cursor-pointer group/status">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#80848e]" />
                  <span className="text-xs font-medium">Invisible</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowUserSettingsModal(true)}>
            <p className="text-sm font-bold truncate leading-tight text-[#e3e1db]">{user?.display_name || user?.username}</p>
            {isJoined ? (
              <p className="text-[10px] text-[#bc9f84] truncate leading-tight uppercase font-bold flex items-center gap-0.5">
                <Phone size={8} className="fill-current text-[#bc9f84]" />
                In a call
              </p>
            ) : (
              <p className="text-[10px] text-[#a3a29e] truncate leading-tight uppercase font-medium">{user?.status || 'Online'}</p>
            )}
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={toggleAudio} className={`h-8 w-8 ${!isAudioEnabled ? 'text-[#bc9f84]' : 'text-[#a3a29e] hover:bg-[#2d2f31]/60'}`}>{isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}</Button>
            <Button variant="ghost" size="icon" onClick={toggleDeafen} className={`h-8 w-8 ${isDeafened ? 'text-[#bc9f84]' : 'text-[#a3a29e] hover:bg-[#2d2f31]/60'}`}><Headphones size={18} /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#a3a29e] hover:bg-[#2d2f31]/60" onClick={() => setShowUserSettingsModal(true)}>
              <Settings size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-[#a3a29e] hover:bg-[#2d2f31]/60">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col obsidian-card overflow-hidden">
        {activeTab === 'home' && activeHomeView === 'friends' ? (
          <div className="flex-1 flex flex-col">
            <div className="h-12 border-b border-[#2d2f31] flex items-center px-4 shadow-sm shrink-0 gap-4 overflow-x-auto">
              <div className="flex items-center gap-2 font-bold text-[#e3e1db] border-r border-[#2d2f31] pr-4 shrink-0">
                <User size={20} className="text-[#a3a29e]" /> Friends
              </div>
              <Button variant="ghost" className={`h-8 px-2 shrink-0 ${friendsFilter === 'all' ? 'bg-[#2d2f31] text-[#e3e1db] border border-[#343638]/50' : 'text-[#a3a29e] hover:bg-[#2d2f31]/50 hover:text-[#e3e1db]'}`} onClick={() => setFriendsFilter('all')}>All</Button>
              <Button variant="ghost" className={`h-8 px-2 shrink-0 ${friendsFilter === 'pending' ? 'bg-[#2d2f31] text-[#e3e1db] border border-[#343638]/50' : 'text-[#a3a29e] hover:bg-[#2d2f31]/50 hover:text-[#e3e1db]'}`} onClick={() => setFriendsFilter('pending')}>Pending</Button>
              <Button variant="ghost" className={`h-8 px-2 shrink-0 ${friendsFilter === 'blocked' ? 'bg-[#2d2f31] text-[#e3e1db] border border-[#343638]/50' : 'text-[#a3a29e] hover:bg-[#2d2f31]/50 hover:text-[#e3e1db]'}`} onClick={() => setFriendsFilter('blocked')}>Blocked</Button>
              <Button variant="ghost" className={`h-8 px-2 shrink-0 ${friendsFilter === 'add' ? 'text-[#bc9f84] bg-transparent hover:bg-transparent' : 'bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71] font-bold'}`} onClick={() => setFriendsFilter('add')}>Add Friend</Button>
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
                            <div className="w-10 h-10 rounded-full bg-[#2d2f31] flex items-center justify-center text-[#e3e1db] font-bold uppercase border border-[#343638]">{u.username[0]}</div>
                            <span className="font-bold text-[#e3e1db]">{u.username}</span>
                          </div>
                          <Button size="sm" className="bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71]" onClick={() => sendRequest(u.id)}>Send Request</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {friends.filter(f => friendsFilter === 'all' ? f.status === 'accepted' : f.status === friendsFilter).map(friend => (
                    <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg border-b border-[#2d2f31]/40 hover:bg-[#2d2f31]/30 group cursor-pointer" onClick={() => setSelectedUserProfileId(friend.id)}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-[#2d2f31] flex items-center justify-center text-[#e3e1db] font-bold uppercase border border-[#343638]">{friend.username[0]}</div>
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
                            <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-[#2d2f31] border border-[#343638]/40 hover:text-[#bc9f84]" onClick={() => acceptRequest(friend.id)} title="Accept"><Check size={16} /></Button>
                            <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-[#2d2f31] border border-[#343638]/40 hover:text-[#bc9f84]" onClick={() => removeFriend(friend.id)} title="Decline"><XIcon size={16} /></Button>
                          </>
                        )}
                        {friend.status === 'pending' && friend.direction === 'outgoing' && (
                          <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-[#2d2f31] border border-[#343638]/40 hover:text-[#bc9f84]" onClick={() => removeFriend(friend.id)} title="Cancel Request"><XIcon size={16} /></Button>
                        )}
                        {friend.status === 'accepted' && (
                          <>
                            <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-[#2d2f31] border border-[#343638]/40 hover:text-[#bc9f84]" onClick={() => {
                              const existingDm = dms.find(d => d.target_id === friend.id)
                              if (existingDm) openDm(existingDm.id)
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
                    <div className="w-full max-w-4xl grid grid-cols-2 gap-4 mb-4">
                      {/* Left: Peer Participant Card */}
                      {(() => {
                        const peerName = dms.find(d => d.id === activeDmId)?.name || 'User';
                        const peerId = dms.find(d => d.id === activeDmId)?.target_id || '';
                        const hasRemoteVideo = remoteStreams[peerId] && remoteStreams[peerId].getVideoTracks().length > 0;
                        const isSpeaking = speakingUsers[peerId] === true;
                        
                        return (
                          <div className={`aspect-video bg-[#1e2022] rounded-xl flex flex-col items-center justify-center relative overflow-hidden border-2 transition-all shadow-lg ${
                            isSpeaking ? 'border-[#bc9f84]' : 'border-[#2d2f31]'
                          }`}>
                            {hasRemoteVideo && remoteStreams[peerId] ? (
                              <video 
                                ref={el => { if (el && el.srcObject !== remoteStreams[peerId]) el.srcObject = remoteStreams[peerId] }} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2d2f31]">
                                <div className={`w-20 h-20 rounded-full bg-[#1e2022] flex items-center justify-center text-3xl font-bold uppercase text-[#e3e1db] border border-[#343638] shadow-lg transition-all ${
                                  isSpeaking ? 'ring-4 ring-[#bc9f84] ring-offset-2 ring-offset-[#2d2f31] scale-105' : ''
                                }`}>
                                  {peerName[0]}
                                </div>
                              </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-semibold text-white">
                              {peerName}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Right: Local Participant Card */}
                      {(() => {
                        const localName = user?.username || 'You';
                        const isSpeaking = speakingUsers[user?.id || 'local'] || speakingUsers['local'];
                        
                        return (
                          <div className={`aspect-video bg-[#1e2022] rounded-xl flex flex-col items-center justify-center relative overflow-hidden border-2 transition-all shadow-lg ${
                            isSpeaking ? 'border-[#bc9f84]' : 'border-[#2d2f31]'
                          }`}>
                            {isVideoEnabled && localStream ? (
                              <video 
                                ref={el => { if (el && el.srcObject !== localStream) el.srcObject = localStream }} 
                                autoPlay 
                                muted 
                                playsInline 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2b2d31]">
                                <div className={`w-20 h-20 rounded-full bg-[#1e2022] flex items-center justify-center text-3xl font-bold uppercase text-[#e3e1db] border border-[#343638] shadow-lg transition-all ${
                                  isSpeaking ? 'ring-4 ring-[#bc9f84] ring-offset-2 ring-offset-[#2b2d31] scale-105' : ''
                                }`}>
                                  {localName[0]}
                                </div>
                              </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-semibold text-white">
                              {localName} (You)
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center gap-4">
                      {/* Audio & Video Controls Container */}
                      <div className="bg-[#1e2022] border border-[#2d2f31] p-1 rounded-xl flex items-center gap-1 shadow-md">
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
                                ? 'bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71]' 
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
                      </div>

                      {/* Screen, Grid, Soundboard Options Container */}
                      <div className="bg-[#1e2022] border border-[#2d2f31] p-1 rounded-xl flex items-center gap-1 shadow-md">
                        <button 
                          onClick={toggleScreenShare}
                          className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                            isScreenSharing 
                              ? 'bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71]' 
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
                        className="bg-[#ed4245]/20 text-[#ed4245] hover:bg-[#ed4245] hover:text-white p-2.5 rounded-xl transition-all flex items-center justify-center shadow-md cursor-pointer"
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
                    />
                  ))}
                </div>
                <div className="p-4 pt-0">
                  <div className="bg-[#383a40] rounded-lg overflow-hidden">
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
                            setDmMessageContent(e.target.value);
                            const now = Date.now();
                            if (now - lastTypingSentRef.current > 3000) {
                              lastTypingSentRef.current = now;
                              sendTypingStatus(true);
                            }
                          }} 
                          className="bg-transparent border-none ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white p-0" 
                          placeholder={uploading ? "Uploading..." : `Message @${dms.find(d => d.id === activeDmId)?.name}`} 
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
                            <div className="w-6 h-6 rounded-full bg-[#5865f2] flex items-center justify-center text-[10px] font-bold uppercase shrink-0">{msg.username?.[0] || 'U'}</div>
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
                  <Input value={messageSearchQuery} onChange={(e) => setMessageSearchQuery(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); searchMessages(messageSearchQuery); } }} placeholder="Search" className="h-7 text-xs bg-[#1e1f22] border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0 pr-8" />
                  <Search size={14} className="absolute right-2 top-1.5 text-[#949ba4]" />
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
                      />
                    )
                  ))}
                </div>
                <div className="p-4 pt-0">
                  <div className="bg-[#383a40] rounded-lg overflow-hidden">
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
                            setMessageContent(e.target.value);
                            const now = Date.now();
                            if (now - lastTypingSentRef.current > 3000) {
                              lastTypingSentRef.current = now;
                              sendTypingStatus(true);
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
                            <div className="w-6 h-6 rounded-full bg-[#2d2f31] flex items-center justify-center text-[10px] font-bold uppercase text-[#e3e1db] border border-[#343638] shrink-0">{msg.username?.[0] || 'U'}</div>
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
              {(msgSearchResults.length > 0 || isSearching) && (
                <div className="w-80 obsidian-card flex flex-col absolute right-2.5 top-2.5 bottom-2.5 z-10 shadow-2xl border-none">
                  <div className="h-12 border-b border-[#2d2f31] flex items-center justify-between px-4 shrink-0 bg-[#1e2022]">
                    <span className="font-bold text-[#e3e1db]">Search Results</span>
                    <Button variant="ghost" size="icon" className="w-6 h-6 hover:text-white text-[#a3a29e]" onClick={() => { setMsgSearchResults([]); setMessageSearchQuery(''); }}><XIcon size={14} /></Button>
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
                            <div className="w-6 h-6 rounded-full bg-[#2d2f31] flex items-center justify-center text-[10px] font-bold uppercase text-[#e3e1db] border border-[#343638] shrink-0">{msg.username[0]}</div>
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
            const allParticipants = [
              {
                id: 'local',
                username: user?.username || 'You',
                isLocal: true,
                isVideoEnabled,
                isAudioEnabled,
                isDeafened,
                stream: localStream
              },
              ...(isScreenSharing && localScreenStream ? [{
                id: 'local-screen',
                username: `${user?.username || 'You'} (Screen)`,
                isLocal: true,
                isVideoEnabled: true,
                isAudioEnabled: false,
                isDeafened: false,
                stream: localScreenStream,
                isScreenShare: true
              }] : []),
              ...Object.entries(remoteStreams).map(([peerId, stream]) => {
                const actualUserId = peerId.replace('-screen', '');
                const isScreenShare = peerId.endsWith('-screen');
                const peer = voiceParticipants.find(p => p.user_id === actualUserId) || members.find(m => m.id === actualUserId) || { username: 'Unknown' };
                const hasVideo = stream.getVideoTracks().length > 0;
                const isMuted = voiceParticipants.find(p => p.user_id === actualUserId)?.is_muted === 1;
                const isDeaf = voiceParticipants.find(p => p.user_id === actualUserId)?.is_deafened === 1;
                return {
                  id: peerId,
                  username: peer.username + (isScreenShare ? " (Screen)" : ""),
                  isLocal: false,
                  isVideoEnabled: hasVideo,
                  isAudioEnabled: !isMuted,
                  isDeafened: isDeaf,
                  stream,
                  isScreenShare
                }
              })
            ];

            const getCardBg = (name: string) => {
              const bgColors = [
                'from-[#2a2622] to-[#141517]',
                'from-[#202522] to-[#141517]',
                'from-[#1c2229] to-[#141517]',
                'from-[#271f29] to-[#141517]',
                'from-[#291f24] to-[#141517]',
              ]
              let hash = 0
              for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash)
              }
              const idx = Math.abs(hash) % bgColors.length
              return bgColors[idx]
            }

            const renderParticipantCard = (p: any, size: 'large' | 'small' | 'normal') => {
              const isLocal = p.isLocal;
              const hasVideo = p.isVideoEnabled;
              const isAudioEnabled = p.isAudioEnabled;
              const isDeafened = p.isDeafened;
              const stream = p.stream;
              const isScreenShare = p.isScreenShare;
              const isFocused = focusedParticipantId === p.id;

              const cardClasses = `bg-[#1e2022] rounded-xl flex flex-col items-center justify-center relative overflow-hidden border-2 transition-all cursor-pointer group shadow-lg ${
                isFocused && size !== 'small' ? 'border-[#bc9f84]' : 'border-[#2d2f31] hover:border-[#bc9f84]'
              } ${
                size === 'small' ? 'w-48 aspect-video shrink-0 text-[10px]' : 'w-full h-full aspect-video'
              }`;

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
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2d2f31]">
                      <div className={`absolute inset-0 bg-gradient-to-tr ${getCardBg(p.username)} opacity-60`} />
                      <div className={`relative z-10 rounded-full border-4 border-[#1e2022] shadow-2xl flex items-center justify-center font-bold uppercase ${
                        size === 'small' ? 'w-10 h-10 text-sm border-2' : 'w-24 h-24 text-3xl border-[6px]'
                      } ${isLocal ? 'bg-[#bc9f84] text-[#141517]' : 'bg-[#2d2f31] text-[#e3e1db] border border-[#bc9f84]'}`}>
                        {p.username[0]}
                      </div>
                    </div>
                  )}
                  <div className={`absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-semibold text-white flex items-center gap-1 z-10 ${
                    size === 'small' ? 'text-[10px] px-1.5 py-0.5 bottom-1.5 left-1.5 gap-0.5' : ''
                  }`}>
                    {isLocal ? (
                      <>
                        {isAudioEnabled ? <Mic size={size === 'small' ? 10 : 14} className="text-[#bc9f84]" /> : <MicOff size={size === 'small' ? 10 : 14} className="text-[#ed4245]" />}
                        {isDeafened && <Headphones size={size === 'small' ? 10 : 14} className="text-[#ed4245]" />}
                      </>
                    ) : (
                      <>
                        {!isScreenShare && (!isAudioEnabled ? <MicOff size={size === 'small' ? 10 : 14} className="text-[#ed4245]" /> : <Mic size={size === 'small' ? 10 : 14} className="text-[#bc9f84]" />)}
                        {!isScreenShare && isDeafened && <Headphones size={size === 'small' ? 10 : 14} className="text-[#ed4245]" />}
                      </>
                    )}
                    <span className="truncate max-w-[100px]">{p.username} {isLocal ? '(You)' : ''}</span>
                  </div>
                </div>
              );
            }

            const renderInviteCard = () => {
              return (
                <div className="aspect-video bg-[#1e2022] rounded-xl flex flex-col items-center justify-center p-6 relative overflow-hidden border border-[#2d2f31] border-dashed shadow-lg group">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#bc9f84] opacity-80 group-hover:scale-105 transition-transform duration-300">
                      <path d="M40 50C40 60 48 65 60 65C72 65 80 60 80 50V25H40V50Z" fill="#bc9f84" fillOpacity="0.15" stroke="#bc9f84" strokeWidth="2" />
                      <path d="M40 30H32C28 30 25 33 25 37V40C25 44 28 47 32 47H40" stroke="#bc9f84" strokeWidth="2" strokeLinecap="round" />
                      <path d="M80 30H88C92 30 95 33 95 37V40C95 44 92 47 88 47H80" stroke="#bc9f84" strokeWidth="2" strokeLinecap="round" />
                      <path d="M60 65V75" stroke="#bc9f84" strokeWidth="2" />
                      <path d="M48 75H72" stroke="#bc9f84" strokeWidth="2" strokeLinecap="round" />
                      <rect x="75" y="55" width="22" height="15" rx="7.5" fill="#bc9f84" fillOpacity="0.15" stroke="#bc9f84" strokeWidth="2" />
                      <circle cx="81" cy="62.5" r="1.5" fill="#bc9f84" />
                      <circle cx="91" cy="62.5" r="1.5" fill="#bc9f84" />
                      <path d="M30 65L32 60L37 59L33 55L34 50L30 53L26 50L27 55L23 59L28 60L30 65Z" fill="#bc9f84" fillOpacity="0.2" stroke="#bc9f84" strokeWidth="1.5" />
                    </svg>
                    <div className="flex items-center gap-2 pt-2">
                      <button 
                        onClick={() => setShowInviteModal(true)} 
                        className="bg-[#2d2f31] hover:bg-[#bc9f84] hover:text-[#141517] font-semibold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow border border-[#343638]"
                      >
                        <UserPlus size={14} />
                        Invite to Voice
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            const focusedParticipant = allParticipants.find(p => p.id === focusedParticipantId);
            const otherParticipants = allParticipants.filter(p => p.id !== focusedParticipantId);

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
                            <div className="w-full max-w-5xl flex items-center justify-center gap-3 overflow-x-auto py-2 px-4 bg-[#1e1f22]/40 rounded-xl backdrop-blur-sm shrink-0 no-scrollbar">
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
                      <div className="bg-[#1e2022]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl border border-[#2d2f31]">
                        {/* Mute Mic */}
                        <button 
                          onClick={toggleAudio}
                          className={`p-3 rounded-full transition-all ${
                            !isAudioEnabled 
                              ? 'bg-[#ed4245]/20 text-[#ed4245] hover:bg-[#ed4245] hover:text-white' 
                              : 'bg-[#2d2f31] text-[#a3a29e] hover:bg-[#bc9f84] hover:text-[#141517]'
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
                              : 'bg-[#2d2f31] text-[#a3a29e] hover:bg-[#bc9f84] hover:text-[#141517]'
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
                              ? 'bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71]' 
                              : 'bg-[#2d2f31] text-[#a3a29e] hover:bg-[#bc9f84] hover:text-[#141517]'
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
                              ? 'bg-[#bc9f84] text-[#141517] hover:bg-[#a88d71]' 
                              : 'bg-[#2d2f31] text-[#a3a29e] hover:bg-[#bc9f84] hover:text-[#141517]'
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
                          className="bg-[#ed4245]/20 text-[#ed4245] hover:bg-[#ed4245] hover:text-white p-3 px-5 rounded-xl transition-all flex items-center justify-center shadow"
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
                              className="w-10 h-10 rounded-full bg-[#2d2f31] border-2 border-[#141517] flex items-center justify-center text-xs font-bold uppercase text-[#e3e1db] shadow"
                              title={p.username}
                            >
                              {p.username[0]}
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
        <div className="w-60 obsidian-card flex flex-col overflow-hidden shrink-0 border-none">
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
                      <div className="w-8 h-8 rounded-full bg-[#2d2f31] flex items-center justify-center text-xs font-bold uppercase text-[#e3e1db] border border-[#343638]">{member.username[0]}</div>
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
        <div className="w-72 obsidian-card flex flex-col overflow-hidden shrink-0 border-none select-none text-left">
          {/* Top Banner (color matching server avatar or matching discord) */}
          <div className="h-16 bg-[#bc9f84] relative shrink-0" />
          
          <div className="flex-1 overflow-y-auto p-4 relative flex flex-col custom-sidebar-scrollbar min-h-0">
            {/* Avatar block with status dot */}
            <div className="w-20 h-20 rounded-full bg-[#1e2022] p-1.5 -mt-12 relative shrink-0 mb-3 z-10">
              <div className="w-full h-full rounded-full bg-[#2d2f31] flex items-center justify-center text-3xl font-bold uppercase text-[#e3e1db] shadow-lg border border-[#343638]">
                {dmUserProfile.username[0]}
              </div>
              {dmUserProfile.status && (
                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[#1e2022] ${getStatusColor(dmUserProfile.status)}`} />
              )}
            </div>

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
        <ServerSettingsModal serverId={currentServer.id} serverName={currentServer.name} onClose={() => setShowServerSettingsModal(false)} />
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
            <div className="h-16 bg-[#bc9f84] relative" />
            <div className="px-4 pb-4 -mt-8 flex flex-col relative">
              <div className="w-16 h-16 rounded-full bg-[#1e2022] p-1 mb-2 relative shrink-0 z-10">
                <div className="w-full h-full rounded-full bg-[#2d2f31] flex items-center justify-center text-2xl font-bold uppercase text-[#e3e1db] border border-[#343638] shadow-md">
                  {userProfileData?.username?.[0] || '?' }
                </div>
                {userProfileData?.status && (
                  <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#1e2022] ${getStatusColor(userProfileData.status)}`} />
                )}
              </div>
              
              {userProfileData ? (
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
                      <p className="text-xs text-[#a3a29e] whitespace-pre-wrap">{userProfileData.bio || "No bio yet."}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-[#a3a29e]">Loading profile...</div>
              )}
            </div>
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
  onReact
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
        <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center shrink-0 mt-0.5 uppercase font-bold text-white shadow-sm cursor-pointer hover:opacity-85">
          {msg.username?.[0] || 'U'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-bold hover:underline cursor-pointer text-white">{msg.username}</span>
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
                {['👍', '❤️', '😂', '😂', '😢', '🙏', '🔥', '🎉'].map(emoji => (
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
