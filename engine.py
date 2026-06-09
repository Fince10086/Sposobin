# engine.py
import itertools
from dna import AVAILABLE_NOTES
from rules import evaluate_voicing

def v_to_tuple(v): return (v['S'], v['A'], v['T'], v['B'])
def tuple_to_v(t): return {'S': t[0], 'A': t[1], 'T': t[2], 'B': t[3]}

def get_chord_siblings(chord_name, dna_db):
    """
    返回和声数据库中与 chord_name 具有相同功能属性（转位或离调目标）的集合。
    - 对于副属和弦 (包含 '/'): 匹配所有指向相同目标的和弦。
    - 对于自然音级和弦: 根据根音剥离转位标记，匹配同根音的集合。
    """
    if "/" in chord_name:
        target = chord_name.split("/")[1]
        return [k for k in dna_db if k.endswith("/" + target)]
    else:
        base = chord_name.split('₆')[0].split('₅')[0].split('₃')[0].split('₂')[0].split('₇')[0]
        return [k for k in dna_db if k.startswith(base) and "/" not in k]

def get_chord_candidates(chord_name, dna_db, target_s=None):
    """
    生成特定和弦的合法声部排列（Voicing）候选集。
    
    Args:
        chord_name: 目标和弦名称
        dna_db: 和弦特征数据库
        target_s: 指定的旋律最高音 (Soprano MIDI值)。若为 None，则进行全局排列组合枚举。
    """
    dna = dna_db[chord_name]
    bass_candidates = dna["bass_options"]
    required_classes = dna["required"]
    max_counts = dna.get("max_counts", {})
    
    candidates = []
    for new_bass in bass_candidates:
        if target_s is not None:
            # 允许同度（Unison）发生，扩大合法排列的解空间范围
            new_S = target_s
            lower_bound_A = new_S - 12
            valid_A = [a for a in AVAILABLE_NOTES if lower_bound_A <= a <= new_S]
            for new_A in valid_A:
                lower_bound_T = new_A - 12
                # 男低音必须严格低于男高音，但内声部允许发生同度
                valid_T = [t for t in AVAILABLE_NOTES if lower_bound_T <= t <= new_A and t > new_bass]
                for new_T in valid_T:
                    all_pcs = [new_S % 12, new_A % 12, new_T % 12, new_bass % 12]
                    if set(all_pcs) != required_classes: continue
                    
                    fail_max_counts = False
                    for pc, max_allowed in max_counts.items():
                        if all_pcs.count(pc) > max_allowed:
                            fail_max_counts = True
                            break
                    if not fail_max_counts:
                        candidates.append({'S': new_S, 'A': new_A, 'T': new_T, 'B': new_bass})
        else:
            for combo in itertools.combinations_with_replacement(AVAILABLE_NOTES, 3):
                new_S, new_A, new_T = sorted(combo, reverse=True)
                
                # 同度规则
                if new_S < new_A or new_A < new_T or new_T <= new_bass: continue
                if (new_S - new_A) > 12 or (new_A - new_T) > 12: continue
                    
                all_pcs = [new_S % 12, new_A % 12, new_T % 12, new_bass % 12]
                if set(all_pcs) != required_classes: continue
                
                fail_max_counts = False
                for pc, max_allowed in max_counts.items():
                    if all_pcs.count(pc) > max_allowed:
                        fail_max_counts = True
                        break
                if fail_max_counts: continue
                
                candidates.append({'S': new_S, 'A': new_A, 'T': new_T, 'B': new_bass})
    return candidates

def build_full_dag(target_melody, dna_db, key_info):
    """
    基于目标旋律序列，利用动态规划算法构建完整的有向无环图（DAG）。
    该图包含了所有符合严格和声规则（Voice Leading）的节点路径。
    """
    layers = []
    
    start_candidates = ["T", "T₆", "D", "D₆", "S", "S₆", "D₇", "t", "t₆", "s", "s₆"] 
    
    current_layer = {}
    for c in start_candidates:
        if c not in dna_db: continue
        for v in get_chord_candidates(c, dna_db, target_melody[0]):
            current_layer[(c, v_to_tuple(v))] = {'next': set(), 'prev': set()}
            
    if not current_layer:
        for c in dna_db.keys():
            for v in get_chord_candidates(c, dna_db, target_melody[0]):
                current_layer[(c, v_to_tuple(v))] = {'next': set(), 'prev': set()}
                
    layers.append(current_layer)

    for i in range(1, len(target_melody)):
        next_layer = {}
        tgt_s = target_melody[i]

        all_possible_next_chords = set()
        for (c_name, _), _ in layers[-1].items():
            for nxt in dna_db.get(c_name, {}).get("next", []):
                all_possible_next_chords.add(nxt)
                all_possible_next_chords.update(get_chord_siblings(nxt, dna_db))
            base = c_name.split('₆')[0].split('₅')[0].split('₃')[0].split('₂')[0].split('₇')[0]
            self_and_inv = [k for k in dna_db.keys() if k.split('₆')[0].split('₅')[0].split('₃')[0].split('₂')[0].split('₇')[0] == base and "/" not in k and "/" not in c_name]
            all_possible_next_chords.update(self_and_inv)

        cand_cache = {}
        for nxt_c in all_possible_next_chords:
            if nxt_c in dna_db:
                cand_cache[nxt_c] = get_chord_candidates(nxt_c, dna_db, tgt_s)

        for (c_name, v_tup), node_data in layers[-1].items():
            possible_nexts = set()
            for nxt in dna_db.get(c_name, {}).get("next", []):
                possible_nexts.add(nxt)
                possible_nexts.update(get_chord_siblings(nxt, dna_db))
            base = c_name.split('₆')[0].split('₅')[0].split('₃')[0].split('₂')[0].split('₇')[0]
            possible_nexts.update([k for k in dna_db.keys() if k.split('₆')[0].split('₅')[0].split('₃')[0].split('₂')[0].split('₇')[0] == base and "/" not in k and "/" not in c_name])

            for nxt_c in possible_nexts:
                if nxt_c not in dna_db: continue
                for nxt_v in cand_cache.get(nxt_c, []):
                    # 通过罚分系统进行评估，低于致命阈值（999999）即视为合法连接
                    if evaluate_voicing(tuple_to_v(v_tup), nxt_v, c_name, nxt_c, key_info) < 999999:
                        nxt_state = (nxt_c, v_to_tuple(nxt_v))
                        if nxt_state not in next_layer:
                            next_layer[nxt_state] = {'next': set(), 'prev': set()}
                        next_layer[nxt_state]['prev'].add((c_name, v_tup))
                        node_data['next'].add(nxt_state)

        layers.append(next_layer)
        if not next_layer:
            # 异常处理机制（Fallback）：当标准功能序进路径断裂时，启用全集搜索，
            # 允许系统忽略功能连接图，仅受声部进行法则（Voice Leading）约束。
            prev_layer = layers[-2]  
            fallback_cands = {}
            for nxt_c in dna_db:
                fallback_cands[nxt_c] = get_chord_candidates(nxt_c, dna_db, tgt_s)
            for (c_name, v_tup), node_data in prev_layer.items():
                for nxt_c in dna_db:
                    if nxt_c not in dna_db: continue
                    for nxt_v in fallback_cands.get(nxt_c, []):
                        if evaluate_voicing(tuple_to_v(v_tup), nxt_v, c_name, nxt_c, key_info) < 999999:
                            nxt_state = (nxt_c, v_to_tuple(nxt_v))
                            if nxt_state not in next_layer:
                                next_layer[nxt_state] = {'next': set(), 'prev': set()}
                            next_layer[nxt_state]['prev'].add((c_name, v_tup))
                            node_data['next'].add(nxt_state)
            if not next_layer:
                return None
            layers.pop()
            layers.append(next_layer)

    # 裁剪过程：反向遍历删除无效死端（Dead Ends）
    valid_final_chords = {"T", "T不完全", "T双三", "t", "t不完全"}
    invalid_finals = [state for state in layers[-1].keys() if state[0] not in valid_final_chords]
    
    for inv_state in invalid_finals:
        if len(layers) > 1:
            for prev_state in layers[-1][inv_state]['prev']:
                layers[-2][prev_state]['next'].discard(inv_state)
        del layers[-1][inv_state]
        
    if not layers[-1]: return None

    for i in range(len(layers) - 1, 0, -1):
        dead_states = [state for state, data in layers[i].items() if i != len(layers)-1 and not data['next']]
        for dead in dead_states:
            for prev_state in layers[i][dead]['prev']:
                layers[i-1][prev_state]['next'].discard(dead)
            del layers[i][dead]

    dead_starts = [state for state, data in layers[0].items() if len(layers) > 1 and not data['next']]
    for dead in dead_starts:
        del layers[0][dead]
        
    if not layers[0]: return None
    return layers

def calculate_best_voicing(chord_sequence, initial_voicing, dna_db, key_info, target_melody=None):
    """
    通过 Viterbi 算法，计算已知和弦序列的最佳声部排列路径（最小化进行罚分）。
    """
    dp = [{(chord_sequence[0], v_to_tuple(initial_voicing)): (0, None)}]
    
    for i in range(1, len(chord_sequence)):
        current_chord = chord_sequence[i]
        last_chord = chord_sequence[i-1]
        next_layer = {}
        target_s = target_melody[i] if target_melody and i < len(target_melody) else None
        candidates = get_chord_candidates(current_chord, dna_db, target_s)
        
        for (prev_c, prev_v_tup), (prev_cost, _) in dp[-1].items():
            for curr_v in candidates:
                cost = evaluate_voicing(tuple_to_v(prev_v_tup), curr_v, prev_c, current_chord, key_info)
                if cost < 999999:
                    total_cost = prev_cost + cost
                    curr_state = (current_chord, v_to_tuple(curr_v))
                    if curr_state not in next_layer or total_cost < next_layer[curr_state][0]:
                        next_layer[curr_state] = (total_cost, (prev_c, prev_v_tup))
        if not next_layer: return None
        dp.append(next_layer)
        
    best_final_state = min(dp[-1].items(), key=lambda x: x[1][0])[0]
    
    path = []
    curr_state = best_final_state
    for i in range(len(chord_sequence)-1, -1, -1):
        path.append(tuple_to_v(curr_state[1]))
        curr_state = dp[i][curr_state][1]
        
    path.reverse()
    return path