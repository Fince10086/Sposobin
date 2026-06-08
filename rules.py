# rules.py
from tonality import spell_midi

def evaluate_voicing(old_voices, new_voices, last_chord_name, target_chord_name, key_info):
    new_S, new_A, new_T, new_B = new_voices['S'], new_voices['A'], new_voices['T'], new_voices['B']
    
    # Advanced harmonic function validation and state machine checks
    
    # 1. 拦截中音和弦 (III) 倒退：属功能的 III 级严禁向反方向进行到下属功能 (S/s/II)
    if last_chord_name.startswith("DTᵢᵢᵢ") and (target_chord_name.startswith("S") or target_chord_name.startswith("s")):
        return 999999

    # 2. 严格限制普通四六和弦 (T64/t64)：强制其作为辅助/经过和弦，只能回到主功能 (T/t)
    if last_chord_name in ["T₆₄", "t₆₄"]:
        if not (target_chord_name.startswith("T") or target_chord_name.startswith("t")):
            return 999999

    # 3. 规范小调大下属 (多利亚 S)：使用大 IV/II 级后必须走向属功能组 (D/K64)，严禁直接进行到主和弦 (t) 导致调式感模糊
    if key_info["type"] == "MINOR" and last_chord_name in ["S", "S₆", "Sᵢᵢ", "Sᵢᵢ₆"]:
        if target_chord_name.startswith("t"):
            return 999999

    # 4. 规范小调天然七级 (VII)：天然 VII 级严禁直接进行到含还原导音的属和弦 (D)，以防不良对斜
    if key_info["type"] == "MINOR" and last_chord_name == "VII":
        # 允许去 DTiii，但阻止去纯正的 D 组和弦
        if target_chord_name.startswith("D") and not target_chord_name.startswith("DT"):
            return 999999
            
    # ====================================================================

    # In composition mode, apply relaxed register constraints
    if key_info.get("app_mode") != "COMPOSE":
        if not (60 <= new_S <= 81): return 999999  
        if not (55 <= new_A <= 74): return 999999  
        if not (48 <= new_T <= 67): return 999999  
        if not (36 <= new_B <= 62): return 999999  

    if not (new_S >= new_A and new_A >= new_T and new_T > new_B): return 999999
    if (new_S - new_A) > 12 or (new_A - new_T) > 12: return 999999

    old_pcs_set = set(old_voices[v] % 12 for v in ['S', 'A', 'T', 'B'])
    new_pcs_set = set(new_voices[v] % 12 for v in ['S', 'A', 'T', 'B'])
    is_same_chord = len(old_pcs_set.intersection(new_pcs_set)) >= 3

    voice_overlap_penalty = 0
    if not is_same_chord:
        # Voice crossing penalty: high penalty to prevent broken solution paths
        if new_S < old_voices['A']: voice_overlap_penalty += 5000
        if new_A > old_voices['S'] or new_A < old_voices['T']: voice_overlap_penalty += 5000
        if new_T > old_voices['A'] or new_T < old_voices['B']: voice_overlap_penalty += 5000
        if new_B > old_voices['T']: voice_overlap_penalty += 5000
        if voice_overlap_penalty >= 10000: return 999999 # 多重超越直接死刑

    directions = []
    for v in ['S', 'A', 'T', 'B']:
        diff = new_voices[v] - old_voices[v]
        directions.append(1 if diff > 0 else (-1 if diff < 0 else 0))
        
    all_same_dir_penalty = 0
    if directions.count(0) == 0:
        if all(d == 1 for d in directions) or all(d == -1 for d in directions):
            all_same_dir_penalty = 3000 

    bass_diff = new_B - old_voices['B']
    bass_leap = abs(bass_diff)
    bass_penalty = 0
    is_bass_dim5_down = (bass_diff == -6)
    
    if bass_leap > 12 or bass_leap in [10, 11] or (bass_leap == 6 and not is_bass_dim5_down): return 999999
    elif bass_leap == 6 and is_bass_dim5_down: bass_penalty += 80   
    elif bass_leap in [8, 9]: bass_penalty += 50   
    else: bass_penalty += bass_leap * 0.5 

    leap_S = abs(new_S - old_voices['S'])
    leap_A = abs(new_A - old_voices['A'])
    leap_T = abs(new_T - old_voices['T'])
    forbidden_leaps = {10, 11}
    
    is_amnesty_S = False
    if last_chord_name in ["D₃₄", "D₅₆", "D₇", "D⁶", "DD₃₄♭⁵", "DD₂♭⁵", "DD₅₆♭⁵", "DD₇♭⁵", "D₇不完全"] and target_chord_name in ["T", "T不完全", "D", "D₇", "K₆₄", "t", "t不完全"]:
        if leap_S in [5, 7, 0]: is_amnesty_S = True 

    if not is_amnesty_S and (leap_S in forbidden_leaps or leap_S in [5, 7]):
        if leap_S in forbidden_leaps: return 999999

    if forbidden_leaps.intersection({leap_A, leap_T}) and not is_same_chord: return 999999

    old_spells = {v: spell_midi(old_voices[v], key_info, last_chord_name) for v in ['S', 'A', 'T', 'B']}
    new_spells = {v: spell_midi(new_voices[v], key_info, target_chord_name) for v in ['S', 'A', 'T', 'B']}

    if last_chord_name in ["D₇", "D₅₆", "D₃₄", "D₂", "D₇不完全"] and target_chord_name in ["T", "T不完全", "T₆", "t", "t不完全", "t₆", "VI", "VI₆"]:
        for v in ['S', 'A', 'T', 'B']:
            _, old_step, _, _ = old_spells[v]
            if old_step == (key_info["root_step"] + 3) % 7: 
                _, new_step, _, _ = new_spells[v]
                if new_step != (key_info["root_step"] + 2) % 7: 
                    return 999999
                    
    if last_chord_name in ["D", "D₆", "D₇", "D₅₆", "D₃₄", "D₂", "Dᵥᵢᵢ₆", "Dᵥᵢᵢ₇", "D₇不完全"] and target_chord_name in ["T", "T不完全", "T₆", "t", "t不完全", "t₆", "VI", "VI₆"]:
        for v in ['S', 'B']:
            _, old_step, _, _ = old_spells[v]
            if old_step == (key_info["root_step"] + 6) % 7: 
                _, new_step, _, _ = new_spells[v]
                if last_chord_name == "D₆" and target_chord_name == "VI" and v == 'S' and new_step == (key_info["root_step"] + 5) % 7:
                    continue
                if new_step != key_info["root_step"]: 
                    return 999999

    if last_chord_name == "K₆₄" and target_chord_name in ["D", "D₆", "D₇", "D₅₆", "D₃₄", "D₂", "D₉", "D₉♭"]:
        for v in ['S', 'A', 'T']:
            _, old_step, _, _ = old_spells[v]
            if old_step == key_info["root_step"]: 
                _, new_step, _, _ = new_spells[v]
                if new_step != (key_info["root_step"] + 6) % 7:
                    return 999999
            if old_step == (key_info["root_step"] + 2) % 7: 
                _, new_step, _, _ = new_spells[v]
                if new_step not in [(key_info["root_step"] + 1) % 7, (key_info["root_step"] + 3) % 7]:
                    return 999999

    for v in ['S', 'A', 'T', 'B']:
        leap = abs(new_voices[v] - old_voices[v])
        if leap == 3: 
            _, old_step, _, _ = old_spells[v]
            _, new_step, _, _ = new_spells[v]
            step_diff = abs(new_step - old_step)
            if step_diff == 1 or step_diff == 6: 
                return 999999

    if last_chord_name.startswith("T") and target_chord_name.startswith("DD") and "♭⁵" in target_chord_name:
        for v in ['S', 'A', 'T', 'B']:
            root_pc = key_info["root_pc"]
            t_third = (root_pc + (3 if key_info["type"] == "MINOR" else 4)) % 12
            dd_third = (root_pc + 6) % 12
            if old_voices[v] % 12 == t_third and new_voices[v] % 12 == dd_third: 
                return 999999

    false_relation_penalty = 0
    for step in range(7):
        old_alts = {v: old_spells[v][2] for v in ['S', 'A', 'T', 'B'] if old_spells[v][1] == step}
        new_alts = {v: new_spells[v][2] for v in ['S', 'A', 'T', 'B'] if new_spells[v][1] == step}
        for v1, alt1 in old_alts.items():
            for v2, alt2 in new_alts.items():
                if alt1 != alt2 and v1 != v2:
                    if v2 not in old_alts or old_alts[v2] != alt1:
                        false_relation_penalty += 2000 

    # 🌟 修复：反向五八度盲区与平行检查重构
    parallel_penalty = 0
    voice_names = ['S', 'A', 'T', 'B']
    for i in range(len(voice_names)):
        for j in range(i+1, len(voice_names)):
            v1, v2 = voice_names[i], voice_names[j]
            o1, o2 = old_voices[v1], old_voices[v2]
            n1, n2 = new_voices[v1], new_voices[v2]
            
            if o1 == n1 and o2 == n2: continue # 均不移动，合法
            
            v1_diff = n1 - o1
            v2_diff = n2 - o2
            
            is_parallel_motion = (v1_diff * v2_diff) > 0  # 同向运动
            is_contrary_motion = (v1_diff * v2_diff) < 0  # 反向运动
            
            old_interval = abs(o1 - o2) % 12
            new_interval = abs(n1 - n2) % 12
            
            if old_interval == 0 and new_interval == 0:
                if is_parallel_motion:
                    parallel_penalty += 10000 # 平行一/八度
                elif is_contrary_motion:
                    parallel_penalty += 10000 # 反向一/八度
                    
            if old_interval == 7 and new_interval == 7:
                if is_parallel_motion:
                    if "Ger" in last_chord_name and target_chord_name in ["D", "D₆", "D₇", "D₇不完全"]:
                        pass # 莫扎特五度豁免
                    else:
                        parallel_penalty += 10000 # 平行五度
                elif is_contrary_motion:
                    parallel_penalty += 10000 # 反向五度
            
            # 减五度到纯五度（同向平行时严禁）
            if is_parallel_motion and old_interval == 6 and new_interval == 7: 
                parallel_penalty += 2000 
                
            # 隐伏五八度（外声部同向进入完全协和，且高音声部跳进）
            if v1 == 'S' and v2 == 'B':
                if new_interval == 0 or new_interval == 7:
                    if is_parallel_motion and abs(n1 - o1) >= 3: 
                        parallel_penalty += 10000
                            
    if parallel_penalty >= 5000: return 999999

    # Unison penalty to maintain voice independence
    unison_penalty = 0
    if new_S == new_A: unison_penalty += 20
    if new_A == new_T: unison_penalty += 15
    if new_T == new_B: unison_penalty += 20
    
    if unison_penalty > 0:
        # 针对特定变化和弦，大幅提升同度惩罚，避免特性音被合并而失去色彩
        if "ᵥᵢᵢ" in target_chord_name or "⁺⁶" in target_chord_name or "DD" in target_chord_name:
            unison_penalty *= 4

    melody_penalty = 0
    if is_amnesty_S: melody_penalty = 0
    elif leap_S == 0:
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

    return bass_penalty + melody_penalty + inner_penalty + parallel_penalty + false_relation_penalty + all_same_dir_penalty + voice_overlap_penalty + unison_penalty + (20 if is_amnesty_S else 0)