# dna.py - Harmonic DNA database (complete copy)

MAJOR_DNA = {
    "T": {"next": ["S", "D", "T₆", "S₆", "D₆", "VI", "Sᵢᵢ₆", "D₅₆", "D₃₄", "D₂", "Sᵢᵢ₇", "Sᵢᵢ₅₆", "Dᵥᵢᵢ₇", "Dᵥᵢᵢ₅₆", "DTᵢᵢᵢ", "Dᵥᵢᵢ₆", "D⁶", "T₇", "S₇", "VI₇", "DTᵢᵢᵢ₇", "D₉", "DD", "DD₆", "DD₇", "DD₅₆", "DDᵥᵢᵢ₇", "D₆₄", "S₆₄", "DD₇♭⁵", "DD₅₆♭⁵", "DD₃₄♭⁵", "DD₂♭⁵", "D₇/II", "Dᵥᵢᵢ₇/II", "D₇/IV", "Dᵥᵢᵢ₇/IV", "D₇/VI", "Dᵥᵢᵢ₇/VI", "D₇/III", "Dᵥᵢᵢ₇/III", "N₆", "It⁺⁶", "Ger⁺⁶", "Fr⁺⁶", "s", "s₆", "♭VI", "sᵢᵢ₆", "sᵢᵢ₇", "sᵢᵢ₅₆", "Dᵥᵢᵢ₇♭", "Dᵥᵢᵢ₅₆♭", "D₉♭"], "bass_options": [48, 36], "required": {0, 4, 7}, "max_counts": {4: 1, 7: 1}},
    "t": {"next": ["s", "S", "D", "t₆", "S₆", "s₆", "VI", "♭VI", "D₅₆", "D₃₄", "D₂", "Sᵢᵢ₇", "sᵢᵢ₇", "Dᵥᵢᵢ₇", "Dᵥᵢᵢ₇♭"], "bass_options": [48, 36], "required": {0, 3, 7}, "max_counts": {3: 1, 7: 1}},
    "D": {"next": ["T", "T₆", "VI", "♭VI", "D₇", "D₇不完全", "T₆₄", "t", "t₆"], "bass_options": [43, 55], "required": {7, 11, 2}, "max_counts": {11: 1, 2: 1}},
    "S": {"next": ["D", "T", "T₆", "S₆", "D₆", "K₆₄", "Sᵢᵢ", "Sᵢᵢ₆", "D₇", "D₇不完全", "D₅₆", "D₃₄", "D₂", "Sᵢᵢ₇", "Sᵢᵢ₅₆", "Dᵥᵢᵢ₇", "Dᵥᵢᵢ₆", "D⁶", "S₇", "VI₇", "DD", "DD₆", "DD₇", "DD₅₆", "DDᵥᵢᵢ₇", "T₆₄", "DD₇♭⁵", "DD₅₆♭⁵", "DD₃₄♭⁵", "DD₂♭⁵", "D₇/VI", "Dᵥᵢᵢ₇/VI", "N₆", "It⁺⁶", "Ger⁺⁶", "Fr⁺⁶"], "bass_options": [41, 53], "required": {5, 9, 0}, "max_counts": {9: 1, 0: 1}},
    "VI": {"next": ["S", "S₆", "Sᵢᵢ", "Sᵢᵢ₆", "Sᵢᵢ₇", "Sᵢᵢ₅₆", "DTᵢᵢᵢ", "VI₇", "D", "D₆", "D₇", "D₇不完全", "K₆₄", "D₇/IV", "Dᵥᵢᵢ₇/IV", "N₆", "It⁺⁶", "Ger⁺⁶", "Fr⁺⁶"], "bass_options": [45, 33], "required": {9, 0, 4}, "max_counts": {9: 1, 4: 1}},
    "K₆₄": {"next": ["D", "D₇", "D⁶", "D₉", "D₉♭"], "bass_options": [43, 55], "required": {0, 4, 7}, "max_counts": {0: 1, 4: 1}},
}

MINOR_DNA = {
    "t": {"next": ["s", "D", "t₆", "s₆", "D₆", "VI", "sᵢᵢ₆", "D₅₆", "D₃₄", "D₂", "sᵢᵢ₇", "sᵢᵢ₅₆", "Dᵥᵢᵢ₇", "Dᵥᵢᵢ₅₆", "D⁶", "t₇", "s₇", "VI₇", "D₉", "DD", "DD₆", "DD₇", "DD₅₆", "DDᵥᵢᵢ₇", "D₆₄", "s₆₄", "D₇/iv", "Dᵥᵢᵢ₇/iv", "D₇/VI", "Dᵥᵢᵢ₇/VI", "D₇/III", "Dᵥᵢᵢ₇/III", "D₇/VII", "Dᵥᵢᵢ₇/VII", "N₆", "It⁺⁶", "Ger⁺⁶", "Fr⁺⁶", "S", "S₆", "Sᵢᵢ", "Sᵢᵢ₆", "DD♮⁵", "DD₇♮⁵", "VII", "DTᵢᵢᵢ"], "bass_options": [48, 36], "required": {0, 3, 7}, "max_counts": {3: 1, 7: 1}},
    "D": {"next": ["t", "t₆", "VI", "D₇", "D₇不完全", "t₆₄"], "bass_options": [43, 55], "required": {7, 11, 2}, "max_counts": {11: 1, 2: 1}},
    "VI": {"next": ["s", "s₆", "sᵢᵢ₆", "sᵢᵢ₇", "sᵢᵢ₅₆", "VI₇", "D₇/iv", "Dᵥᵢᵢ₇/iv", "N₆", "It⁺⁶", "Ger⁺⁶", "Fr⁺⁶", "S", "S₆", "Sᵢᵢ", "Sᵢᵢ₆", "DD♮⁵", "DD₇♮⁵", "D", "D₆", "D₇", "D₇不完全", "K₆₄", "VII", "D₇/III", "Dᵥᵢᵢ₇/III", "D₇/VII", "Dᵥᵢᵢ₇/VII"], "bass_options": [44, 32], "required": {8, 0, 3}, "max_counts": {0: 1, 3: 1}},
    "K₆₄": {"next": ["D", "D₇", "D⁶", "D₉"], "bass_options": [43, 55], "required": {0, 3, 7}, "max_counts": {0: 1, 3: 1}},
}

AVAILABLE_NOTES = list(range(36, 96))
