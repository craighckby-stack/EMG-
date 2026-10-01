/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-134 [2026-09-20T05:57:13.831Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/SoundEngine.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

let audioContextInstance: AudioContext | null = null;

const BRACKET_REGEX: RegExp = /\[.*?\]/g;
const QUOTE_REGEX: RegExp = /["'"]/g;

const ARPEGGIO_NOTES: readonly number[] = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];

function getAudioContext(): AudioContext {
  if (!audioContextInstance) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContextInstance = new AudioContextClass();
  }
  if (audioContextInstance.state === 'suspended') {
    void audioContextInstance.resume();
  }
  return audioContextInstance;
}

export function initAudioEngine(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    oscillator.start(now);
    oscillator.stop(now + 0.001);

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(' ');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
    }
  } catch (error: unknown) {
    console.warn('Audio engine initialization failed:', error);
  }
}

export type SynthSoundType = 'move' | 'capture' | 'check' | 'checkmate' | 'victory' | 'blip' | 'alarm';

export function playClickSound(muted: boolean = false): void {
  playSynthSound('blip', muted, 0.4);
}

export function playChirpSound(muted: boolean = false): void {
  playSynthSound('move', muted, 0.5);
}

export function playSynthSound(
  type: SynthSoundType,
  muted: boolean = false,
  volume: number = 0.5
): void {
  if (muted) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.01);
    mainGain.connect(ctx.destination);

    switch (type) {
      case 'move': {
        const oscillator = ctx.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(350, now);
        oscillator.frequency.exponentialRampToValueAtTime(700, now + 0.08);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);

        oscillator.connect(filter);
        filter.connect(mainGain);

        oscillator.start(now);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        oscillator.stop(now + 0.13);
        break;
      }

      case 'capture': {
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(1200, now);
        oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.25);

        const modulator = ctx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.value = 45;
        
        const modGain = ctx.createGain();
        modGain.gain.value = 500;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.22);

        modulator.connect(modGain);
        modGain.connect(oscillator.frequency);
        oscillator.connect(filter);
        filter.connect(mainGain);

        modulator.start(now);
        oscillator.start(now);

        mainGain.gain.setValueAtTime(volume * 0.4, now);
        mainGain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.05);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        modulator.stop(now + 0.3);
        oscillator.stop(now + 0.3);
        break;
      }

      case 'check': {
        const oscPrimary = ctx.createOscillator();
        const oscSecondary = ctx.createOscillator();
        oscPrimary.type = 'sine';
        oscSecondary.type = 'sawtooth';

        oscPrimary.frequency.value = 660;
        oscSecondary.frequency.value = 440;

        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.Q.value = 10;
        filter.frequency.value = 550;

        oscPrimary.connect(filter);
        oscSecondary.connect(filter);
        filter.connect(mainGain);

        oscPrimary.start(now);
        oscSecondary.start(now);

        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.05);
        mainGain.gain.setValueAtTime(0.01, now + 0.15);
        mainGain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.2);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        oscPrimary.stop(now + 0.5);
        oscSecondary.stop(now + 0.5);
        break;
      }

      case 'checkmate': {
        const oscillator = ctx.createOscillator();
        const subOscillator = ctx.createOscillator();
        oscillator.type = 'sawtooth';
        subOscillator.type = 'sine';

        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.linearRampToValueAtTime(45, now + 0.8);
        subOscillator.frequency.setValueAtTime(90, now);
        subOscillator.frequency.linearRampToValueAtTime(30, now + 0.9);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 250;

        oscillator.connect(filter);
        subOscillator.connect(filter);
        filter.connect(mainGain);

        oscillator.start(now);
        subOscillator.start(now);

        mainGain.gain.setValueAtTime(volume * 0.6, now);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        oscillator.stop(now + 1.3);
        subOscillator.stop(now + 1.3);
        break;
      }

      case 'victory': {
        const tempo = 0.08;
        ARPEGGIO_NOTES.forEach((freq, idx) => {
          const oscillator = ctx.createOscillator();
          oscillator.type = 'square';
          oscillator.frequency.value = freq;

          const bitGain = ctx.createGain();
          const startTime = now + idx * tempo;
          
          bitGain.gain.setValueAtTime(0, startTime);
          bitGain.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.01);
          bitGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

          oscillator.connect(bitGain);
          bitGain.connect(ctx.destination);

          oscillator.start(startTime);
          oscillator.stop(startTime + 0.16);
        });
        break;
      }

      case 'blip': {
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.linearRampToValueAtTime(600, now + 0.05);

        oscillator.connect(mainGain);
        oscillator.start(now);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        oscillator.stop(now + 0.07);
        break;
      }

      case 'alarm': {
        for (let i = 0; i < 3; i++) {
          const pulseStartTime = now + i * 0.12;
          const oscillator = ctx.createOscillator();
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(800 - i * 100, pulseStartTime);
          oscillator.frequency.linearRampToValueAtTime(100, pulseStartTime + 0.1);

          const pulseGain = ctx.createGain();
          pulseGain.gain.setValueAtTime(0, pulseStartTime);
          pulseGain.gain.linearRampToValueAtTime(volume * 0.3, pulseStartTime + 0.01);
          pulseGain.gain.exponentialRampToValueAtTime(0.001, pulseStartTime + 0.11);

          oscillator.connect(pulseGain);
          pulseGain.connect(ctx.destination);

          oscillator.start(pulseStartTime);
          oscillator.stop(pulseStartTime + 0.12);
        }
        break;
      }
    }
  } catch (error: unknown) {
    console.warn('Audio context synthesis failed:', error);
  }
}

let speechOscillator: OscillatorNode | null = null;
let speechModulator: OscillatorNode | null = null;
let speechModGain: GainNode | null = null;
let speechGainNode: GainNode | null = null;

let celestialOscPrimary: OscillatorNode | null = null;
let celestialOscSecondary: OscillatorNode | null = null;
let celestialGainNode: GainNode | null = null;

export function cleanupSpeechAudio(): void {
  try {
    if (speechOscillator) {
      speechOscillator.stop();
      speechOscillator.disconnect();
      speechOscillator = null;
    }
    if (speechModulator) {
      speechModulator.stop();
      speechModulator.disconnect();
      speechModulator = null;
    }
    if (speechModGain) {
      speechModGain.disconnect();
      speechModGain = null;
    }
    if (speechGainNode) {
      speechGainNode.disconnect();
      speechGainNode = null;
    }
    if (celestialOscPrimary) {
      celestialOscPrimary.stop();
      celestialOscPrimary.disconnect();
      celestialOscPrimary = null;
    }
    if (celestialOscSecondary) {
      celestialOscSecondary.stop();
      celestialOscSecondary.disconnect();
      celestialOscSecondary = null;
    }
    if (celestialGainNode) {
      celestialGainNode.disconnect();
      celestialGainNode = null;
    }
  } catch {
    // Suppress errors if nodes are already disconnected or inactive
  }
}

let globalChronosLoadValue: number = 0;

export function setChronosLoadValue(val: number): void {
  globalChronosLoadValue = val;
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  cleanupSpeechAudio();
}

export function speakDalekText(
  text: string, 
  muted: boolean = false, 
  volume: number = 0.5, 
  onEndCallback?: () => void, 
  chronosLoad: number = 0
): void {
  const activeChronos = chronosLoad || globalChronosLoadValue;
  if (muted || typeof window === 'undefined' || !window.speechSynthesis) {
    onEndCallback?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    cleanupSpeechAudio();

    const cleanedText = text
      .replace(BRACKET_REGEX, "")
      .replace(QUOTE_REGEX, "")
      .trim();

    if (!cleanedText) {
      onEndCallback?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.volume = volume;
    
    const chronosPercentage = activeChronos / 100;
    utterance.pitch = 1.35 + (chronosPercentage * 0.45);
    utterance.rate = 1.0 + (chronosPercentage * 0.5);

    const availableVoices = window.speechSynthesis.getVoices();
    const ukVoice = availableVoices.find(v => 
      v.lang.includes('GB') || 
      v.lang.includes('en-GB') || 
      v.name.toLowerCase().includes('google uk') || 
      v.name.toLowerCase().includes('british')
    );
    const englishVoice = availableVoices.find(v => v.lang.startsWith('en'));
    
    if (ukVoice) {
      utterance.voice = ukVoice;
    } else if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        speechGainNode = ctx.createGain();
        speechGainNode.gain.setValueAtTime(0, now);
        speechGainNode.connect(ctx.destination);

        speechOscillator = ctx.createOscillator();
        speechOscillator.type = 'sawtooth';
        const carrierFrequency = 120 + chronosPercentage * 150;
        speechOscillator.frequency.setValueAtTime(carrierFrequency, now);

        speechModulator = ctx.createOscillator();
        speechModulator.type = 'sine';
        const lfoFrequency = 30 + chronosPercentage * 70;
        speechModulator.frequency.value = lfoFrequency;

        speechModGain = ctx.createGain();
        speechModGain.gain.value = 40;

        speechModulator.connect(speechModGain);
        speechModGain.connect(speechOscillator.frequency);
        speechOscillator.connect(speechGainNode);

        speechModulator.start(now);
        speechOscillator.start(now);

        speechGainNode.gain.linearRampToValueAtTime(volume * 0.15, now + 0.05);
      } catch (err: unknown) {
        console.warn("Failed to activate synchronized Dalek modulation buzz", err);
      }
    };

    utterance.onend = () => {
      if (speechGainNode) {
        try {
          const ctx = getAudioContext();
          const now = ctx.currentTime;
          speechGainNode.gain.setValueAtTime(speechGainNode.gain.value, now);
          speechGainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          setTimeout(() => {
            cleanupSpeechAudio();
            onEndCallback?.();
          }, 60);
        } catch {
          cleanupSpeechAudio();
          onEndCallback?.();
        }
      } else {
        cleanupSpeechAudio();
        onEndCallback?.();
      }
    };

    utterance.onerror = () => {
      cleanupSpeechAudio();
      onEndCallback?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err: unknown) {
    console.warn("Dalek talk synthesis failed:", err);
    onEndCallback?.();
  }
}

export function speakJesusText(
  text: string, 
  muted: boolean = false, 
  volume: number = 0.5, 
  onEndCallback?: () => void, 
  chronosLoad: number = 0
): void {
  const activeChronos = chronosLoad || globalChronosLoadValue;
  if (muted || typeof window === 'undefined' || !window.speechSynthesis) {
    onEndCallback?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    cleanupSpeechAudio();

    const cleanedText = text
      .replace(BRACKET_REGEX, "")
      .replace(QUOTE_REGEX, "")
      .trim();

    if (!cleanedText) {
      onEndCallback?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.volume = volume;
    
    const chronosPercentage = activeChronos / 100;
    utterance.pitch = 0.85 + (chronosPercentage * 0.35);
    utterance.rate = 0.85 + (chronosPercentage * 0.40);

    const availableVoices = window.speechSynthesis.getVoices();
    const usVoice = availableVoices.find(v => 
      v.lang.includes('US') || 
      v.lang.includes('en-US') || 
      v.name.toLowerCase().includes('google us') || 
      v.name.toLowerCase().includes('natural') || 
      v.name.toLowerCase().includes('guy') || 
      v.name.toLowerCase().includes('male')
    );
    const englishVoice = availableVoices.find(v => v.lang.startsWith('en'));

    if (usVoice) {
      utterance.voice = usVoice;
    } else if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        celestialGainNode = ctx.createGain();
        celestialGainNode.gain.setValueAtTime(0, now);
        celestialGainNode.connect(ctx.destination);

        celestialOscPrimary = ctx.createOscillator();
        celestialOscPrimary.type = 'sine';
        celestialOscPrimary.frequency.setValueAtTime(220 + chronosPercentage * 50, now);

        celestialOscSecondary = ctx.createOscillator();
        celestialOscSecondary.type = 'sine';
        celestialOscSecondary.frequency.setValueAtTime(330 + chronosPercentage * 75, now);

        celestialOscPrimary.connect(celestialGainNode);
        celestialOscSecondary.connect(celestialGainNode);

        celestialOscPrimary.start(now);
        celestialOscSecondary.start(now);

        celestialGainNode.gain.linearRampToValueAtTime(volume * 0.2, now + 0.1);
      } catch (err: unknown) {
        console.warn("Failed to activate synchronized celestial drone", err);
      }
    };

    utterance.onend = () => {
      if (celestialGainNode) {
        try {
          const ctx = getAudioContext();
          const now = ctx.currentTime;
          celestialGainNode.gain.setValueAtTime(celestialGainNode.gain.value, now);
          celestialGainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          setTimeout(() => {
            cleanupSpeechAudio();
            onEndCallback?.();
          }, 110);
        } catch {
          cleanupSpeechAudio();
          onEndCallback?.();
        }
      } else {
        cleanupSpeechAudio();
        onEndCallback?.();
      }
    };

    utterance.onerror = () => {
      cleanupSpeechAudio();
      onEndCallback?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err: unknown) {
    console.warn("Jesus talk synthesis failed:", err);
    onEndCallback?.();
  }
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 132,
  timestamp: "2026-09-20T03:53:06.564Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});