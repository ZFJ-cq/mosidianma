import type { SaveData } from '../lib/storage';
import { LEVELS } from '../lib/levels';

interface LevelSelectProps {
  data: SaveData;
  onStart: (id: number) => void;
}

function stars(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(3 - n);
}

// 闯关入口：关卡网格（显示星级、最佳成绩、锁定状态）与总体进度概览。
export function LevelSelect({ data, onStart }: LevelSelectProps) {
  const total = LEVELS.length;
  const completed = LEVELS.filter((l) => data.levels[l.id]?.completed).length;
  const totalStars = LEVELS.reduce((s, l) => s + (data.levels[l.id]?.stars || 0), 0);
  const maxStars = total * 3;

  return (
    <div className="space-y-4">
      {/* 进度概览 */}
      <section className="card flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">已通关</div>
          <div className="text-xl font-bold text-slate-800">
            {completed} / {total}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">收集星星</div>
          <div className="text-xl font-bold text-amber-500">
            {totalStars} / {maxStars}
          </div>
        </div>
      </section>

      {/* 关卡网格 */}
      <div className="grid grid-cols-2 gap-3">
        {LEVELS.map((lv) => {
          const rec = data.levels[lv.id];
          const unlocked = rec?.unlocked ?? lv.id === 1;
          const modeLabel = lv.mode === 'listen' ? '听音猜词' : '看码猜词';
          return (
            <button
              key={lv.id}
              disabled={!unlocked}
              onClick={() => unlocked && onStart(lv.id)}
              className={[
                'card text-left transition active:scale-[0.98]',
                unlocked ? 'hover:border-sky-400' : 'opacity-60 cursor-not-allowed',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{lv.name}</span>
                <span className="text-lg" aria-hidden>
                  {unlocked ? (lv.mode === 'listen' ? '🔊' : '👁️') : '🔒'}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{modeLabel}</div>
              <div className="text-xs text-slate-500 mt-1">{lv.wpm} WPM · {lv.questions} 题</div>
              {unlocked && rec && rec.stars > 0 && (
                <div className="text-amber-500 mt-2 text-sm">{stars(rec.stars)}</div>
              )}
              {unlocked && rec && rec.bestAccuracy > 0 && (
                <div className="text-xs text-slate-400 mt-1">
                  最佳 {rec.bestAccuracy}% · {rec.bestScore} 分
                </div>
              )}
              {!unlocked && <div className="text-xs text-slate-400 mt-2">通关上一关解锁</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
