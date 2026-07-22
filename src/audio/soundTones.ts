import type { AudioEffect, SoundPackId } from "./audioManifest";

export interface SoundTone {
  frequency: number;
  endFrequency?: number;
  duration: number;
  delay?: number;
  gain: number;
  type?: OscillatorType;
  filterFrequency?: number;
  noise?: number;
}

export function createSoundTones(
  pack: SoundPackId,
  effect: AudioEffect,
  variant: number,
): SoundTone[] {
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
