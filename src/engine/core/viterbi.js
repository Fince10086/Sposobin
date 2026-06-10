// engine/core/viterbi.js - Viterbi pathfinding for free mode

import { getChordCandidates } from './candidateEngine.js';
import { evaluateVoicing } from '../rules/index.js';
import { v_to_tuple, tuple_to_v } from '../utils/index.js';

export function calculateBestVoicing(chordSequence, initialVoicing, dnaDb, keyInfo, targetMelody = null) {
  const dp = [];
  dp.push({
    [`${chordSequence[0]}|${JSON.stringify(v_to_tuple(initialVoicing))}`]: {
      cost: 0,
      prev: null,
      chord: chordSequence[0],
      tuple: v_to_tuple(initialVoicing)
    }
  });

  for (let i = 1; i < chordSequence.length; i++) {
    const currentChord = chordSequence[i];
    const lastChord = chordSequence[i - 1];
    const nextLayer = {};
    const targetS = targetMelody && i < targetMelody.length ? targetMelody[i] : null;
    const candidates = getChordCandidates(currentChord, dnaDb, targetS);

    for (const [prevKey, prevData] of Object.entries(dp[dp.length - 1])) {
      const prevC = prevData.chord;
      const prevV = tuple_to_v(prevData.tuple);
      for (const currV of candidates) {
        const cost = evaluateVoicing(prevV, currV, prevC, currentChord, keyInfo);
        if (cost < 999999) {
          const totalCost = prevData.cost + cost;
          const currKey = `${currentChord}|${JSON.stringify(v_to_tuple(currV))}`;
          if (!(currKey in nextLayer) || totalCost < nextLayer[currKey].cost) {
            nextLayer[currKey] = { cost: totalCost, prev: prevKey, chord: currentChord, tuple: v_to_tuple(currV) };
          }
        }
      }
    }
    if (Object.keys(nextLayer).length === 0) return null;
    dp.push(nextLayer);
  }

  let bestFinalKey = null;
  let bestCost = Infinity;
  for (const [key, data] of Object.entries(dp[dp.length - 1])) {
    if (data.cost < bestCost) {
      bestCost = data.cost;
      bestFinalKey = key;
    }
  }

  const path = [];
  let currKey = bestFinalKey;
  for (let i = dp.length - 1; i >= 0; i--) {
    path.push(tuple_to_v(dp[i][currKey].tuple));
    currKey = dp[i][currKey].prev;
    if (currKey === null && i > 0) return null;
  }
  path.reverse();
  return path;
}
