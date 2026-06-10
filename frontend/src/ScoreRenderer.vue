<template>
  <div class="score-container" ref="scoreContainerRef">
    <svg :width="Math.max(900, renderData.nodes.length * 85 + 150)" height="270" class="score-svg">
      <g class="staff-lines">
        <line v-for="i in 5" :key="'t'+i" x1="50" :y1="30 + i*10" x2="100%" :y2="30 + i*10" stroke="#475569" stroke-width="1" />
        <line v-for="i in 5" :key="'b'+i" x1="50" :y1="160 + i*10" x2="100%" :y2="160 + i*10" stroke="#475569" stroke-width="1" />
      </g>

      <!-- Vertical line connecting both staves on the left -->
      <line x1="50" y1="40" x2="50" y2="210" stroke="#475569" stroke-width="2" />

      <!-- Grand Staff Brace -->
      <text x="40" y="210" font-size="170" fill="#475569" font-family="'Bravura'" dominant-baseline="central" text-anchor="middle">&#xE000;</text>
      
      <text x="70" y="70" font-size="44" fill="#475569" font-family="'Bravura'" dominant-baseline="central" text-anchor="middle">&#xE050;</text>
      <text x="70" y="180" font-size="40" fill="#475569" font-family="'Bravura'" dominant-baseline="central" text-anchor="middle">&#xE062;</text>

      <g v-for="(sig, i) in renderData.sigs" :key="'sig'+i">
        <text :x="95 + i * 12" :y="sig.t_y" :dy="getAccDy(sig.sym)" font-size="34" fill="#334155" font-family="'Bravura'" dominant-baseline="central" text-anchor="middle">{{ sig.sym }}</text>
        <text :x="95 + i * 12" :y="sig.b_y" :dy="getAccDy(sig.sym)" font-size="34" fill="#334155" font-family="'Bravura'" dominant-baseline="central" text-anchor="middle">{{ sig.sym }}</text>
      </g>

      <g v-for="(node, index) in renderData.nodes" :key="index" 
         :transform="`translate(${112 + (renderData.sigs.length * 14) + index * 85}, 0)`"
         :class="{ 'clickable-node': node.type === 'history' }"
         @click="node.type === 'history' ? rewindTo(node.original_index) : null">
        
        <rect v-if="node.type === 'history'" x="-25" y="10" width="50" height="230" rx="8" class="hover-bg" />

        <text v-if="node.type === 'history'" x="0" y="20" text-anchor="middle" font-weight="bold" font-family="Georgia, serif" font-size="18" fill="#E11D48">{{ node.chord_display }}</text>
        
        <g v-for="note in node.notes" :key="note.v">
          <text :x="note.x" :y="note.y" font-size="40" font-family="'Bravura'" text-anchor="middle" dominant-baseline="central"
                :fill="node.type === 'history' ? '#0F172A' : (node.type === 'pending' ? '#F59E0B' : 'transparent')"
                :stroke="node.type === 'target' ? '#CBD5E1' : (node.type === 'pending' ? '#D97706' : 'none')"
                :stroke-width="node.type === 'target' ? '1' : '0'"
                :stroke-dasharray="node.type === 'target' ? '2,2' : 'none'"
          >&#xE0A2;</text>
          <text v-if="note.acc" :x="note.acc_x" :y="note.y" :dy="getAccDy(note.acc)" font-size="24" fill="#0F172A" font-family="'Bravura'" dominant-baseline="central">{{ note.acc }}</text>
          <line v-for="ly in note.ledgers" :key="ly" :x1="note.x - 15" :y1="ly" :x2="note.x + 15" :y2="ly" :stroke="node.type === 'target' ? '#CBD5E1' : '#0F172A'" stroke-width="1.5" />
        </g>
      </g>

      <g class="playhead-layer" v-if="store.history.length > 0 || store.target_melody.length > 0 || store.pending_note">
        <line :x1="playheadX" y1="15" :x2="playheadX" y2="235" stroke="#10B981" stroke-width="2" stroke-dasharray="4,2" />
        <polygon :points="`${playheadX-6},15 ${playheadX+6},15 ${playheadX},25`" fill="#10B981" />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { store, sync_state } from './engine/store.js';
import { KEY_REGISTRY, spell_midi } from './engine/tonality.js';
import { PITCH_Y } from './engine/data.js';
import { format_chord_name } from './engine/formatter.js';

const scoreContainerRef = ref(null);

const keyInfo = computed(() => {
  const ki = {...KEY_REGISTRY[store.key_name]};
  ki.app_mode = store.mode;
  return ki;
});

const renderData = computed(() => {
  const key_info = keyInfo.value;
  const history = store.history;
  const target_melody = store.target_melody;
  const pending_note = store.pending_note;

  const render_nodes = [];
  const sig_count = key_info.sigs;
  const sig_type = key_info.sig_type;
  const sigs = [];
  
  // Key signature positions
  const positions = {
    sharp: {treble: [40,55,35,50,65,45,60], bass: [180,195,175,190,205,185,200]},
    flat: {treble: [60,45,65,50,70,55,75], bass: [200,185,205,190,210,195,215]}
  };
  
  if (sig_count > 0 && sig_type !== "none") {
    for (let i = 0; i < sig_count; i++) {
      sigs.push({sym: sig_type === "sharp" ? "\uE262" : "\uE260", t_y: positions[sig_type].treble[i], b_y: positions[sig_type].bass[i]});
    }
  }

  // Key signature alterations
  const key_sig_alts = {};
  for (let s = 0; s < 7; s++) key_sig_alts[s] = 0;
  if (sig_type === "sharp") {
    const order = [3,0,4,1,5,2,6];
    for (let i = 0; i < sig_count; i++) key_sig_alts[order[i]] = 1;
  } else if (sig_type === "flat") {
    const order = [6,2,5,1,4,0,3];
    for (let i = 0; i < sig_count; i++) key_sig_alts[order[i]] = -1;
  }

  // Running accidentals state (reset per re-computation, which is correct)
  const running_accidentals = {};

  for (let index = 0; index < history.length; index++) {
    const item = history[index];
    const chord = item.chord;
    const voices = item.voices;
    const node = {type: "history", chord_display: format_chord_name(chord), notes: [], original_index: index};

    // Calculate Y positions for all voices
    const y_positions = {};
    for (const [v_name, is_bass] of [['S', false], ['A', false], ['T', true], ['B', true]]) {
      const midi = voices[v_name];
      const [letter, abs_step, abs_alt, octave] = spell_midi(midi, key_info, chord);
      y_positions[v_name] = PITCH_Y[`${letter}${octave}${is_bass ? "_bass" : ""}`];
    }

    // Determine which accidentals need to be drawn
    const drawn_accidentals = {};
    for (const [v_name, is_bass] of [['S', false], ['A', false], ['T', true], ['B', true]]) {
      const midi = voices[v_name];
      const [letter, abs_step, abs_alt, octave] = spell_midi(midi, key_info, chord);
      const y = y_positions[v_name];
      if (y == null) continue;
      const staff = is_bass ? 1 : 0;
      const acc_key = `${staff}_${octave}_${abs_step}`;
      const curr_alt = running_accidentals[acc_key] !== undefined ? running_accidentals[acc_key] : key_sig_alts[abs_step];
      if (abs_alt !== curr_alt) {
        drawn_accidentals[v_name] = [y, abs_alt, acc_key];
      }
    }

    // Build note data
    for (const [v_name, is_bass] of [['S', false], ['A', false], ['T', true], ['B', true]]) {
      const y = y_positions[v_name];
      if (y == null) continue;

      let is_shifted = false;
      for (const [other_voice, other_y] of Object.entries(y_positions)) {
        if (other_y != null && other_voice !== v_name && other_y - y === 5) {
          is_shifted = true;
          break;
        }
      }
      const note_x = is_shifted ? 13 : 0;

      let acc_str = "";
      let acc_x = 0;
      if (v_name in drawn_accidentals) {
        const [, abs_alt, acc_key] = drawn_accidentals[v_name];
        const accMap = {"-2": "\uE264", "-1": "\uE260", "0": "\uE261", "1": "\uE262", "2": "\uE263"};
        acc_str = accMap[String(abs_alt)] || "";
        running_accidentals[acc_key] = abs_alt;
        acc_x = is_shifted ? -3 : -18;
        const has_drawn_above = Object.entries(drawn_accidentals).some(([ov, [oy]]) => ov !== v_name && oy < y && y - oy <= 11);
        if (!is_shifted && has_drawn_above) acc_x = -28;
      }

      const ledgers = [];
      if (!is_bass) {
        if (y >= 90) for (let ly = 90; ly <= y; ly += 10) ledgers.push(ly);
        if (y <= 30) for (let ly = 30; ly >= y; ly -= 10) ledgers.push(ly);
      } else {
        if (y <= 160) for (let ly = 160; ly >= y; ly -= 10) ledgers.push(ly);
        if (y >= 220) for (let ly = 220; ly <= y; ly += 10) ledgers.push(ly);
      }

      node.notes.push({v: v_name, y, x: note_x, acc: acc_str, acc_x, ledgers, is_bass});
    }
    render_nodes.push(node);
  }

  // Pending note
  if (pending_note !== null) {
    const [letter, abs_step, abs_alt, octave] = spell_midi(pending_note, key_info, "");
    const y = PITCH_Y[`${letter}${octave}`] || 90;
    const ledgers = [];
    if (y >= 90) for (let ly = 90; ly <= y; ly += 10) ledgers.push(ly);
    if (y <= 30) for (let ly = 30; ly >= y; ly -= 10) ledgers.push(ly);
    render_nodes.push({type: "pending", chord_display: "?", notes: [{v: "S", y, x: 0, acc: "", acc_x: 0, ledgers, is_bass: false}]});
  } else if (target_melody && target_melody.length > 0 && store.mode === "SOPRANO" && history.length < target_melody.length) {
    // Target melody ghost notes
    for (let i = history.length; i < target_melody.length; i++) {
      const [letter, abs_step, abs_alt, octave] = spell_midi(target_melody[i], key_info, "");
      const y = PITCH_Y[`${letter}${octave}`] || 90;
      const ledgers = [];
      if (y >= 90) for (let ly = 90; ly <= y; ly += 10) ledgers.push(ly);
      if (y <= 30) for (let ly = 30; ly >= y; ly -= 10) ledgers.push(ly);
      render_nodes.push({type: "target", chord_display: "", notes: [{v: "S", y, x: 0, acc: "", acc_x: 0, ledgers, is_bass: false}]});
    }
  }

  return {sigs, nodes: render_nodes};
});

const playheadX = computed(() => {
  const spacing = 85;
  const startX = 112 + (renderData.value.sigs.length * 14);
  if (store.playbackIndex !== null) return startX + store.playbackIndex * spacing;
  let idx = store.history.length;
  if (store.target_melody.length > 0 && idx < store.target_melody.length) return startX + idx * spacing;
  return startX + Math.max(0, store.history.length - 1) * spacing;
});

watch(playheadX, async (newX) => {
  await nextTick(); 
  if (!scoreContainerRef.value) return;
  const container = scoreContainerRef.value;
  const containerWidth = container.clientWidth;
  const goldenRatioOffset = containerWidth * 0.382; 
  const targetScrollLeft = newX - goldenRatioOffset;
  if (targetScrollLeft > 0) { container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' }); } 
  else { container.scrollTo({ left: 0, behavior: 'smooth' }); }
});

function getAccDy(sym) {
  if (!sym) return 0;
  // Bravura accidentals visual center adjustments
  if (sym.includes('\uE260') || sym.includes('\uE264')) return -3;
  if (sym.includes('\uE262') || sym.includes('\uE263')) return 0;
  if (sym.includes('\uE261')) return 0;
  return 0;
}

function rewindTo(index) {
  store.history = store.history.slice(0, index + 1);
  store.pending_note = null;
  sync_state();
}
</script>

<style scoped>
.score-container {
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  -webkit-user-select: none;
  user-select: none;
  background: #fff;
  overflow: auto hidden;
}

.score-svg {
  display: block;
}

.clickable-node {
  cursor: pointer;
}

.clickable-node .hover-bg {
  fill: transparent;
  transition: all 0.2s;
}

.clickable-node:hover .hover-bg {
  fill: rgba(14, 165, 233, 0.05);
}
</style>
