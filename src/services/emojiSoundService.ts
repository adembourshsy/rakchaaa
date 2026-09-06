// ============================================================
//  src/services/emojiSoundService.ts
//  RAKCHA GAME — High-Fidelity Audio URL Player for Emojis
//  Plays external high-quality MP3s via direct URLs.
//  Free default emojis (😂 😒 😢 😎) strictly produce NO SOUND.
// ============================================================

const EMOJI_AUDIO_URLS: Record<string, string> = {
  // Provided external placeholders that fetch directly from external CDNs.
  // We use reliable placeholders but these can be easily swapped for direct Pixabay URL links
  // by simply pasting the URL here!
  'fire_ignite': 'https://www.myinstants.com/media/sounds/fire-whoosh.mp3',
  'kiss_pop': 'https://www.myinstants.com/media/sounds/kiss-the-rain_0wyGkeD.mp3',
  'cosmic_blast': 'https://www.myinstants.com/media/sounds/explosion_3.mp3',
  'applause_clap': 'https://www.myinstants.com/media/sounds/applause-4.mp3',
  'clown_honk': 'https://www.myinstants.com/media/sounds/clown-horn-sound-effect_1.mp3',
  'rage_growl': 'https://www.myinstants.com/media/sounds/perry-the-platypuss-growl.mp3',
  'party_fanfare': 'https://www.myinstants.com/media/sounds/tada_1.mp3',
  'ghost_wail': 'https://www.myinstants.com/media/sounds/phasmophobia-ghost-attack-1_b6tVbw6.mp3',
  'royal_fanfare': 'https://www.myinstants.com/media/sounds/fanfaretrumpet.mp3',
  'cash_register': 'https://www.myinstants.com/media/sounds/audiojoiner120623175716.mp3',
  'rocket_boost': 'https://www.myinstants.com/media/sounds/minecraft-firework.mp3',
  'devil_laugh': 'https://www.myinstants.com/media/sounds/evillaugh.swf.mp3',
  'salute_bugle': 'https://www.myinstants.com/media/sounds/army-bugle-reveille.mp3',
  'facepalm_slap': 'https://www.myinstants.com/media/sounds/slap.mp3',
};

class EmojiSoundService {
  private soundEnabled = true;
  private audioPool: Record<string, HTMLAudioElement[]> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      // Preload audio elements
      Object.entries(EMOJI_AUDIO_URLS).forEach(([id, url]) => {
        this.audioPool[id] = [];
        // Create 2 instances per sound for overlapping
        for (let i = 0; i < 2; i++) {
          const audio = new Audio(url);
          audio.preload = 'auto';
          audio.volume = 0.8;
          this.audioPool[id].push(audio);
        }
      });
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  /**
   * Plays the sound effect associated with a soundId using external MP3s.
   */
  public playSound(soundId?: string | null): void {
    if (!soundId || !this.soundEnabled || typeof window === 'undefined') return;

    const pool = this.audioPool[soundId];
    if (pool && pool.length > 0) {
      // Find an audio element that is currently not playing or just use the oldest one
      const audio = pool.find(a => a.paused || a.ended) || pool[0];
      
      // Reset time to start
      audio.currentTime = 0;
      
      audio.play().catch(e => {
         console.warn('[EmojiAudio] Failed to play external URL:', soundId, e);
      });
    }
  }
}

export const emojiSoundService = new EmojiSoundService();
