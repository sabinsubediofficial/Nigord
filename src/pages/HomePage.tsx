import { useEffect, useState, useRef } from "react"
import { apiFetch, getFileUrl, parseUTCDate, clearToken, saveToken } from "@/lib/api"
import { useAuthStore } from "@/store/useAuthStore"
import { useMessageStore, deletedMessageIds } from "@/store/useMessageStore"
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
import { useAudioStore } from "@/store/useAudioStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import InviteModal from "@/components/modals/InviteModal"
import ServerSettingsModal from "@/components/modals/ServerSettingsModal"
import UserSettingsModal from "@/components/modals/UserSettingsModal"
import ChannelSettingsModal from "@/components/modals/ChannelSettingsModal"
import QuickSwitcherModal from "@/components/modals/QuickSwitcherModal"
import ImageLightboxModal from "@/components/modals/ImageLightboxModal"
import EmojiPickerPopover from "@/components/chat/EmojiPickerPopover"
import GifPickerPopover from "@/components/chat/GifPickerPopover"
import PipVideoOverlay from "@/components/voice/PipVideoOverlay"
import { useUIStore } from "@/store/useUIStore"
import MessageContent from "@/components/MessageContent"
import { SidebarHeader } from "@/components/navigation/SidebarHeader"
import { Plus, LogOut, Settings, Hash, Volume2, Shield, User, Users, Mic, MicOff, Headphones, Video, VideoOff, Phone, PhoneOff, MonitorUp, MessageSquare, Check, X as XIcon, Search, UserMinus, Ban, ChevronDown, UserPlus, Gamepad2, CornerUpLeft, Edit3, Trash2, Pin, Smile, MoreHorizontal, Compass, Megaphone, Pencil, Menu, Crown } from "lucide-react"

function ContextSidebarHeader({ 
  activeTab, 
  currentServer, 
  onInvite, 
  onCreateChannel, 
  onSettings, 
  onLeave,
  onUserSettings,
  isOwner,
  isAdmin,
  isManageChannels,
}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Only show server actions menu when on a server
  if (activeTab === 'server' && currentServer) {
    const hasBanner = !!currentServer.banner;
    return (
      <div className="relative z-50 w-full shrink-0" ref={menuRef}>
        {hasBanner ? (
          /* Rich Server Banner Header */
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="relative h-28 w-full group cursor-pointer overflow-hidden border-b border-border/80"
          >
            <img 
              src={getFileUrl(currentServer.banner)} 
              alt={currentServer.name}
              className="w-full h-full object-cover brightness-[0.6] group-hover:brightness-[0.75] transition-all duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                {currentServer.icon ? (
                  <img 
                    src={getFileUrl(currentServer.icon)} 
                    alt={currentServer.name} 
                    className="w-8 h-8 rounded-lg object-cover border-2 border-white/20 shadow-lg shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-sm font-bold text-white border border-white/20 shadow-lg shrink-0">
                    {currentServer.name[0]?.toUpperCase()}
                  </div>
                )}
                <span className="font-display font-extrabold text-base text-white tracking-wide truncate drop-shadow-md">
                  {currentServer.name}
                </span>
              </div>
              <ChevronDown size={18} className={`text-white/80 group-hover:text-white transition-transform duration-200 shrink-0 drop-shadow ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        ) : (
          /* Clean Server Header with Icon Thumbnail */
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-3 h-14 hover:bg-white/[0.06] transition-all border-b border-border group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {currentServer.icon ? (
                <img 
                  src={getFileUrl(currentServer.icon)} 
                  alt={currentServer.name} 
                  className="w-8 h-8 rounded-lg object-cover border border-white/10 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-indigo-600/30 flex items-center justify-center text-sm font-extrabold text-white border border-white/10 shadow-sm shrink-0">
                  {currentServer.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-display font-extrabold text-base text-white tracking-wide truncate group-hover:text-primary transition-colors">
                {currentServer.name}
              </span>
            </div>
            <ChevronDown size={16} className={`text-white/70 group-hover:text-white transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}

        {isOpen && (
          <div className="absolute top-full left-2 right-2 mt-1.5 bg-[#1e1f22]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
            <button 
              onClick={() => { onInvite?.(); setIsOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary/15 transition-colors"
            >
              <span>Invite People</span>
              <UserPlus size={15} />
            </button>
            
            {(isOwner || isAdmin || isManageChannels) && (
              <button 
                onClick={() => { onCreateChannel?.(); setIsOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span>Create Channel</span>
                <Plus size={15} />
              </button>
            )}
            
            {(isOwner || isAdmin) && (
              <button 
                onClick={() => { onSettings?.(); setIsOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span>Server Settings</span>
                <Settings size={15} />
              </button>
            )}
            
            {!isOwner && (
              <button 
                onClick={() => { onLeave?.(); setIsOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-500/15 transition-colors mt-0.5"
              >
                <span>Leave Server</span>
                <LogOut size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // For home/chats/people — clean branding header
  return (
    <div className="w-full flex items-center px-4 h-12 border-b border-border shrink-0 bg-secondary/50 select-none">
      <div className="flex items-center gap-2">
        <img src="/favicon.svg" alt="Suhhp" className="w-6 h-6 rounded-md shadow-sm" />
        <span className="font-display font-extrabold text-xl text-white tracking-widest uppercase">Suhhp</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, setUser } = useAuthStore()
  const { userVolumes, setUserVolume } = useAudioStore()
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

  const { roles: serverRoles } = useServerSettings(currentServer?.id)

  const [sidebarWidth, setSidebarWidth] = useState<number>(270) // Default 270px

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(260, Math.min(480, startWidth + deltaX)); // clamp between 260px and 480px
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

  // Master UI & Navigation Store
  const {
    showUserSettingsModal,
    setShowUserSettingsModal,
    showServerSettingsModal,
    setShowServerSettingsModal,
    showQuickSwitcher,
    setShowQuickSwitcher,
    selectedLightboxImage,
    setSelectedLightboxImage,
    showInviteModal,
    setShowInviteModal,
    showChannelSettingsModal,
    setShowChannelSettingsModal,
    showCreateServerModal,
    setShowCreateServerModal,
    showCreateChannelModal,
    setShowCreateChannelModal,
    activeTab,
    setActiveTab,
    activeHomeView,
    setActiveHomeView,
    activeDmId,
    setActiveDmId,
    mobileMenuOpen,
    setMobileMenuOpen,
    rightSidebarOpen,
    setRightSidebarOpen,
    messageSearchQuery,
    setMessageSearchQuery,
  } = useUIStore()

  const [newServerName, setNewServerName] = useState("")
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text')
  const [showServerMenu, setShowServerMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [emojiTarget, setEmojiTarget] = useState<'channel' | 'dm'>('channel')
  const [gifTarget, setGifTarget] = useState<'channel' | 'dm'>('channel')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShowQuickSwitcher(!showQuickSwitcher)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showQuickSwitcher, setShowQuickSwitcher])

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
  const [friendsFilter, setFriendsFilter] = useState<'all' | 'pending' | 'add' | 'blocked'>('all')

  useEffect(() => {
    try {
      localStorage.setItem('suhhp_activeHomeView', activeHomeView)
    } catch (e) {}
  }, [activeHomeView])

  useEffect(() => {
    try {
      if (activeDmId) {
        localStorage.setItem('suhhp_activeDmId', activeDmId)
      } else {
        localStorage.removeItem('suhhp_activeDmId')
      }
    } catch (e) {}
  }, [activeDmId])
  const [searchQuery, setSearchQuery] = useState('')

  const { friends, searchResults, searchUsers, sendRequest, acceptRequest, removeFriend, blockUser } = useFriends()
  const { dms, messages: dmMessages, setMessages: setDmMessages, sendMessage: sendDmMessage, fetchMessages: fetchDmMessages, fetchMoreMessages: fetchMoreDmMessages, hasMore: dmHasMore, isLoadingMore: dmLoadingMore, fetchDMs } = useDMs(activeDmId || undefined)
  const { unreads } = useNotifications(currentServer?.id)
  const { searchResults: msgSearchResults, searchMessages, isSearching, setSearchResults: setMsgSearchResults } = useSearch(currentServer?.id)
  const { notifications, fetchNotifications } = useGlobalNotifications()
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
  

  // Find all user IDs that currently have a screen share active
  const screenSharingUserIds = new Set<string>();
  if (isScreenSharing && localScreenStream) {
    screenSharingUserIds.add('local');
    if (user?.id) screenSharingUserIds.add(user.id);
  }
  Object.keys(remoteStreams).forEach(peerId => {
    if (peerId.endsWith('-screen')) {
      screenSharingUserIds.add(peerId.replace('-screen', ''));
    }
  });

  const allParticipants = [
    // If local user is streaming, show ONLY their screen window!
    ...(isScreenSharing && localScreenStream ? [{
      id: 'local-screen',
      username: user?.username || 'You',
      isLocal: true,
      isVideoEnabled: true,
      isAudioEnabled,
      isDeafened,
      stream: localScreenStream,
      isScreenShare: true,
      avatar: user?.avatar
    }] : [{
      id: 'local',
      username: user?.username || 'You',
      isLocal: true,
      isVideoEnabled,
      isAudioEnabled,
      isDeafened,
      stream: localStream,
      isScreenShare: false,
      avatar: user?.avatar
    }]),

    // For remote users: if streaming, show ONLY their screen share window!
    ...Object.entries(remoteStreams)
      .filter(([peerId]) => {
        const isScreenShare = peerId.endsWith('-screen');
        const actualUserId = peerId.replace('-screen', '');
        // If this user is streaming, include their screen share window and omit their duplicate avatar tile
        if (screenSharingUserIds.has(actualUserId)) {
          return isScreenShare;
        }
        return true;
      })
      .map(([peerId, stream]) => {
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
          username: ((peer as any).username || (peer as any).name || 'Unknown'),
          isLocal: false,
          isVideoEnabled: hasVideo,
          isAudioEnabled: !isMuted,
          isDeafened: isDeaf,
          stream,
          isScreenShare,
          avatar: (peer as any).avatar
        };
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
      ? !!(speakingUsers[user?.id || 'local'] || speakingUsers['local'])
      : !!(speakingUsers[p.id] || speakingUsers[p.id.replace('-screen', '')]);

    const cardClasses = `bg-background rounded-xl flex flex-col items-center justify-center relative overflow-hidden border-2 transition-all duration-150 cursor-pointer group shadow-lg ${
      isSpeaking 
        ? 'border-[#23a55a] ring-4 ring-[#23a55a]/50 shadow-[0_0_30px_rgba(35,165,90,0.65)]' 
        : (isFocused && size !== 'small' ? 'border-[#b5bac1]' : 'border-white/10 hover:border-white/20')
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
          <div className="w-full h-full relative flex items-center justify-center bg-black">
            <video 
              ref={el => { if (el && el.srcObject !== stream) el.srcObject = stream }} 
              autoPlay 
              muted={true} 
              playsInline 
              className="w-full h-full object-contain pointer-events-none" 
            />
            {isSpeaking && (
              <div className="absolute inset-0 pointer-events-none border-2 border-[#23a55a] shadow-[inset_0_0_20px_rgba(35,165,90,0.4)]" />
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary">
            <div className={`relative z-10 rounded-full bg-background text-foreground flex items-center justify-center font-bold uppercase transition-all duration-150 overflow-hidden ${avatarSizeClass} ${
              isSpeaking 
                ? 'ring-[4px] ring-[#23a55a] ring-offset-2 ring-offset-[#2b2d31] shadow-[0_0_20px_#23a55a]' 
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
        <div className={`absolute bottom-2 left-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold text-white flex items-center gap-1.5 z-10 border transition-all ${
          isSpeaking ? 'border-[#23a55a] text-[#23a55a]' : 'border-white/10'
        } ${
          size === 'small' ? 'text-[10px] px-1.5 py-0.5 bottom-1.5 left-1.5 gap-1' : ''
        }`}>
          {isSpeaking && (
            <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse shrink-0 shadow-[0_0_8px_#23a55a]" />
          )}
          {isScreenShare && (
            <MonitorUp size={size === 'small' ? 10 : 13} className="text-primary shrink-0" />
          )}
          {!isScreenShare && !isAudioEnabled && <MicOff size={size === 'small' ? 10 : 12} className="text-[#f23f43]" />}
          {!isScreenShare && isDeafened && (
            <div className="relative flex items-center justify-center">
              <Headphones size={size === 'small' ? 10 : 12} className="text-[#f23f43]" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[1.2px] h-[12px] bg-[#f23f43] rotate-45" />
              </div>
            </div>
          )}
          <span className="truncate max-w-[120px]">{p.username} {isLocal ? '(You)' : ''}</span>
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
      deletedMessageIds.add(msgId)
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
        let participants = data.participants || []
        
        // Prevent stale server response from overwriting local join state (race condition safeguard)
        if (activeVoiceChannel && user) {
          const hasSelf = participants.some((p: any) => p.user_id === user.id)
          if (!hasSelf) {
            participants = [
              ...participants,
              {
                user_id: user.id,
                username: user.username,
                avatar: user.avatar,
                channel_id: activeVoiceChannel.id,
                is_muted: !isAudioEnabled ? 1 : 0,
                is_deafened: isDeafened ? 1 : 0
              }
            ]
          }
        }
        
        setVoiceParticipants(participants)
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
      clearToken()
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
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <RemoteStream key={peerId} stream={stream} peerId={peerId} />
      ))}

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-30 transition-opacity animate-in fade-in duration-200 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Layout — Clean 2-Panel Split */}
      <div className="flex-1 flex h-full z-10">
        <div className="w-full h-full flex overflow-hidden relative">
          
          {/* Mobile slide-out drawer wrapper for Context Sidebar */}
          <div className={`fixed md:relative top-0 bottom-0 left-0 z-40 h-full shrink-0 flex transition-transform duration-300 md:translate-x-0 ${
              mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
            }`}
          >
            {/* Context Sidebar */}
            <div 
              style={{ width: `${sidebarWidth}px`, maxWidth: '350px', minWidth: '260px' }}
              className={`h-full bg-secondary border-r border-border/50 shrink-0 flex flex-col relative`}
            >
            {/* Workspace Switcher Header */}
            <ContextSidebarHeader 
              activeTab={activeTab}
              currentServer={currentServer}
              onInvite={() => setShowInviteModal(true)}
              onSettings={() => setShowServerSettingsModal(true)}
              onUserSettings={() => setShowUserSettingsModal(true)}
              onCreateChannel={() => { setNewChannelType('text'); setShowCreateChannelModal(true); }}
              onLeave={handleLeaveServer}
              isOwner={currentServer?.owner_id === user?.id}
              isAdmin={!!(currentServer as any)?.permissions?.includes('ADMINISTRATOR')}
              isManageChannels={!!(currentServer as any)?.permissions?.includes('MANAGE_CHANNELS')}
            />
            
            <div className="flex-1 overflow-y-auto p-3.5 no-scrollbar">
              {/* Sidebar tabs: Chats / People / Servers — 3-equal grid, high contrast, zero truncation */}
              <div className="grid grid-cols-3 gap-1 mb-3.5 bg-background/60 rounded-xl p-1 border border-white/10">
                <button 
                  onClick={() => { setActiveTab('home'); setActiveHomeView('dm'); setMobileMenuOpen(false); }}
                  className={`py-2 px-1 rounded-lg text-sm font-extrabold transition-all text-center truncate select-none ${
                    activeTab === 'home' && activeHomeView !== 'friends' 
                      ? 'bg-white/15 text-white shadow-sm border border-white/10' 
                      : 'text-white/70 hover:text-white hover:bg-white/5 font-semibold'
                  }`}
                >
                  Chats
                </button>
                <button 
                  onClick={() => { setActiveTab('home'); setActiveHomeView('friends'); setActiveDmId(null); setMobileMenuOpen(false); }}
                  className={`py-2 px-1 rounded-lg text-sm font-extrabold transition-all text-center truncate select-none ${
                    activeTab === 'home' && activeHomeView === 'friends' 
                      ? 'bg-white/15 text-white shadow-sm border border-white/10' 
                      : 'text-white/70 hover:text-white hover:bg-white/5 font-semibold'
                  }`}
                >
                  People
                </button>
                <button 
                  onClick={() => { setActiveTab('server'); setCurrentServer(null as any); setMobileMenuOpen(false); }}
                  className={`py-2 px-1 rounded-lg text-sm font-extrabold transition-all text-center truncate select-none ${
                    activeTab === 'server' 
                      ? 'bg-white/15 text-white shadow-sm border border-white/10' 
                      : 'text-white/70 hover:text-white hover:bg-white/5 font-semibold'
                  }`}
                >
                  Servers
                </button>
              </div>

              {/* Tab content */}
              {activeTab === 'home' && activeHomeView === 'friends' ? (
                /* People tab — Friends management inline in sidebar */
                <div className="space-y-2.5">
                  {/* Search / Add friend */}
                  <form onSubmit={handleSearchUsers} className="relative">
                    <Input 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      placeholder="Find or add people..." 
                      className="bg-background/80 border border-white/10 text-white text-sm font-medium h-10 pl-9 pr-3 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 placeholder:text-white/70" 
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                  </form>

                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-white/80 px-1">Results</span>
                      {searchResults.map(u => (
                        <div key={u.id} className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.06] transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-xs font-bold text-white border border-white/10 overflow-hidden shrink-0">
                              {u.avatar ? <img src={getFileUrl(u.avatar)} alt={u.username} className="w-full h-full object-cover" /> : u.username?.[0]}
                            </div>
                            <span className="text-sm font-semibold text-white truncate">{u.username}</span>
                          </div>
                          <Button size="sm" className="h-7 text-xs px-2.5 bg-primary/20 text-white hover:bg-primary border border-primary/30" onClick={async () => { const ok = await sendRequest(u.id); if (ok) showToast("Request sent!"); }}>Add</Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Filter tabs */}
                  <div className="flex gap-1.5 px-1">
                    {(['all', 'pending', 'blocked'] as const).map(f => (
                      <button key={f} onClick={() => setFriendsFilter(f)} className={`text-sm px-3.5 py-1.5 rounded-lg transition-all capitalize font-bold ${friendsFilter === f ? 'bg-white/15 text-white shadow-sm border border-white/10' : 'text-white/70 hover:text-white hover:bg-white/5 font-semibold'}`}>{f}</button>
                    ))}
                  </div>

                  {/* Friends list */}
                  <div className="space-y-1">
                    {friends.filter(f => friendsFilter === 'all' ? f.status === 'accepted' : f.status === friendsFilter).map(friend => (
                      <div key={friend.id} className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-white/[0.06] group cursor-pointer transition-colors" onClick={() => setSelectedUserProfileId(friend.id)}>
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-sm font-bold text-white border border-white/10 overflow-hidden">
                            {friend.avatar ? <img src={getFileUrl(friend.avatar)} alt={friend.username} className="w-full h-full object-cover" /> : friend.username[0]}
                          </div>
                          {friend.status === 'accepted' && (
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-secondary ${getStatusColor(friend.presence_status)}`} />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-base font-bold text-white truncate">{friend.display_name || friend.username}</span>
                          <span className="text-xs text-white/80 truncate leading-none mt-0.5 font-semibold">
                            {friend.status === 'pending' ? (friend.direction === 'incoming' ? 'Incoming request' : 'Sent request') : 
                             friend.status === 'blocked' ? 'Blocked' : (friend.status_message || friend.presence_status || 'offline')}
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {friend.status === 'pending' && friend.direction === 'incoming' && (
                            <>
                              <button className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-emerald-400 hover:bg-emerald-500/20 transition-colors" onClick={async (e) => { e.stopPropagation(); const success = await acceptRequest(friend.id); if (success) { const latestDms = await fetchDMs(); const newDm = latestDms?.find((d: any) => d.target_id === friend.id); if (newDm) openDm(newDm.id); }}} title="Accept"><Check size={14} /></button>
                              <button className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-rose-400 hover:bg-rose-500/20 transition-colors" onClick={(e) => { e.stopPropagation(); removeFriend(friend.id); }} title="Decline"><XIcon size={14} /></button>
                            </>
                          )}
                          {friend.status === 'accepted' && (
                            <button className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-primary hover:bg-primary/20 transition-colors" onClick={async (e) => { e.stopPropagation(); let existingDm = dms.find(d => d.target_id === friend.id); if (!existingDm) { const latestDms = await fetchDMs(); existingDm = latestDms?.find((d: any) => d.target_id === friend.id); } if (existingDm) openDm(existingDm.id); }} title="Message"><MessageSquare size={14} /></button>
                          )}
                          {friend.status === 'blocked' && (
                            <button className="text-xs text-white/80 hover:text-white px-2 py-0.5 rounded transition-colors" onClick={(e) => { e.stopPropagation(); removeFriend(friend.id); }}>Unblock</button>
                          )}
                        </div>
                      </div>
                    ))}
                    {friends.filter(f => friendsFilter === 'all' ? f.status === 'accepted' : f.status === friendsFilter).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-white text-base font-bold gap-1">
                        <Users size={36} className="mb-1 text-white/60" />
                        <span>No people yet</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'home' ? (
                /* Chats tab — DM list */
                <div className="space-y-1">
                {dms.map(dm => {
                  const unreadCount = notifications.dms.find(d => d.channel_id === dm.id)?.unread_count || 0;
                  return (
                  <div 
                    key={dm.id} 
                    onClick={() => { openDm(dm.id); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-3 px-2.5 py-2.5 rounded-lg cursor-pointer group relative transition-all duration-150 ${activeHomeView === 'dm' && activeDmId === dm.id ? 'bg-white/15 text-white font-bold shadow-sm border border-white/10' : 'text-white/80 hover:bg-white/[0.06] hover:text-white'}`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-sm font-bold uppercase text-white border border-white/10 overflow-hidden">
                        {dm.avatar ? (
                          <img src={getFileUrl(dm.avatar)} alt={dm.name} className="w-full h-full object-cover" />
                        ) : (
                          dm.name[0]
                        )}
                      </div>
                      {dm.active_call && dm.active_call > 0 ? (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-secondary flex items-center justify-center text-white">
                          <Phone size={8} className="fill-current" />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 text-left">
                      <span className={`text-sm truncate ${unreadCount > 0 && activeDmId !== dm.id ? 'text-white font-bold' : 'font-semibold'}`}>{dm.name}</span>
                      {dm.active_call && dm.active_call > 0 ? (
                        <span className="text-xs text-emerald-400 font-semibold leading-none mt-0.5">In a call</span>
                      ) : null}
                    </div>
                    {unreadCount > 0 && activeDmId !== dm.id && (
                      <div className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                )})}
                {dms.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-white/80 text-sm font-medium">
                    <MessageSquare size={32} className="mb-2 opacity-50 text-white" />
                    No conversations yet
                  </div>
                )}
                </div>
              ) : activeTab === 'server' && !currentServer ? (
                /* Servers tab — no server selected, show server list */
                <div className="space-y-1">
                  {servers.map((server: any) => (
                    <button
                      key={server.id}
                      onClick={() => { setCurrentServer(server); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/[0.06] hover:text-white transition-colors text-left font-semibold"
                    >
                      {server.icon ? (
                        <img src={getFileUrl(server.icon)} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center text-sm font-bold text-white border border-white/10 shrink-0">
                          {server.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-sm truncate">{server.name}</span>
                    </button>
                  ))}
                  <button 
                    onClick={() => setShowCreateServerModal(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/90 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all font-semibold shadow-sm group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                      <Plus size={16} strokeWidth={2.5} />
                    </div>
                    <span className="font-semibold text-sm">Create Server</span>
                  </button>
                  {servers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-white/80 text-sm font-medium">
                      <Compass size={32} className="mb-2 opacity-50 text-white" />
                      No servers yet
                    </div>
                  )}
                </div>
              ) : currentServer ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex items-center justify-between px-3 mb-2 group/header select-none">
                      <button 
                        onClick={() => setTextChannelsCollapsed(!textChannelsCollapsed)}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-white/80 tracking-widest hover:text-white transition-colors"
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
                          className="text-white/80 cursor-pointer hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover/header:opacity-100 transition-all duration-200" 
                          onClick={(e) => { e.stopPropagation(); setNewChannelType('text'); setShowCreateChannelModal(true); }} 
                        />
                      )}
                    </div>
                    {!textChannelsCollapsed && (
                      <div className="space-y-1 px-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        {textChannels.map(channel => {
                          const isUnread = unreads[channel.id] > 0;
                          const isActive = currentChannel?.id === channel.id;
                          return (
                            <div 
                              key={channel.id} 
                              onClick={() => { sendTypingStatus(false); setCurrentChannel(channel); setMobileMenuOpen(false); }} 
                              className={`relative flex items-center justify-between pl-4 pr-2 py-2 rounded-xl cursor-pointer group transition-all duration-200 ${
                                isActive 
                                  ? 'bg-white/10 text-white shadow-inner font-semibold' 
                                  : 'text-white/80 hover:bg-white/5 hover:text-white font-medium'
                              }`}
                            >
                              {/* Left accent pill */}
                              <div 
                                className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200 ${
                                  isActive 
                                    ? 'h-5 bg-primary' 
                                    : isUnread 
                                      ? 'h-3.5 bg-white group-hover:h-4' 
                                      : 'h-0 bg-white/20 group-hover:h-3'
                                }`} 
                              />
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Hash 
                                  size={18} 
                                  className={`transition-colors shrink-0 ${
                                    isActive 
                                      ? 'text-white' 
                                      : (isUnread ? 'text-white' : 'text-white/70 group-hover:text-white')
                                  }`} 
                                />
                                <span className={`text-[14px] truncate transition-all duration-200 group-hover:translate-x-0.5 ${
                                  isActive
                                    ? 'font-semibold text-white'
                                    : isUnread 
                                      ? 'font-bold text-white' 
                                      : 'font-medium text-white/80 group-hover:text-white'
                                }`}>{channel.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 transition-all duration-200 shrink-0 ml-1 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0">
                                <span title="Create Invite" className="flex items-center">
                                  <UserPlus
                                    size={14}
                                    className="text-muted-foreground hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
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
                                      className="text-muted-foreground hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
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
                        className="flex items-center gap-1 text-[11px] font-bold uppercase text-white/80 hover:text-white transition-colors"
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
                          className="text-white/80 cursor-pointer hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover/header:opacity-100 transition-all duration-200" 
                          onClick={(e) => { e.stopPropagation(); setNewChannelType('voice'); setShowCreateChannelModal(true); }} 
                        />
                      )}
                    </div>
                    {!voiceChannelsCollapsed && (
                      <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        {voiceChannels.map(channel => {
                          const participants = voiceParticipants.filter(p => {
                            if (p.channel_id !== channel.id) return false
                            if (p.user_id === user?.id) return !!activeVoiceChannel
                            return true
                          });
                          const isActive = currentChannel?.id === channel.id;
                          const isConnected = activeVoiceChannel?.id === channel.id;
                          return (
                            <div key={channel.id} className="flex flex-col">
                              <div 
                                onClick={() => { sendTypingStatus(false); setCurrentChannel(channel); handleJoinVoice(channel); setMobileMenuOpen(false); }} 
                                className={`relative flex items-center justify-between pl-4 pr-2 py-2 rounded-xl cursor-pointer group transition-all duration-200 ${
                                  isConnected
                                    ? 'bg-primary/15 text-white font-semibold border border-primary/30 shadow-sm'
                                    : (isActive 
                                      ? 'bg-white/10 text-white shadow-inner font-semibold border border-white/10' 
                                      : 'text-white/80 hover:bg-white/5 hover:text-white font-medium')
                                }`}
                              >
                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                  <Volume2 
                                    size={18} 
                                    className={`transition-colors shrink-0 mt-[2px] ${
                                      isConnected
                                        ? 'text-primary'
                                        : (isActive 
                                          ? 'text-white' 
                                          : 'text-white/70 group-hover:text-white')
                                    }`} 
                                  />
                                  <div className="flex flex-col min-w-0 flex-1 select-none">
                                    <span className={`text-[14px] truncate transition-all duration-200 ${
                                      isConnected
                                        ? 'font-semibold text-white'
                                        : (isActive
                                          ? 'font-semibold text-white'
                                          : 'font-medium text-white/80 group-hover:text-white')
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
                                        className="flex items-center gap-1 group/status text-[11px] text-muted-foreground hover:text-white transition-colors mt-0.5 min-w-0 cursor-pointer"
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
                                            className="bg-black/50 text-white px-2 py-1 rounded outline-none border border-primary w-full shadow-inner"
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
                                                className="opacity-0 group-hover/status:opacity-100 transition-opacity shrink-0 ml-0.5 text-muted-foreground" 
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
                                      className="text-muted-foreground hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
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
                                        className="text-muted-foreground hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
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
                                        className="flex items-center justify-between p-1 rounded-md hover:bg-secondary/50 cursor-pointer group/p transition-colors"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className={`w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[9px] uppercase font-bold text-foreground shrink-0 overflow-hidden transition-all duration-150 ${
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
                                            isUserSpeaking ? 'text-[#23a55a] font-semibold' : 'text-muted-foreground group-hover/p:text-foreground'
                                          }`}>{p.username}</span>
                                        </div>
                                        <div className="flex items-center gap-1 pr-1 shrink-0">
                                          {p.is_muted === 1 && <MicOff size={13} className="text-muted-foreground" />}
                                          {p.is_deafened === 1 && (
                                            <div className="relative flex items-center justify-center text-muted-foreground">
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
            
            {/* Resizable Sidebar Drag Handle */}
            <div 
              onMouseDown={handleMouseDown}
              className="hidden md:block absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-white/10 active:bg-white/20 z-30 transition-colors"
            />

            {/* Universal Bottom User & Voice Panel (Always accessible across all channels, servers, and screens) */}
            <div className="w-full bg-black/50 backdrop-blur-2xl border-t border-white/10 flex flex-col shrink-0 z-20 relative select-none">
              {/* Voice Connected status if active */}
              {activeVoiceChannel && (() => {
                const voiceServer = servers.find(s => s.id === activeVoiceChannel.server_id);
                const voiceSubtitle = voiceServer ? `${activeVoiceChannel.name} / ${voiceServer.name}` : `${activeVoiceChannel.name} / Direct Call`;
                return (
                  <div className="w-full px-3 py-2 flex items-center justify-between border-b border-white/10 text-left bg-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-2.5 text-white min-w-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold leading-tight text-white">Voice Connected</span>
                        <span className="text-[10px] leading-tight text-white/60 truncate mt-0.5">{voiceSubtitle}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLeaveVoice} title="Disconnect" className="h-7 w-7 text-white/60 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg cursor-pointer transition-colors">
                      <PhoneOff size={14} />
                    </Button>
                  </div>
                );
              })()}

              {/* User Panel with Avatar, Name, Mic, Deafen, and Settings */}
              <div className="w-full flex items-center justify-between px-3 py-2 shrink-0 bg-background/80">
                <div 
                  className="flex items-center gap-2.5 min-w-0 group cursor-pointer hover:bg-white/5 p-1 -m-1 rounded-lg transition-colors flex-1 mr-1" 
                  onClick={() => { setShowUserSettingsModal(true); setMobileMenuOpen(false); }}
                  title="Open User Settings"
                >
                  <div className="relative shrink-0" onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold uppercase text-white border border-white/10 overflow-hidden shadow-sm">
                      {user?.avatar ? (
                        <img src={getFileUrl(user.avatar)} alt={user.username} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        user?.username?.[0] || '?'
                      )}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#121214] ${getStatusColor(user?.status)} shadow-sm transition-colors duration-300`} />
                    
                    {showStatusMenu && (
                      <div className="absolute bottom-11 left-0 w-48 bg-black/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/15 p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <div onClick={(e) => { e.stopPropagation(); handleUpdateStatus('online'); setShowStatusMenu(false); }} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer transition-colors text-white/80">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                          <span className="text-xs font-semibold">Online</span>
                        </div>
                        <div onClick={(e) => { e.stopPropagation(); handleUpdateStatus('idle'); setShowStatusMenu(false); }} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer transition-colors text-white/80">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" />
                          <span className="text-xs font-semibold">Idle</span>
                        </div>
                        <div onClick={(e) => { e.stopPropagation(); handleUpdateStatus('dnd'); setShowStatusMenu(false); }} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer transition-colors text-white/80">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
                          <span className="text-xs font-semibold">Do Not Disturb</span>
                        </div>
                        <div onClick={(e) => { e.stopPropagation(); handleUpdateStatus('invisible'); setShowStatusMenu(false); }} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer transition-colors text-white/80">
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 shadow-sm" />
                          <span className="text-xs font-semibold">Invisible</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-[13px] font-bold text-white truncate leading-tight group-hover:text-primary transition-colors">{user?.display_name || user?.username}</span>
                    <span className="text-[10px] text-white/50 truncate leading-none mt-0.5 font-medium">@{user?.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleAudio(); }} 
                    title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                    className={`p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-150 cursor-pointer ${!isAudioEnabled ? 'text-rose-500 hover:text-rose-400 hover:bg-rose-500/10' : ''}`}
                  >
                    {!isAudioEnabled ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleDeafen(); }} 
                    title={isDeafened ? "Undeafen" : "Deafen Audio"}
                    className={`p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white relative transition-all duration-150 cursor-pointer ${isDeafened ? 'text-rose-500 hover:text-rose-400 hover:bg-rose-500/10' : ''}`}
                  >
                    <Headphones size={16} />
                    {isDeafened && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[1.5px] h-[14px] bg-rose-500 rotate-45" />
                      </div>
                    )}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowUserSettingsModal(true); setMobileMenuOpen(false); }} 
                    title="User Settings"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-150 cursor-pointer hover:rotate-45"
                  >
                    <Settings size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Content wrapper */}
        <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-card">
          {activeTab === 'home' && activeHomeView === 'friends' ? (
          /* Welcome / empty state — friends are managed in the sidebar now */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden absolute top-4 left-4 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Users size={28} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">People</h2>
            <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-6">
              Manage your connections in the sidebar. Search for people, accept requests, or start a conversation.
            </p>
            <button
              onClick={() => setShowUserSettingsModal(true)}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/15 flex items-center gap-2 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
            >
              <Settings size={18} className="text-primary" />
              <span className="font-sans font-semibold tracking-wide">Open User Settings</span>
            </button>
          </div>
        ) : activeTab === 'home' && activeHomeView === 'dm' && activeDmId ? (
          <>
            <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 relative z-20">
              <div className="flex items-center gap-2 min-w-0">
                <button 
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                >
                  <Menu size={20} />
                </button>
                <div className="flex flex-col text-left min-w-0">
                  <span className="font-semibold text-foreground truncate text-sm">@{dms.find(d => d.id === activeDmId)?.name}</span>
                  {isJoined && activeVoiceChannel?.id === activeDmId && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 leading-none">
                      In a call
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <button 
                  onClick={() => {
                    const dmChannel = dms.find(d => d.id === activeDmId)
                    if (dmChannel) {
                      setActiveVoiceChannel({ id: dmChannel.id, name: `@${dmChannel.name}`, type: 'voice' })
                      startCall(dmChannel.target_id, dmChannel.name, dmChannel.id, false)
                    }
                  }}
                  className="hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
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
                  className="hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Start Video Call"
                >
                  <Video size={20} />
                </button>
                <button 
                  onClick={() => {
                    setShowPins(!showPins)
                    if (!showPins) fetchPins()
                  }}
                  className={`hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer ${showPins ? 'text-primary' : ''}`}
                  title="Pinned Messages"
                >
                  <Pin size={20} className={showPins ? 'fill-primary text-primary' : ''} />
                </button>
                <button 
                  onClick={() => setShowDmProfile(!showDmProfile)}
                  className={`transition-all cursor-pointer hover:scale-110 active:scale-95 ${showDmProfile ? 'text-primary hover:text-primary/80' : 'hover:text-white'}`}
                  title={showDmProfile ? "Hide User Profile" : "Show User Profile"}
                >
                  <User size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 flex overflow-hidden relative">
              <div className="flex-1 flex flex-col">
                {isJoined && activeVoiceChannel?.id === activeDmId && (
                  <div className="bg-background p-4 flex flex-col items-center justify-center border-b border-border select-none shrink-0 relative transition-all duration-300 w-full">
                    {/* Participant Grid */}
                    <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {allParticipants.map(p => renderParticipantCard(p, 'normal'))}
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center gap-4">
                      {/* Audio, Video, Deafen Controls Container */}
                      <div className="bg-background border border-border p-1.5 rounded-[8px] flex items-center gap-1.5 shadow-md">
                        {/* Mic */}
                        <div className="flex items-center">
                          <button 
                            onClick={toggleAudio}
                            className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                              !isAudioEnabled 
                                ? 'bg-destructive/20 text-destructive hover:bg-destructive hover:text-white' 
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                            title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                            aria-label={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                          >
                            {isAudioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                          </button>
                          <button className="p-1 text-muted-foreground hover:text-white transition-colors" aria-label="Audio settings">
                            <ChevronDown size={12} />
                          </button>
                        </div>
                        
                        <div className="w-[1px] h-5 bg-secondary mx-1" />

                        {/* Video */}
                        <div className="flex items-center">
                          <button 
                            onClick={toggleVideo}
                            className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                              isVideoEnabled 
                                ? 'bg-primary text-white hover:bg-primary/80' 
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                            title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                            aria-label={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                          >
                            {isVideoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                          </button>
                          <button className="p-1 text-muted-foreground hover:text-white transition-colors" aria-label="Camera settings">
                            <ChevronDown size={12} />
                          </button>
                        </div>

                        <div className="w-[1px] h-5 bg-secondary mx-1" />

                        {/* Deafen */}
                        <div className="flex items-center">
                          <button 
                            onClick={toggleDeafen}
                            className={`p-2 rounded-lg transition-all flex items-center justify-center relative ${
                              isDeafened 
                                ? 'bg-destructive/20 text-destructive hover:bg-destructive hover:text-white' 
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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
                      <div className="bg-background border border-border p-1.5 rounded-[8px] flex items-center gap-1.5 shadow-md">
                        <button 
                          onClick={toggleScreenShare}
                          className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                            isScreenSharing 
                              ? 'bg-primary text-white hover:bg-primary/80' 
                              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                          }`}
                          title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
                        >
                          <MonitorUp size={16} />
                        </button>
                        
                        <button className="p-2 text-muted-foreground hover:bg-secondary hover:text-white rounded-lg transition-colors" title="Participants Grid">
                          <Users size={16} />
                        </button>

                        <button className="p-2 text-muted-foreground hover:bg-secondary hover:text-white rounded-lg transition-colors" title="Soundboard">
                          <Gamepad2 size={16} />
                        </button>

                        <button className="p-2 text-muted-foreground hover:bg-secondary hover:text-white rounded-lg transition-colors" title="More Options">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>

                      {/* Red End Call Button */}
                      <button 
                        onClick={handleLeaveVoice}
                        className="bg-destructive text-white hover:bg-destructive/80 p-2.5 rounded-[8px] transition-all flex items-center justify-center shadow-md cursor-pointer"
                        title="Disconnect"
                      >
                        <PhoneOff size={18} className="rotate-[135deg]" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex-1 p-4 overflow-y-auto flex flex-col-reverse" onScroll={handleDmScroll}>
                  {dmMessages.map((msg, index) => {
                    const nextMsg = dmMessages[index + 1];
                    const isGrouped = nextMsg &&
                      nextMsg.author_id === msg.author_id &&
                      !msg.reply_to_id &&
                      parseUTCDate(msg.created_at).getMinutes() === parseUTCDate(nextMsg.created_at).getMinutes() &&
                      parseUTCDate(msg.created_at).getHours() === parseUTCDate(nextMsg.created_at).getHours() &&
                      parseUTCDate(msg.created_at).toDateString() === parseUTCDate(nextMsg.created_at).toDateString();
                    return (
                      <MessageItem
                        key={msg.id}
                        msg={msg}
                        isGrouped={isGrouped}
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
                        onImageClick={(url) => setSelectedLightboxImage(url)}
                      />
                    )
                  })}
                </div>
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-white/5 border border-white/10 rounded-xl shadow-sm backdrop-blur-md relative">
                    {replyToMsg && (
                      <div className="bg-black/20 px-3 py-1.5 flex items-center justify-between border-b border-white/5 text-xs">
                        <span className="text-muted-foreground">Replying to <span className="font-semibold text-white">@{replyToMsg.username}</span></span>
                        <button onClick={() => setReplyToMsg(null)} className="text-muted-foreground hover:text-white"><XIcon size={14} /></button>
                      </div>
                    )}
                    {pendingAttachments.length > 0 && (
                      <div className="p-3 pb-0 flex flex-wrap gap-2">
                        {pendingAttachments.map(att => (
                          <div key={att.id} className="relative group bg-black/40 rounded-xl p-2 w-48 h-48 flex items-center justify-center border border-white/5 shadow-inner">
                            {att.content_type.startsWith('image/') ? (
                              <img src={att.url} className="max-w-full max-h-full rounded-lg object-contain" />
                            ) : (
                              <div className="text-center">
                                <div className="w-12 h-16 bg-white/5 rounded-lg mx-auto mb-2 flex items-center justify-center text-muted-foreground font-bold uppercase text-[10px]">
                                  {att.filename.split('.').pop()}
                                </div>
                                <p className="text-xs text-white truncate w-32">{att.filename}</p>
                              </div>
                            )}
                            <button 
                              onClick={() => removePendingAttachment(att.id)}
                              className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XIcon size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="p-2 pl-3 flex items-center gap-3 relative">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all shrink-0 disabled:opacity-50"
                        title="Upload File / Image"
                      >
                        <Plus size={18} strokeWidth={3} />
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
                          className="bg-transparent border-none ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white text-[15px] p-0 min-h-[40px]" 
                          placeholder={uploading ? "Uploading..." : `Message @${dms.find(d => d.id === activeDmId)?.name || 'user'}`} 
                        />
                      </form>

                      {/* GIF & Emoji Triggers */}
                      <div className="flex items-center gap-1.5 shrink-0 text-white/50">
                        <button
                          type="button"
                          onClick={() => {
                            setGifTarget('dm')
                            setShowGifPicker(!showGifPicker)
                            setShowEmojiPicker(false)
                          }}
                          className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-white/10 hover:bg-white/20 text-white transition-colors"
                          title="Search GIFs"
                        >
                          GIF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmojiTarget('dm')
                            setShowEmojiPicker(!showEmojiPicker)
                            setShowGifPicker(false)
                          }}
                          className="p-1.5 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                          title="Emoji Picker"
                        >
                          <Smile size={18} />
                        </button>
                      </div>

                      {/* Floating Emoji Popover */}
                      {showEmojiPicker && emojiTarget === 'dm' && (
                        <EmojiPickerPopover
                          onSelectEmoji={(emoji) => {
                            setDmMessageContent(prev => prev + emoji)
                            setShowEmojiPicker(false)
                          }}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      )}

                      {/* Floating GIF Popover */}
                      {showGifPicker && gifTarget === 'dm' && (
                        <GifPickerPopover
                          onSelectGif={(gifUrl) => {
                            setDmMessageContent(prev => prev ? `${prev} ${gifUrl}` : gifUrl)
                            setShowGifPicker(false)
                          }}
                          onClose={() => setShowGifPicker(false)}
                        />
                      )}
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
                <div className="w-80 bg-secondary border-l border-border flex flex-col absolute right-0 top-0 bottom-0 z-20 shadow-xl animate-in slide-in-from-right duration-200">
                  <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 bg-secondary">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Pin size={16} className="text-[#f5a623] fill-[#f5a623]" />
                      <span>Pinned Messages</span>
                    </div>
                    <Button variant="ghost" size="icon" className="w-6 h-6 hover:text-white text-[#b5bac1]" onClick={() => setShowPins(false)}><XIcon size={14} /></Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-sidebar-scrollbar">
                    {pinnedMessages.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground mt-10">No pinned messages yet. Pin messages from the hover toolbar!</div>
                    ) : (
                      pinnedMessages.map((msg: any) => (
                        <div key={msg.id} className="bg-background p-3 rounded shadow-sm border border-border relative group/pin-item text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold uppercase shrink-0 overflow-hidden">
                              {msg.avatar ? (
                                <img src={getFileUrl(msg.avatar)} alt={msg.username} className="w-full h-full object-cover" />
                              ) : (
                                msg.username?.[0] || 'U'
                              )}
                            </div>
                            <span className="font-bold text-xs truncate">{msg.username}</span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-auto">{parseUTCDate(msg.created_at).toLocaleDateString()}</span>
                          </div>
                          <MessageContent content={msg.content} attachments={msg.attachments} />
                          <button
                            onClick={() => togglePin(msg.id, true)}
                            className="absolute top-2 right-2 opacity-0 group-hover/pin-item:opacity-100 text-xs text-destructive hover:underline transition-opacity"
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
            <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 relative z-20">
              <div className="flex items-center min-w-0 gap-2">
                <button 
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden p-1 mr-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                >
                  <Menu size={20} />
                </button>
                {currentServer?.icon ? (
                  <img 
                    src={getFileUrl(currentServer.icon)} 
                    alt={currentServer.name} 
                    className="w-6 h-6 rounded-md object-cover border border-white/10 shrink-0 shadow-sm" 
                  />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {currentServer?.name?.[0]?.toUpperCase() || 'S'}
                  </div>
                )}
                <Hash size={18} className="text-white/70 shrink-0" />
                <span className="font-display font-bold text-base text-white tracking-wide truncate">{currentChannel.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    setShowPins(!showPins)
                    if (!showPins) fetchPins()
                  }}
                  className={`hover:scale-110 active:scale-95 transition-all cursor-pointer ${showPins ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
                  title="Pinned Messages"
                >
                  <Pin size={20} className={showPins ? 'fill-primary' : ''} />
                </button>
                <div className="relative w-48 md:w-64 hidden sm:block">
                  <Input value={messageSearchQuery} onChange={(e) => setMessageSearchQuery(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); setShowMsgSearchResults(true); searchMessages(messageSearchQuery); } }} placeholder="Search" className="h-8 text-[13px] bg-white/5 border border-white/10 rounded-full text-white placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary pr-9 shadow-inner transition-all" />
                  <Search size={14} className="absolute right-3 top-2 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="flex-1 flex overflow-hidden relative">
              <div className="flex-1 flex flex-col">
                <div className="flex-1 p-4 overflow-y-auto flex flex-col-reverse" onScroll={handleChannelScroll}>
                  {channelMessages.map((msg, index) => {
                    const nextMsg = channelMessages[index + 1];
                    const isGrouped = nextMsg &&
                      msg.author_id !== 'system' &&
                      nextMsg.author_id === msg.author_id &&
                      !msg.reply_to_id &&
                      parseUTCDate(msg.created_at).getMinutes() === parseUTCDate(nextMsg.created_at).getMinutes() &&
                      parseUTCDate(msg.created_at).getHours() === parseUTCDate(nextMsg.created_at).getHours() &&
                      parseUTCDate(msg.created_at).toDateString() === parseUTCDate(nextMsg.created_at).toDateString();
                    return msg.author_id === 'system' ? (
                      <div key={msg.id} className="flex items-center gap-4 py-2 px-4 -mx-4 hover:bg-secondary group/system mt-3">
                        <div className="w-10 flex justify-center text-[#23a559] shrink-0">
                          <Plus size={18} />
                        </div>
                        <MessageContent content={msg.content} attachments={(msg as any).attachments} />
                      </div>
                    ) : (
                      <MessageItem
                        key={msg.id}
                        msg={msg}
                        isGrouped={isGrouped}
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
                        onImageClick={(url) => setSelectedLightboxImage(url)}
                      />
                    )
                  })}
                </div>
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-white/5 border border-white/10 rounded-xl shadow-sm backdrop-blur-md relative">
                    {replyToMsg && (
                      <div className="bg-black/20 px-3 py-1.5 flex items-center justify-between border-b border-white/5 text-xs">
                        <span className="text-muted-foreground">Replying to <span className="font-semibold text-white">@{replyToMsg.username}</span></span>
                        <button onClick={() => setReplyToMsg(null)} className="text-muted-foreground hover:text-white"><XIcon size={14} /></button>
                      </div>
                    )}
                    {pendingAttachments.length > 0 && (
                      <div className="p-3 pb-0 flex flex-wrap gap-2">
                        {pendingAttachments.map(att => (
                          <div key={att.id} className="relative group bg-black/40 rounded-xl p-2 w-48 h-48 flex items-center justify-center border border-white/5 shadow-inner">
                            {att.content_type.startsWith('image/') ? (
                              <img src={att.url} className="max-w-full max-h-full rounded-lg object-contain" />
                            ) : (
                              <div className="text-center">
                                <div className="w-12 h-16 bg-white/5 rounded-lg mx-auto mb-2 flex items-center justify-center text-muted-foreground font-bold uppercase text-[10px]">
                                  {att.filename.split('.').pop()}
                                </div>
                                <p className="text-xs text-white truncate w-32">{att.filename}</p>
                              </div>
                            )}
                            <button 
                              onClick={() => removePendingAttachment(att.id)}
                              className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XIcon size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="p-2 pl-3 flex items-center gap-3 relative">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all shrink-0 disabled:opacity-50"
                        title="Upload File / Image"
                      >
                        <Plus size={18} strokeWidth={3} />
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
                          className="bg-transparent border-none ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white text-[15px] p-0 min-h-[40px]" 
                          placeholder={uploading ? "Uploading..." : `Message #${currentChannel.name}`} 
                        />
                      </form>

                      {/* GIF & Emoji Triggers */}
                      <div className="flex items-center gap-1.5 shrink-0 text-white/50">
                        <button
                          type="button"
                          onClick={() => {
                            setGifTarget('channel')
                            setShowGifPicker(!showGifPicker)
                            setShowEmojiPicker(false)
                          }}
                          className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-white/10 hover:bg-white/20 text-white transition-colors"
                          title="Search GIFs"
                        >
                          GIF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmojiTarget('channel')
                            setShowEmojiPicker(!showEmojiPicker)
                            setShowGifPicker(false)
                          }}
                          className="p-1.5 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                          title="Emoji Picker"
                        >
                          <Smile size={18} />
                        </button>
                      </div>

                      {/* Floating Emoji Popover */}
                      {showEmojiPicker && emojiTarget === 'channel' && (
                        <EmojiPickerPopover
                          onSelectEmoji={(emoji) => {
                            setMessageContent(prev => prev + emoji)
                            setShowEmojiPicker(false)
                          }}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      )}

                      {/* Floating GIF Popover */}
                      {showGifPicker && gifTarget === 'channel' && (
                        <GifPickerPopover
                          onSelectGif={(gifUrl) => {
                            setMessageContent(prev => prev ? `${prev} ${gifUrl}` : gifUrl)
                            setShowGifPicker(false)
                          }}
                          onClose={() => setShowGifPicker(false)}
                        />
                      )}
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
                <div className="w-80 obsidian-card flex flex-col absolute right-2.5 top-2.5 bottom-2.5 z-10 shadow-2xl border-none">
                  <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 bg-secondary">
                    <div className="flex items-center gap-1.5 font-bold text-primary">
                      <Pin size={16} className="text-primary fill-primary" />
                      <span className="text-foreground">Pinned Messages</span>
                    </div>
                    <Button variant="ghost" size="icon" className="w-6 h-6 hover:text-white text-muted-foreground" onClick={() => setShowPins(false)}><XIcon size={14} /></Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-sidebar-scrollbar">
                    {pinnedMessages.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground mt-10">No pinned messages yet. Pin messages from the hover toolbar!</div>
                    ) : (
                      pinnedMessages.map((msg: any) => (
                        <div key={msg.id} className="bg-background p-3 rounded shadow-sm border border-border relative group/pin-item text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold uppercase text-foreground border border-border shrink-0 overflow-hidden">
                              {msg.avatar ? (
                                <img src={getFileUrl(msg.avatar)} alt={msg.username} className="w-full h-full object-cover" />
                              ) : (
                                msg.username?.[0] || 'U'
                              )}
                            </div>
                            <span className="font-bold text-xs truncate text-foreground">{msg.username}</span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-auto">{parseUTCDate(msg.created_at).toLocaleDateString()}</span>
                          </div>
                          <MessageContent content={msg.content} attachments={msg.attachments} />
                          <button
                            onClick={() => togglePin(msg.id, true)}
                            className="absolute top-2 right-2 opacity-0 group-hover/pin-item:opacity-100 text-xs text-primary hover:underline transition-opacity"
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
                  <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 bg-secondary">
                    <span className="font-bold text-foreground">Search Results</span>
                    <Button variant="ghost" size="icon" className="w-6 h-6 hover:text-white text-muted-foreground" onClick={() => { setMsgSearchResults([]); setMessageSearchQuery(''); setShowMsgSearchResults(false); }}><XIcon size={14} /></Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isSearching ? (
                      <p className="text-muted-foreground text-center mt-10">Searching...</p>
                    ) : msgSearchResults.length === 0 ? (
                      <p className="text-muted-foreground text-center mt-10">No results found.</p>
                    ) : (
                      msgSearchResults.map((msg: any) => (
                        <div key={msg.id} className="bg-background p-3 rounded hover:bg-secondary/40 cursor-pointer shadow-sm border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold uppercase text-foreground border border-border shrink-0 overflow-hidden">
                              {msg.avatar ? (
                                <img src={getFileUrl(msg.avatar)} alt={msg.username} className="w-full h-full object-cover" />
                              ) : (
                                msg.username?.[0] || '?'
                              )}
                            </div>
                            <span className="font-bold text-sm truncate text-foreground">{msg.username}</span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">in #{msg.channel_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground break-words line-clamp-3">{msg.content}</p>
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
            <div className="h-12 border-b border-border flex items-center justify-between px-4 shadow-sm shrink-0 bg-background">
              <div className="flex items-center min-w-0">
                <button 
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden p-1 mr-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                >
                  <Menu size={24} />
                </button>
                <Volume2 size={24} className="text-muted-foreground mr-1 shrink-0" />
                <span className="font-bold truncate">{currentChannel.name}</span>
              </div>
            </div>
            {isJoined ? (
              (() => {
            const focusedParticipant = allParticipants.find(p => p.id === focusedParticipantId);
            const otherParticipants = allParticipants.filter(p => p.id !== focusedParticipantId);

            const renderInviteCard = () => {
              return (
                <div className="aspect-video bg-background rounded-[8px] flex flex-col items-center justify-center p-6 relative overflow-hidden border border-border border-dashed shadow group">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <svg width="100" height="75" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground opacity-70 group-hover:scale-105 transition-transform duration-300">
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
                      <span className="text-xs text-muted-foreground">Invite friends to join this voice call!</span>
                      <button 
                        onClick={() => setShowInviteModal(true)} 
                        className="bg-primary hover:bg-primary/80 text-white font-semibold text-xs px-4 py-2 rounded-[3px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
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
                className="flex-1 flex flex-col bg-background relative group/voice"
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
                            <div className="w-full max-w-5xl flex items-center justify-center gap-3 overflow-x-auto py-2 px-4 bg-background/60 rounded-[8px] shrink-0 no-scrollbar">
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
                      <div className="bg-background/95 backdrop-blur-md px-4 py-2.5 rounded-[8px] flex items-center gap-3 shadow-2xl border border-border">
                        {/* Mute Mic */}
                        <button 
                          onClick={toggleAudio}
                          className={`p-3 rounded-full transition-all ${
                            !isAudioEnabled 
                              ? 'bg-destructive/20 text-destructive hover:bg-destructive hover:text-white' 
                              : 'bg-card text-foreground hover:bg-secondary hover:text-white'
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
                              ? 'bg-destructive/20 text-destructive hover:bg-destructive hover:text-white' 
                              : 'bg-card text-foreground hover:bg-secondary hover:text-white'
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
                              ? 'bg-primary text-white hover:bg-primary/80' 
                              : 'bg-card text-foreground hover:bg-secondary hover:text-white'
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
                              ? 'bg-primary text-white hover:bg-primary/80' 
                              : 'bg-card text-foreground hover:bg-secondary hover:text-white'
                          }`}
                          title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
                        >
                          <MonitorUp size={18} />
                        </button>

                        {/* Vertical Divider */}
                        <div className="w-[1px] h-6 bg-secondary" />

                        {/* Disconnect Button */}
                        <button 
                          onClick={handleLeaveVoice}
                          className="bg-destructive text-white hover:bg-destructive/80 p-3 px-5 rounded-[8px] transition-all flex items-center justify-center shadow"
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
                  if (p.user_id === user?.id) return !!activeVoiceChannel
                  return true
                })
                return (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-card">
                    <Volume2 size={64} className="text-primary mb-4 opacity-80" />
                    <h1 className="text-3xl font-extrabold text-foreground mb-2">{targetChannel.name}</h1>
                    
                    {activeParticipants.length === 0 ? (
                      <p className="text-muted-foreground text-sm mb-8">No one is currently in voice</p>
                    ) : (
                      <div className="flex flex-col items-center gap-3 mb-8">
                        <div className="flex -space-x-2">
                          {activeParticipants.map(p => (
                            <div 
                              key={p.user_id} 
                              className="w-10 h-10 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-xs font-bold uppercase text-foreground shadow overflow-hidden"
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
                        <p className="text-foreground text-sm font-medium">
                          {activeParticipants.length} {
                            activeParticipants.length === 1 ? "person is" : "people are"
                          } currently in voice
                        </p>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => handleJoinVoice(targetChannel)} 
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-3 rounded-full transition-all shadow-xl text-sm cursor-pointer"
                    >
                      Join Voice
                    </button>
                  </div>
                )
              })()
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col h-full items-center justify-center bg-transparent text-center p-8 relative">
            <div className="md:hidden h-[60px] border-b border-white/5 flex items-center px-4 shadow-sm shrink-0 w-full absolute top-0 left-0 bg-black/20 backdrop-blur-md z-10">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="p-1 text-muted-foreground hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <Menu size={24} />
              </button>
              <span className="ml-2 font-extrabold text-white display-font text-lg tracking-tight">Suhhp</span>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full md:mt-0 mt-[60px] shadow-2xl backdrop-blur-md">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-inner">
                <MessageSquare size={32} className="text-white/50" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 display-font">Ready to connect?</h3>
              <p className="text-muted-foreground text-sm">Select a conversation or a channel to start talking with your community.</p>
            </div>
          </div>
        )}
      </div>

      {/* Members Sidebar */}
      {activeTab === 'server' && currentServer && currentChannel?.type === 'text' && (
        <div className="hidden md:flex w-64 bg-black/20 backdrop-blur-2xl flex flex-col overflow-hidden shrink-0 border-l border-white/5 z-10">
          <div className="h-[60px] border-b border-white/5 flex items-center px-4 shadow-sm shrink-0 bg-transparent">
            <Users size={20} className="text-muted-foreground mr-2" />
            <span className="font-bold text-white text-lg display-font">Members</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 no-scrollbar space-y-4">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground mb-2 px-1">Online — {members.length}</p>
              <div className="space-y-1">
                {members.map(member => {
                  const isServerOwner = currentServer?.owner_id === member.id;
                  const memberRole = (serverRoles || []).find((r: any) => r.id === member.role_id);
                  return (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer group transition-all" onClick={() => setSelectedUserProfileId(member.id)}>
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold uppercase text-white border border-white/10 shadow-inner overflow-hidden">
                          {member.avatar ? (
                            <img src={getFileUrl(member.avatar)} alt={member.username} className="w-full h-full object-cover" />
                          ) : (
                            member.username[0]
                          )}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${getStatusColor(member.status)}`} />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[13px] font-semibold text-white group-hover:text-primary transition-colors truncate">
                            {member.display_name || member.username}
                          </span>
                          {isServerOwner && (
                            <span title="Server Owner" className="flex items-center">
                              <Crown size={14} className="text-amber-400 fill-amber-400/20 shrink-0 ml-0.5" />
                            </span>
                          )}
                          {!isServerOwner && memberRole && (
                            <span 
                              className="text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider border shrink-0 bg-white/5 text-white/80 border-white/10"
                            >
                              {memberRole.name}
                            </span>
                          )}
                        </div>
                        {member.status_message && <span className="text-[11px] text-white/50 truncate">{member.status_message}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DM User Profile Sidebar */}
      {activeTab === 'home' && activeHomeView === 'dm' && activeDmId && showDmProfile && dmUserProfile && (
        <div className="w-72 bg-black/20 backdrop-blur-2xl flex flex-col overflow-hidden shrink-0 border-l border-white/5 select-none text-left z-10">
          {/* Header block (non-scrollable) to prevent avatar clipping */}
          <div className="relative shrink-0">
            <div className="h-[120px] bg-gradient-to-r from-primary to-indigo-500 opacity-80" />
            <div className="px-5 -mt-12 mb-2">
              <div className="w-[100px] h-[100px] rounded-full bg-black/40 backdrop-blur-md p-1.5 relative z-10">
                <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center text-4xl font-bold uppercase text-white shadow-inner border border-white/10 overflow-hidden">
                  {dmUserProfile.avatar ? (
                    <img src={getFileUrl(dmUserProfile.avatar)} alt={dmUserProfile.username} className="w-full h-full object-cover" />
                  ) : (
                    dmUserProfile.username[0]
                  )}
                </div>
                {dmUserProfile.status && (
                  <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-[3px] border-black ${getStatusColor(dmUserProfile.status)} shadow-lg`} />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 pt-2 relative flex flex-col custom-sidebar-scrollbar min-h-0">
            {/* Profile Info block */}
            <div className="bg-white/5 p-5 rounded-2xl space-y-5 shadow-inner border border-white/5 backdrop-blur-sm">
              <div>
                <h2 className="text-xl font-bold text-white leading-tight flex items-center gap-1.5 display-font">
                  {dmUserProfile.display_name || dmUserProfile.username}
                </h2>
                <p className="text-sm text-muted-foreground">@{dmUserProfile.username}</p>
              </div>

              {dmUserProfile.status_message && (
                <div className="border-t border-white/5 pt-4">
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1.5">Custom Status</p>
                  <p className="text-sm text-white italic">"{dmUserProfile.status_message}"</p>
                </div>
              )}

              {dmUserProfile.bio && (
                <div className="border-t border-white/5 pt-4">
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1.5">About Me</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{dmUserProfile.bio}</p>
                </div>
              )}

              {dmUserProfile.created_at && (
                <div className="border-t border-white/5 pt-4">
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1.5">Member Since</p>
                  <p className="text-sm text-white">
                    {parseUTCDate(dmUserProfile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}

              <div className="border-t border-white/5 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-white hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors cursor-pointer">
                  <span className="font-semibold">Mutual Servers</span>
                  <span className="text-muted-foreground font-medium">{(dmUserProfile as any).mutual_servers || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-white hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors cursor-pointer">
                  <span className="font-semibold">Mutual Friends</span>
                  <span className="text-muted-foreground font-medium">{(dmUserProfile as any).mutual_friends || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 shrink-0">
            <button 
              onClick={() => setSelectedUserProfileId(dmUserProfile.id)}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              View Full Profile
            </button>
          </div>
        </div>
      )}

      </div>
      </div>



      {/* Modals... */}
      {showCreateServerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-popover w-full max-w-md rounded-xl overflow-hidden shadow-2xl border border-border p-6 text-center">
            <h2 className="text-2xl font-bold mb-2 text-foreground">Customize your server</h2>
            <form onSubmit={handleCreateServer} className="text-left space-y-4">
              <Input autoFocus value={newServerName} onChange={(e) => setNewServerName(e.target.value)} className="bg-background border border-border text-foreground focus-visible:ring-primary" placeholder={`${user?.username}'s server`} />
              <div className="flex justify-between pt-4"><Button variant="ghost" type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setShowCreateServerModal(false)}>Back</Button><Button type="submit" className="bg-primary text-white hover:bg-primary/80 font-bold">Create</Button></div>
            </form>
          </div>
        </div>
      )}
      {showCreateChannelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-popover w-full max-w-md rounded-xl p-6 shadow-2xl border border-border">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Create Channel</h2>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div onClick={() => setNewChannelType('text')} className={`p-3 rounded-lg bg-background cursor-pointer border-2 flex items-center gap-2 text-foreground ${newChannelType === 'text' ? 'border-primary' : 'border-border'}`}><Hash size={16} /> Text</div>
                <div onClick={() => setNewChannelType('voice')} className={`p-3 rounded-lg bg-background cursor-pointer border-2 flex items-center gap-2 text-foreground ${newChannelType === 'voice' ? 'border-primary' : 'border-border'}`}><Volume2 size={16} /> Voice</div>
              </div>
              <Input autoFocus value={newChannelName} onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))} className="bg-background border border-border text-foreground focus-visible:ring-primary" placeholder="new-channel" />
              <div className="flex justify-end pt-4 gap-4"><Button variant="ghost" type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setShowCreateChannelModal(false)}>Cancel</Button><Button type="submit" className="bg-primary text-white hover:bg-primary/80 font-bold">Create Channel</Button></div>
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

      {/* Quick Switcher Modal (Ctrl + K / Cmd + K) */}
      <QuickSwitcherModal
        isOpen={showQuickSwitcher}
        onClose={() => setShowQuickSwitcher(false)}
        dms={dms}
        friends={friends}
        servers={servers}
        onSelectDm={(dmId) => {
          setActiveTab('home')
          setActiveHomeView('dm')
          setActiveDmId(dmId)
        }}
        onSelectFriend={() => {
          setActiveTab('home')
          setActiveHomeView('friends')
          setActiveDmId(null)
        }}
        onSelectChannel={(serverId, channelId) => {
          const targetServer = servers.find(s => s.id === serverId)
          if (targetServer) {
            setCurrentServer(targetServer)
            setActiveTab('server')
            const targetChan = (targetServer as any).channels?.find((c: any) => c.id === channelId)
            if (targetChan) {
              setCurrentChannel(targetChan)
            }
          }
        }}
      />

      {/* Instant Image Lightbox Modal */}
      <ImageLightboxModal
        imageUrl={selectedLightboxImage}
        onClose={() => setSelectedLightboxImage(null)}
      />

      {selectedUserProfileId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUserProfileId(null)}>
          <div className="bg-popover w-full max-w-[340px] rounded-xl overflow-hidden shadow-2xl border border-border relative text-left" onClick={e => e.stopPropagation()}>
            {userProfileData && !(!userProfileData.username && userProfileData.isLoading) ? (
              <>
                {/* Header block (non-scrollable) to prevent avatar clipping */}
                <div className="relative shrink-0">
                  <div className="h-16 bg-primary" />
                  <div className="px-4 -mt-8 mb-2">
                    <div className="w-16 h-16 rounded-full bg-popover p-1 relative z-10">
                      <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-2xl font-bold uppercase text-foreground border border-border shadow-md overflow-hidden">
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
                      <h3 className="text-lg font-bold text-foreground leading-tight">{userProfileData.display_name || userProfileData.username}</h3>
                      <p className="text-xs text-muted-foreground">@{userProfileData.username}</p>
                    </div>
                    
                    {userProfileData.status_message && (
                      <div className="bg-background p-2 rounded border border-border text-xs text-white">
                        <p className="text-muted-foreground text-[10px] font-bold uppercase mb-0.5">Custom Status</p>
                        <p className="italic text-foreground">"{userProfileData.status_message}"</p>
                      </div>
                    )}

                    <div className="bg-background p-3 rounded border border-border space-y-2.5">
                      <div>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase">About Me</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {userProfileData.isLoading && !userProfileData.bio 
                            ? "Loading bio..." 
                            : (userProfileData.bio || "No bio yet.")}
                        </p>
                      </div>
                    </div>

                    {selectedUserProfileId !== user?.id && (
                      <div className="bg-background p-3 rounded-xl border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase text-white/80 tracking-wider">User Volume</label>
                          <span className="text-xs text-primary font-bold">{Math.round((userVolumes[selectedUserProfileId] ?? 1.0) * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Volume2 size={16} className="text-white/60 shrink-0" />
                          <input 
                            type="range" 
                            min="0" 
                            max="2" 
                            step="0.05"
                            value={userVolumes[selectedUserProfileId] ?? 1.0}
                            onChange={(e) => setUserVolume(selectedUserProfileId, parseFloat(e.target.value))}
                            className="w-full accent-primary bg-secondary h-2 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading profile...</div>
            )}
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white/75 hover:text-white rounded-full bg-black/20 hover:bg-black/40 h-7 w-7" onClick={() => setSelectedUserProfileId(null)}>
              <XIcon size={14} />
            </Button>
          </div>
        </div>
      )}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-popover p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm w-full border border-border">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-3xl font-bold uppercase text-foreground border border-border mb-4 shadow-lg animate-bounce">
              {incomingCall.callerName[0]}
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">{incomingCall.callerName}</h3>
            <p className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5 animate-pulse">
              Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call...
            </p>
            <div className="flex gap-4 w-full">
              <button 
                onClick={declineCall}
                className="flex-1 py-3 bg-destructive/20 text-destructive hover:bg-destructive hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
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
                className="flex-1 py-3 bg-emerald-500 text-white hover:bg-emerald-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg animate-pulse"
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
          <div className="bg-popover p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm w-full border border-border">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-3xl font-bold uppercase text-foreground border border-border mb-4 shadow-lg animate-pulse">
              {outgoingCall.targetName[0]}
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">Calling {outgoingCall.targetName}</h3>
            <p className="text-sm text-muted-foreground mb-8 animate-pulse">Ringing...</p>
            <button 
              onClick={cancelCall}
              className="w-full py-3 bg-destructive/20 text-destructive hover:bg-destructive hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <PhoneOff size={18} />
              Cancel Call
            </button>
          </div>
        </div>
      )}

      {/* Real-time Picture-in-Picture Video Overlay (only shown when navigated away from voice view) */}
      {isJoined && activeVoiceChannel && !(activeTab === 'server' && currentChannel?.id === activeVoiceChannel?.id && currentChannel?.type === 'voice') && (
        <PipVideoOverlay
          channelName={activeVoiceChannel.name}
          participants={allParticipants}
          isMuted={!isAudioEnabled}
          isDeafened={isDeafened}
          onToggleMute={toggleAudio}
          onToggleDeafen={toggleDeafen}
          onDisconnect={handleLeaveVoice}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-popover text-foreground px-4 py-2.5 rounded-lg shadow-2xl font-semibold border border-border z-[110] animate-in slide-in-from-bottom duration-200">
          {toast}
        </div>
      )}
    </div>
  )
}

function RemoteStream({ stream, peerId }: { stream: MediaStream; peerId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const { outputVolume, userVolumes, outputDeviceId } = useAudioStore()

  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = stream
  }, [stream])

  useEffect(() => {
    if (audioRef.current) {
      const actualUserId = peerId.replace('-screen', '')
      const userVol = userVolumes[actualUserId] ?? 1.0
      audioRef.current.volume = Math.max(0, Math.min(1.0, outputVolume * userVol))
    }
  }, [outputVolume, userVolumes, peerId])

  useEffect(() => {
    const audio = audioRef.current
    if (audio && (audio as any).setSinkId && outputDeviceId && outputDeviceId !== 'default') {
      (audio as any).setSinkId(outputDeviceId).catch((err: any) => {
        console.error("Failed to set audio sink ID:", err)
      })
    }
  }, [outputDeviceId])

  return <audio ref={audioRef} autoPlay />
}

function formatMessageTimestamp(dateInput: string | Date) {
  const date = parseUTCDate(dateInput);
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  
  if (msgDate.getTime() === today.getTime()) {
    return `Today at ${timeStr}`;
  } else if (msgDate.getTime() === yesterday.getTime()) {
    return `Yesterday at ${timeStr}`;
  } else {
    return `${date.toLocaleDateString()} ${timeStr}`;
  }
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
  onImageClick?: (url: string) => void;
  isGrouped?: boolean;
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
  onProfileClick,
  onImageClick,
  isGrouped = false
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
    <div className={`flex flex-col group message-group-container relative hover:bg-white/5 -mx-4 px-4 transition-colors duration-100 ease-in-out ${isGrouped ? 'py-[1px] mt-0' : 'py-1 mt-3'}`}>
      {/* Reply header */}
      {msg.reply_to_id && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-14 mb-1 select-none">
          <CornerUpLeft size={12} className="rotate-180 text-muted-foreground shrink-0" />
          <span className="font-bold text-white">@{msg.reply_username}</span>
          <span className="truncate max-w-[240px] opacity-75">{msg.reply_content}</span>
        </div>
      )}

      <div className="flex gap-4">
        {isGrouped ? (
          /* Gutter placeholder with hover timestamp */
          <div className="w-10 shrink-0 select-none flex items-center justify-center text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 pr-1 font-medium h-4 mt-0.5">
            {parseUTCDate(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?[AP]M$/i, '')}
          </div>
        ) : (
          /* Avatar */
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5 uppercase font-bold text-white shadow-inner border border-white/10 cursor-pointer hover:opacity-85 overflow-hidden" onClick={() => onProfileClick?.(msg.author_id)}>
            {msg.avatar ? (
              <img src={getFileUrl(msg.avatar)} alt={msg.username} className="w-full h-full object-cover" />
            ) : (
              msg.username?.[0] || 'U'
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {!isGrouped && (
            <div className="flex items-baseline gap-2">
              <span 
                className="font-bold hover:underline cursor-pointer text-[15px]" 
                style={{ color: msg.role_color || '#ffffff' }}
                onClick={() => onProfileClick?.(msg.author_id)}
              >
                {msg.username}
              </span>
              <span className="text-[12px] font-medium text-muted-foreground">
                {formatMessageTimestamp(msg.created_at)}
              </span>
              {msg.is_pinned === 1 && (
                <span title="Pinned">
                  <Pin size={10} className="text-primary fill-primary shrink-0" />
                </span>
              )}
            </div>
          )}

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
                className="w-full bg-black/40 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary border border-white/10"
              />
              <span className="text-[10px] text-muted-foreground">
                escape to <span className="text-rose-500 hover:underline cursor-pointer" onClick={onEditCancel}>cancel</span> • enter to <span className="text-emerald-500 hover:underline cursor-pointer" onClick={() => onEditSubmit(msg.id, editingContent)}>save</span>
              </span>
            </div>
          ) : (
            <div className="text-[15px] text-white flex flex-col gap-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <MessageContent content={msg.content} attachments={msg.attachments} onImageClick={onImageClick} />
                {msg.edited_at && (
                  <span className="text-[10px] text-muted-foreground select-none">(edited)</span>
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
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-colors cursor-pointer backdrop-blur-md shadow-sm ${
                    r.hasReacted 
                      ? 'bg-primary/20 border-primary/50 text-white hover:bg-primary/30' 
                      : 'bg-black/20 border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white hover:border-white/20'
                  }`}
                  title={r.users.join(', ')}
                >
                  <span>{r.emoji}</span>
                  <span className="font-bold text-white">{r.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Toolbar on Hover */}
      {!isEditing && (
        <div className="absolute right-4 -top-3.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg flex items-center p-0.5 opacity-0 group-hover:opacity-100 message-hover-toolbar transition-opacity z-10">
          {/* Reaction Picker Icon */}
          <div className="relative">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 hover:bg-white/10 text-muted-foreground hover:text-white rounded transition-colors cursor-pointer"
              title="Add Reaction"
            >
              <Smile size={16} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-8 right-0 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl p-2 z-50 flex gap-2 w-48 flex-wrap justify-center">
                {['👍', '❤️', '🔥', '🎉', '😂', '😢', '😮', '🙏'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => {
                      const hasReacted = groupedReactions[emoji]?.hasReacted || false;
                      onReact(msg.id, emoji, hasReacted);
                      setShowEmojiPicker(false);
                    }}
                    className="hover:scale-125 hover:bg-white/10 rounded p-1 transition-all text-lg cursor-pointer animate-in fade-in zoom-in-50 duration-75"
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
            className="p-1.5 hover:bg-white/10 text-muted-foreground hover:text-white rounded transition-colors cursor-pointer"
            title="Reply"
          >
            <CornerUpLeft size={16} />
          </button>

          {/* Pin */}
          <button 
            onClick={() => onTogglePin(msg.id, msg.is_pinned === 1)}
            className={`p-1.5 hover:bg-white/10 rounded transition-colors cursor-pointer ${
              msg.is_pinned === 1 ? 'text-primary' : 'text-muted-foreground hover:text-white'
            }`}
            title={msg.is_pinned === 1 ? "Unpin Message" : "Pin Message"}
          >
            <Pin size={16} className={msg.is_pinned === 1 ? 'fill-primary' : ''} />
          </button>

          {/* Edit / Delete (for authors) */}
          {isAuthor && (
            <>
              <button 
                onClick={() => onEditStart(msg.id, msg.content)}
                className="p-1.5 hover:bg-white/10 text-muted-foreground hover:text-white rounded transition-colors cursor-pointer"
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
                className="p-1.5 hover:bg-white/10 text-rose-500 rounded transition-colors cursor-pointer"
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
