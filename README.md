# Harmonic

A harmonic voice-leading analysis and composition tool based on Riemann harmony theory. Implements classical voice-leading rules and automated four-part harmony generation using dynamic programming.

## Overview

This tool provides intelligent harmonic analysis and voice-leading suggestions following traditional classical harmony rules. It supports multiple composition modes including free composition, soprano-based writing, and melody composition.

## Modules

- `main.py` - GUI application and main entry point
- `engine.py` - Core voice-leading search engine using DAG-based algorithms
- `rules.py` - Voice-leading validation rules and harmonic function constraints
- `dna.py` - Harmonic DNA database with chord definitions and voice-leading constraints
- `tonality.py` - Key and tonality management, pitch spelling utilities
- `player.py` - MIDI playback functionality
- `renderer.py` - Musical score rendering and visualization

## Getting Started

### Requirements

- Python 3.x

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd Harmonic
```

### Running

```bash
python main.py
```

## License

MIT License
