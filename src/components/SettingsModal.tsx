import type { Settings } from '../lib/storage';

interface SettingsModalProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
}

// 播放设置弹窗：调节速度(WPM)、音调(Hz)、音量。
// 设置会被持久化到 localStorage，转换页与闯关页共用音调/音量。
export function SettingsModal({ settings, onChange, onClose }: SettingsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg mb-4">播放设置</h2>

        <div className="space-y-4">
          <div>
            <label className="label">
              速度：{settings.wpm} WPM（{settings.wpm < 10 ? '慢' : settings.wpm < 18 ? '适中' : '快'}）
            </label>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={settings.wpm}
              onChange={(e) => onChange({ wpm: +e.target.value })}
              className="w-full accent-sky-500"
            />
          </div>

          <div>
            <label className="label">音调：{settings.freq} Hz</label>
            <input
              type="range"
              min={300}
              max={1000}
              step={10}
              value={settings.freq}
              onChange={(e) => onChange({ freq: +e.target.value })}
              className="w-full accent-sky-500"
            />
          </div>

          <div>
            <label className="label">音量：{Math.round(settings.volume * 100)}%</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => onChange({ volume: +e.target.value })}
              className="w-full accent-sky-500"
            />
          </div>
        </div>

        <button className="btn w-full mt-6" onClick={onClose}>
          完成
        </button>
      </div>
    </div>
  );
}
