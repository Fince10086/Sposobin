# rules.py
from tonality import spell_midi

def evaluate_voicing(old_voices, new_voices, last_chord_name, target_chord_name, key_info):
    """
    计算两个和弦排列之间的进行成本 (Penalty)。
    当违背核心和声准则（如平行五八度、不规则跳进、增减音程、非法七音解决等）时，返回 999999 以实现硬性阻断。
    """
    new_S, new_A, new_T, new_B = new_voices['S'], new_voices['A'], new_voices['T'], new_voices['B']
    
    # 音域约束放宽，支持极端高音题旋律线下探 (解决 B3/A3 导致断链的问题)
    if key_info.get("app_mode") != "COMPOSE":
        if not (57 <= new_S <= 84): return 999999  # 女高音: A3 - C6
        if not (53 <= new_A <= 74): return 999999  # 女低音: F3 - D5
        if not (45 <= new_T <= 69): return 999999  # 男高音: A2 - A4
        if not (36 <= new_B <= 64): return 999999  # 男低音: C2 - E4

    # 声部间距约束 (Spacing)
    if not (new_S >= new_A and new_A >= new_T and new_T > new_B): return 999999
    if (new_S - new_A) > 12 or (new_A - new_T) > 12: return 999999

    old_pcs_set = set(old_voices[v] % 12 for v in ['S', 'A', 'T', 'B'])
    new_pcs_set = set(new_voices[v] % 12 for v in ['S', 'A', 'T', 'B'])
    is_same_chord = len(old_pcs_set.intersection(new_pcs_set)) >= 3

    # 声部交叉检查 (Voice Crossing)
    voice_overlap_penalty = 0
    if not is_same_chord:
        if new_S < old_voices['A']: voice_overlap_penalty += 5000
        if new_A > old_voices['S'] or new_A < old_voices['T']: voice_overlap_penalty += 5000
        if new_T > old_voices['A'] or new_T < old_voices['B']: voice_overlap_penalty += 5000
        if new_B > old_voices['T']: voice_overlap_penalty += 5000
        if voice_overlap_penalty >= 10000: return 999999

    # 同向进行检查 (Similar Motion)
    directions = []
    for v in ['S', 'A', 'T', 'B']:
        diff = new_voices[v] - old_voices[v]
        directions.append(1 if diff > 0 else (-1 if diff < 0 else 0))
        
    all_same_dir_penalty = 0
    if directions.count(0) == 0:
        if all(d == 1 for d in directions) or all(d == -1 for d in directions):
            all_same_dir_penalty = 3000 

    # 低音进行检查 (Bass Motion)
    bass_diff = new_B - old_voices['B']
    bass_leap = abs(bass_diff)
    bass_penalty = 0
    is_bass_dim5_down = (bass_diff == -6)
    
    if bass_leap > 12 or bass_leap in [10, 11] or (bass_leap == 6 and not is_bass_dim5_down): return 999999
    elif bass_leap == 6 and is_bass_dim5_down: bass_penalty += 80   
    elif bass_leap in [8, 9]: bass_penalty += 50   
    else: bass_penalty += bass_leap * 0.5 

    # 提前拼写音符，供后续音程模与特性解决法则使用
    old_spells = {v: spell_midi(old_voices[v], key_info, last_chord_name) for v in ['S', 'A', 'T', 'B']}
    new_spells = {v: spell_midi(new_voices[v], key_info, target_chord_name) for v in ['S', 'A', 'T', 'B']}

    # 上声部基本跳进幅度
    leap_S = abs(new_S - old_voices['S'])
    leap_A = abs(new_A - old_voices['A'])
    leap_T = abs(new_T - old_voices['T'])

    # 属到主和弦时，旋律音允许四度或五度跳进解决的特殊情况 (供后续罚分参考)
    is_amnesty_S = False
    if last_chord_name in ["D₃₄", "D₅₆", "D₇", "D⁶", "DD₃₄♭⁵", "DD₂♭⁵", "DD₅₆♭⁵", "DD₇♭⁵", "D₇不完全"] and target_chord_name in ["T", "T不完全", "D", "D₇", "K₆₄", "t", "t不完全"]:
        if leap_S in [5, 7, 0]: is_amnesty_S = True 

    # === 核心规则补丁：增减音程与危险跳进通用数学过滤器 ===
    for v in ['S', 'A', 'T', 'B']:
        leap = abs(new_voices[v] - old_voices[v])
        if leap == 0: continue
            
        _, old_step, _, _ = old_spells[v]
        _, new_step, _, _ = new_spells[v]
        
        # 计算自然音级差 (0-6) 与 半音程模 (0-6)
        step_diff = abs(new_step - old_step)
        norm_step = min(step_diff, 7 - step_diff)
        norm_ic = min(leap % 12, 12 - (leap % 12))
        
        is_unclassical_interval = False
        
        # 完美的古典旋律映射法则：一旦音级跨度与物理半音不匹配，必定是增减音程
        if norm_step == 1 and norm_ic not in [1, 2]: is_unclassical_interval = True
        elif norm_step == 2 and norm_ic not in [3, 4]: is_unclassical_interval = True
        elif norm_step == 3 and norm_ic != 5: is_unclassical_interval = True
        elif norm_step == 0 and norm_ic not in [0, 1]: is_unclassical_interval = True

        if is_unclassical_interval:
            # 唯一的古典特例豁免：低音允许减五度下行
            if v == 'B' and leap == 6 and new_voices[v] < old_voices[v]:
                pass 
            # 🌟 新增修复：豁免女高音（Soprano）的硬性阻断。
            # 因为在解题时，既定旋律常包含模进的“分句死音程”（如增四度大跳），引擎无权罢工，必须服从
            elif v == 'S':
                pass 
            else:
                return 999999
                
        # 追加拦截：严格限制内声部与低音的普通大跳（大六度及以上，八度除外）
        if leap in [9, 10, 11] or leap > 12:
            if v != 'S': return 999999

    # 增六和弦 (Augmented Sixth Chords) 的特性解决规则：增六度需向外扩张至纯八度
    if last_chord_name.startswith(("It⁺⁶", "Ger⁺⁶", "Fr⁺⁶")):
        b6_step = (key_info["root_step"] + 5) % 7
        sharp4_step = (key_info["root_step"] + 3) % 7 
        dom_step = (key_info["root_step"] + 4) % 7    

        for v in ['S', 'A', 'T', 'B']:
            _, old_step, _, _ = old_spells[v]
            if old_step == b6_step:
                _, new_step, _, _ = new_spells[v]
                if new_step != dom_step or (new_voices[v] - old_voices[v] != -1): return 999999
            if old_step == sharp4_step:
                _, new_step, _, _ = new_spells[v]
                if new_step != dom_step or (new_voices[v] - old_voices[v] != 1): return 999999

    # 那不勒斯六和弦 (Neapolitan Sixth, N₆) 解决特性：降二级音必须下行解决到导音或主音
    if last_chord_name == "N₆" and target_chord_name in ["D", "D₇", "D₇不完全", "D₆", "K₆₄"]:
        flat2_step = (key_info["root_step"] + 1) % 7 
        lead_step = (key_info["root_step"] + 6) % 7  
        tonic_step = key_info["root_step"]           
        
        for v in ['S', 'A', 'T', 'B']:
            _, old_step, _, _ = old_spells[v]
            if old_step == flat2_step:
                _, new_step, _, _ = new_spells[v]
                if new_step not in [lead_step, tonic_step]: return 999999
                if new_voices[v] >= old_voices[v]: return 999999

    # 辅助四六和弦 (Neighboring 6/4 Chords) 低音持续音要求
    if target_chord_name in ["S₆₄", "s₆₄"] or last_chord_name in ["S₆₄", "s₆₄"]:
        if bass_leap != 0: return 999999

    # 经过四六和弦 (Passing 6/4 Chords) 低音必须保持级进
    if target_chord_name in ["D₆₄", "T₆₄", "t₆₄"]:
        if bass_leap not in [1, 2]: return 999999
    if last_chord_name in ["D₆₄", "T₆₄", "t₆₄"]:
        if bass_leap not in [1, 2]: return 999999

    # 导音解决规则
    if last_chord_name in ["D₇", "D₅₆", "D₃₄", "D₂", "D₇不完全"] and target_chord_name in ["T", "T不完全", "T₆", "t", "t不完全", "t₆", "VI", "VI₆"]:
        for v in ['S', 'A', 'T', 'B']:
            _, old_step, _, _ = old_spells[v]
            if old_step == (key_info["root_step"] + 3) % 7: 
                _, new_step, _, _ = new_spells[v]
                if new_step != (key_info["root_step"] + 2) % 7: return 999999
                    
    if last_chord_name in ["D", "D₆", "D₇", "D₅₆", "D₃₄", "D₂", "Dᵥᵢᵢ₆", "Dᵥᵢᵢ₇", "D₇不完全"] and target_chord_name in ["T", "T不完全", "T₆", "t", "t不完全", "t₆", "VI", "VI₆"]:
        for v in ['S', 'B']:
            _, old_step, _, _ = old_spells[v]
            if old_step == (key_info["root_step"] + 6) % 7: 
                _, new_step, _, _ = new_spells[v]
                if last_chord_name == "D₆" and target_chord_name == "VI" and v == 'S' and new_step == (key_info["root_step"] + 5) % 7:
                    continue
                if new_step != key_info["root_step"]: return 999999

    # K64 终止四六和弦的预备法则
    if last_chord_name == "K₆₄" and target_chord_name in ["D", "D₆", "D₇", "D₅₆", "D₃₄", "D₂", "D₉", "D₉♭"]:
        for v in ['S', 'A', 'T']:
            _, old_step, _, _ = old_spells[v]
            if old_step == key_info["root_step"]: 
                _, new_step, _, _ = new_spells[v]
                if new_step != (key_info["root_step"] + 6) % 7: return 999999
            if old_step == (key_info["root_step"] + 2) % 7: 
                _, new_step, _, _ = new_spells[v]
                if new_step not in [(key_info["root_step"] + 1) % 7, (key_info["root_step"] + 3) % 7]: return 999999

    if last_chord_name.startswith("T") and target_chord_name.startswith("DD") and "♭⁵" in target_chord_name:
        for v in ['S', 'A', 'T', 'B']:
            root_pc = key_info["root_pc"]
            t_third = (root_pc + (3 if key_info["type"] == "MINOR" else 4)) % 12
            dd_third = (root_pc + 6) % 12
            if old_voices[v] % 12 == t_third and new_voices[v] % 12 == dd_third: return 999999

    # 对斜检查 (False Relation)
    false_relation_penalty = 0
    for step in range(7):
        old_alts = {v: old_spells[v][2] for v in ['S', 'A', 'T', 'B'] if old_spells[v][1] == step}
        new_alts = {v: new_spells[v][2] for v in ['S', 'A', 'T', 'B'] if new_spells[v][1] == step}
        for v1, alt1 in old_alts.items():
            for v2, alt2 in new_alts.items():
                if alt1 != alt2 and v1 != v2:
                    if v2 not in old_alts or old_alts[v2] != alt1:
                        false_relation_penalty += 2000 

    # 核心禁忌：平行五度与平行八度检查 (Parallel Fifths & Octaves)
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
                if is_parallel_motion: parallel_penalty += 10000 
                elif is_contrary_motion: parallel_penalty += 10000 
                    
            if old_interval == 7 and new_interval == 7:
                if is_parallel_motion:
                    # 莫扎特五度豁免 (Mozart Fifths Exception)
                    if "Ger" in last_chord_name and target_chord_name in ["D", "D₆", "D₇", "D₇不完全"]:
                        pass 
                    else:
                        parallel_penalty += 10000
                elif is_contrary_motion:
                    parallel_penalty += 10000
            
            if is_parallel_motion and old_interval == 6 and new_interval == 7: parallel_penalty += 2000 
                
            if v1 == 'S' and v2 == 'B':
                # 隐伏八度与隐伏五度 (Hidden Octaves and Fifths)
                if new_interval == 0 or new_interval == 7:
                    if is_parallel_motion and abs(n1 - o1) >= 3: parallel_penalty += 10000
                            
    if parallel_penalty >= 5000: return 999999

    # 同度结构检查 (Unison Configuration)
    unison_penalty = 0
    if new_S == new_A: unison_penalty += 20
    if new_A == new_T: unison_penalty += 15
    if new_T == new_B: unison_penalty += 20
    
    if unison_penalty > 0:
        if "ᵥᵢᵢ" in target_chord_name or "⁺⁶" in target_chord_name or "DD" in target_chord_name:
            unison_penalty *= 4

    # 核心规则补丁：副七和弦 (Secondary Sevenths) 风格与解决约束
    rare_sevenths = ["T₇", "t₇", "VI₇", "DTᵢᵢᵢ₇", "S₇", "s₇"]
    stylistic_penalty = 0

    if target_chord_name in rare_sevenths:
        stylistic_penalty += 2000  
        if leap_S > 2 or leap_A > 2 or leap_T > 2:
            return 999999  
            
    if last_chord_name in rare_sevenths:
        has_step_down = False
        for v in ['S', 'A', 'T', 'B']:
            diff = old_voices[v] - new_voices[v]
            if diff in [1, 2]: 
                has_step_down = True
                break
                
        if not has_step_down:
            return 999999  

    # 旋律跳进与平稳性评估
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

    return bass_penalty + melody_penalty + inner_penalty + parallel_penalty + false_relation_penalty + all_same_dir_penalty + voice_overlap_penalty + unison_penalty + stylistic_penalty + (20 if is_amnesty_S else 0)