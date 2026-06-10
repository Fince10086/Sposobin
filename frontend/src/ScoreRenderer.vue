<template>
  <div class="score-container" ref="scoreContainerRef">
    <svg :width="Math.max(900, store.renderData.nodes.length * 85 + 150)" height="270" class="score-svg">
      <g class="staff-lines">
        <line v-for="i in 5" :key="'t'+i" x1="50" :y1="30 + i*10" x2="100%" :y2="30 + i*10" stroke="#94A3B8" stroke-width="1" />
        <line v-for="i in 5" :key="'b'+i" x1="50" :y1="160 + i*10" x2="100%" :y2="160 + i*10" stroke="#94A3B8" stroke-width="1" />
      </g>

      <!-- Grand Staff Brace -->
      <text x="45" y="210" font-size="170" fill="#64748B" font-family="'Bravura'" dominant-baseline="central" text-anchor="middle">&#xE000;</text>
      
      <text x="70" y="70" font-size="44" fill="#64748B" font-family="'Bravura'" dominant-baseline="central" text-anchor="middle">&#xE050;</text>
      <text x="70" y="180" font-size="40" fill="#64748B" font-family="'Bravura'" dominant-baseline="central" text-anchor="middle">&#xE062;</text>

      <g v-for="(sig, i) in store.renderData.sigs" :key="'sig'+i">
        <text :x="88 + i * 14" :y="sig.t_y" :dy="getAccDy(sig.sym)" font-size="26" fill="#334155" font-family="'Bravura'" dominant-baseline="central" text-anchor="middle">{{ sig.sym }}</text>
        <text :x="88 + i * 14" :y="sig.b_y" :dy="getAccDy(sig.sym)" font-size="26" fill="#334155" font-family="'Bravura'" dominant-baseline="central" text-anchor="middle">{{ sig.sym }}</text>
      </g>

      <g v-for="(node, index) in store.renderData.nodes" :key="index" 
         :transform="`translate(${112 + (store.renderData.sigs.length * 14) + index * 85}, 0)`"
         :class="{ 'clickable-node': node.type === 'history' }"
         @click="node.type === 'history' ? rewindTo(node.original_index) : null">
        
        <rect v-if="node.type === 'history'" x="-25" y="10" width="50" height="230" rx="8" class="hover-bg" />

        <text v-if="node.type === 'history'" x="0" y="20" text-anchor="middle" font-weight="bold" font-family="Georgia, serif" font-size="18" fill="#E11D48">{{ node.chord_display }}</text>
        
        <g v-for="note in node.notes" :key="note.v">
          <text :x="note.x" :y="note.y" font-size="28" font-family="'Bravura'" text-anchor="middle" dominant-baseline="central"
                :fill="node.type === 'history' ? '#0F172A' : (node.type === 'pending' ? '#F59E0B' : 'transparent')"
                :stroke="node.type === 'target' ? '#CBD5E1' : (node.type === 'pending' ? '#D97706' : 'none')"
                :stroke-width="node.type === 'target' ? '1' : '0'"
                :stroke-dasharray="node.type === 'target' ? '2,2' : 'none'"
          >&#xE0A4;</text>
          <line :x1="note.x + (note.v === 'S' || note.v === 'T' ? 9 : -9)" :y1="note.y" 
                :x2="note.x + (note.v === 'S' || note.v === 'T' ? 9 : -9)" :y2="note.v === 'S' || note.v === 'T' ? note.y - 25 : note.y + 25" 
                :stroke="node.type === 'history' ? '#0F172A' : (node.type === 'pending' ? '#F59E0B' : '#CBD5E1')"
                :stroke-dasharray="node.type === 'target' ? '2,2' : 'none'" stroke-width="1.5" />
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

const scoreContainerRef = ref(null);

const playheadX = computed(() => {
  const spacing = 85;
  const startX = 112 + (store.renderData.sigs.length * 14);
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
