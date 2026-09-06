// ============================================================
//  src/services/audioManager.ts
//  RAKCHA GAME — Audio Identity & Sound Engine
// ============================================================

class RakchaAudioManager {
  private ctx: AudioContext | null = null;
  private sfxMasterGain: GainNode | null = null;

  // SFX state
  private sfxEnabled = true;
  private sfxVolume = 0.70;

  // SFX throttle
  private lastCardSfxTime = 0;

  // Diagnostics counters
  private sfxPickCount = 0;
  private sfxPlaceCount = 0;
  private isUnlocked = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockHandler = () => {
        void this.unlockAudioContext();
      };

      const events = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];
      events.forEach((evt) => {
        window.addEventListener(evt, unlockHandler, { passive: true, capture: true });
        document.addEventListener(evt, unlockHandler, { passive: true, capture: true });
      });

      // Expose diagnostic tools on window for dev debugging
      (window as unknown as { rakchaAudioDebug: unknown }).rakchaAudioDebug = {
        getDebugInfo: () => this.getDebugInfo(),
        playTestTone: () => this.playTestTone(),
        playCardPick: () => this.playCardPick(),
        playCardPlace: () => this.playCardPlace(),
        playSonicSignature: () => this.playSonicSignature(),
        playChessSlide: () => this.playChessSlide(),
        playChessCapture: () => this.playChessCapture(),
        playChessCheck: () => this.playChessCheck(),
      };
    }
  }

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioCtxClass) {
        try {
          this.ctx = new AudioCtxClass();
        } catch (e) {
          console.warn('[Audio] Failed to instantiate AudioContext:', e);
        }
      }
    }
    return this.ctx;
  }

  public async unlockAudioContext(): Promise<boolean> {
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // 1ms silent buffer hardware priming
      const silentBuffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(ctx.destination);
      source.start(0);

      this.isUnlocked = ctx.state === 'running';
      this.ensureNodes();
      return this.isUnlocked;
    } catch (err) {
      console.warn('[Audio] Unlock attempt error:', err);
      return false;
    }
  }

  private ensureNodes(): boolean {
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    if (!this.sfxMasterGain) {
      this.sfxMasterGain = ctx.createGain();
      this.sfxMasterGain.gain.setValueAtTime(
        this.sfxEnabled ? this.sfxVolume : 0,
        ctx.currentTime
      );
      this.sfxMasterGain.connect(ctx.destination);
    } else {
      try {
        this.sfxMasterGain.disconnect();
      } catch {
        // ignore
      }
      this.sfxMasterGain.connect(ctx.destination);
      if (this.sfxEnabled && this.sfxMasterGain.gain.value === 0) {
        this.sfxMasterGain.gain.setValueAtTime(this.sfxVolume, ctx.currentTime);
      }
    }

    return true;
  }

  // ------------------------------------------------------------
  // CORE CONFIGURATION
  // ------------------------------------------------------------

  public setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    const ctx = this.getAudioContext();
    if (ctx && this.sfxMasterGain) {
      const t = ctx.currentTime;
      this.sfxMasterGain.gain.cancelScheduledValues(t);
      this.sfxMasterGain.gain.linearRampToValueAtTime(
        enabled ? this.sfxVolume : 0,
        t + 0.1
      );
    }
  }

  // ------------------------------------------------------------
  // PLAYBACK: DIAGNOSTIC & TEST TONE
  // ------------------------------------------------------------

  public async playTestTone(): Promise<string> {
    const ctx = this.getAudioContext();
    if (!ctx) return '[Audio Test] Error: No AudioContext';

    const unlocked = await this.unlockAudioContext();
    if (!unlocked) return '[Audio Test] Error: Could not unlock AudioContext';

    if (!this.ensureNodes() || !this.sfxMasterGain) {
      return '[Audio Test] Error: Could not ensure nodes';
    }

    try {
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxMasterGain);

      osc.start(now);
      osc.stop(now + 0.6);

      return `[Audio Test] Success | sfxgain: ${this.sfxMasterGain.gain.value} | state: ${ctx.state}`;
    } catch (err) {
      return `[Audio Test] Exception: ${String(err)}`;
    }
  }

  // ------------------------------------------------------------
  // PLAYBACK: GAMEPLAY SFX (CARD PICK & PLACE)
  // ------------------------------------------------------------

  public playCardPick(): void {
    if (!this.sfxEnabled) return;

    const now = Date.now();
    if (now - this.lastCardSfxTime < 40) return;
    this.lastCardSfxTime = now;
    this.sfxPickCount++;

    const ctx = this.getAudioContext();
    if (!ctx) return;
    void this.unlockAudioContext();

    if (!this.ensureNodes() || !this.sfxMasterGain) return;

    try {
      const t = ctx.currentTime;

      const bufferSize = Math.floor(ctx.sampleRate * 0.06);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, t);
      filter.frequency.exponentialRampToValueAtTime(1200, t + 0.055);
      filter.Q.setValueAtTime(1.8, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, t);
      noiseGain.gain.linearRampToValueAtTime(0.35, t + 0.012);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.058);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxMasterGain);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.06);
    } catch (err) {
      console.warn('[Audio] playCardPick error:', err);
    }
  }

  public playCardPlace(): void {
    if (!this.sfxEnabled) return;

    const now = Date.now();
    if (now - this.lastCardSfxTime < 40) return;
    this.lastCardSfxTime = now;
    this.sfxPlaceCount++;

    const ctx = this.getAudioContext();
    if (!ctx) return;
    void this.unlockAudioContext();

    if (!this.ensureNodes() || !this.sfxMasterGain) return;

    try {
      const t = ctx.currentTime;

      const bufferSize = Math.floor(ctx.sampleRate * 0.045);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2200, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(800, t + 0.04);
      noiseFilter.Q.setValueAtTime(2.0, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, t);
      noiseGain.gain.linearRampToValueAtTime(0.40, t + 0.006);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.042);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxMasterGain);

      noise.start(t);
      noise.stop(t + 0.045);

      const tapOsc = ctx.createOscillator();
      tapOsc.type = 'sine';
      tapOsc.frequency.setValueAtTime(180, t);
      tapOsc.frequency.exponentialRampToValueAtTime(70, t + 0.05);

      const tapGain = ctx.createGain();
      tapGain.gain.setValueAtTime(0.30, t);
      tapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      tapOsc.connect(tapGain);
      tapGain.connect(this.sfxMasterGain);

      tapOsc.start(t);
      tapOsc.stop(t + 0.055);
    } catch (err) {
      console.warn('[Audio] playCardPlace error:', err);
    }
  }

  // ------------------------------------------------------------
  // RAKCHA SONIC SIGNATURE
  // ------------------------------------------------------------

  public playSonicSignature(): void {
    if (!this.sfxEnabled) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;
    void this.unlockAudioContext();

    if (!this.ensureNodes() || !this.sfxMasterGain) return;

    try {
      const t = ctx.currentTime;

      const notes = [
        { freq: 293.66, time: 0.0, dur: 0.22, vol: 0.35 },
        { freq: 349.23, time: 0.18, dur: 0.22, vol: 0.38 },
        { freq: 392.0, time: 0.36, dur: 0.24, vol: 0.42 },
        { freq: 440.0, time: 0.54, dur: 0.45, vol: 0.48 },
      ];

      const doumOsc = ctx.createOscillator();
      doumOsc.type = 'sine';
      doumOsc.frequency.setValueAtTime(120, t);
      doumOsc.frequency.exponentialRampToValueAtTime(50, t + 0.28);

      const doumGain = ctx.createGain();
      doumGain.gain.setValueAtTime(0.40, t);
      doumGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      doumOsc.connect(doumGain);
      doumGain.connect(this.sfxMasterGain);

      doumOsc.start(t);
      doumOsc.stop(t + 0.35);

      notes.forEach((note) => {
        const noteStart = t + note.time;

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, noteStart);

        const oscHarmonic = ctx.createOscillator();
        oscHarmonic.type = 'sawtooth';
        oscHarmonic.frequency.setValueAtTime(note.freq * 2, noteStart);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, noteStart);
        filter.frequency.exponentialRampToValueAtTime(450, noteStart + note.dur);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(note.vol, noteStart + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.dur);

        osc.connect(filter);
        oscHarmonic.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxMasterGain!);

        osc.start(noteStart);
        oscHarmonic.start(noteStart);
        osc.stop(noteStart + note.dur + 0.05);
        oscHarmonic.stop(noteStart + note.dur + 0.05);
      });
    } catch (err) {
      console.warn('[Audio] playSonicSignature error:', err);
    }
  }

  // ------------------------------------------------------------
  // CHESS GAME SOUND EFFECTS
  // ------------------------------------------------------------

  public playChessSlide(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    void this.unlockAudioContext();
    if (!this.ensureNodes() || !this.sfxMasterGain) return;

    try {
      const t = ctx.currentTime;
      const bufferSize = Math.floor(ctx.sampleRate * 0.08);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxMasterGain);

      noise.start(t);
      noise.stop(t + 0.08);
    } catch (err) {
      console.warn('[Audio] playChessSlide error:', err);
    }
  }

  public playChessCapture(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    void this.unlockAudioContext();
    if (!this.ensureNodes() || !this.sfxMasterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxMasterGain);

      osc.start(t);
      osc.stop(t + 0.11);

      const bufferSize = Math.floor(ctx.sampleRate * 0.06);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1500, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxMasterGain);

      noise.start(t);
      noise.stop(t + 0.06);
    } catch (err) {
      console.warn('[Audio] playChessCapture error:', err);
    }
  }

  public playChessCheck(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    void this.unlockAudioContext();
    if (!this.ensureNodes() || !this.sfxMasterGain) return;

    try {
      const t = ctx.currentTime;
      [880, 1320].forEach((freq, idx) => {
        const noteTime = t + idx * 0.12;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxMasterGain!);

        osc.start(noteTime);
        osc.stop(noteTime + 0.26);
      });
    } catch (err) {
      console.warn('[Audio] playChessCheck error:', err);
    }
  }

  public playVictory(): void {
    this.playSonicSignature();
  }

  public playLoss(): void {
    if (!this.sfxEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx || !this.sfxMasterGain) return;
      const t = ctx.currentTime;
      const freqs = [330, 293.66, 261.63, 220]; // Falling chords
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t + i * 0.12);
        gain.gain.setValueAtTime(0.15, t + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxMasterGain!);
        osc.start(t + i * 0.12);
        osc.stop(t + i * 0.12 + 0.35);
      });
    } catch (err) {
      console.warn('[Audio] playLoss error:', err);
    }
  }

  // ------------------------------------------------------------
  // DIAGNOSTICS
  // ------------------------------------------------------------

  public getDebugInfo(): Record<string, unknown> {
    return {
      ctxState: this.ctx ? this.ctx.state : 'null',
      isUnlocked: this.isUnlocked,
      sfxEnabled: this.sfxEnabled,
      sfxGainValue: this.sfxMasterGain ? this.sfxMasterGain.gain.value : 0,
      sfxPickCount: this.sfxPickCount,
      sfxPlaceCount: this.sfxPlaceCount,
    };
  }
}

export const audioManager = new RakchaAudioManager();
