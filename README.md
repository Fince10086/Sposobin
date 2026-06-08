# Harmonic - Web Harmony Analysis & Composition System

一个基于Riemann和声理论的Web版和声分析系统。将经典的四部和声写作法则与动态规划算法相结合，实现智能和声生成和声部连接。

**English:** A web-based harmonic voice-leading analysis and composition tool implementing classical harmony rules with dynamic programming DAG algorithms for optimal four-part writing.

## 🌟 Features

### ✨ Complete Functionality Preserved
- **Three Composition Modes**: FREE (自由), SOPRANO (高音题), COMPOSE (旋律写作)
- **24 Tonalities**: All 12 major and 12 minor keys with full harmonic support
- **Advanced Voice-Leading**: 80+ harmonic rules including register limits, parallel motion detection, voice crossing, leap constraints
- **Dynamic Programming Engine**: DAG-based optimal path finding for voice-leading solutions
- **Real-time Audio**: Web Audio API integration for MIDI playback
- **Professional Notation**: Canvas-based score rendering with chord labels

## 📁 Project Structure

```
Harmonic/
├── app.py                 # Flask web server (REST API)
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Web interface
├── static/
│   ├── style.css         # Responsive styling
│   └── script.js         # Frontend interactivity
├── prototype/            # Original desktop application (archived)
│   ├── main.py           # Tkinter GUI (legacy)
│   ├── engine.py         # Core algorithm
│   ├── rules.py          # Voice-leading rules
│   ├── dna.py            # Harmonic database
│   ├── tonality.py       # Key management
│   ├── player.py         # Audio synthesis
│   └── renderer.py       # Score visualization
└── .git/                 # Version control
```

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

### Running

```bash
# Start Flask development server
python app.py

# Open browser
# http://localhost:5000
```

## 📖 Usage Guide

### Basic Operation

1. **Select Mode & Key**
   - Choose composition mode (FREE/SOPRANO/COMPOSE)
   - Select tonality (24 options: major/minor keys)

2. **Input Melody**
   - Click piano keyboard keys, or
   - Type note names (e.g., C4 D4 E4)

3. **Generate Harmony**
   - Click "生成和声" (Generate Harmony)
   - System calculates optimal SATB voicing

4. **Playback & Edit**
   - Click "▶ 播放" (Play) to hear results
   - Use "撤销" (Undo) and "清空" (Clear) to edit

### Composition Modes

**自由 (FREE)** - Unrestricted harmony construction  
**高音题 (SOPRANO)** - Generate harmony based on given melody (soprano)  
**旋律写作 (COMPOSE)** - Full melody and harmony composition

## 🎹 Core Algorithms

### Voice-Leading Search Engine
- **Graph Construction**: DAG (Directed Acyclic Graph) of valid voicings
- **Cost Function**: Penalty-based evaluation (0-999999 cost scale)
  - Bass leaps, melodic shape, parallel motion, voice crossing, false relations
  - Forbidden voicings: cost = 999999 (pruned from search)
- **Pathfinding**: Dynamic programming backward pass finding min-cost path
- **Fallback**: Full library search if no valid path exists

### Harmonic Constraints
- **Register Limits**: S:60-81, A:55-74, T:48-67, B:36-62 (MIDI)
- **Parallel Motion**: Detects forbidden parallel fifths/octaves
- **Voice Crossing**: Prevents S<A, A<T, T≤B violations
- **Leap Penalties**: Restricts melodic jumps (soft constraints)
- **Bass Constraints**: Limits low voice movement
- **False Relations**: Detects chromatic voice leading errors

### Harmonic DNA Database
- **MAJOR_DNA**: 80+ chord definitions with function relationships
- **MINOR_DNA**: Harmonic minor system with borrowed chords
- **Chord Types**: T(onic), D(ominant), S(ubdominant), TD, SD, DT, DTᵢᵢᵢ, Cad, etc.
- **Voice Options**: Multiple bass options and chord configurations per function

## 🔧 API Reference

### `POST /api/init`
Initialize session with key and mode
```json
{
  "key": "g 小调 (g minor)",
  "mode": "FREE"
}
```

### `POST /api/generate-voicing`
Generate harmony for soprano melody
```json
{
  "session_id": "...",
  "soprano_notes": [60, 62, 64, 65]
}
```

### `GET /api/keys`
Get all available tonalities

### `POST /api/change-key`
Switch to different tonality (transposes DNA)

### `POST /api/change-mode`
Switch composition mode

## 💻 Technology Stack

**Backend**: Flask (Python web framework)  
**Frontend**: HTML5, CSS3, Vanilla JavaScript  
**Audio**: Web Audio API, WAV synthesis  
**Algorithms**: Dynamic Programming, Graph Theory (DAG)  
**Architecture**: Stateless REST API with session tokens  

## 📊 Data Format

### Voice Configuration
```json
{
  "S": 72,    // Soprano (high voice) - MIDI value
  "A": 65,    // Alto (mezzo) 
  "T": 60,    // Tenor
  "B": 48     // Bass (low voice)
}
```

### Result Format
```json
{
  "chord": "T",
  "voices": {"S": 72, "A": 65, "T": 60, "B": 48},
  "note_names": {"S": "C5", "A": "F4", "T": "C4", "B": "C3"}
}
```

## 🔄 Version History

- **v3.0** (Current) - Web application with Flask backend
- **v2.0** - Tkinter desktop GUI (legacy, archived in `prototype/`)
- **v1.0** - Original console application

## 🤝 Contributing

Issues and feature requests welcome!

## 📝 License

MIT License - See LICENSE file for details

## 📚 References

- Riemann, Hugo - *Harmony Simplified*
- Kostka, Payne, Almén - *Tonal Harmony*
- Web Audio API Documentation
- Flask Documentation

---

**Last Updated**: 2026-06-09  
**Author**: Harmonic Project Team
