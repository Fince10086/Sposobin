# rules.py - Voice leading evaluation rules

from tonality import spell_midi

def evaluate_voicing(old_voices, new_voices, last_chord_name, target_chord_name, key_info):
    new_S, new_A, new_T, new_B = new_voices['S'], new_voices['A'], new_voices['T'], new_voices['B']
    
    # Basic register constraints
    if key_info.get("app_mode") != "COMPOSE":
        if not (60 <= new_S <= 81): return 999999  
        if not (55 <= new_A <= 74): return 999999  
        if not (48 <= new_T <= 67): return 999999  
        if not (36 <= new_B <= 62): return 999999  

    # Voice ordering constraint
    if not (new_S >= new_A and new_A >= new_T and new_T > new_B): return 999999
    if (new_S - new_A) > 12 or (new_A - new_T) > 12: return 999999

    old_pcs_set = set(old_voices[v] % 12 for v in ['S', 'A', 'T', 'B'])
    new_pcs_set = set(new_voices[v] % 12 for v in ['S', 'A', 'T', 'B'])
    is_same_chord = len(old_pcs_set.intersection(new_pcs_set)) >= 3

    voice_overlap_penalty = 0
    if not is_same_chord:
        if new_S < old_voices['A']: voice_overlap_penalty += 5000
        if new_A > old_voices['S'] or new_A < old_voices['T']: voice_overlap_penalty += 5000
        if new_T > old_voices['A'] or new_T < old_voices['B']: voice_overlap_penalty += 5000
        if new_B > old_voices['T']: voice_overlap_penalty += 5000
        if voice_overlap_penalty >= 10000: return 999999

    # Leap constraints
    leap_S = abs(new_S - old_voices['S'])
    leap_A = abs(new_A - old_voices['A'])
    leap_T = abs(new_T - old_voices['T'])
    forbidden_leaps = {10, 11}
    
    if forbidden_leaps.intersection({leap_A, leap_T}) and not is_same_chord: return 999999

    bass_diff = new_B - old_voices['B']
    bass_leap = abs(bass_diff)
    bass_penalty = 0
    is_bass_dim5_down = (bass_diff == -6)
    
    if bass_leap > 12 or bass_leap in [10, 11] or (bass_leap == 6 and not is_bass_dim5_down): return 999999
    elif bass_leap == 6 and is_bass_dim5_down: bass_penalty += 80   
    elif bass_leap in [8, 9]: bass_penalty += 50   
    else: bass_penalty += bass_leap * 0.5 

    # Direction penalties
    directions = []
    for v in ['S', 'A', 'T', 'B']:
        diff = new_voices[v] - old_voices[v]
        directions.append(1 if diff > 0 else (-1 if diff < 0 else 0))
        
    all_same_dir_penalty = 0
    if directions.count(0) == 0:
        if all(d == 1 for d in directions) or all(d == -1 for d in directions):
            all_same_dir_penalty = 3000 

    # Parallel and contrary motion detection
    parallel_penalty = 0
    voice_names = ['S', 'A', 'T', 'B']
    for i in range(len(voice_names)):
        for j in range(i+1, len(voice_names)):
            v1, v2 = voice_names[i], voice_names[j]
            o1, o2 = old_voices[v1], old_voices[v2]
            n1, n2 = new_voices[v1], new_voices[v2]
            
            if o1 == n1 and o2 == n2: continue
            
            v1_diff = n1 - o1
            v2_diff = n2 - o2
            
            is_parallel_motion = (v1_diff * v2_diff) > 0
            is_contrary_motion = (v1_diff * v2_diff) < 0
            
            old_interval = abs(o1 - o2) % 12
            new_interval = abs(n1 - n2) % 12
            
            if old_interval == 0 and new_interval == 0:
                if is_parallel_motion or is_contrary_motion:
                    parallel_penalty += 10000
                    
            if old_interval == 7 and new_interval == 7:
                if is_parallel_motion:
                    if "Ger" not in last_chord_name:
                        parallel_penalty += 10000
                elif is_contrary_motion:
                    parallel_penalty += 10000
            
            if is_parallel_motion and old_interval == 6 and new_interval == 7: 
                parallel_penalty += 2000 
                
            if v1 == 'S' and v2 == 'B':
                if new_interval == 0 or new_interval == 7:
                    if is_parallel_motion and abs(n1 - o1) >= 3: 
                        parallel_penalty += 10000
                            
    if parallel_penalty >= 5000: return 999999

    # Unison penalty
    unison_penalty = 0
    if new_S == new_A: unison_penalty += 20
    if new_A == new_T: unison_penalty += 15
    if new_T == new_B: unison_penalty += 20

    # Melody penalty
    melody_penalty = 0
    if leap_S == 0:
        if is_same_chord: melody_penalty = 2.0  
        else: melody_penalty = 0.0   
    elif leap_S in [1, 2]: melody_penalty = 0.0  
    elif leap_S in [3, 4, 5]:
        if is_same_chord: melody_penalty = 1.0  
        else: melody_penalty = leap_S * 1.5
    else: melody_penalty = leap_S * 2.0 

    inner_penalty = 0
    for leap in [leap_A, leap_T]:
        if leap == 0: inner_penalty += 0.0
        elif leap in [1, 2]: inner_penalty += leap * 0.5
        elif leap in [3, 4]: inner_penalty += leap * 1.2 
        else: inner_penalty += leap * 2.0 

    return bass_penalty + melody_penalty + inner_penalty + parallel_penalty + all_same_dir_penalty + voice_overlap_penalty + unison_penalty
