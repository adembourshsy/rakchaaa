// Web Audio API engine sound synthesizer for MECANQUE
// Generates realistic engine revving, turbo flutter, and exhaust rumble across all mobile and desktop browsers

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioCtxClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playEngineRevSound(soundProfile: string = 'v8_naturally_aspirated', customAudioUrl?: string) {
  try {
    if (customAudioUrl && customAudioUrl.trim().length > 5) {
      const audio = new Audio(customAudioUrl);
      audio.volume = 0.8;
      audio.play().catch((e) => console.warn('Custom engine audio playback failed:', e));
      return;
    }

    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.linearRampToValueAtTime(0.3, now + 0.2);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
    masterGain.connect(ctx.destination);

    // Primary engine oscillator
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();

    let startFreq = 90;
    let peakFreq = 380;
    let waveType: OscillatorType = 'sawtooth';

    switch (soundProfile) {
      case 'v10_high_rev':
        startFreq = 160;
        peakFreq = 650;
        waveType = 'sawtooth';
        break;
      case 'v12_exotic':
        startFreq = 180;
        peakFreq = 720;
        waveType = 'sawtooth';
        break;
      case 'v6_turbo':
        startFreq = 110;
        peakFreq = 420;
        waveType = 'triangle';
        break;
      case 'inline4_turbo':
        startFreq = 100;
        peakFreq = 350;
        waveType = 'square';
        break;
      case 'boxer6':
        startFreq = 120;
        peakFreq = 450;
        waveType = 'sawtooth';
        break;
      case 'v8_naturally_aspirated':
      default:
        startFreq = 85;
        peakFreq = 400;
        waveType = 'sawtooth';
        break;
    }

    // Oscillators pitch curve (idle -> acceleration -> rev limiter peak -> decel)
    osc1.type = waveType;
    osc1.frequency.setValueAtTime(startFreq, now);
    osc1.frequency.linearRampToValueAtTime(peakFreq, now + 1.1);
    osc1.frequency.linearRampToValueAtTime(peakFreq * 1.15, now + 1.4);
    osc1.frequency.exponentialRampToValueAtTime(startFreq * 1.1, now + 2.7);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(startFreq * 0.5, now);
    osc2.frequency.linearRampToValueAtTime(peakFreq * 0.5, now + 1.1);
    osc2.frequency.exponentialRampToValueAtTime(startFreq * 0.5, now + 2.7);

    // Filter settings for throatiness
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(2200, now + 1.1);
    filter.frequency.exponentialRampToValueAtTime(300, now + 2.7);

    // Sub-bass rumble
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(45, now);
    subOsc.frequency.linearRampToValueAtTime(140, now + 1.1);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 2.7);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.4, now);
    subGain.connect(masterGain);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterGain);
    subOsc.connect(subGain);

    osc1.start(now);
    osc2.start(now);
    subOsc.start(now);

    osc1.stop(now + 2.8);
    osc2.stop(now + 2.8);
    subOsc.stop(now + 2.8);
  } catch (err) {
    console.warn('AudioContext playback error:', err);
  }
}
