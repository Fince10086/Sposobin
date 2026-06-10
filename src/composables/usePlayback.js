// composables/usePlayback.js - Playback state and playhead management

import { ref, computed } from 'vue';
import { useAudio } from './useAudio.js';

const playbackIndex = ref(null);

export function usePlayback() {
  const { playSequence } = useAudio();

  const isPlaying = computed(() => playbackIndex.value !== null);

  async function startPlayback(history) {
    if (history.length === 0 || isPlaying.value) return;

    await playSequence(history, (index) => {
      playbackIndex.value = index;
      if (index === null) {
        playbackIndex.value = null;
      }
    });
  }

  function resetPlayback() {
    playbackIndex.value = null;
  }

  return {
    playbackIndex,
    isPlaying,
    startPlayback,
    resetPlayback
  };
}
