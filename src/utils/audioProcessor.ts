/**
 * Open-Source Audio DSP Voice Processing & Studio Noise Gate Engine
 * 
 * Uses true RMS decibel (dBFS) energy detection with hysteresis:
 * - Open Threshold (e.g. -48 dBFS): Gate opens smoothly when voice is detected
 * - Close Threshold (-54 dBFS): Gate stays open during natural speech pauses
 * - Hold Time (400ms): Prevents syllable chopping and preserves sentence endings
 * - Attack (15ms) & Release (75ms): Smooth exponential ramps without pops or clicks
 */

export interface VoiceProcessorOptions {
  enableNoiseGate?: boolean;
  noiseGateThreshold?: number; // dBFS (-60 to -24)
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

  // 1. High-Pass Filter: Cuts sub-80Hz rumble (desk bumps, PC fans, AC hum)
  const highpass = audioCtx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = enableHighPass ? 80 : 10;
  highpass.Q.value = 0.707;

  // 2. Voice Clarity Peaking Filter: Subtle +1.5dB boost at 3kHz for clear speech
  const presence = audioCtx.createBiquadFilter();
  presence.type = 'peaking';
  presence.frequency.value = 3000;
  presence.gain.value = enableVoicePresence ? 1.5 : 0;
  presence.Q.value = 1.0;

  // 3. Dynamics Compressor: Gentle transparent leveler to prevent loud peaks
  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 12;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.100;

  // 4. User Mic Gain Node
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = micGain;

  // 5. Noise Gate Gain & Analyser
  const gateGainNode = audioCtx.createGain();
  gateGainNode.gain.value = 1.0;

  const analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 1024;
  analyserNode.smoothingTimeConstant = 0.1;

  // Connect Audio Signal Graph:
  // source -> highpass -> presence -> compressor -> gainNode -> gateGainNode -> destination
  source.connect(highpass);
  highpass.connect(presence);

  if (enableCompressor) {
    presence.connect(compressor);
    compressor.connect(gainNode);
  } else {
    presence.connect(gainNode);
  }

  gainNode.connect(gateGainNode);
  gainNode.connect(analyserNode);

  const destination = audioCtx.createMediaStreamDestination();
  gateGainNode.connect(destination);

  // True RMS dBFS Noise Gate Engine
  let gateEnabled = enableNoiseGate;
  let openThresholdDb = noiseGateThreshold;
  let closeThresholdDb = noiseGateThreshold - 6; // 6dB hysteresis to prevent stuttering

  let isGateClosed = false;
  let lastSpokeTime = Date.now();
  let animId: number | null = null;
  const timeDomainBuffer = new Float32Array(analyserNode.fftSize);

  const processGate = () => {
    if (!gateEnabled) {
      if (isGateClosed) {
        gateGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gateGainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
        isGateClosed = false;
      }
      animId = requestAnimationFrame(processGate);
      return;
    }

    analyserNode.getFloatTimeDomainData(timeDomainBuffer);

    // Calculate true Root Mean Square (RMS) signal energy
    let sumSquares = 0;
    for (let i = 0; i < timeDomainBuffer.length; i++) {
      const sample = timeDomainBuffer[i];
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / timeDomainBuffer.length);
    // Convert RMS to decibels full scale (dBFS)
    const currentDb = rms > 0.000001 ? 20 * Math.log10(rms) : -100;

    const now = Date.now();

    if (currentDb >= openThresholdDb) {
      // Voice detected above open threshold -> open gate
      lastSpokeTime = now;
      if (isGateClosed) {
        gateGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gateGainNode.gain.setTargetAtTime(1.0, audioCtx.currentTime, 0.015);
        isGateClosed = false;
      }
    } else if (currentDb < closeThresholdDb) {
      // Audio is below close threshold
      // Wait for 400ms hold time before gently closing gate
      if (now - lastSpokeTime > 400) {
        if (!isGateClosed) {
          gateGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
          gateGainNode.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.075);
          isGateClosed = true;
        }
      }
    } else {
      // In hysteresis zone between closeThreshold and openThreshold
      // Keep gate open if it was already open
      if (!isGateClosed) {
        lastSpokeTime = now;
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
      openThresholdDb = dB;
      closeThresholdDb = dB - 6;
    },
    setNoiseGateEnabled: (enabled: boolean) => {
      gateEnabled = enabled;
      if (!enabled) {
        gateGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gateGainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
        isGateClosed = false;
      }
    },
    cleanup
  };
}

