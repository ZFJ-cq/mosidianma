// 基于 Web Audio API 的摩斯电码蜂鸣播放器。
//
// 关键点：
//  - 使用单个振荡器(OscillatorNode) 持续发声，配合“门控”增益节点(GainNode)
//    做开关包络，从而精确模拟点(dot)与划(dash)的时长。
//  - 三个可调参数：音调 freq(Hz)、音量 volume(0~1)、速度 wpm(词/分钟)。
//  - 速度采用经典 PARIS 标准：1 个“单词”= 50 个时间单位，故 1 单位 = 1200ms / WPM。
//  - 浏览器要求 AudioContext 在用户手势中创建/恢复，故 play* 方法应在点击等事件中调用。

import { textToMorse } from './morse';

export interface PlayOptions {
  wpm: number; // 速度：词/分钟
  freq: number; // 音调：Hz
  volume: number; // 音量：0~1
}

// 单个单位时长（秒）：dot = 1 单位，dash = 3 单位
function unitSeconds(wpm: number): number {
  return 1.2 / Math.max(1, wpm);
}

export class MorsePlayer {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gate: GainNode | null = null;
  private master: GainNode | null = null;

  /** 浏览器要求音频在用户手势中创建/恢复 */
  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** 将文本即时转码后播放（供转换页使用） */
  playText(text: string, opts: PlayOptions): Promise<void> {
    return this.playMorse(textToMorse(text), opts);
  }

  /** 播放摩斯串（'.'/'-'，字母空格、词 ' / '） */
  playMorse(morse: string, opts: PlayOptions): Promise<void> {
    return new Promise((resolve) => {
      this.stop();
      const ctx = this.ensureCtx();

      const unit = unitSeconds(opts.wpm);
      const dot = unit;
      const dash = unit * 3;
      const symGap = unit; // 同一字母内符号间隔
      const charGap = unit * 3; // 字母间隔
      const wordGap = unit * 7; // 单词间隔

      // 将摩斯字符串解析为「发声 / 静音」段落序列
      const segs: { on: boolean; dur: number }[] = [];
      const words = morse.trim().split(' / ');
      words.forEach((word, wi) => {
        const letters = word.trim().split(/\s+/).filter(Boolean);
        letters.forEach((letter) => {
          const symbols = letter.split('');
          symbols.forEach((s, si) => {
            segs.push({ on: true, dur: s === '.' ? dot : dash });
            // 符号之间留单位间隔；字母末尾留字母间隔
            segs.push({ on: false, dur: si < symbols.length - 1 ? symGap : charGap });
          });
        });
        // 词末间隔改为单词间隔
        if (wi < words.length - 1 && segs.length) {
          segs[segs.length - 1].dur = wordGap;
        }
      });

      if (!segs.length) {
        resolve();
        return;
      }

      // 信号链：osc -> gate(开关) -> master(音量) -> 输出
      this.master = ctx.createGain();
      this.master.gain.value = opts.volume;
      this.master.connect(ctx.destination);

      this.gate = ctx.createGain();
      this.gate.gain.value = 0;
      this.gate.connect(this.master);

      this.osc = ctx.createOscillator();
      this.osc.type = 'sine';
      this.osc.frequency.value = opts.freq;
      this.osc.connect(this.gate);

      // 按段落排程门控增益，形成点划节奏
      let t = ctx.currentTime + 0.08;
      const attack = 0.005;
      for (const seg of segs) {
        if (seg.on) {
          this.gate!.gain.setValueAtTime(0, t);
          this.gate!.gain.linearRampToValueAtTime(1, t + attack);
          this.gate!.gain.setValueAtTime(1, Math.max(t + attack, t + seg.dur - attack));
          this.gate!.gain.linearRampToValueAtTime(0, t + seg.dur);
        } else {
          this.gate!.gain.setValueAtTime(0, t);
        }
        t += seg.dur;
      }

      this.osc.start(ctx.currentTime + 0.08);
      this.osc.stop(t + 0.05);
      this.osc.onended = () => {
        this.cleanup();
        resolve(); // 无论正常结束还是被 stop() 打断，都结束本次播放
      };
    });
  }

  /** 立即停止播放 */
  stop(): void {
    try {
      this.osc?.stop();
    } catch {
      /* 已停止 */
    }
    this.cleanup();
  }

  private cleanup(): void {
    try {
      this.osc?.disconnect();
      this.gate?.disconnect();
      this.master?.disconnect();
    } catch {
      /* noop */
    }
    this.osc = null;
    this.gate = null;
    this.master = null;
  }
}

// 全局单例：避免频繁创建 AudioContext（部分浏览器对实例数量有限制）
export const morsePlayer = new MorsePlayer();
