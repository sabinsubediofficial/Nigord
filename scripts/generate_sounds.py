"""
Suhhp Custom Sound Studio Synthesizer
Generates studio-grade, cohesive, high-fidelity 44.1kHz 16-bit stereo PCM audio files
for Suhhp's custom sound identity.
"""

import math
import struct
import wave
import os

SAMPLE_RATE = 44100

def create_stereo_sample(left: float, right: float) -> bytes:
    """Clamps and converts floating point [-1.0, 1.0] samples to 16-bit PCM stereo."""
    # Soft clipping with tanh to avoid hard distortion
    left = math.tanh(left)
    right = math.tanh(right)
    
    l_int = int(max(-32767, min(32767, left * 32767.0)))
    r_int = int(max(-32767, min(32767, right * 32767.0)))
    return struct.pack('<hh', l_int, r_int)

def write_wav(filename: str, audio_data: list[tuple[float, float]]):
    """Writes a stereo 44.1kHz 16-bit WAV file with anti-click fade in/out."""
    n_samples = len(audio_data)
    fade_len = int(SAMPLE_RATE * 0.004) # 4ms anti-click fade
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        
        frames = bytearray()
        for i, (l, r) in enumerate(audio_data):
            # Apply anti-click ramp
            if i < fade_len:
                ramp = i / fade_len
                l *= ramp
                r *= ramp
            elif i > n_samples - fade_len:
                ramp = (n_samples - i) / fade_len
                l *= ramp
                r *= ramp
            frames.extend(create_stereo_sample(l, r))
        
        wav_file.writeframes(frames)
    print(f"Generated: {filename} ({n_samples / SAMPLE_RATE:.2f}s)")

class SynthEngine:
    @staticmethod
    def tone(freq: float, duration: float, volume: float = 0.5, pan: float = 0.0, 
             decay: float = 0.2, attack: float = 0.005, harmonics: list[float] = None,
             fm_ratio: float = 0.0, fm_depth: float = 0.0) -> list[tuple[float, float]]:
        """Synthesizes a rich harmonic tone with ADSR envelope and stereo panning."""
        if harmonics is None:
            harmonics = [1.0, 0.35, 0.12, 0.04] # Natural warm acoustic overtone series
            
        n_samples = int(SAMPLE_RATE * duration)
        samples = []
        
        l_mult = math.cos((pan + 1) * math.pi / 4)
        r_mult = math.sin((pan + 1) * math.pi / 4)
        
        for i in range(n_samples):
            t = i / SAMPLE_RATE
            
            # Envelope (Linear attack, exponential decay)
            if t < attack:
                env = t / attack
            else:
                env = math.exp(-(t - attack) / decay)
            
            # FM Modulation
            fm = 0.0
            if fm_ratio > 0 and fm_depth > 0:
                fm = math.sin(2 * math.pi * freq * fm_ratio * t) * (fm_depth * env)
            
            # Additive synthesis with harmonics
            val = 0.0
            for h_idx, h_amp in enumerate(harmonics):
                h_freq = freq * (h_idx + 1)
                # Add slight inharmonicity for acoustic bell/wood realism
                inharm = 1.0 + (h_idx * 0.0012)
                val += h_amp * math.sin(2 * math.pi * h_freq * inharm * t + fm)
            
            val *= env * volume
            samples.append((val * l_mult, val * r_mult))
            
        return samples

    @staticmethod
    def mix(tracks: list[tuple[list[tuple[float, float]], float]]) -> list[tuple[float, float]]:
        """Mixes multiple audio tracks with delay offsets (in seconds)."""
        max_samples = 0
        for track, offset in tracks:
            total_len = int(offset * SAMPLE_RATE) + len(track)
            if total_len > max_samples:
                max_samples = total_len
                
        mixed = [[0.0, 0.0] for _ in range(max_samples)]
        
        for track, offset in tracks:
            start_idx = int(offset * SAMPLE_RATE)
            for i, (l, r) in enumerate(track):
                mixed[start_idx + i][0] += l
                mixed[start_idx + i][1] += r
                
        return [(l, r) for l, r in mixed]

    @staticmethod
    def noise_click(duration: float = 0.03, volume: float = 0.3, freq_start: float = 800, freq_end: float = 200) -> list[tuple[float, float]]:
        """Synthesizes a tactile physical click with pitch dive."""
        n_samples = int(SAMPLE_RATE * duration)
        samples = []
        phase = 0.0
        
        for i in range(n_samples):
            t = i / duration
            freq = freq_start + (freq_end - freq_start) * (t ** 2)
            phase += 2 * math.pi * freq / SAMPLE_RATE
            
            env = math.exp(-t * 6.0) * (1.0 - t)
            # Mix sine dive with shaped transient
            val = (math.sin(phase) * 0.7 + (math.sin(phase * 2.3) * 0.3)) * env * volume
            samples.append((val, val))
        return samples


# ==========================================
# Sound Generator Recipes
# ==========================================

def gen_new_message() -> list[tuple[float, float]]:
    """Crystalline Silk Chime (C6 + G6 + C7 shimmer)"""
    # Note 1: C6 (1046.5 Hz) with glass harmonics
    c6 = SynthEngine.tone(1046.5, duration=0.35, volume=0.42, pan=-0.15, decay=0.12, attack=0.002, 
                          harmonics=[1.0, 0.45, 0.15, 0.08], fm_ratio=2.76, fm_depth=0.3)
    # Note 2: G6 (1567.98 Hz) with crystalline air
    g6 = SynthEngine.tone(1567.98, duration=0.40, volume=0.38, pan=0.15, decay=0.14, attack=0.003,
                          harmonics=[1.0, 0.35, 0.10, 0.04], fm_ratio=3.5, fm_depth=0.25)
    # Shimmer overtone: C7 (2093.0 Hz)
    c7 = SynthEngine.tone(2093.0, duration=0.25, volume=0.18, pan=0.05, decay=0.08, attack=0.005)
    
    return SynthEngine.mix([
        (c6, 0.0),
        (g6, 0.035),
        (c7, 0.040),
    ])

def gen_incoming_user() -> list[tuple[float, float]]:
    """Ascending Harmonic Bloom (Eb4 -> Bb4 -> Eb5 marimba bloom)"""
    eb4 = SynthEngine.tone(311.13, duration=0.45, volume=0.48, pan=-0.25, decay=0.22, attack=0.003,
                           harmonics=[1.0, 0.6, 0.25, 0.08])
    bb4 = SynthEngine.tone(466.16, duration=0.48, volume=0.45, pan=0.0, decay=0.24, attack=0.003,
                           harmonics=[1.0, 0.5, 0.20, 0.06])
    eb5 = SynthEngine.tone(622.25, duration=0.55, volume=0.42, pan=0.25, decay=0.28, attack=0.004,
                           harmonics=[1.0, 0.4, 0.15, 0.05])
    # Gentle sub body
    sub = SynthEngine.tone(155.56, duration=0.35, volume=0.25, pan=0.0, decay=0.18, attack=0.005,
                          harmonics=[1.0, 0.2])
    
    return SynthEngine.mix([
        (eb4, 0.0),
        (sub, 0.0),
        (bb4, 0.075),
        (eb5, 0.150),
    ])

def gen_user_leave() -> list[tuple[float, float]]:
    """Velvet Resonant Drop (G4 -> Eb4 soft acoustic decay)"""
    g4 = SynthEngine.tone(392.00, duration=0.35, volume=0.42, pan=0.15, decay=0.16, attack=0.004,
                          harmonics=[1.0, 0.4, 0.12])
    eb4 = SynthEngine.tone(311.13, duration=0.42, volume=0.46, pan=-0.15, decay=0.22, attack=0.004,
                           harmonics=[1.0, 0.5, 0.18])
    sub = SynthEngine.tone(155.56, duration=0.30, volume=0.20, pan=0.0, decay=0.15, attack=0.005)
    
    return SynthEngine.mix([
        (g4, 0.0),
        (eb4, 0.080),
        (sub, 0.080),
    ])

def gen_deconnected() -> list[tuple[float, float]]:
    """Tactile Sub Drop (Soft hangup tap + downward sub-sweep)"""
    click = SynthEngine.noise_click(duration=0.04, volume=0.25, freq_start=600, freq_end=150)
    
    # Sub pitch sweep
    duration = 0.26
    n_samples = int(SAMPLE_RATE * duration)
    sub_sweep = []
    phase = 0.0
    for i in range(n_samples):
        t = i / duration
        f = 160.0 * (1.0 - t * 0.45) # 160Hz -> 88Hz
        phase += 2 * math.pi * f / SAMPLE_RATE
        env = math.exp(-t * 4.2) * (1.0 - t * 0.8)
        val = (math.sin(phase) + 0.3 * math.sin(phase * 2)) * env * 0.45
        sub_sweep.append((val, val))
        
    return SynthEngine.mix([
        (click, 0.0),
        (sub_sweep, 0.015),
    ])

def gen_muted() -> list[tuple[float, float]]:
    """Tactile Shutter Down (Crisp downward haptic click)"""
    click1 = SynthEngine.noise_click(duration=0.025, volume=0.40, freq_start=950, freq_end=350)
    click2 = SynthEngine.noise_click(duration=0.040, volume=0.48, freq_start=450, freq_end=140)
    sub = SynthEngine.tone(130.81, duration=0.08, volume=0.22, pan=0.0, decay=0.04, attack=0.002)
    
    return SynthEngine.mix([
        (click1, 0.0),
        (click2, 0.018),
        (sub, 0.020),
    ])

def gen_non_muted() -> list[tuple[float, float]]:
    """Tactile Pop Up (Crisp upward haptic micro-pluck)"""
    click1 = SynthEngine.noise_click(duration=0.020, volume=0.35, freq_start=220, freq_end=650)
    ping = SynthEngine.tone(880.0, duration=0.09, volume=0.38, pan=0.0, decay=0.04, attack=0.002,
                            harmonics=[1.0, 0.4, 0.1])
    ping2 = SynthEngine.tone(1320.0, duration=0.06, volume=0.20, pan=0.1, decay=0.03, attack=0.002)
    
    return SynthEngine.mix([
        (click1, 0.0),
        (ping, 0.015),
        (ping2, 0.020),
    ])

def gen_deaf() -> list[tuple[float, float]]:
    """Submerged Low-Pass Filter (Deep isolation downward sweep)"""
    # Downward sweeping chord
    duration = 0.32
    n_samples = int(SAMPLE_RATE * duration)
    sweep = []
    p1, p2, p3 = 0.0, 0.0, 0.0
    for i in range(n_samples):
        t = i / duration
        cutoff_mult = math.exp(-t * 3.5)
        f1 = 440.0 * (0.3 + 0.7 * cutoff_mult)
        f2 = 554.37 * (0.3 + 0.7 * cutoff_mult)
        f3 = 659.25 * (0.3 + 0.7 * cutoff_mult)
        
        p1 += 2 * math.pi * f1 / SAMPLE_RATE
        p2 += 2 * math.pi * f2 / SAMPLE_RATE
        p3 += 2 * math.pi * f3 / SAMPLE_RATE
        
        env = math.exp(-t * 2.8) * (1.0 - t * 0.5)
        l = (math.sin(p1) * 0.4 + math.sin(p2) * 0.3 + math.sin(p3) * 0.2) * env * 0.42
        r = (math.sin(p1) * 0.3 + math.sin(p2) * 0.4 + math.sin(p3) * 0.2) * env * 0.42
        sweep.append((l, r))
        
    sub = SynthEngine.tone(110.0, duration=0.28, volume=0.35, pan=0.0, decay=0.15, attack=0.005)
    
    return SynthEngine.mix([
        (sweep, 0.0),
        (sub, 0.02),
    ])

def gen_non_deaf() -> list[tuple[float, float]]:
    """Air Uncork Sparkle (Rising high-pass sparkle and open bell)"""
    # Rising sparkle
    duration = 0.26
    n_samples = int(SAMPLE_RATE * duration)
    sparkle = []
    p1, p2 = 0.0, 0.0
    for i in range(n_samples):
        t = i / duration
        f1 = 350.0 + (1400.0 - 350.0) * (t ** 1.5)
        f2 = 700.0 + (2800.0 - 700.0) * (t ** 1.5)
        p1 += 2 * math.pi * f1 / SAMPLE_RATE
        p2 += 2 * math.pi * f2 / SAMPLE_RATE
        
        env = (1.0 - math.exp(-t * 8.0)) * math.exp(-t * 3.5)
        val = (math.sin(p1) * 0.6 + math.sin(p2) * 0.4) * env * 0.38
        sparkle.append((val * 0.8, val * 1.0))
        
    bell = SynthEngine.tone(1760.0, duration=0.28, volume=0.28, pan=0.15, decay=0.12, attack=0.015,
                            harmonics=[1.0, 0.3, 0.1])
    
    return SynthEngine.mix([
        (sparkle, 0.0),
        (bell, 0.06),
    ])

def gen_stream_started() -> list[tuple[float, float]]:
    """Prism Glass Bloom (Ascending F#4 -> A#4 -> C#5 -> F#5 glass bloom)"""
    f_sharp4 = SynthEngine.tone(369.99, duration=0.65, volume=0.35, pan=-0.3, decay=0.25, attack=0.003,
                                harmonics=[1.0, 0.4, 0.15, 0.05], fm_ratio=2.0, fm_depth=0.2)
    a_sharp4 = SynthEngine.tone(466.16, duration=0.65, volume=0.36, pan=-0.1, decay=0.26, attack=0.003,
                                harmonics=[1.0, 0.4, 0.15, 0.05], fm_ratio=2.0, fm_depth=0.2)
    c_sharp5 = SynthEngine.tone(554.37, duration=0.70, volume=0.38, pan=0.1, decay=0.28, attack=0.003,
                                harmonics=[1.0, 0.35, 0.12, 0.04], fm_ratio=3.0, fm_depth=0.25)
    f_sharp5 = SynthEngine.tone(739.99, duration=0.80, volume=0.40, pan=0.3, decay=0.35, attack=0.004,
                                harmonics=[1.0, 0.30, 0.10, 0.03], fm_ratio=3.0, fm_depth=0.3)
    
    return SynthEngine.mix([
        (f_sharp4, 0.0),
        (a_sharp4, 0.045),
        (c_sharp5, 0.090),
        (f_sharp5, 0.135),
    ])

def gen_stream_ended() -> list[tuple[float, float]]:
    """Prism Glass Sweep Down (F#5 -> C#5 -> F#4 glass decay)"""
    f_sharp5 = SynthEngine.tone(739.99, duration=0.40, volume=0.35, pan=0.2, decay=0.18, attack=0.003,
                                harmonics=[1.0, 0.3, 0.1])
    c_sharp5 = SynthEngine.tone(554.37, duration=0.45, volume=0.36, pan=0.0, decay=0.20, attack=0.003,
                                harmonics=[1.0, 0.35, 0.12])
    f_sharp4 = SynthEngine.tone(369.99, duration=0.55, volume=0.40, pan=-0.2, decay=0.26, attack=0.004,
                                harmonics=[1.0, 0.4, 0.15])
    
    return SynthEngine.mix([
        (f_sharp5, 0.0),
        (c_sharp5, 0.055),
        (f_sharp4, 0.110),
    ])

def gen_incoming_ring() -> list[tuple[float, float]]:
    """Boutique Marimba Ringtone Loop (3.2s elegant melodic motif in Eb Major)"""
    # Notes in melody: Eb5 (622.25), G5 (783.99), Bb5 (932.33), C6 (1046.5), Bb5 (932.33), G5 (783.99), F5 (698.46), Eb5 (622.25)
    # Warm chords: Ebmaj7 (Eb3, G3, Bb3, D4), Cm7 (C3, G3, Bb3, Eb4), Abmaj7 (Ab2, Eb3, G3, C4), Bb9 (Bb2, F3, Ab3, C4)
    
    tracks = []
    
    # Melody line (warm electric marimba / chime)
    melody = [
        (622.25, 0.00, 0.35, -0.2),
        (783.99, 0.18, 0.38, 0.1),
        (932.33, 0.36, 0.40, -0.1),
        (1046.50, 0.54, 0.42, 0.2),
        (932.33, 0.72, 0.38, 0.0),
        
        (783.99, 1.10, 0.36, -0.15),
        (698.46, 1.28, 0.34, 0.15),
        (622.25, 1.46, 0.42, 0.0),
        
        # Second Phrase (variation)
        (783.99, 1.85, 0.36, 0.2),
        (932.33, 2.03, 0.38, -0.1),
        (1046.50, 2.21, 0.42, 0.15),
        (1244.50, 2.39, 0.35, -0.2), # Eb6
        (932.33, 2.57, 0.40, 0.0),
    ]
    
    for freq, offset, vol, pan in melody:
        t = SynthEngine.tone(freq, duration=0.45, volume=vol * 0.65, pan=pan, decay=0.20, attack=0.003,
                             harmonics=[1.0, 0.4, 0.15, 0.04], fm_ratio=2.0, fm_depth=0.15)
        tracks.append((t, offset))
        
    # Warm chord backing (Electric piano / warm pads)
    # Chord 1: Ebmaj7 (0.0s)
    for freq, pan in [(155.56, -0.2), (196.00, 0.1), (233.08, -0.1), (293.66, 0.2)]:
        c_tone = SynthEngine.tone(freq, duration=1.0, volume=0.16, pan=pan, decay=0.65, attack=0.02,
                                  harmonics=[1.0, 0.25, 0.08])
        tracks.append((c_tone, 0.0))
        
    # Chord 2: Cm7 (0.9s)
    for freq, pan in [(130.81, 0.0), (196.00, -0.2), (233.08, 0.2), (311.13, -0.1)]:
        c_tone = SynthEngine.tone(freq, duration=0.9, volume=0.16, pan=pan, decay=0.60, attack=0.02,
                                  harmonics=[1.0, 0.25, 0.08])
        tracks.append((c_tone, 0.9))
        
    # Chord 3: Abmaj7 (1.8s)
    for freq, pan in [(103.83, 0.0), (155.56, -0.2), (196.00, 0.1), (261.63, 0.2)]:
        c_tone = SynthEngine.tone(freq, duration=1.2, volume=0.16, pan=pan, decay=0.75, attack=0.02,
                                  harmonics=[1.0, 0.25, 0.08])
        tracks.append((c_tone, 1.8))
        
    mixed = SynthEngine.mix(tracks)
    # Pad with gentle tail to exactly 3.2s
    target_samples = int(3.2 * SAMPLE_RATE)
    if len(mixed) < target_samples:
        mixed.extend([(0.0, 0.0)] * (target_samples - len(mixed)))
    elif len(mixed) > target_samples:
        mixed = mixed[:target_samples]
    return mixed

def gen_outgoing_ring() -> list[tuple[float, float]]:
    """Soft Pulse Ringback (Calm double pulse chime on 3.0s loop)"""
    tracks = []
    
    # Pulse 1 at 0.0s (440Hz + 480Hz soft bell)
    p1_a = SynthEngine.tone(440.0, duration=0.45, volume=0.32, pan=-0.15, decay=0.28, attack=0.015,
                            harmonics=[1.0, 0.25, 0.05])
    p1_b = SynthEngine.tone(480.0, duration=0.45, volume=0.30, pan=0.15, decay=0.28, attack=0.015,
                            harmonics=[1.0, 0.25, 0.05])
    tracks.append((p1_a, 0.0))
    tracks.append((p1_b, 0.0))
    
    # Pulse 2 at 0.4s
    p2_a = SynthEngine.tone(440.0, duration=0.55, volume=0.35, pan=-0.1, decay=0.32, attack=0.015,
                            harmonics=[1.0, 0.25, 0.05])
    p2_b = SynthEngine.tone(480.0, duration=0.55, volume=0.32, pan=0.1, decay=0.32, attack=0.015,
                            harmonics=[1.0, 0.25, 0.05])
    tracks.append((p2_a, 0.40))
    tracks.append((p2_b, 0.40))
    
    mixed = SynthEngine.mix(tracks)
    target_samples = int(3.0 * SAMPLE_RATE)
    if len(mixed) < target_samples:
        mixed.extend([(0.0, 0.0)] * (target_samples - len(mixed)))
    else:
        mixed = mixed[:target_samples]
    return mixed

def gen_user_moved() -> list[tuple[float, float]]:
    """Spatial Whoosh Chime (Stereo pan transition + Bb4 -> F5 chime)"""
    # Spatial whoosh
    duration = 0.28
    n_samples = int(SAMPLE_RATE * duration)
    whoosh = []
    p = 0.0
    for i in range(n_samples):
        t = i / duration
        f = 250.0 + 350.0 * math.sin(t * math.pi)
        p += 2 * math.pi * f / SAMPLE_RATE
        env = math.sin(t * math.pi)
        
        # Pan left to right
        pan_val = (t * 2.0) - 1.0 # -1.0 -> +1.0
        l_mult = math.cos((pan_val + 1) * math.pi / 4)
        r_mult = math.sin((pan_val + 1) * math.pi / 4)
        
        val = math.sin(p) * env * 0.22
        whoosh.append((val * l_mult, val * r_mult))
        
    bb4 = SynthEngine.tone(466.16, duration=0.32, volume=0.35, pan=-0.2, decay=0.15, attack=0.004,
                          harmonics=[1.0, 0.35, 0.1])
    f5 = SynthEngine.tone(698.46, duration=0.40, volume=0.40, pan=0.25, decay=0.22, attack=0.004,
                         harmonics=[1.0, 0.30, 0.08])
    
    return SynthEngine.mix([
        (whoosh, 0.0),
        (bb4, 0.04),
        (f5, 0.12),
    ])


def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "sounds"))
    print(f"Synthesizing Suhhp Custom Sound Library to: {base_dir}")
    
    sound_map = {
        "new-message.mp3": gen_new_message(),
        "incoming-user.mp3": gen_incoming_user(),
        "user-leave.mp3": gen_user_leave(),
        "deconnected.mp3": gen_deconnected(),
        "muted.mp3": gen_muted(),
        "non-muted.mp3": gen_non_muted(),
        "deaf.mp3": gen_deaf(),
        "non-deaf.mp3": gen_non_deaf(),
        "stream-started.mp3": gen_stream_started(),
        "stream-ended.mp3": gen_stream_ended(),
        "incoming-ring.mp3": gen_incoming_ring(),
        "outgoing-ring.mp3": gen_outgoing_ring(),
        "user-moved.mp3": gen_user_moved(),
    }
    
    for filename, audio_data in sound_map.items():
        out_path = os.path.join(base_dir, filename)
        write_wav(out_path, audio_data)
        
    print("\n[SUCCESS] Successfully synthesized all 13 Suhhp custom sound effects!")

if __name__ == "__main__":
    main()
