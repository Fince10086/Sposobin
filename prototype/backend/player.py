# player.py - Audio generation for web playback

import math
import base64
import io
import wave
import struct

def midi_to_freq(midi_note):
    return 440.0 * (2.0 ** ((midi_note - 69) / 12.0))

def generate_wav_bytes(history):
    sample_rate = 44100  
    bpm = 65             
    duration_per_chord = 60.0 / bpm
    
    wav_io = io.BytesIO()
    with wave.open(wav_io, 'wb') as wav_file:
        wav_file.setnchannels(1)       
        wav_file.setsampwidth(2)       
        wav_file.setframerate(sample_rate)
        
        chord_audio = bytearray()
        
        for index, item in enumerate(history):
            voices = item["voices"]
            freqs = [midi_to_freq(voices[v]) for v in ['S', 'A', 'T', 'B']]
            
            duration = duration_per_chord * 2.0 if index == len(history) - 1 else duration_per_chord
            num_samples = int(sample_rate * duration)
            
            for i in range(num_samples):
                t = i / sample_rate
                
                env = 1.0
                if i < 400: env = i / 400.0
                elif i > num_samples - 400: env = (num_samples - i) / 400.0
                
                sample = 0.0
                for f in freqs:
                    val = math.sin(2.0 * math.pi * f * t)
                    val += 0.50 * math.sin(2.0 * math.pi * (f * 2) * t)
                    val /= 1.5
                    sample += val * 0.6
                
                master_out = sample / 4.0
                pcm_val = int(master_out * env * 32767.0)
                pcm_val = max(-32768, min(32767, pcm_val))
                
                chord_audio.extend(struct.pack('<h', pcm_val))
                
        wav_file.writeframes(chord_audio)
    
    wav_io.seek(0)
    return wav_io.getvalue()

def generate_audio_data_url(history):
    """Generate a data URL for audio playback in browser"""
    wav_bytes = generate_wav_bytes(history)
    b64_data = base64.b64encode(wav_bytes).decode('utf-8')
    return f"data:audio/wav;base64,{b64_data}"
