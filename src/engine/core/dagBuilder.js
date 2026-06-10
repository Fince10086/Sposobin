// engine/core/dagBuilder.js - DAG construction for soprano harmonization

import { getChordCandidates } from './candidateEngine.js';
import { evaluateVoicing } from '../rules/index.js';
import { v_to_tuple, tuple_to_v, get_chord_siblings } from '../utils/index.js';
import { START_CANDIDATES } from '../../constants/modes.js';

export function buildFullDag(targetMelody, dnaDb, keyInfo) {
  const layers = [];

  // Layer 0: Start candidates
  let currentLayer = {};
  for (const c of START_CANDIDATES) {
    if (!(c in dnaDb)) continue;
    for (const v of getChordCandidates(c, dnaDb, targetMelody[0])) {
      const key = `${c}|${JSON.stringify(v_to_tuple(v))}`;
      currentLayer[key] = { next: new Set(), prev: new Set(), chord: c, tuple: v_to_tuple(v) };
    }
  }
  // Fallback: if no start candidates matched, try all chords
  if (Object.keys(currentLayer).length === 0) {
    for (const c of Object.keys(dnaDb)) {
      for (const v of getChordCandidates(c, dnaDb, targetMelody[0])) {
        const key = `${c}|${JSON.stringify(v_to_tuple(v))}`;
        currentLayer[key] = { next: new Set(), prev: new Set(), chord: c, tuple: v_to_tuple(v) };
      }
    }
  }
  layers.push(currentLayer);

  // Build subsequent layers
  for (let i = 1; i < targetMelody.length; i++) {
    const nextLayer = {};
    const tgtS = targetMelody[i];
    const prevLayer = layers[layers.length - 1];

    // Collect all possible next chords
    const allPossibleNext = new Set();
    for (const stateKey of Object.keys(prevLayer)) {
      const cName = prevLayer[stateKey].chord;
      for (const nxt of dnaDb[cName]?.next || []) {
        allPossibleNext.add(nxt);
        for (const sib of get_chord_siblings(nxt, dnaDb)) allPossibleNext.add(sib);
      }
      for (const sib of get_chord_siblings(cName, dnaDb)) allPossibleNext.add(sib);
    }

    // Cache candidates
    const candCache = {};
    for (const nxtC of allPossibleNext) {
      if (nxtC in dnaDb) {
        candCache[nxtC] = getChordCandidates(nxtC, dnaDb, tgtS);
      }
    }

    // Connect edges
    for (const [stateKey, nodeData] of Object.entries(prevLayer)) {
      const cName = nodeData.chord;
      const vTup = nodeData.tuple;
      const possibleNexts = new Set();

      for (const nxt of dnaDb[cName]?.next || []) {
        possibleNexts.add(nxt);
        for (const sib of get_chord_siblings(nxt, dnaDb)) possibleNexts.add(sib);
      }
      for (const sib of get_chord_siblings(cName, dnaDb)) possibleNexts.add(sib);

      for (const nxtC of possibleNexts) {
        if (!(nxtC in dnaDb)) continue;
        for (const nxtV of candCache[nxtC] || []) {
          if (evaluateVoicing(tuple_to_v(vTup), nxtV, cName, nxtC, keyInfo) < 999999) {
            const nxtKey = `${nxtC}|${JSON.stringify(v_to_tuple(nxtV))}`;
            if (!(nxtKey in nextLayer)) {
              nextLayer[nxtKey] = { next: new Set(), prev: new Set(), chord: nxtC, tuple: v_to_tuple(nxtV) };
            }
            nextLayer[nxtKey].prev.add(stateKey);
            nodeData.next.add(nxtKey);
          }
        }
      }
    }

    layers.push(nextLayer);

    // Fallback if layer is empty
    if (Object.keys(nextLayer).length === 0) {
      const fallbackLayer = {};
      const fallbackCache = {};
      for (const nxtC of Object.keys(dnaDb)) {
        fallbackCache[nxtC] = getChordCandidates(nxtC, dnaDb, tgtS);
      }
      for (const [stateKey, nodeData] of Object.entries(prevLayer)) {
        const cName = nodeData.chord;
        const vTup = nodeData.tuple;
        for (const nxtC of Object.keys(dnaDb)) {
          for (const nxtV of fallbackCache[nxtC] || []) {
            if (evaluateVoicing(tuple_to_v(vTup), nxtV, cName, nxtC, keyInfo) < 999999) {
              const nxtKey = `${nxtC}|${JSON.stringify(v_to_tuple(nxtV))}`;
              if (!(nxtKey in fallbackLayer)) {
                fallbackLayer[nxtKey] = { next: new Set(), prev: new Set(), chord: nxtC, tuple: v_to_tuple(nxtV) };
              }
              fallbackLayer[nxtKey].prev.add(stateKey);
              nodeData.next.add(nxtKey);
            }
          }
        }
      }
      if (Object.keys(fallbackLayer).length === 0) return null;
      layers.pop();
      layers.push(fallbackLayer);
    }
  }

  // Prune invalid final chords
  const validFinals = new Set(['T', 'T不完全', 'T双三', 't', 't不完全']);
  const invalidFinals = [];
  for (const stateKey of Object.keys(layers[layers.length - 1])) {
    if (!validFinals.has(layers[layers.length - 1][stateKey].chord)) {
      invalidFinals.push(stateKey);
    }
  }

  for (const invState of invalidFinals) {
    if (layers.length > 1) {
      for (const prevState of layers[layers.length - 1][invState].prev) {
        layers[layers.length - 2][prevState].next.delete(invState);
      }
    }
    delete layers[layers.length - 1][invState];
  }

  if (Object.keys(layers[layers.length - 1]).length === 0) return null;

  // Backward dead-end removal
  for (let i = layers.length - 1; i > 0; i--) {
    const deadStates = [];
    for (const [stateKey, data] of Object.entries(layers[i])) {
      if (i !== layers.length - 1 && data.next.size === 0) {
        deadStates.push(stateKey);
      }
    }
    for (const dead of deadStates) {
      for (const prevState of layers[i][dead].prev) {
        layers[i - 1][prevState].next.delete(dead);
      }
      delete layers[i][dead];
    }
  }

  const deadStarts = [];
  for (const [stateKey, data] of Object.entries(layers[0])) {
    if (layers.length > 1 && data.next.size === 0) {
      deadStarts.push(stateKey);
    }
  }
  for (const dead of deadStarts) {
    delete layers[0][dead];
  }

  if (Object.keys(layers[0]).length === 0) return null;
  return layers;
}
