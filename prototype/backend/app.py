# app.py - Flask web application

from flask import Flask, render_template, request, jsonify
import json
from dna import MAJOR_DNA, MINOR_DNA, AVAILABLE_NOTES
from tonality import KEY_REGISTRY, transpose_dna, spell_midi, midi_to_note_name
from engine import build_full_dag, calculate_best_voicing, get_chord_candidates, v_to_tuple, tuple_to_v
from player import generate_audio_data_url
from rules import evaluate_voicing

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

# Session state - in production, use sessions/database
sessions = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/keys', methods=['GET'])
def get_keys():
    return jsonify(list(KEY_REGISTRY.keys()))

@app.route('/api/init', methods=['POST'])
def init_session():
    data = request.json
    key_name = data.get('key', 'g 小调 (g minor)')
    mode = data.get('mode', 'FREE')
    
    key_info = KEY_REGISTRY.get(key_name, KEY_REGISTRY['g 小调 (g minor)'])
    key_info['app_mode'] = mode
    
    base_db = MAJOR_DNA if key_info["type"] == "MAJOR" else MINOR_DNA
    active_dna_db = transpose_dna(base_db, key_info["shift"])
    
    session_id = str(hash((key_name, mode))) % 999999
    sessions[session_id] = {
        'key_name': key_name,
        'key_info': key_info,
        'active_dna_db': active_dna_db,
        'history': [],
        'target_melody': None,
        'mode': mode
    }
    
    return jsonify({
        'session_id': session_id,
        'key_name': key_name,
        'key_info': key_info,
        'mode': mode
    })

@app.route('/api/generate-voicing', methods=['POST'])
def generate_voicing():
    data = request.json
    session_id = data.get('session_id')
    soprano_notes = data.get('soprano_notes', [])
    
    if session_id not in sessions or not soprano_notes:
        return jsonify({'error': 'Invalid session or empty melody'}), 400
    
    session = sessions[session_id]
    key_info = session['key_info']
    dna_db = session['active_dna_db']
    
    layers = build_full_dag(soprano_notes, dna_db, key_info)
    
    if not layers:
        return jsonify({'error': 'No valid voicing found for this melody'}), 400
    
    # Find best path through DAG
    path_states = []
    current_states = list(layers[0].keys())
    
    if not current_states:
        return jsonify({'error': 'No valid starting chords'}), 400
    
    # Simple greedy path (in production, use full DP)
    current_state = current_states[0]
    path_states.append(current_state)
    
    for layer in layers[1:]:
        next_states = list(current_state[1] for (c, v) in layer.keys() if (c, v) in current_state[1] or True)
        if not next_states and layer:
            current_state = list(layer.keys())[0]
        else:
            current_state = next_states[0] if next_states else list(layer.keys())[0]
        path_states.append(current_state)
    
    # Build result
    result = []
    for chord_name, v_tup in path_states:
        voices = tuple_to_v(v_tup)
        note_names = {v: midi_to_note_name(voices[v], key_info) for v in ['S', 'A', 'T', 'B']}
        result.append({
            'chord': chord_name,
            'voices': voices,
            'note_names': note_names
        })
    
    session['history'] = result
    session['target_melody'] = soprano_notes
    
    return jsonify({
        'voicing': result,
        'audio_url': generate_audio_data_url(result)
    })

@app.route('/api/play-history', methods=['POST'])
def play_history():
    data = request.json
    session_id = data.get('session_id')
    
    if session_id not in sessions or not sessions[session_id]['history']:
        return jsonify({'error': 'No history to play'}), 400
    
    history = sessions[session_id]['history']
    audio_url = generate_audio_data_url(history)
    
    return jsonify({'audio_url': audio_url})

@app.route('/api/get-history', methods=['GET'])
def get_history():
    session_id = request.args.get('session_id')
    
    if session_id not in sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    return jsonify(sessions[session_id]['history'])

@app.route('/api/change-key', methods=['POST'])
def change_key():
    data = request.json
    session_id = data.get('session_id')
    key_name = data.get('key')
    
    if session_id not in sessions or key_name not in KEY_REGISTRY:
        return jsonify({'error': 'Invalid session or key'}), 400
    
    session = sessions[session_id]
    key_info = KEY_REGISTRY[key_name]
    key_info['app_mode'] = session['mode']
    
    base_db = MAJOR_DNA if key_info["type"] == "MAJOR" else MINOR_DNA
    active_dna_db = transpose_dna(base_db, key_info["shift"])
    
    session['key_name'] = key_name
    session['key_info'] = key_info
    session['active_dna_db'] = active_dna_db
    session['history'] = []
    session['target_melody'] = None
    
    return jsonify({
        'key_name': key_name,
        'key_info': key_info
    })

@app.route('/api/change-mode', methods=['POST'])
def change_mode():
    data = request.json
    session_id = data.get('session_id')
    mode = data.get('mode')
    
    if session_id not in sessions or mode not in ['FREE', 'SOPRANO', 'COMPOSE']:
        return jsonify({'error': 'Invalid session or mode'}), 400
    
    session = sessions[session_id]
    session['mode'] = mode
    session['key_info']['app_mode'] = mode
    session['history'] = []
    session['target_melody'] = None
    
    return jsonify({'mode': mode})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
