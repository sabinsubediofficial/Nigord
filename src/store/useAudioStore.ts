import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AudioState {
  micVolume: number // 0 to 1
  outputVolume: number // 0 to 1
  userVolumes: Record<string, number> // maps userId -> volume (0 to 2)
  inputDeviceId: string
  outputDeviceId: string
  setMicVolume: (vol: number) => void
  setOutputVolume: (vol: number) => void
  setUserVolume: (userId: string, vol: number) => void
  setInputDeviceId: (id: string) => void
  setOutputDeviceId: (id: string) => void
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      micVolume: 1.0,
      outputVolume: 1.0,
      userVolumes: {},
      inputDeviceId: 'default',
      outputDeviceId: 'default',
      setMicVolume: (micVolume) => set({ micVolume }),
      setOutputVolume: (outputVolume) => set({ outputVolume }),
      setUserVolume: (userId, vol) =>
        set((state) => ({
          userVolumes: { ...state.userVolumes, [userId]: vol },
        })),
      setInputDeviceId: (inputDeviceId) => set({ inputDeviceId }),
      setOutputDeviceId: (outputDeviceId) => set({ outputDeviceId }),
    }),
    {
      name: 'suhhp_audio_settings',
    }
  )
)
