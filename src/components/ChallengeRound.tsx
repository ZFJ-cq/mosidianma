import { useCallback, useEffect, useRef, useState } from 'react';
import { textToMorse } from '../lib/morse';
import { morsePlayer } from '../lib/audio';
import { getLevel } from '../lib/levels';
import type { LevelConfig } from '../lib/levels';
import type { Settings } from '../lib/storage';

interface Question {
  answer: string; // 正确答案（单词）
  options: string[]; // 打乱后的选项（含答案）
  morse: string; // 答案对应的摩斯电码
  wpm: number; // 本题有效速度（关内递增）
}

// Fisher–Yates 洗牌
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 依据关卡配置生成题目：从词池抽取答案与干扰项，速度随题号递增。
function buildQuestions(level: LevelConfig): Question[] {
  const pool = Array.from(new Set(level.pool));
  const qs: Question[] = [];
  for (let i = 0; i < level.questions; i++) {
    const answer = pool[Math.floor(Math.random() * pool.length)];
    const distractors = shuffle(pool.filter((w) => w !== answer)).slice(0, level.options - 1);
    qs.push({
      answer,
      options: shuffle([answer, ...distractors]),
      morse: textToMorse(answer),
      wpm: Math.round((level.wpm + i * level.rampWpm) * 10) / 10,
    });
  }
  return qs;
}

interface ChallengeRoundProps {
  level: LevelConfig;
  settings: Settings;
  onExit: () => void;
  onComplete: (result: { score: number; accuracy: number }) => void;
  onReplay: () => void;
}

// 关卡完成后的结算面板
function Summary({
  accuracy,
  score,
  stars,
  unlockedNext,
  onReplay,
  onExit,
}: {
  accuracy: number;
  score: number;
  stars: number;
  unlockedNext: boolean;
  onReplay: () => void;
  onExit: () => void;
}) {
  return (
    <div className="max-w-md mx-auto card text-center">
      <h2 className="text-xl font-bold text-slate-800">关卡完成！</h2>
      <div className="text-3xl my-3 text-amber-500">
        {'★'.repeat(stars)}
        {'☆'.repeat(3 - stars)}
      </div>
      <div className="text-slate-600">
        正确率：<b className="text-slate-800">{accuracy}%</b>
      </div>
      <div className="text-slate-600 mt-1">
        得分：<b className="text-slate-800">{score}</b>
      </div>
      <p className="hint mt-3">
        {unlockedNext
          ? '🔓 已解锁下一关！'
          : accuracy >= 60
            ? '可继续挑战更高关卡'
            : '正确率达到 60% 即可解锁下一关'}
      </p>
      <div className="flex gap-2 mt-5">
        <button className="btn-ghost flex-1" onClick={onReplay}>
          重玩
        </button>
        <button className="btn flex-1" onClick={onExit}>
          返回关卡
        </button>
      </div>
    </div>
  );
}

export function ChallengeRound({ level, settings, onExit, onComplete, onReplay }: ChallengeRoundProps) {
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(level));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [playing, setPlaying] = useState(false);
  const completedRef = useRef(false);

  const q = questions[idx];

  // 播放当前题目的摩斯电码（使用本题有效速度，音调/音量取用户设置）
  const replay = useCallback(async () => {
    if (playing || !q) return;
    setPlaying(true);
    await morsePlayer.playMorse(q.morse, { ...settings, wpm: q.wpm });
    setPlaying(false);
  }, [q, settings, playing]);

  // 听音模式：进入每题自动播放一次
  useEffect(() => {
    if (finished || !q) return;
    if (level.mode === 'listen') {
      const t = setTimeout(() => replay(), 350);
      return () => clearTimeout(t);
    }
  }, [idx, finished, level.mode, replay, q]);

  // 离开组件时停止音频
  useEffect(() => () => morsePlayer.stop(), []);

  const choose = (opt: string) => {
    if (selected || !q) return; // 已作答则忽略
    setSelected(opt);
    if (opt === q.answer) {
      setCorrectCount((c) => c + 1);
      setScore((s) => s + 100 + Math.round(q.wpm)); // 速度越快得分越高
    }
  };

  const next = () => {
    if (!q) return;
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  // 键盘操作：数字键 1-9 选择选项，空格重播，回车进入下一题
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (finished || !q) return;
      if (e.key >= '1' && e.key <= '9') {
        const i = parseInt(e.key, 10) - 1;
        if (i < q.options.length) choose(q.options[i]);
      } else if (e.code === 'Space') {
        e.preventDefault(); // 阻止页面滚动/按钮误触
        replay();
      } else if (e.key === 'Enter' && selected) {
        next();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [q, selected, finished, choose, next, replay]);

  // 完成本关：计算正确率与得分，仅提交一次
  useEffect(() => {
    if (finished && !completedRef.current && questions.length > 0) {
      completedRef.current = true;
      const accuracy = Math.round((correctCount / questions.length) * 100);
      onComplete({ score, accuracy });
    }
  }, [finished, correctCount, score, questions.length, onComplete]);

  if (finished) {
    const accuracy = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
    const stars = accuracy >= 90 ? 3 : accuracy >= 75 ? 2 : accuracy >= 60 ? 1 : 0;
    const unlockedNext = accuracy >= 60 && !!getLevel(level.id + 1);
    return (
      <Summary
        accuracy={accuracy}
        score={score}
        stars={stars}
        unlockedNext={unlockedNext}
        onReplay={onReplay}
        onExit={onExit}
      />
    );
  }

  const modeLabel = level.mode === 'listen' ? '听音猜词' : '看码猜词';

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* 顶部：返回 + 进度 */}
      <div className="flex items-center justify-between">
        <button className="btn-ghost text-sm" onClick={onExit}>
          ← 返回
        </button>
        <div className="text-sm text-slate-500">
          第 {idx + 1}/{questions.length} 题 · {modeLabel} · {q.wpm} WPM
        </div>
      </div>

      {/* 题面 */}
      {level.mode === 'listen' ? (
        <section className="card text-center">
          <p className="hint mb-3">听蜂鸣声，选择对应的单词</p>
          <button className="play-big" onClick={replay}>
            {playing ? '♪ 播放中…' : '🔊 播放 / 重播'}
          </button>
          <p className="hint mt-2">空格键可重播</p>
        </section>
      ) : (
        <section className="card">
          <p className="hint mb-2">下面的摩斯电码代表哪个单词？</p>
          <div className="morse-big">{q.morse}</div>
          <button className="btn-ghost text-sm mt-3 w-full" onClick={replay}>
            {playing ? '♪ 播放中…' : '🔊 听一听'}
          </button>
        </section>
      )}

      {/* 选项 */}
      <div className="grid grid-cols-1 gap-2">
        {q.options.map((opt, i) => {
          const isAnswer = opt === q.answer;
          const isChosen = opt === selected;
          let cls = 'opt';
          if (selected) {
            if (isAnswer) cls += ' opt-correct';
            else if (isChosen) cls += ' opt-wrong';
            else cls += ' opt-dim';
          }
          return (
            <button key={opt} className={cls} disabled={!!selected} onClick={() => choose(opt)}>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-sm font-bold">
                {i + 1}
              </span>
              <span className="text-base">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* 即时反馈 */}
      {selected && (
        <div className="card">
          <div className={selected === q.answer ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {selected === q.answer ? '✓ 回答正确！' : '✗ 回答错误'}
          </div>
          <div className="text-sm text-slate-600 mt-1">
            正确答案：<b>{q.answer}</b>（{q.morse}）
          </div>
          <button className="btn w-full mt-3" onClick={next}>
            {idx + 1 < questions.length ? '下一题 →' : '查看结果 →'}
          </button>
          <p className="hint mt-2 text-center">回车键进入下一题</p>
        </div>
      )}
    </div>
  );
}
