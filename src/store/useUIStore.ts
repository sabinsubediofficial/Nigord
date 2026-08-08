import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Modal visibility
  showUserSettingsModal: boolean
  userSettingsSubTab: 'account' | 'profile' | 'voice'
  showServerSettingsModal: boolean
  serverSettingsTab: 'overview' | 'roles' | 'members'
  showQuickSwitcher: boolean
  selectedLightboxImage: string | null
  showInviteModal: boolean
  showChannelSettingsModal: boolean
  showCreateServerModal: boolean
  showCreateChannelModal: boolean
  
  // Navigation & View Layout
  activeTab: 'home' | 'server'
  activeHomeView: 'friends' | 'dm'
  activeDmId: string | null
  friendsTab: 'online' | 'all' | 'pending' | 'add'
  mobileMenuOpen: boolean
  rightSidebarOpen: boolean
  messageSearchQuery: string

  // Setters & Actions
  setShowUserSettingsModal: (show: boolean) => void
  setUserSettingsSubTab: (subTab: 'account' | 'profile' | 'voice') => void
  setShowServerSettingsModal: (show: boolean) => void
  setServerSettingsTab: (tab: 'overview' | 'roles' | 'members') => void
  setShowQuickSwitcher: (show: boolean) => void
  setSelectedLightboxImage: (image: string | null) => void
  setShowInviteModal: (show: boolean) => void
  setShowChannelSettingsModal: (show: boolean) => void
  setShowCreateServerModal: (show: boolean) => void
  setShowCreateChannelModal: (show: boolean) => void
  
  setActiveTab: (tab: 'home' | 'server') => void
  setActiveHomeView: (view: 'friends' | 'dm') => void
  setActiveDmId: (dmId: string | null) => void
  setFriendsTab: (tab: 'online' | 'all' | 'pending' | 'add') => void
  setMobileMenuOpen: (open: boolean) => void
  setRightSidebarOpen: (open: boolean) => void
  setMessageSearchQuery: (query: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      showUserSettingsModal: false,
      userSettingsSubTab: 'account',
      showServerSettingsModal: false,
      serverSettingsTab: 'overview',
      showQuickSwitcher: false,
      selectedLightboxImage: null,
      showInviteModal: false,
      showChannelSettingsModal: false,
      showCreateServerModal: false,
      showCreateChannelModal: false,

      activeTab: 'home',
      activeHomeView: 'friends',
      activeDmId: null,
      friendsTab: 'online',
      mobileMenuOpen: false,
      rightSidebarOpen: true,
      messageSearchQuery: '',

      setShowUserSettingsModal: (show) => set({ showUserSettingsModal: show }),
      setUserSettingsSubTab: (subTab) => set({ userSettingsSubTab: subTab }),
      setShowServerSettingsModal: (show) => set({ showServerSettingsModal: show }),
      setServerSettingsTab: (tab) => set({ serverSettingsTab: tab }),
      setShowQuickSwitcher: (show) => set({ showQuickSwitcher: show }),
      setSelectedLightboxImage: (image) => set({ selectedLightboxImage: image }),
      setShowInviteModal: (show) => set({ showInviteModal: show }),
      setShowChannelSettingsModal: (show) => set({ showChannelSettingsModal: show }),
      setShowCreateServerModal: (show) => set({ showCreateServerModal: show }),
      setShowCreateChannelModal: (show) => set({ showCreateChannelModal: show }),

      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveHomeView: (view) => set({ activeHomeView: view }),
      setActiveDmId: (dmId) => set({ activeDmId: dmId }),
      setFriendsTab: (tab) => set({ friendsTab: tab }),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
      setMessageSearchQuery: (query) => set({ messageSearchQuery: query }),
    }),
    {
      name: 'suhhp_ui_state',
    }
  )
)
