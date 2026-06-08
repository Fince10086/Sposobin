// script.js - Frontend JavaScript for web application

let sessionId = null;
let currentMode = 'FREE';
let currentKey = 'g 小调 (g minor)';
let melodySequence = [];
let currentHistory = [];
let isPlaying = false;

const MIDI_NOTES = {
    'C2': 36, 'D2': 38, 'E2': 40, 'F2': 41, 'G2': 43, 'A2': 45, 'B2': 47,
    'C3': 48, 'D3': 50, 'E3': 52, 'F3': 53, 'G3': 55, 'A3': 57, 'B3': 59,
    'C4': 60, 'D4': 62, 'E4': 64, 'F4': 65, 'G4': 67, 'A4': 69, 'B4': 71,
    'C5': 72, 'D5': 74, 'E5': 76, 'F5': 77, 'G5': 79, 'A5': 81, 'B5': 83,
    'C6': 84, 'D6': 86, 'E6': 88, 'F6': 89, 'G6': 91, 'A6': 93, 'B6': 95
};

const NOTE_NAMES = Object.keys(MIDI_NOTES).reverse();

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
    createPianoKeyboard();
});

async function initializeApp() {
    try {
        // Initialize session
        const response = await fetch('/api/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: currentKey, mode: currentMode })
        });
        
        const data = await response.json();
        sessionId = data.session_id;
        
        // Load keys
        await loadKeys();
        
        showStatus('初始化完成', 'success');
    } catch (error) {
        console.error('Initialization error:', error);
        showStatus('初始化失败', 'error');
    }
}

async function loadKeys() {
    try {
        const response = await fetch('/api/keys');
        const keys = await response.json();
        
        const keySelect = document.getElementById('keySelect');
        keySelect.innerHTML = '';
        
        keys.forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            if (key === currentKey) option.selected = true;
            keySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load keys:', error);
    }
}

function setupEventListeners() {
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentMode = btn.dataset.mode;
            await changeMode(currentMode);
        });
    });
    
    // Key selection
    document.getElementById('keySelect').addEventListener('change', async (e) => {
        currentKey = e.target.value;
        await changeKey(currentKey);
    });
    
    // Melody input
    document.getElementById('melodyInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateVoicing();
        }
    });
    
    // Buttons
    document.getElementById('generateBtn').addEventListener('click', generateVoicing);
    document.getElementById('undoBtn').addEventListener('click', undoNote);
    document.getElementById('clearBtn').addEventListener('click', clearNotes);
    document.getElementById('playBtn').addEventListener('click', playAudio);
    document.getElementById('stopBtn').addEventListener('click', stopAudio);
}

function createPianoKeyboard() {
    const keyboard = document.getElementById('pianoKeyboard');
    keyboard.innerHTML = '';
    
    // Create C4 to C6 keyboard
    for (let i = 60; i <= 84; i++) {
        const noteName = getMidiNoteName(i);
        const isBlackKey = ['C#', 'D#', 'F#', 'G#', 'A#'].includes(noteName.replace(/(2|3|4|5|6)/, ''));
        
        const key = document.createElement('div');
        key.className = `piano-key ${isBlackKey ? 'black' : 'white'}`;
        key.textContent = isBlackKey ? '' : noteName.replace('#', '♯');
        key.dataset.midi = i;
        key.addEventListener('click', () => addMelodyNote(i));
        
        keyboard.appendChild(key);
    }
}

function getMidiNoteName(midi) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor((midi - 12) / 12);
    const noteIndex = midi % 12;
    return notes[noteIndex] + octave;
}

function addMelodyNote(midi) {
    melodySequence.push(midi);
    updateMelodyDisplay();
}

function undoNote() {
    if (melodySequence.length > 0) {
        melodySequence.pop();
        updateMelodyDisplay();
    }
}

function clearNotes() {
    melodySequence = [];
    updateMelodyDisplay();
    document.getElementById('resultDisplay').innerHTML = '<p>生成结果将显示在此处</p>';
    drawEmptyScore();
}

function updateMelodyDisplay() {
    const notes = melodySequence.map(midi => getMidiNoteName(midi)).join(' ');
    document.getElementById('melodyInput').value = notes;
}

async function generateVoicing() {
    if (melodySequence.length === 0) {
        showStatus('请输入旋律', 'error');
        return;
    }
    
    try {
        showStatus('正在生成和声...', 'info');
        
        const response = await fetch('/api/generate-voicing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                soprano_notes: melodySequence
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '生成失败');
        }
        
        const data = await response.json();
        currentHistory = data.voicing;
        
        displayVoicing(currentHistory);
        drawScore(currentHistory);
        
        // Set audio
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.src = data.audio_url;
        
        showStatus('和声生成成功！', 'success');
    } catch (error) {
        console.error('Generation error:', error);
        showStatus('生成失败: ' + error.message, 'error');
    }
}

async function playAudio() {
    if (!currentHistory || currentHistory.length === 0) {
        showStatus('没有要播放的内容', 'error');
        return;
    }
    
    const audioPlayer = document.getElementById('audioPlayer');
    isPlaying = true;
    document.getElementById('playbackStatus').textContent = '播放中...';
    
    audioPlayer.play().catch(error => {
        console.error('Playback error:', error);
        showStatus('播放失败', 'error');
    });
    
    audioPlayer.onended = () => {
        isPlaying = false;
        document.getElementById('playbackStatus').textContent = '完成';
    };
}

function stopAudio() {
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    isPlaying = false;
    document.getElementById('playbackStatus').textContent = '已停止';
}

function displayVoicing(voicing) {
    const resultDisplay = document.getElementById('resultDisplay');
    resultDisplay.innerHTML = '';
    
    voicing.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'result-item';
        
        const chordName = document.createElement('div');
        chordName.className = 'chord-name';
        chordName.textContent = `${index + 1}. ${item.chord}`;
        
        const voiceDetail = document.createElement('div');
        voiceDetail.className = 'voice-detail';
        voiceDetail.textContent = `S: ${item.note_names.S} | A: ${item.note_names.A} | T: ${item.note_names.T} | B: ${item.note_names.B}`;
        
        div.appendChild(chordName);
        div.appendChild(voiceDetail);
        resultDisplay.appendChild(div);
    });
}

function drawScore(voicing) {
    const canvas = document.getElementById('scoreCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw staff lines
    const startY = 50;
    const lineHeight = 10;
    const staffCount = 2; // Treble and Bass
    const staffSpacing = 150;
    
    for (let staff = 0; staff < staffCount; staff++) {
        const staffY = startY + staff * staffSpacing;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        
        for (let line = 0; line < 5; line++) {
            const y = staffY + line * lineHeight;
            ctx.beginPath();
            ctx.moveTo(40, y);
            ctx.lineTo(canvas.width - 20, y);
            ctx.stroke();
        }
    }
    
    // Draw chord labels
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    
    const chordX = 60;
    voicing.forEach((item, index) => {
        const x = chordX + index * 100;
        ctx.fillText(item.chord, x, startY - 10);
    });
}

function drawEmptyScore() {
    const canvas = document.getElementById('scoreCanvas');
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#999';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('生成和声后将显示五线谱', canvas.width / 2, canvas.height / 2);
}

async function changeKey(newKey) {
    try {
        const response = await fetch('/api/change-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                key: newKey
            })
        });
        
        if (!response.ok) throw new Error('切换调性失败');
        
        clearNotes();
        showStatus(`已切换至 ${newKey}`, 'success');
    } catch (error) {
        console.error('Key change error:', error);
        showStatus('切换调性失败', 'error');
    }
}

async function changeMode(newMode) {
    try {
        const response = await fetch('/api/change-mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                mode: newMode
            })
        });
        
        if (!response.ok) throw new Error('切换模式失败');
        
        clearNotes();
        showStatus(`已切换至 ${getModeLabel(newMode)} 模式`, 'success');
    } catch (error) {
        console.error('Mode change error:', error);
        showStatus('切换模式失败', 'error');
    }
}

function getModeLabel(mode) {
    const labels = {
        'FREE': '自由',
        'SOPRANO': '高音题',
        'COMPOSE': '旋律写作'
    };
    return labels[mode] || mode;
}

function showStatus(message, type = 'info') {
    const alertClass = `alert alert-${type}`;
    const statusDiv = document.createElement('div');
    statusDiv.className = alertClass;
    statusDiv.textContent = message;
    statusDiv.style.position = 'fixed';
    statusDiv.style.top = '20px';
    statusDiv.style.right = '20px';
    statusDiv.style.zIndex = '1000';
    statusDiv.style.maxWidth = '300px';
    
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
        statusDiv.remove();
    }, 3000);
}

// Initialize empty score on load
drawEmptyScore();
