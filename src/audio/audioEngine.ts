export type SoundEffect = "hover" | "click" | "type" | "error" | "complete";

interface Tone {
  frequency: number;
  duration: number;
  delay?: number;
  gain: number;
  type?: OscillatorType;
  endFrequency?: number;
}

class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private volume = 0.35;
  private lastHoverAt = 0;
  private typeStep = 0;

  configure(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.volume = Math.max(0, Math.min(1, volume));

    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.015);
    }
  }

  play(effect: SoundEffect) {
    if (!this.enabled || this.volume <= 0) {
      return;
    }

    if (effect === "hover") {
      const now = performance.now();

      if (now - this.lastHoverAt < 45) {
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

    const tones = this.getTones(effect);

    for (const tone of tones) {
      this.playTone(context, tone);
    }
  }

  private getContext() {
    if (this.context && this.master) {
      return this.context;
    }

    try {
      const context = new AudioContext({ latencyHint: "interactive" });
      const master = context.createGain();
      master.gain.value = this.volume;
      master.connect(context.destination);
      this.context = context;
      this.master = master;
      return context;
    } catch {
      return null;
    }
  }

  private getTones(effect: SoundEffect): Tone[] {
    if (effect === "hover") {
      return [
        {
          frequency: 760,
          endFrequency: 860,
          duration: 0.035,
          gain: 0.018,
          type: "sine",
        },
      ];
    }

    if (effect === "click") {
      return [
        {
          frequency: 380,
          endFrequency: 560,
          duration: 0.055,
          gain: 0.04,
          type: "triangle",
        },
        {
          frequency: 940,
          duration: 0.025,
          gain: 0.012,
          type: "sine",
        },
      ];
    }

    if (effect === "type") {
      const frequencies = [520, 550, 580, 610];
      const frequency = frequencies[this.typeStep % frequencies.length];
      this.typeStep += 1;

      return [
        {
          frequency,
          endFrequency: frequency * 0.92,
          duration: 0.03,
          gain: 0.026,
          type: "triangle",
        },
      ];
    }

    if (effect === "error") {
      return [
        {
          frequency: 180,
          endFrequency: 125,
          duration: 0.075,
          gain: 0.045,
          type: "square",
        },
      ];
    }

    return [
      {
        frequency: 440,
        endFrequency: 520,
        duration: 0.15,
        gain: 0.035,
        type: "sine",
      },
      {
        frequency: 554,
        endFrequency: 660,
        duration: 0.18,
        delay: 0.055,
        gain: 0.03,
        type: "sine",
      },
      {
        frequency: 659,
        endFrequency: 784,
        duration: 0.22,
        delay: 0.11,
        gain: 0.028,
        type: "sine",
      },
    ];
  }

  private playTone(context: AudioContext, tone: Tone) {
    if (!this.master) {
      return;
    }

    const start = context.currentTime + (tone.delay ?? 0);
    const end = start + tone.duration;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = tone.type ?? "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, start);

    if (tone.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, end);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(tone.gain, start + Math.min(0.012, tone.duration / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.addEventListener(
      "ended",
      () => {
        oscillator.disconnect();
        gain.disconnect();
      },
      { once: true },
    );
    oscillator.start(start);
    oscillator.stop(end + 0.01);
  }
}

export const audioEngine = new AudioEngine();
