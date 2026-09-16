interface HeaderProps {
  onOpenSettings: () => void;
}

// 顶部标题栏 + 设置入口（设置影响全局播放音调/速度/音量）。
export function Header({ onOpenSettings }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-lg px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            📻
          </span>
          <h1 className="text-lg font-bold text-slate-800">摩斯电码挑战</h1>
        </div>
        <button className="btn-ghost text-sm" onClick={onOpenSettings} aria-label="打开播放设置">
          ⚙️ 设置
        </button>
      </div>
    </header>
  );
}
