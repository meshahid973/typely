import type { AudioEffect, SoundPackId } from "./audioManifest";

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

interface Tone {
  frequency: number;
  endFrequency?: number;
  duration: number;
  delay?: number;
  gain: number;
  type?: OscillatorType;
  filterFrequency?: number;
  noise?: number;
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
  private master: GainNode | null = null;
  private interfaceGain: GainNode | null = null;
  private typingGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private configuration = defaultConfiguration;
  private lastHoverAt = 0;
  private correctStep = 0;

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
    this.master?.gain.setTargetAtTime(configuration.enabled ? 1 : 0, now, 0.02);
    this.interfaceGain?.gain.setTargetAtTime(this.configuration.interfaceVolume, now, 0.02);
    this.typingGain?.gain.setTargetAtTime(this.configuration.typingVolume, now, 0.02);
  }

  prepare() {
    const context = this.getContext();

    if (context?.state === "suspended") {
      void context.resume();
    }
  }

  play(effect: AudioEffect, options: PlayOptions = {}) {
    const { enabled, pack } = this.configuration;

    if (!enabled || pack === "silent") {
      return;
    }

    if (effect === "menu-hover") {
      const now = performance.now();

      if (now - this.lastHoverAt < 80) {
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

    const variant = options.variant ?? this.correctStep++;
    const pitch = Math.max(0.94, Math.min(1.08, options.pitch ?? 1));

    for (const tone of this.createTones(pack, effect, variant)) {
      this.playTone(context, tone, effectChannel(effect), pitch);
    }
  }

  private getContext() {
    if (this.context) {
      return this.context;
    }

    try {
      const context = new AudioContext({ latencyHint: "interactive" });
      const master = context.createGain();
      const interfaceGain = context.createGain();
      const typingGain = context.createGain();

      master.gain.value = this.configuration.enabled ? 1 : 0;
      interfaceGain.gain.value = this.configuration.interfaceVolume;
      typingGain.gain.value = this.configuration.typingVolume;
      interfaceGain.connect(master);
      typingGain.connect(master);
      master.connect(context.destination);

      this.context = context;
      this.master = master;
      this.interfaceGain = interfaceGain;
      this.typingGain = typingGain;
      return context;
    } catch {
      return null;
    }
  }

  private createTones(pack: SoundPackId, effect: AudioEffect, variant: number): Tone[] {
    const packGain = pack === "muted" ? 0.38 : 1;
    const variantOffset = [0, 18, -12][variant % 3];

    if (effect === "typing-error") {
      return [
        {
          frequency: pack === "digital" ? 238 : 188,
          endFrequency: pack === "digital" ? 196 : 154,
          duration: 0.055,
          gain: 0.024 * packGain,
          type: "sine",
          filterFrequency: 680,
          noise: pack === "typewriter" ? 0.018 : 0,
        },
      ];
    }

    if (effect === "typing-correct") {
      if (pack === "soft-mechanical" || pack === "typewriter") {
        return [
          {
            frequency: 248 + variantOffset,
            endFrequency: 218 + variantOffset,
            duration: 0.025,
            gain: 0.022 * packGain,
            type: "triangle",
            filterFrequency: 1150,
            noise: pack === "typewriter" ? 0.025 : 0.012,
          },
        ];
      }

      if (pack === "digital") {
        return [
          {
            frequency: 520 + variantOffset,
            endFrequency: 468 + variantOffset,
            duration: 0.022,
            gain: 0.014 * packGain,
            type: "sine",
            filterFrequency: 1900,
          },
        ];
      }

      return [
        {
          frequency: 432 + variantOffset,
          endFrequency: 390 + variantOffset,
          duration: 0.025,
          gain: 0.018 * packGain,
          type: "triangle",
          filterFrequency: 1550,
        },
      ];
    }

    if (effect === "word-complete") {
      return [
        {
          frequency: 530,
          endFrequency: 594,
          duration: 0.045,
          gain: 0.012 * packGain,
          type: "sine",
          filterFrequency: 1800,
        },
      ];
    }

    if (effect === "menu-hover") {
      return [
        {
          frequency: 680,
          endFrequency: 748,
          duration: 0.025,
          gain: 0.008 * packGain,
          type: "sine",
          filterFrequency: 1800,
        },
      ];
    }

    if (effect === "menu-select" || effect === "test-start") {
      return [
        {
          frequency: effect === "test-start" ? 360 : 310,
          endFrequency: effect === "test-start" ? 510 : 455,
          duration: 0.06,
          gain: 0.023 * packGain,
          type: "triangle",
          filterFrequency: 1600,
          noise: pack === "soft-mechanical" ? 0.008 : 0,
        },
      ];
    }

    if (effect === "combo-milestone") {
      return [
        {
          frequency: 540,
          endFrequency: 610,
          duration: 0.09,
          gain: 0.019 * packGain,
          type: "sine",
          filterFrequency: 2100,
        },
        {
          frequency: 680,
          endFrequency: 760,
          duration: 0.11,
          delay: 0.045,
          gain: 0.015 * packGain,
          type: "sine",
          filterFrequency: 2300,
        },
      ];
    }

    const personalBest = effect === "personal-best";
    const frequencies = personalBest ? [440, 554, 659, 880] : [392, 494, 587];

    return frequencies.map((frequency, index) => ({
      frequency,
      endFrequency: frequency * 1.06,
      duration: personalBest ? 0.17 : 0.14,
      delay: index * (personalBest ? 0.055 : 0.05),
      gain: (personalBest ? 0.019 : 0.016) * packGain,
      type: "sine",
      filterFrequency: 2200,
    }));
  }

  private playTone(
    context: AudioContext,
    tone: Tone,
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
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

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

    let noise: AudioBufferSourceNode | null = null;
    let noiseGain: GainNode | null = null;

    if (tone.noise && tone.noise > 0) {
      noise = context.createBufferSource();
      noiseGain = context.createGain();
      noise.buffer = this.getNoiseBuffer(context);
      noiseGain.gain.setValueAtTime(tone.noise, start);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, end);
      noise.connect(noiseGain);
      noiseGain.connect(filter);
      noise.start(start);
      noise.stop(end);
    }

    oscillator.addEventListener(
      "ended",
      () => {
        oscillator.disconnect();
        filter.disconnect();
        gain.disconnect();
        noise?.disconnect();
        noiseGain?.disconnect();
      },
      { once: true },
    );

    oscillator.start(start);
    oscillator.stop(end + 0.01);
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
