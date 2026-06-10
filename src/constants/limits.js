// constants/limits.js - Centralized limits and thresholds

export const INVALID_COST = 999999;

export const VOICE_RANGES = {
  S: { min: 57, max: 84 },
  A: { min: 53, max: 74 },
  T: { min: 45, max: 69 },
  B: { min: 36, max: 64 }
};

export const SPACING_LIMITS = {
  maxOctaveBetweenSA: 12,
  maxOctaveBetweenAT: 12
};

export const BASS_LEAP_LIMITS = {
  absoluteMax: 12,
  forbidden: [10, 11],
  diminishedFifthDown: -6,
  majorPenalty: [8, 9],
  minorPenaltyPerSemitone: 0.5,
  diminishedPenalty: 80,
  majorLeapPenalty: 50
};

export const PARALLEL_PENALTIES = {
  octaveUnison: 10000,
  fifth: 10000,
  hiddenFifth: 2000,
  maxAllowed: 5000
};

export const VOICE_OVERLAP_PENALTY = 5000;
export const VOICE_OVERLAP_MAX = 10000;
export const ALL_SAME_DIRECTION_PENALTY = 3000;
export const UNISON_PENALTIES = { SA: 20, AT: 15, TB: 20 };
export const RARE_SEVENTH_PENALTY = 2000;
export const STYLISTIC_MULTIPLIER = 4;
