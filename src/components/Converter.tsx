import { useRef, useState } from 'react';
import { textToMorse, morseToText } from '../lib/morse';
import { morsePlayer } from '../lib/audio';
import type { Settings } from '../lib/storage';

// 转换页：文本 <-> 摩斯电码双向互转，并通过 Web Audio 生成蜂鸣声播放。
export function Converter({ settings }: { settings: Settings }) {
  const [text, setText] = useState('SOS CAT');
  const [morseInput, setMorseInput] = useState('');
  const [textFromMorse, setTextFromMorse] = useState('');
  const [playing, setPlaying] = useState<'text' | 'morse' | null>(null);
  const playingRef = useRef(false);

  // 文本转码结果（实时计算）
  const morseOut = textToMorse(text);

  // 播放或停止：再次点击可中断当前播放
  const togglePlay = async (kind: 'text' | 'morse') => {
    if (playingRef.current) {
      morsePlayer.stop();
      playingRef.current = false;
      setPlaying(null);
      return;
    }
    playingRef.current = true;
    setPlaying(kind);
    const target = kind === 'text' ? morsePlayer.playText(text, settings) : morsePlayer.playMorse(morseOut, settings);
    await target;
    playingRef.current = false;
    setPlaying(null);
  };

  const onMorseChange = (v: string) => {
    setMorseInput(v);
    setTextFromMorse(morseToText(v));
  };

  const copy = (s: string) => {
    if (s) navigator.clipboard?.writeText(s);
  };

  return (
    <div className="space-y-4">
      {/* 文本 -> 电码 */}
      <section className="card">
        <h2 className="font-semibold mb-2">文本 → 摩斯电码</h2>
        <textarea
          className="input font-mono"
          rows={3}
          value={text}
          placeholder="输入文字，例如：SOS CAT"
          onChange={(e) => setText(e.target.value)}
          // 快捷键：Ctrl/Cmd + Enter 直接播放
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') togglePlay('text');
          }}
        />
        <div className="morse-output mt-3 min-h-[3rem]">{morseOut || '（无可编码内容）'}</div>
        <div className="flex gap-2 mt-3">
          <button className="btn flex-1" onClick={() => togglePlay('text')}>
            {playing === 'text' ? '■ 停止' : '▶ 播放'}
          </button>
          <button className="btn-ghost" onClick={() => copy(morseOut)}>
            复制电码
          </button>
        </div>
        <p className="hint mt-2">提示：Ctrl/⌘ + Enter 快速播放</p>
      </section>

      {/* 电码 -> 文本 */}
      <section className="card">
        <h2 className="font-semibold mb-2">摩斯电码 → 文本</h2>
        <p className="hint mb-2">字母间用空格分隔，单词间用 “ / ” 分隔。</p>
        <textarea
          className="input font-mono"
          rows={3}
          value={morseInput}
          placeholder="例如：... --- ... / -.-. .- -"
          onChange={(e) => onMorseChange(e.target.value)}
        />
        <div className="morse-output mt-3 min-h-[3rem]">{textFromMorse || '（等待输入）'}</div>
        <div className="flex gap-2 mt-3">
          <button className="btn flex-1" onClick={() => togglePlay('morse')} disabled={!morseInput}>
            {playing === 'morse' ? '■ 停止' : '▶ 播放电码'}
          </button>
          <button className="btn-ghost" onClick={() => copy(textFromMorse)} disabled={!textFromMorse}>
            复制文本
          </button>
        </div>
      </section>
    </div>
  );
}
