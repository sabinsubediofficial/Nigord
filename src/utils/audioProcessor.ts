/**
 * Open-Source Audio DSP Voice Processing & Noise Gate Engine
 * Implements:
 * 1. High-Pass Filter (removes sub-85Hz mechanical vibration, room resonance, and AC hum)
 * 2. Voice Clarity Peaking Filter (boosts speech intelligibility in 2.5kHz-3.5kHz band)
 * 3. Low-Pass Anti-Aliasing Filter (filters out high frequency hiss > 8500Hz)
 * 4. Fast Dynamics Compressor (prevents vocal clipping and evens out dynamic range)
 * 5. Intelligent Noise Gate (dynamic envelope follower with fast attack, 280ms hold, and smooth release)
 */

export interface VoiceProcessorOptions {
  enableNoiseGate?: boolean;
  noiseGateThreshold?: number; // dB (-60 to -24)
  enableHighPass?: boolean;
  enableVoicePresence?: boolean;
  enableCompressor?: boolean;
  micGain?: number;
}

export interface VoiceProcessorInstance {
  destinationStream: MediaStream;
  gainNode: GainNode;
  gateGainNode: GainNode;
  analyserNode: AnalyserNode;
  setThreshold: (dB: number) => void;
  setNoiseGateEnabled: (enabled: boolean) => void;
  cleanup: () => void;
}

export function createVoiceProcessor(
  audioCtx: AudioContext,
  sourceStream: MediaStream,
  options: VoiceProcessorOptions = {}
): VoiceProcessorInstance {
  const {
    enableNoiseGate = true,
    noiseGateThreshold = -48,
    enableHighPass = true,
    enableVoicePresence = true,
    enableCompressor = true,
    micGain = 1.0
  } = options;

  const source = audioCtx.createMediaStreamSource(sourceStream);

  // 1. High-pass filter: Cuts sub-85Hz background rumblings, computer fan vibration, desk taps
  const highpass = audioCtx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = enableHighPass ? 85 : 10;
  highpass.Q.value = 0.707;

  // 2. Voice Presence filter: 2.8kHz peaking filter to keep vocal harmonics clear and isolated
  const presence = audioCtx.createBiquadFilter();
  presence.type = 'peaking';
  presence.frequency.value = 2800;
  presence.gain.value = enableVoicePresence ? 2.5 : 0;
  presence.Q.value = 1.0;

  // 3. Low-pass filter: Eliminates ultra-high frequency hiss, coil whine, electrical interference
  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 8500;
  lowpass.Q.value = 0.707;

  // 4. Dynamics Compressor: Smooth vocal leveler
  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 10;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.15;

  // 5. User Gain Node
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = micGain;

  // 6. Noise Gate Gain & Analyser
  const gateGainNode = audioCtx.createGain();
  gateGainNode.gain.value = 1.0;

  const analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 512;
  analyserNode.smoothingTimeConstant = 0.15;

  // Connect Audio Pipeline:
  source.connect(highpass);
  highpass.connect(presence);
  presence.connect(lowpass);

  if (enableCompressor) {
    lowpass.connect(compressor);
    compressor.connect(gainNode);
  } else {
    lowpass.connect(gainNode);
  }

  gainNode.connect(gateGainNode);
  gainNode.connect(analyserNode); // Feed analyser to evaluate speech energy

  const destination = audioCtx.createMediaStreamDestination();
  gateGainNode.connect(destination);

  // Noise Gate Tracking Loop
  let gateEnabled = enableNoiseGate;
  let currentThresholdDb = noiseGateThreshold;
  let linearThreshold = Math.pow(10, currentThresholdDb / 20) * 128;

  let isGated = false;
  let lastSpokeTime = Date.now();
  let animId: number | null = null;
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const processGate = () => {
    analyserNode.getByteFrequencyData(dataArray);

    let sum = 0;
    // Calculate RMS/Average in voice frequency range (100Hz - 4000Hz)
    const startBin = Math.floor(100 / (audioCtx.sampleRate / analyserNode.fftSize));
    const endBin = Math.min(bufferLength - 1, Math.floor(4000 / (audioCtx.sampleRate / analyserNode.fftSize)));
    const count = endBin - startBin + 1;

    for (let i = startBin; i <= endBin; i++) {
      sum += dataArray[i];
    }
    const energy = count > 0 ? sum / count : 0;

    const now = Date.now();
    if (!gateEnabled || energy > linearThreshold) {
      lastSpokeTime = now;
      if (isGated) {
        // Fast Attack (10ms) - open gate immediately without clipping voice start
        gateGainNode.gain.setTargetAtTime(1.0, audioCtx.currentTime, 0.01);
        isGated = false;
      }
    } else {
      // Hold for 280ms before closing gate to preserve natural trailing syllables
      if (now - lastSpokeTime > 280) {
        if (!isGated) {
          // Smooth Release (35ms) - exponential decay down to silence
          gateGainNode.gain.setTargetAtTime(0.00001, audioCtx.currentTime, 0.035);
          isGated = true;
        }
      }
    }

    animId = requestAnimationFrame(processGate);
  };

  animId = requestAnimationFrame(processGate);

  const cleanup = () => {
    if (animId) cancelAnimationFrame(animId);
    try { source.disconnect(); } catch {}
    try { highpass.disconnect(); } catch {}
    try { presence.disconnect(); } catch {}
    try { lowpass.disconnect(); } catch {}
    try { compressor.disconnect(); } catch {}
    try { gainNode.disconnect(); } catch {}
    try { gateGainNode.disconnect(); } catch {}
    try { analyserNode.disconnect(); } catch {}
  };

  return {
    destinationStream: destination.stream,
    gainNode,
    gateGainNode,
    analyserNode,
    setThreshold: (dB: number) => {
      currentThresholdDb = dB;
      linearThreshold = Math.pow(10, currentThresholdDb / 20) * 128;
    },
    setNoiseGateEnabled: (enabled: boolean) => {
      gateEnabled = enabled;
      if (!enabled) {
        gateGainNode.gain.setTargetAtTime(1.0, audioCtx.currentTime, 0.01);
        isGated = false;
      }
    },
    cleanup
  };
}
