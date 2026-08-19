import { useAudioStore } from "@/store/useAudioStore"

export type SoundEffect =
  | 'new-message'
  | 'incoming-user'
  | 'user-leave'
  | 'deconnected'
  | 'muted'
  | 'non-muted'
  | 'deaf'
  | 'non-deaf'
  | 'stream-started'
  | 'stream-ended'
  | 'incoming-ring'
  | 'outgoing-ring'
  | 'user-moved'

const SOUND_PATHS: Record<SoundEffect, string> = {
  'new-message': '/sounds/new-message.mp3',
  'incoming-user': '/sounds/incoming-user.mp3',
  'user-leave': '/sounds/user-leave.mp3',
  'deconnected': '/sounds/deconnected.mp3',
  'muted': '/sounds/muted.mp3',
  'non-muted': '/sounds/non-muted.mp3',
  'deaf': '/sounds/deaf.mp3',
  'non-deaf': '/sounds/non-deaf.mp3',
  'stream-started': '/sounds/stream-started.mp3',
  'stream-ended': '/sounds/stream-ended.mp3',
  'incoming-ring': '/sounds/incoming-ring.mp3',
  'outgoing-ring': '/sounds/outgoing-ring.mp3',
  'user-moved': '/sounds/user-moved.mp3',
}

let activeRingtone: HTMLAudioElement | null = null

/**
 * Plays a UI sound effect respecting master output volume and device routing.
 */
export function playSoundEffect(effect: SoundEffect, customVolume?: number): HTMLAudioElement {
  const path = SOUND_PATHS[effect] || `/sounds/${effect}.mp3`
  const audio = new Audio(path)
  
  try {
    const { outputVolume, outputDeviceId } = useAudioStore.getState()
    const vol = typeof customVolume === 'number' ? customVolume : outputVolume
    audio.volume = Math.max(0, Math.min(1, vol))

    if (outputDeviceId && outputDeviceId !== 'default' && 'setSinkId' in audio) {
      (audio as any).setSinkId(outputDeviceId).catch(() => {})
    }
  } catch (e) {
    // Fallback gracefully
  }

  audio.play().catch(() => {
    // Silently ignore browser autoplay restrictions
  })

  return audio
}

/**
 * Starts looping a ringtone (incoming or outgoing call).
 */
export function startCallRingtone(type: 'incoming' | 'outgoing'): void {
  stopCallRingtone()
  const soundName: SoundEffect = type === 'incoming' ? 'incoming-ring' : 'outgoing-ring'
  const path = SOUND_PATHS[soundName]
  const audio = new Audio(path)
  audio.loop = true

  try {
    const { outputVolume, outputDeviceId } = useAudioStore.getState()
    audio.volume = Math.max(0, Math.min(1, outputVolume))

    if (outputDeviceId && outputDeviceId !== 'default' && 'setSinkId' in audio) {
      (audio as any).setSinkId(outputDeviceId).catch(() => {})
    }
  } catch (e) {
    // Fallback gracefully
  }

  audio.play().catch(() => {})
  activeRingtone = audio
}

/**
 * Stops any currently playing call ringtone.
 */
export function stopCallRingtone(): void {
  if (activeRingtone) {
    try {
      activeRingtone.pause()
      activeRingtone.currentTime = 0
    } catch (e) {}
    activeRingtone = null
  }
}
