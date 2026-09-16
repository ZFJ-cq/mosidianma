import { useState } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { Converter } from './components/Converter';
import { LevelSelect } from './components/LevelSelect';
import { ChallengeRound } from './components/ChallengeRound';
import { load, save, submitResult } from './lib/storage';
import type { SaveData, Settings } from './lib/storage';
import { getLevel } from './lib/levels';
import { morsePlayer } from './lib/audio';

type Tab = 'convert' | 'challenge';

export default function App() {
  // 全局存档（含设置与关卡进度），首次加载即从 localStorage 读取
  const [data, setData] = useState<SaveData>(() => load());
  const [tab, setTab] = useState<Tab>('convert');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  // 重玩计数：改变 key 以重置 ChallengeRound 内部状态
  const [replayNonce, setReplayNonce] = useState(0);

  // 更新播放设置并持久化
  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...data, settings: { ...data.settings, ...patch } };
    save(next);
    setData(next);
  };

  const startLevel = (id: number) => setActiveLevel(id);

  // 关卡完成后写入成绩（更新最佳值并解锁下一关）
  const handleComplete = (result: { score: number; accuracy: number }) => {
    if (activeLevel == null) return;
    const next = submitResult(data, activeLevel, result);
    setData(next);
  };

  const exitChallenge = () => {
    morsePlayer.stop();
    setActiveLevel(null);
    setTab('challenge');
  };

  const replayLevel = () => {
    morsePlayer.stop();
    setReplayNonce((n) => n + 1);
  };

  const level = activeLevel != null ? getLevel(activeLevel) : undefined;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      {/* 顶部导航（仅在非闯关进行中显示） */}
      {activeLevel == null && (
        <nav className="sticky top-14 z-20 bg-slate-100/90 backdrop-blur border-b border-slate-200">
          <div className="mx-auto max-w-lg px-4 flex gap-1">
            <TabButton active={tab === 'convert'} onClick={() => setTab('convert')}>
              🔁 转换
            </TabButton>
            <TabButton active={tab === 'challenge'} onClick={() => setTab('challenge')}>
              🏆 闯关
            </TabButton>
          </div>
        </nav>
      )}

      <main className="mx-auto max-w-lg px-4 py-4">
        {activeLevel == null && tab === 'convert' && <Converter settings={data.settings} />}
        {activeLevel == null && tab === 'challenge' && (
          <LevelSelect data={data} onStart={startLevel} />
        )}
        {activeLevel != null && level && (
          <ChallengeRound
            key={`${activeLevel}-${replayNonce}`}
            level={level}
            settings={data.settings}
            onExit={exitChallenge}
            onComplete={handleComplete}
            onReplay={replayLevel}
          />
        )}
      </main>

      {settingsOpen && (
        <SettingsModal
          settings={data.settings}
          onChange={updateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

// 退出/重玩时确保停止正在播放的蜂鸣（已在上方通过 morsePlayer.stop() 处理）

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition',
        active ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
