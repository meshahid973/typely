import type { AudioEffect, SoundPackId } from "./audioManifest";
import { createSoundTones, type SoundTone } from "./soundTones";

interface AudioConfiguration {
  enabled: boolean;
  pack: SoundPackId;
  interfaceVolume: number;
  typingVolume: number;
}

interface PlayOptions {
  pitch?: number;
  variant?: number;
}

const defaultConfiguration: AudioConfiguration = {
  enabled: true,
  pack: "clean-taps",
  interfaceVolume: 0.22,
  typingVolume: 0.24,
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function effectChannel(effect: AudioEffect) {
  return effect.startsWith("typing-") || effect === "word-complete" ? "typing" : "interface";
}

class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private interfaceGain: GainNode | null = null;
  private typingGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private configuration = defaultConfiguration;
  private lastHoverAt = 0;
  private correctVariant = 0;
  private toneCache = new Map<string, SoundTone[]>();

  configure(configuration: AudioConfiguration) {
    this.configuration = {
      ...configuration,
      interfaceVolume: clamp(configuration.interfaceVolume),
      typingVolume: clamp(configuration.typingVolume),
    };

    if (!this.context) {
      return;
    }

    const now = this.context.currentTime;
    this.masterGain?.gain.setTargetAtTime(this.canPlay() ? 1 : 0, now, 0.02);
    this.interfaceGain?.gain.setTargetAtTime(this.configuration.interfaceVolume, now, 0.02);
    this.typingGain?.gain.setTargetAtTime(this.configuration.typingVolume, now, 0.02);
  }

  prepare() {
    if (!this.canPlay()) {
      return;
    }

    const context = this.getContext();

    if (context?.state === "suspended") {
      void context.resume();
    }
  }

  play(effect: AudioEffect, options: PlayOptions = {}) {
    if (!this.canPlay()) {
      return;
    }

    if (effect === "menu-hover") {
      const now = performance.now();

      if (now - this.lastHoverAt < 90) {
        return;
      }

      this.lastHoverAt = now;
    }

    const context = this.getContext();

    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      void context.resume();
    }

    const variant = options.variant ?? (effect === "typing-correct" ? this.correctVariant++ : 0);
    const pitch = Math.max(0.94, Math.min(1.08, options.pitch ?? 1));

    const variantKey = effect === "typing-correct" ? variant % 3 : 0;
    const cacheKey = `${this.configuration.pack}:${effect}:${variantKey}`;
    let tones = this.toneCache.get(cacheKey);

    if (!tones) {
      tones = createSoundTones(this.configuration.pack, effect, variantKey);
      this.toneCache.set(cacheKey, tones);
    }

    for (const tone of tones) {
      this.playTone(context, tone, effectChannel(effect), pitch);
    }
  }

  private canPlay() {
    return this.configuration.enabled && this.configuration.pack !== "silent";
  }

  private getContext() {
    if (this.context) {
      return this.context;
    }

    try {
      const context = new AudioContext({ latencyHint: "interactive" });
      const masterGain = context.createGain();
      const interfaceGain = context.createGain();
      const typingGain = context.createGain();

      masterGain.gain.value = this.canPlay() ? 1 : 0;
      interfaceGain.gain.value = this.configuration.interfaceVolume;
      typingGain.gain.value = this.configuration.typingVolume;
      interfaceGain.connect(masterGain);
      typingGain.connect(masterGain);
      masterGain.connect(context.destination);

      this.context = context;
      this.masterGain = masterGain;
      this.interfaceGain = interfaceGain;
      this.typingGain = typingGain;
      return context;
    } catch {
      return null;
    }
  }

  private playTone(
    context: AudioContext,
    tone: SoundTone,
    channel: "interface" | "typing",
    pitch: number,
  ) {
    const output = channel === "typing" ? this.typingGain : this.interfaceGain;

    if (!output) {
      return;
    }

    const start = context.currentTime + (tone.delay ?? 0);
    const end = start + tone.duration;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    oscillator.type = tone.type ?? "sine";
    oscillator.frequency.setValueAtTime(tone.frequency * pitch, start);

    if (tone.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, tone.endFrequency * pitch),
        end,
      );
    }

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(tone.filterFrequency ?? 1800, start);
    filter.Q.value = 0.45;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, tone.gain),
      start + Math.min(0.007, tone.duration / 3),
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    const noiseNodes = this.playNoise(context, tone, filter, start, end);

    oscillator.addEventListener(
      "ended",
      () => {
        oscillator.disconnect();
        filter.disconnect();
        gain.disconnect();
        noiseNodes?.source.disconnect();
        noiseNodes?.gain.disconnect();
      },
      { once: true },
    );

    oscillator.start(start);
    oscillator.stop(end + 0.01);
  }

  private playNoise(
    context: AudioContext,
    tone: SoundTone,
    filter: BiquadFilterNode,
    start: number,
    end: number,
  ) {
    if (!tone.noise || tone.noise <= 0) {
      return null;
    }

    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = this.getNoiseBuffer(context);
    gain.gain.setValueAtTime(tone.noise, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(gain);
    gain.connect(filter);
    source.start(start);
    source.stop(end);
    return { source, gain };
  }

  private getNoiseBuffer(context: AudioContext) {
    if (this.noiseBuffer) {
      return this.noiseBuffer;
    }

    const length = Math.max(1, Math.floor(context.sampleRate * 0.08));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < length; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }

    this.noiseBuffer = buffer;
    return buffer;
  }
}

export const audioEngine = new AudioEngine();
