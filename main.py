# main.py
import tkinter as tk
from tkinter import ttk
import tkinter.messagebox
import re
import time 
from dna import MAJOR_DNA, MINOR_DNA
from tonality import KEY_REGISTRY, transpose_dna, spell_midi
from engine import calculate_best_voicing, get_chord_candidates, build_full_dag, v_to_tuple, tuple_to_v, get_chord_siblings
from player import play_history, stop_audio
from renderer import ScoreRenderer
from rules import evaluate_voicing  # 🌟 核心修复：引入法则判决引擎！

import ctypes
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(1)
except:
    try: ctypes.windll.user32.SetProcessDPIAware()
    except: pass

class HarmonyApp:
    def __init__(self, root):
        self.root = root
        self.root.title("斯波索宾 AI 和声引擎 - 步进写作终极修复版 (V26.0)")
        self.root.geometry("1150x880") 
        self.root.configure(bg="#F8F9FA")

        self.selected_key_name = "g 小调 (g minor)"
        self.key_info = KEY_REGISTRY[self.selected_key_name]
        self.active_dna_db = transpose_dna(MINOR_DNA, self.key_info["shift"])

        self.history = []
        self.target_melody = None 
        self.app_mode = "FREE"    
        self.input_midi_sequence = [] 
        self.dag_layers = None
        self.playback_index = None  
        self.pending_melody_note = None 

        self.base_width = 1150
        self.base_height = 880
        self.scale = 1.0
        self._font_cache = {}  # 字体缓存加快速度

        self.setup_ui()
        self.renderer = ScoreRenderer(self.canvas)
        self.renderer.on_history_click = self.revert_history
        self.clear_canvas()
        
        self.root.bind("<Configure>", self.on_window_resize, add="+")

    def setup_ui(self):
        self.key_info["app_mode"] = self.app_mode

        header_frame = tk.Frame(self.root, bg="#F8F9FA")
        header_frame.pack(fill=tk.X, padx=40, pady=(20, 5))
        
        tk.Label(header_frame, text="斯波索宾 AI 和声工作站", font=("Microsoft YaHei", 18, "bold"), bg="#F8F9FA", fg="#2C3E50").pack(side=tk.LEFT)
        
        self.mode_var = tk.StringVar(value="FREE")
        tk.Radiobutton(header_frame, text="自由模式", variable=self.mode_var, value="FREE", command=self.on_mode_change, font=("Microsoft YaHei", 12, "bold"), bg="#F8F9FA", fg="#2C3E50", cursor="hand2").pack(side=tk.LEFT, padx=(30, 5))
        tk.Radiobutton(header_frame, text="高音题模式", variable=self.mode_var, value="SOPRANO", command=self.on_mode_change, font=("Microsoft YaHei", 12, "bold"), bg="#F8F9FA", fg="#E67E22", cursor="hand2").pack(side=tk.LEFT, padx=5)
        tk.Radiobutton(header_frame, text="旋律写作模式", variable=self.mode_var, value="COMPOSE", command=self.on_mode_change, font=("Microsoft YaHei", 12, "bold"), bg="#F8F9FA", fg="#8E44AD", cursor="hand2").pack(side=tk.LEFT, padx=5)
        
        tk.Label(header_frame, text="全局调性：", font=("Microsoft YaHei", 11, "bold"), bg="#F8F9FA", fg="#6C757D").pack(side=tk.LEFT, padx=(15, 5))
        self.key_combobox = ttk.Combobox(header_frame, values=list(KEY_REGISTRY.keys()), state="readonly", font=("Microsoft YaHei", 11), width=18)
        self.key_combobox.set(self.selected_key_name)
        self.key_combobox.pack(side=tk.LEFT)
        self.key_combobox.bind("<<ComboboxSelected>>", self.on_key_changed)

        self.soprano_frame = tk.Frame(self.root, bg="#FFF3E0", highlightbackground="#F39C12", highlightthickness=1)
        tk.Label(self.soprano_frame, text="旋律:", font=("Microsoft YaHei", 10, "bold"), bg="#FFF3E0", fg="#D35400").pack(side=tk.LEFT, padx=10)
        
        self.pk_canvas = tk.Canvas(self.soprano_frame, height=105, bg="white", highlightthickness=0)
        self.pk_canvas.pack(side=tk.LEFT, pady=10)
        self.draw_piano_keyboard()

        self.seq_frame = tk.Frame(self.soprano_frame, bg="#FFF3E0")
        self.seq_frame.pack(side=tk.LEFT, padx=15, fill=tk.Y, pady=10)
        
        self.melody_entry_var = tk.StringVar()
        self.melody_entry = tk.Entry(self.seq_frame, textvariable=self.melody_entry_var, font=("Consolas", 12, "bold"), bg="white", fg="#2C3E50", width=25)
        self.melody_entry.pack(side=tk.TOP, fill=tk.X, ipady=3)
        
        btn_frame = tk.Frame(self.seq_frame, bg="#FFF3E0")
        btn_frame.pack(side=tk.TOP, fill=tk.X, pady=(5, 0))
        tk.Button(btn_frame, text="撤销", command=self.undo_note, font=("Microsoft YaHei", 9), padx=5, cursor="hand2").pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0, 2))
        tk.Button(btn_frame, text="清空", command=self.clear_notes, font=("Microsoft YaHei", 9), padx=5, cursor="hand2").pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(2, 0))

        self.gen_btn = tk.Button(self.soprano_frame, text="▶ 全局穷举\n生成题解", font=("Microsoft YaHei", 10, "bold"), command=self.start_soprano_mode, bg="#E67E22", fg="white", relief="flat", cursor="hand2", padx=8, pady=8)
        self.gen_btn.pack(side=tk.LEFT, padx=(10, 20))

        self.canvas_frame = tk.Frame(self.root, bg="#F8F9FA")
        self.canvas_frame.pack(fill=tk.X, padx=40, pady=10)
        
        self.canvas = tk.Canvas(self.canvas_frame, height=220, bg="white", highlightbackground="#DEE2E6")
        self.scrollbar = tk.Scrollbar(self.canvas_frame, orient=tk.HORIZONTAL, command=self.canvas.xview)
        self.canvas.configure(xscrollcommand=self.scrollbar.set)
        self.canvas.pack(side=tk.TOP, fill=tk.X, expand=True)
        self.scrollbar.pack(side=tk.BOTTOM, fill=tk.X)

        self.status_lbl = tk.Label(self.root, text="", font=("Microsoft YaHei", 11, "bold"), bg="#F8F9FA", fg="#6C757D")
        self.status_lbl.pack(pady=(15, 5))
        
        self.main_wrapper = tk.Frame(self.root, bg="#F8F9FA")
        self.main_wrapper.pack(fill=tk.BOTH, expand=True, padx=40, pady=(0, 5))
        
        self.btn_canvas = tk.Canvas(self.main_wrapper, bg="#F8F9FA", highlightthickness=0)
        self.btn_scrollbar = ttk.Scrollbar(self.main_wrapper, orient=tk.VERTICAL, command=self.btn_canvas.yview)
        self.main_split_frame = tk.Frame(self.btn_canvas, bg="#F8F9FA")
        
        self.btn_window = self.btn_canvas.create_window((0, 0), window=self.main_split_frame, anchor="nw")
        self.btn_canvas.bind("<Configure>", lambda e: self.btn_canvas.itemconfig(self.btn_window, width=e.width))
        self.btn_canvas.configure(yscrollcommand=self.btn_scrollbar.set)
        self.btn_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.btn_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.btn_canvas.bind_all("<MouseWheel>", self._on_mousewheel)

        self.control_frame = tk.Frame(self.root, bg="#F8F9FA")
        self.control_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=10)
        self.control_inner = tk.Frame(self.control_frame, bg="#F8F9FA")
        self.control_inner.pack()

        self.btn_play = tk.Button(self.control_inner, text="▶ 试听全曲", font=("Microsoft YaHei", 11, "bold"), command=self.play_full_song, bg="#2ECC71", fg="white", relief="flat", cursor="hand2", padx=15, pady=4)
        self.btn_play.pack(side=tk.LEFT, padx=5)
        self.btn_stop = tk.Button(self.control_inner, text="⏹ 停止", font=("Microsoft YaHei", 11, "bold"), command=self.stop_playback, bg="#95A5A6", fg="white", relief="flat", cursor="hand2", padx=10, pady=4)
        self.btn_stop.pack(side=tk.LEFT, padx=(5, 20))
        self.btn_clear = tk.Button(self.control_inner, text="🗑️ 清空画板", font=("Microsoft YaHei", 10, "bold"), command=self.clear_canvas, bg="#E74C3C", fg="white", relief="flat", cursor="hand2", padx=15, pady=4)
        self.btn_clear.pack(side=tk.LEFT, padx=5)

    def _on_mousewheel(self, event):
        if self.btn_canvas.winfo_containing(event.x_root, event.y_root) == self.btn_canvas:
            self.btn_canvas.yview_scroll(int(-1*(event.delta/120)), "units")

    def on_window_resize(self, event):
        """窗口缩放时自适应调整各组件尺寸"""
        if event.widget != self.root:
            return
        w = max(event.width, 800)
        h = max(event.height, 600)
        new_scale = min(w / self.base_width, h / self.base_height)
        new_scale = max(0.65, min(new_scale, 1.8))  # 限制缩放范围
        
        if abs(new_scale - self.scale) < 0.03:
            return  # 避免频繁刷新
        
        self.scale = new_scale
        s = self.scale
        
        # 更新乐谱画布高度
        self.canvas.config(height=max(160, int(220 * s)))
        
        # 更新状态栏字体
        fs = max(9, int(11 * s))
        self.status_lbl.config(font=("Microsoft YaHei", fs, "bold"))
        
        # 更新控制按钮字体
        fs_btn = max(9, int(11 * s))
        self.btn_play.config(font=("Microsoft YaHei", fs_btn, "bold"))
        self.btn_stop.config(font=("Microsoft YaHei", fs_btn, "bold"))
        fs_clr = max(8, int(10 * s))
        self.btn_clear.config(font=("Microsoft YaHei", fs_clr, "bold"))
        
        # 更新 header 字体 (找 header 中的 label)
        for child in self.root.winfo_children():
            if isinstance(child, tk.Frame) and child.winfo_children():
                for sub in child.winfo_children():
                    if isinstance(sub, tk.Label) and "斯波索宾" in sub.cget("text"):
                        sub.config(font=("Microsoft YaHei", max(14, int(18 * s)), "bold"))
                    if isinstance(sub, ttk.Combobox):
                        sub.config(font=("Microsoft YaHei", max(9, int(11 * s))))
        
        # 更新 soprano_frame 中的标签字体
        if self.soprano_frame.winfo_viewable():
            for child in self.soprano_frame.winfo_children():
                if isinstance(child, tk.Label) and child.cget("text") == "旋律:":
                    child.config(font=("Microsoft YaHei", max(8, int(10 * s)), "bold"))
                if isinstance(child, tk.Button):
                    child.config(font=("Microsoft YaHei", max(8, int(10 * s)), "bold"))
        
        # 更新钢琴键盘高度
        pk_h = max(70, int(105 * s))
        self.pk_canvas.config(height=pk_h)
        if hasattr(self, 'pk_canvas'):
            self.redraw_piano_scaled()
        
        # 更新 header 中的 RadioButton 字体
        for child in self.root.winfo_children():
            if isinstance(child, tk.Frame):
                for sub in child.winfo_children():
                    if isinstance(sub, tk.Radiobutton):
                        sub.config(font=("Microsoft YaHei", max(9, int(12 * s)), "bold"))

    def draw_piano_keyboard(self):
        self._draw_piano(scale=1.0)

    def redraw_piano_scaled(self):
        self._draw_piano(scale=self.scale)

    def _draw_piano(self, scale=1.0):
        """根据缩放比例绘制钢琴键盘，固定范围 A3(45)~A#5(80)"""
        self.pk_canvas.delete("all")
        start_midi = 45  # A3
        end_midi = 80    # A#5

        white_midi = []
        black_midi = []
        for m in range(start_midi, end_midi + 1):
            if m % 12 in [0, 2, 4, 5, 7, 9, 11]: white_midi.append(m)
            else: black_midi.append(m)

        key_w = max(16, int(26 * scale))
        key_h = max(60, int(105 * scale))
        midi_to_x = {}

        for i, midi in enumerate(white_midi):
            x0 = i * key_w
            midi_to_x[midi] = x0
            rect = self.pk_canvas.create_rectangle(x0, 0, x0 + key_w, key_h, fill="white", outline="#34495E", activefill="#EAECEE", width=max(1, int(1.5 * scale)))
            self.pk_canvas.tag_bind(rect, "<Button-1>", lambda e, n=midi: self.on_piano_key(n))

            if midi % 12 == 0:
                oct_num = (midi // 12) - 1
                fs = max(5, int(8 * scale))
                self.pk_canvas.create_text(x0 + key_w / 2, key_h - max(10, int(15 * scale)), text=f"C{oct_num}", font=("Arial", fs, "bold"), fill="#7F8C8D")

        for midi in black_midi:
            left_x = midi_to_x.get(midi - 1, 0)
            bw = max(10, int(16 * scale))
            rect = self.pk_canvas.create_rectangle(left_x + key_w - bw / 2, 0, left_x + key_w + bw / 2, key_h * 0.6, fill="#2C3E50", outline="#2C3E50", activefill="#5D6D7E", width=max(1, int(1.5 * scale)))
            self.pk_canvas.tag_bind(rect, "<Button-1>", lambda e, n=midi: self.on_piano_key(n))

        self.pk_canvas.config(width=len(white_midi) * key_w)

    def on_piano_key(self, midi_note):
        if self.app_mode == "COMPOSE":
            self.pending_melody_note = midi_note
            self.update_ui()
        else:
            letter, abs_step, abs_alt, oct_res = spell_midi(midi_note, self.key_info, "")
            symbol = {-2: "bb", -1: "b", 0: "", 1: "#", 2: "x"}[abs_alt]
            note_str = f"{letter}{symbol}{oct_res}"
            current_text = self.melody_entry_var.get().strip()
            new_text = current_text + (" " if current_text else "") + note_str
            self.melody_entry_var.set(new_text)

    def undo_note(self):
        current = self.melody_entry_var.get().strip()
        if current:
            tokens = current.split()
            if tokens:
                tokens.pop()
                self.melody_entry_var.set(" ".join(tokens))
                self.target_melody = self.parse_melody_str(self.melody_entry_var.get().strip())
                if self.app_mode == "COMPOSE": self.update_ui()

    def clear_notes(self):
        self.melody_entry_var.set("")
        self.target_melody = None
        if self.app_mode == "COMPOSE": self.update_ui()

    def on_mode_change(self):
        self.app_mode = self.mode_var.get()
        self.key_info["app_mode"] = self.app_mode 
        self.pending_melody_note = None 
        self.stop_playback()

        if self.app_mode == "COMPOSE":
            self.soprano_frame.pack(fill=tk.X, padx=40, pady=(0, 5), after=self.root.winfo_children()[0])
            self.key_combobox.config(state=tk.DISABLED)
            self.seq_frame.pack_forget() 
            self.gen_btn.pack_forget()   
            self.target_melody = []      
            self.history = []
            self.dag_layers = None
            self.update_ui()
        elif self.app_mode == "SOPRANO":
            self.soprano_frame.pack(fill=tk.X, padx=40, pady=(0, 5), after=self.root.winfo_children()[0])
            self.key_combobox.config(state=tk.DISABLED)
            self.seq_frame.pack(side=tk.LEFT, padx=15, fill=tk.Y, pady=10) 
            self.gen_btn.pack(side=tk.LEFT, padx=(10, 20))
            self.target_melody = self.parse_melody_str(self.melody_entry_var.get().strip())
            self.history = []
            self.dag_layers = None
            self.update_ui()
        else:
            self.soprano_frame.pack_forget()
            self.key_combobox.config(state="readonly")
            self.target_melody = None
            self.dag_layers = None
            self.history = []
            self.clear_canvas()

    def parse_melody_str(self, text):
        midi_notes = []
        tokens = re.findall(r'([A-Ga-g])(bb|b|♭|##|x|#|♯)?\s*(\d)', text)
        if not tokens: return None
        note_names = {'C':0, 'D':2, 'E':4, 'F':5, 'G':7, 'A':9, 'B':11}
        for letter, acc, oct_str in tokens:
            base = note_names[letter.upper()]
            acc = acc.lower()
            alt = 0
            if acc in ['#', '♯']: alt = 1
            elif acc in ['##', 'x']: alt = 2
            elif acc in ['b', '♭']: alt = -1
            elif acc == 'bb': alt = -2
            octave = int(oct_str)
            midi_notes.append((octave + 1) * 12 + base + alt)
        return midi_notes

    def start_soprano_mode(self):
        text = self.melody_entry_var.get().strip()
        if not text:
            tk.messagebox.showerror("序列为空", "请录入旋律！可弹奏左侧键盘或直接复制粘贴文本。")
            return
        parsed = self.parse_melody_str(text)
        if not parsed:
            tk.messagebox.showerror("格式错误", "无法解析旋律文本！")
            return
        self.target_melody = parsed
        self.dag_layers = build_full_dag(self.target_melody, self.active_dna_db, self.key_info)
        
        if not self.dag_layers:
            tk.messagebox.showerror("此题无解！", "经过 AI 上帝视角穷举，这组高音序列在严苛的古典法则下没有完整通路！")
            show_dp_debugger_window(self.target_melody, self.history, self.active_dna_db, self.key_info)
            self.target_melody = None
            return
            
        self.history = []
        self.key_combobox.config(state=tk.DISABLED)
        self.update_ui()

    def on_key_changed(self, event=None):
        self.selected_key_name = self.key_combobox.get()
        self.key_info = KEY_REGISTRY[self.selected_key_name]
        self.key_info["app_mode"] = self.app_mode
        base_db = MAJOR_DNA if self.key_info["type"] == "MAJOR" else MINOR_DNA
        self.active_dna_db = transpose_dna(base_db, self.key_info["shift"])
        self.clear_canvas()

    def revert_history(self, index):
        if self.app_mode == "COMPOSE": self.pending_melody_note = None
        if 0 <= index < len(self.history):
            self.stop_playback()
            self.history = self.history[:index+1]
            if self.app_mode == "COMPOSE" and self.target_melody:
                self.target_melody = self.target_melody[:index+1]
            if self.app_mode == "SOPRANO":
                tokens = self.melody_entry_var.get().strip().split()
                if tokens: self.melody_entry_var.set(" ".join(tokens[:index+1]))
            self.update_ui()
            play_history([self.history[-1]]) 

    def clear_canvas(self):
        self.stop_playback()
        self.history = []
        self.pending_melody_note = None
        if self.app_mode == "COMPOSE": self.target_melody = []
        self.update_ui()

    def update_ui(self):
        self.renderer.draw_entire_score(self.history, self.key_info, self.target_melody, self.playback_index, self.pending_melody_note)
        
        if hasattr(self, 'main_split_frame') and self.main_split_frame.winfo_exists():
            self.main_split_frame.destroy()
            
        self.main_split_frame = tk.Frame(self.btn_canvas, bg="#F8F9FA")
        self.main_split_frame.bind("<Configure>", lambda e: self.btn_canvas.configure(scrollregion=self.btn_canvas.bbox("all")))
        self.btn_canvas.itemconfig(self.btn_window, window=self.main_split_frame)

        if self.app_mode == "SOPRANO":
            if self.target_melody and len(self.history) >= len(self.target_melody):
                tk.Label(self.main_split_frame, text="🎉 恭喜！这道高音题已被你完美破解！", font=("Microsoft YaHei", 16, "bold"), bg="#F8F9FA", fg="#27AE60").pack(pady=40)
                return

        next_chords = []

        if not self.history:
            if self.app_mode == "SOPRANO" and self.target_melody:
                self.status_lbl.config(text=f"当前挑战第 1/{len(self.target_melody)} 个音，AI 已为您展开完整通路：")
                valid_states = self.dag_layers[0].keys()
                next_chords = list(set([state[0] for state in valid_states]))
            elif self.app_mode == "COMPOSE":
                if self.pending_melody_note is None:
                    self.status_lbl.config(text="🎹 旋律写作模式：请在上方宽阔的钢琴上点选你的第 1 个音...")
                else:
                    self.status_lbl.config(text=f"🎶 已放置高音（亮橙色），AI 引擎推荐以下起手和弦：")
                    tgt_s = self.pending_melody_note
                    for c_name in self.active_dna_db.keys():
                        if get_chord_candidates(c_name, self.active_dna_db, tgt_s):
                            next_chords.append(c_name)
                    if not next_chords:
                        self.status_lbl.config(text=f"⚠️ 警告：古典和声库中没有任何一个和弦能够包含你选择的音符，请换一个音。")
            else:
                self.status_lbl.config(text="创世时刻：请选择你的起手和弦 (左侧：本调功能组 | 右侧：离调通道)：")
                next_chords = list(self.active_dna_db.keys())
        else:
            current_item = self.history[-1]
            current_chord_name = current_item["chord"]
            
            if self.app_mode == "SOPRANO":
                self.status_lbl.config(text=f"当前挑战第 {len(self.history)+1}/{len(self.target_melody)} 个音，当前备选池 100% 安全：")
                step = len(self.history)
                if step >= len(self.target_melody): return
                
                last_state = (current_chord_name, v_to_tuple(current_item["voices"]))
                state_data = self.dag_layers[step-1].get(last_state)
                if not state_data: return
                valid_next_states = state_data['next']
                next_chords = list(set([state[0] for state in valid_next_states]))
                
            elif self.app_mode == "COMPOSE":
                if self.pending_melody_note is None:
                    self.status_lbl.config(text=f"🎹 已完成 {len(self.history)} 个和弦，请继续在上方钢琴点选下一个旋律音...")
                else:
                    self.status_lbl.config(text=f"🎶 已接收第 {len(self.history)+1} 个旋律音，AI 引擎结合古典法则得出以下完美连接：")
                    tgt_s = self.pending_melody_note
                    last_c = current_chord_name
                    last_v = current_item["voices"]
                    
                    possible_nexts = set()
                    for nxt in self.active_dna_db.get(last_c, {}).get("next", []):
                        possible_nexts.add(nxt)
                        possible_nexts.update(get_chord_siblings(nxt, self.active_dna_db))
                    base = last_c.split('₆')[0].split('₅')[0].split('₃')[0].split('₂')[0].split('₇')[0]
                    possible_nexts.update([k for k in self.active_dna_db.keys() if k.split('₆')[0].split('₅')[0].split('₃')[0].split('₂')[0].split('₇')[0] == base and "/" not in k and "/" not in last_c])
                    
                    for nxt_c in possible_nexts:
                        if nxt_c not in self.active_dna_db: continue
                        for nxt_v in get_chord_candidates(nxt_c, self.active_dna_db, tgt_s):
                            if evaluate_voicing(tuple_to_v(v_to_tuple(last_v)), nxt_v, last_c, nxt_c, self.key_info) < 999999:
                                next_chords.append(nxt_c)
                                break 
                    
                    if not next_chords and self.target_melody:
                        # 🛡️ 排列法重试保险：当前排列法连不上，尝试前一个和弦的所有其他排列法
                        prev_midi = self.target_melody[-1]
                        alt_voicings = get_chord_candidates(last_c, self.active_dna_db, prev_midi)
                        alt_voicings = [v for v in alt_voicings if v != last_v]
                        
                        found_alt = False
                        for alt_v in alt_voicings:
                            for nxt_c in possible_nexts:
                                if nxt_c in next_chords: continue
                                if nxt_c not in self.active_dna_db: continue
                                for nxt_v in get_chord_candidates(nxt_c, self.active_dna_db, tgt_s):
                                    if evaluate_voicing(tuple_to_v(v_to_tuple(alt_v)), nxt_v, last_c, nxt_c, self.key_info) < 999999:
                                        next_chords.append(nxt_c)
                                        found_alt = True
                                        self.history[-1]["voices"] = alt_v
                                        break
                                if nxt_c in next_chords: break
                            if found_alt: break
                        
                        if next_chords:
                            self.status_lbl.config(text=f"🎶 AI 已自动切换前一个和弦的排列法来接通此旋律音：")
                        else:
                            # 🛡️ 终极兜底：排列法切换也不行，启动全库大搜索
                            for nxt_c in self.active_dna_db:
                                if nxt_c in next_chords: continue
                                for nxt_v in get_chord_candidates(nxt_c, self.active_dna_db, tgt_s):
                                    if evaluate_voicing(tuple_to_v(v_to_tuple(last_v)), nxt_v, last_c, nxt_c, self.key_info) < 999999:
                                        next_chords.append(nxt_c)
                                        break
                                if nxt_c in next_chords: break
                            
                            if next_chords:
                                self.status_lbl.config(text=f"🎶 AI 已启用全库搜索找到非常规连接：")
                            else:
                                self.status_lbl.config(text=f"⚠️ 即使切换了前一个和弦的所有排列法，仍无法避免平行五度或声部交叉。请更换旋律音！", fg="#E74C3C")
                    elif not next_chords:
                        self.status_lbl.config(text=f"⚠️ 无法连接：此旋律音会导致平行五度、声部交叉或极度跳进，已被 AI 拦截。请更换旋律音！", fg="#E74C3C")
            else:
                raw_next_chords = self.active_dna_db.get(current_chord_name, {}).get("next", [])
                if not raw_next_chords:
                    tk.Label(self.main_split_frame, text="已到达终止线", bg="#F8F9FA", font=("Microsoft YaHei", 12)).pack()
                    return
                self.status_lbl.config(text="后续和弦通路连接 (左侧：本调功能组 | 右侧：离调副属通道)：")
                next_chords = raw_next_chords

        left_panel = tk.Frame(self.main_split_frame, bg="#F8F9FA")
        left_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        ttk.Separator(self.main_split_frame, orient='vertical').pack(side=tk.LEFT, fill=tk.Y, padx=20)
        right_panel = tk.Frame(self.main_split_frame, bg="#F8F9FA")
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        diatonic_cats = {"主功能组 (T / t / DT)": [], "下属功能组 (S / s / VI)": [], "变和弦组 (N / +6)": [], "属功能组 (D / K / VII)": [], "导功能组 (Dᵥᵢᵢ)": [], "重属功能组 (DD)": []}
        tonicization_cats = {}

        for chord in next_chords:
            if "/" in chord:
                target_deg = chord.split("/")[1]
                cat_name = f"离调至 {target_deg} 级"
                if cat_name not in tonicization_cats: tonicization_cats[cat_name] = []
                tonicization_cats[cat_name].append(chord)
            else:
                if chord.startswith("N") or chord.startswith("It") or chord.startswith("Ger") or chord.startswith("Fr"): diatonic_cats["变和弦组 (N / +6)"].append(chord)
                elif chord.startswith("DD"): diatonic_cats["重属功能组 (DD)"].append(chord)
                elif chord.startswith("Dᵥᵢᵢ"): diatonic_cats["导功能组 (Dᵥᵢᵢ)"].append(chord)
                elif chord.startswith("T") or chord.startswith("t") or chord.startswith("DT"): diatonic_cats["主功能组 (T / t / DT)"].append(chord)
                elif chord.startswith("S") or chord.startswith("s") or chord.startswith("VI"): diatonic_cats["下属功能组 (S / s / VI)"].append(chord)
                elif chord.startswith("♭VII") or chord.startswith("♭VI") or chord.startswith("♭III"): diatonic_cats["下属功能组 (S / s / VI)"].append(chord)
                elif chord.startswith("D") or chord.startswith("K") or chord.startswith("VII"): diatonic_cats["属功能组 (D / K / VII)"].append(chord)

        theme_color = "#2980B9" if self.key_info["type"] == "MAJOR" else "#8E44AD"
        hover_color = "#EBF5FB" if self.key_info["type"] == "MAJOR" else "#F4ECF7"
        
        def render_category(parent_panel, title, chords, row_offset):
            if not chords: return row_offset
            s = self.scale
            lbl = tk.Label(parent_panel, text=title, font=("Microsoft YaHei", max(7, int(9 * s)), "bold"), bg="#F8F9FA", fg="#7F8C8D")
            lbl.grid(row=row_offset, column=0, sticky="w", pady=(max(4, int(6 * s)), max(1, int(2 * s))))
            row_frame = tk.Frame(parent_panel, bg="#F8F9FA")
            row_frame.grid(row=row_offset + 1, column=0, sticky="w", padx=max(5, int(10 * s)), pady=(0, max(4, int(6 * s))))
            
            max_cols = max(3, int(5 * s))
            bw = max(60, int(90 * s))
            bh = max(30, int(45 * s))
            for col_idx, chord in enumerate(chords):
                r = col_idx // max_cols
                c = col_idx % max_cols
                btn_canvas = tk.Canvas(row_frame, width=bw, height=bh, bg="white", highlightthickness=max(1, int(1 * s)), highlightbackground=theme_color, cursor="hand2")
                btn_canvas.grid(row=r, column=c, padx=max(2, int(5 * s)), pady=max(2, int(4 * s)))
                self.renderer.render_academic_layout(btn_canvas, bw // 2, bh // 2, chord, color=theme_color, font_size_core=max(10, int(14 * s)), font_size_sub=max(6, int(8 * s)))
                btn_canvas.bind("<Button-1>", lambda event, c=chord: self.on_chord_click(c))
                btn_canvas.bind("<Enter>", lambda event, bc=btn_canvas, hc=hover_color, tc=theme_color: bc.config(bg=hc, highlightbackground=tc))
                btn_canvas.bind("<Leave>", lambda event, bc=btn_canvas, tc=theme_color: bc.config(bg="white", highlightbackground=tc))
            return row_offset + 2

        current_row = 0
        for title, chords in diatonic_cats.items(): current_row = render_category(left_panel, title, chords, current_row)
        current_row = 0
        for title, chords in tonicization_cats.items(): current_row = render_category(right_panel, title, chords, current_row)

    def on_chord_click(self, target_chord_name):
        self.stop_playback()
        shift = self.key_info["shift"]
        v_shift = shift if shift <= 3 else shift - 12
        ideal_S, ideal_A, ideal_T, ideal_B = 72 + v_shift, 65 + v_shift, 60 + v_shift, 48 + v_shift
        
        def score_initial(v):
            return abs(v['S']-ideal_S)*1.5 + abs(v['A']-ideal_A) + abs(v['T']-ideal_T) + abs(v['B']-ideal_B)

        if self.app_mode == "SOPRANO" and self.target_melody:
            step = len(self.history)
            valid_states = []
            
            if step == 0:
                valid_states = [s for s in self.dag_layers[0].keys() if s[0] == target_chord_name]
            else:
                last_state = (self.history[-1]['chord'], v_to_tuple(self.history[-1]['voices']))
                state_data = self.dag_layers[step-1].get(last_state)
                if not state_data: return
                next_states = state_data['next']
                valid_states = [s for s in next_states if s[0] == target_chord_name]
                
            if not valid_states: return

            best_state = min(valid_states, key=lambda s: score_initial(tuple_to_v(s[1])))
            self.history.append({"chord": best_state[0], "voices": tuple_to_v(best_state[1])})
            self.update_ui()
            play_history([self.history[-1]])
            return
            
        if self.app_mode == "COMPOSE" and self.pending_melody_note is not None:
            tgt_s = self.pending_melody_note
            valid_states = []
            
            if not self.history:
                for v in get_chord_candidates(target_chord_name, self.active_dna_db, tgt_s):
                    valid_states.append((target_chord_name, v_to_tuple(v)))
            else:
                last_c = self.history[-1]["chord"]
                last_v = self.history[-1]["voices"]
                for nxt_v in get_chord_candidates(target_chord_name, self.active_dna_db, tgt_s):
                    if evaluate_voicing(tuple_to_v(v_to_tuple(last_v)), nxt_v, last_c, target_chord_name, self.key_info) < 999999:
                        valid_states.append((target_chord_name, v_to_tuple(nxt_v)))
            
            if not valid_states: return
                
            best_state = min(valid_states, key=lambda s: score_initial(tuple_to_v(s[1])))
            self.history.append({"chord": best_state[0], "voices": tuple_to_v(best_state[1])})
            
            if self.target_melody is None: self.target_melody = []
            self.target_melody.append(self.pending_melody_note)
            
            self.pending_melody_note = None 
            self.update_ui()
            play_history([self.history[-1]])
            return
            
        target_s = None
        candidates = get_chord_candidates(target_chord_name, self.active_dna_db, target_s)
        
        if not candidates: return
            
        if not self.history:
            best_v = min(candidates, key=score_initial)
            self.history.append({"chord": target_chord_name, "voices": best_v})
            self.update_ui()
            play_history([self.history[-1]])
            return

        chord_sequence = [item["chord"] for item in self.history] + [target_chord_name]
        initial_voicing = self.history[0]["voices"] 
        
        global_path = calculate_best_voicing(chord_sequence, initial_voicing, self.active_dna_db, self.key_info, self.target_melody)
        
        if global_path is None: return

        self.history = []
        for name, voices in zip(chord_sequence, global_path):
            self.history.append({"chord": name, "voices": voices})
            
        self.update_ui()
        play_history([self.history[-1]])

    def play_full_song(self):
        if not self.history: return
        self.playback_index = 0
        self.is_playing = True
        self.renderer.update_playhead(self.history, self.key_info, self.target_melody, 0)
        
        def on_audio_ready():
            self.root.after(0, self._start_polling)
            
        play_history(self.history, on_play_start=on_audio_ready)

    def _start_polling(self):
        if not getattr(self, 'is_playing', False): return
        self.start_time = time.time()
        self.poll_playhead()

    def stop_playback(self):
        stop_audio()
        self.is_playing = False
        self.playback_index = None
        self.renderer.update_playhead(self.history, self.key_info, self.target_melody, self.playback_index)

    def poll_playhead(self):
        if not getattr(self, 'is_playing', False): return
        
        elapsed = time.time() - self.start_time
        bpm = 65.0
        sec_per_chord = 60.0 / bpm
        total_duration = sec_per_chord * (len(self.history) + 1)
        
        if elapsed >= total_duration:
            self.stop_playback()
            return
            
        current_index = int(elapsed / sec_per_chord)
        if current_index >= len(self.history):
            current_index = len(self.history) - 1
            
        if current_index != self.playback_index:
            self.playback_index = current_index
            self.renderer.update_playhead(self.history, self.key_info, self.target_melody, self.playback_index)
            
        self.root.after(16, self.poll_playhead)

def show_dp_debugger_window(target_melody, history, dna_db, key_info):
    debug_win = tk.Toplevel()
    debug_win.title("☠️ DP 断链诊断控制台")
    debug_win.geometry("700x600")
    text_area = tk.Text(debug_win, font=("Consolas", 10), bg="#1E1E1E", fg="#D4D4D4")
    text_area.pack(expand=True, fill=tk.BOTH, padx=10, pady=10)
    def log(msg, color="#D4D4D4"):
        text_area.insert(tk.END, msg + "\n")
        text_area.see(tk.END)
        text_area.update()
    
    log("=== 启动斯波索宾 DP 探针 ===", "#569CD6")
    log(f"调性: {key_info['type']} / 根音偏移: {key_info['shift']}")
    log(f"目标旋律序列 (MIDI): {target_melody}")
    log("-" * 50)
    
    from engine import get_chord_candidates, v_to_tuple, tuple_to_v
    from rules import evaluate_voicing
    
    current_layer = {}
    start_index = 0
    if not history:
        start_chord = "T" if key_info["type"] == "MAJOR" else "t"
        cands = get_chord_candidates(start_chord, dna_db, target_melody[0])
        for v in cands: current_layer[(start_chord, v_to_tuple(v))] = {start_chord}
        log(f"[音符 0] 旋律={target_melody[0]}, 初始 '{start_chord}' 状态存活数: {len(current_layer)}")
    else:
        last_h = history[-1]
        start_index = len(history)
        current_layer[(last_h["chord"], v_to_tuple(last_h["voices"]))] = {last_h["chord"]}
        log(f"基于已有历史记录，从第 {start_index} 个音开始推演...")

    for i in range(start_index + 1 if history else 1, len(target_melody)):
        next_layer = {}
        tgt_s = target_melody[i]
        
        all_possible_nexts = set()
        for c_name, _ in current_layer.keys():
            all_possible_nexts.update(dna_db.get(c_name, {}).get("next", []))
            
        cand_cache = {}
        for nxt_chord in all_possible_nexts:
            if nxt_chord in dna_db: cand_cache[nxt_chord] = get_chord_candidates(nxt_chord, dna_db, tgt_s)
            
        for (c_name, v_tup), _ in current_layer.items():
            possible_nexts = dna_db.get(c_name, {}).get("next", [])
            for nxt_chord in possible_nexts:
                if nxt_chord not in dna_db: continue
                for nxt_v in cand_cache.get(nxt_chord, []):
                    if evaluate_voicing(tuple_to_v(v_tup), nxt_v, c_name, nxt_chord, key_info) < 999999: 
                        next_layer[(nxt_chord, v_to_tuple(nxt_v))] = True
                        
        log(f"[音符 {i}] 旋律MIDI={tgt_s}, 存活的合法连接数: {len(next_layer)}")
        
        if not next_layer:
            log("-" * 50)
            log(f"❌ 致命断链发生！", "#F44336")
            log(f"断链位置: 第 {i} 个音 (旋律MIDI: {tgt_s})")
            log(f"上一个音符 (MIDI: {target_melody[i-1]}) 时，幸存的和弦有：")
            
            surviving_chords = {}
            for c_name, _ in current_layer.keys(): surviving_chords[c_name] = surviving_chords.get(c_name, 0) + 1
            for c, count in surviving_chords.items(): log(f" - {c}: {count} 种声部排列法")
            break
        current_layer = next_layer

if __name__ == "__main__":
    root = tk.Tk()
    app = HarmonyApp(root)
    root.mainloop()