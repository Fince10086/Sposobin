# tonality.py - Tonality and key management

KEY_REGISTRY = {
    "C 大调 (C Major)":   {"type": "MAJOR", "shift": 0, "sig_type": "none", "sigs": 0, "root_pc": 0, "root_step": 0},
    "G 大调 (G Major)":   {"type": "MAJOR", "shift": -5, "sig_type": "sharp", "sigs": 1, "root_pc": 7, "root_step": 4},
    "D 大调 (D Major)":   {"type": "MAJOR", "shift": 2, "sig_type": "sharp", "sigs": 2, "root_pc": 2, "root_step": 1},
    "A 大调 (A Major)":   {"type": "MAJOR", "shift": -3, "sig_type": "sharp", "sigs": 3, "root_pc": 9, "root_step": 5},
    "F 大调 (F Major)":   {"type": "MAJOR", "shift": 5, "sig_type": "flat", "sigs": 1, "root_pc": 5, "root_step": 3},
    "Bb 大调 (Bb Major)": {"type": "MAJOR", "shift": -2, "sig_type": "flat", "sigs": 2, "root_pc": 10, "root_step": 6},
    "Eb 大调 (Eb Major)": {"type": "MAJOR", "shift": 3, "sig_type": "flat", "sigs": 3, "root_pc": 3, "root_step": 2},
    "c 小调 (c minor)":   {"type": "MINOR", "shift": 0, "sig_type": "flat", "sigs": 3, "root_pc": 0, "root_step": 0},
    "g 小调 (g minor)":   {"type": "MINOR", "shift": -5, "sig_type": "flat", "sigs": 2, "root_pc": 7, "root_step": 4},
    "d 小调 (d minor)":   {"type": "MINOR", "shift": 2, "sig_type": "flat", "sigs": 1, "root_pc": 2, "root_step": 1},
    "a 小调 (a minor)":   {"type": "MINOR", "shift": -3, "sig_type": "none", "sigs": 0, "root_pc": 9, "root_step": 5},
    "e 小调 (e minor)":   {"type": "MINOR", "shift": 4, "sig_type": "sharp", "sigs": 1, "root_pc": 4, "root_step": 2},
    "b 小调 (b minor)":   {"type": "MINOR", "shift": -1, "sig_type": "sharp", "sigs": 2, "root_pc": 11, "root_step": 6},
    "f 小调 (f minor)":   {"type": "MINOR", "shift": 5, "sig_type": "flat", "sigs": 4, "root_pc": 5, "root_step": 3},
}

def transpose_dna(base_dna, shift):
    if shift == 0: return base_dna
    transposed_db = {}
    for chord, rules in base_dna.items():
        transposed_db[chord] = {
            "next": rules["next"],
            "bass_options": [b + shift for b in rules["bass_options"]],
            "required": {(pc + shift) % 12 for pc in rules["required"]},
            "max_counts": {(pc + shift) % 12: count for pc, count in rules["max_counts"].items()}
        }
    return transposed_db

NATURAL_PCS = {0: 0, 1: 2, 2: 4, 3: 5, 4: 7, 5: 9, 6: 11}
REL_MAP = {
    0: (0, 0), 1: (1, -1), 2: (1, 0), 3: (2, -1),
    4: (2, 0), 5: (3, 0), 6: (3, 1), 7: (4, 0),
    8: (5, -1), 9: (5, 0), 10: (6, -1), 11: (6, 0)
}
LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

def spell_midi(midi_note, key_info, chord_name=""):
    root_pc = key_info["root_pc"]
    root_step = key_info["root_step"]
    
    pc = midi_note % 12
    rel_pc = (pc - root_pc) % 12
    rel_step, rel_alt = REL_MAP[rel_pc]
    
    if "/" in chord_name and "♭" not in chord_name:
        target = chord_name.split("/")[1]
        if key_info["type"] == "MAJOR":
            if target == "II":
                if rel_pc == 1: rel_step, rel_alt = 0, 1
            elif target == "III":
                if rel_pc == 3: rel_step, rel_alt = 1, 1
            elif target == "VI":
                if rel_pc == 8: rel_step, rel_alt = 4, 1
        elif key_info["type"] == "MINOR":
            if target == "III":
                if rel_pc == 11: rel_step, rel_alt = 0, -1
            elif target == "VI":
                if rel_pc == 4: rel_step, rel_alt = 3, -1
            elif target == "VII":
                if rel_pc == 6: rel_step, rel_alt = 4, -1

    abs_step = (root_step + rel_step) % 7
    natural_pc = NATURAL_PCS[abs_step]
    
    abs_alt = (pc - natural_pc + 6) % 12 - 6
    octave = (midi_note - natural_pc - abs_alt) // 12 - 1
    
    return LETTERS[abs_step], abs_step, abs_alt, octave

def midi_to_note_name(midi_note, key_info):
    letter, step, alt, octave = spell_midi(midi_note, key_info)
    
    alt_str = ""
    if alt == 1: alt_str = "♯"
    elif alt == 2: alt_str = "♯♯"
    elif alt == -1: alt_str = "♭"
    elif alt == -2: alt_str = "♭♭"
    
    return f"{letter}{alt_str}{octave}"
