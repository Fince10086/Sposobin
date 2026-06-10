// constants/modes.js - Application mode constants

export const MODES = {
  FREE: 'FREE',
  SOPRANO: 'SOPRANO',
  COMPOSE: 'COMPOSE'
};

export const MODE_LABELS = {
  [MODES.FREE]: '自由模式',
  [MODES.SOPRANO]: '高音题模式',
  [MODES.COMPOSE]: '旋律写作模式'
};

export const VALID_FINAL_CHORDS = new Set(['T', 'T不完全', 'T双三', 't', 't不完全']);
export const START_CANDIDATES = ['T', 'T₆', 'D', 'D₆', 'S', 'S₆', 'D₇', 't', 't₆', 's', 's₆'];
