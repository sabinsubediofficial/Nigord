import { create } from 'zustand'
import { useServerStore } from './useServerStore'

export interface Channel {
  id: string
  server_id: string
  name: string
  type: 'text' | 'voice'
}

const loadCache = (): Record<string, Channel[]> => {
  try {
    const data = localStorage.getItem('nigord_channels_cache')
    return data ? JSON.parse(data) : {}
  } catch (e) {
    return {}
  }
}

const saveCache = (cache: Record<string, Channel[]>) => {
  try {
    localStorage.setItem('nigord_channels_cache', JSON.stringify(cache))
  } catch (e) {}
}

interface ChannelState {
  channels: Channel[]
  currentChannel: Channel | null
  channelsCache: Record<string, Channel[]>
  setChannels: (channels: Channel[]) => void
  setCurrentChannel: (channel: Channel | null) => void
  addChannel: (channel: Channel) => void
  cacheChannels: (serverId: string, channels: Channel[]) => void
  clearCache: () => void
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  currentChannel: null,
  channelsCache: loadCache(),
  setChannels: (channels) => set((state) => {
    const nextCache = { ...state.channelsCache };
    const activeServerId = useServerStore.getState().currentServer?.id;
    if (activeServerId) {
      nextCache[activeServerId] = channels;
      saveCache(nextCache);
    }
    return { channels, channelsCache: nextCache };
  }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  addChannel: (channel) => set((state) => {
    const nextChannels = [...state.channels, channel];
    const serverId = channel.server_id;
    const nextCache = { ...state.channelsCache, [serverId]: nextChannels };
    saveCache(nextCache);
    return { 
      channels: nextChannels, 
      channelsCache: nextCache 
    };
  }),
  cacheChannels: (serverId, channels) => set((state) => {
    const nextCache = { ...state.channelsCache, [serverId]: channels };
    saveCache(nextCache);
    return { channelsCache: nextCache };
  }),
  clearCache: () => set(() => {
    try {
      localStorage.removeItem('nigord_channels_cache')
    } catch (e) {}
    return { channelsCache: {} };
  }),
}))
