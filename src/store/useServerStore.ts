import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Server {
  id: string
  name: string
  owner_id: string
  icon?: string | null
  banner?: string | null
}

interface ServerState {
  servers: Server[]
  currentServer: Server | null
  isLoading: boolean
  setServers: (servers: Server[]) => void
  setCurrentServer: (server: Server | null) => void
  addServer: (server: Server) => void
  setIsLoading: (isLoading: boolean) => void
}

export const useServerStore = create<ServerState>()(
  persist(
    (set) => ({
      servers: [],
      currentServer: null,
      isLoading: false,
      setServers: (servers) => set({ servers }),
      setCurrentServer: (server) => set({ currentServer: server }),
      addServer: (server) => set((state) => ({ servers: [...state.servers, server] })),
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'suhhp_server_state',
    }
  )
)
