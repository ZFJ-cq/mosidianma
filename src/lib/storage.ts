// localStorage 进度与设置持久化。
// 保存：每关最佳成绩、最佳正确率、星级、解锁与完成状态；以及全局播放设置。
import { LEVELS } from './levels';

export interface LevelRecord {
  bestScore: number; // 最佳得分
  bestAccuracy: number; // 最佳正确率 0~100
  stars: number; // 星级 0~3
  completed: boolean; // 是否曾达到通关正确率
  unlocked: boolean; // 是否已解锁
}

export interface Settings {
  wpm: number; // 转换页速度
  freq: number; // 音调 Hz
  volume: number; // 音量 0~1
}

export interface SaveData {
  version: number;
  settings: Settings;
  levels: Record<number, LevelRecord>;
}

const KEY = 'morse-challenge:v1';
const DEFAULT_SETTINGS: Settings = { wpm: 12, freq: 600, volume: 0.5 };

export function defaultSave(): SaveData {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    levels: {
      1: { bestScore: 0, bestAccuracy: 0, stars: 0, completed: false, unlocked: true },
    },
  };
}

export function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const data = JSON.parse(raw) as SaveData;
    if (!data.settings) data.settings = { ...DEFAULT_SETTINGS };
    if (!data.levels) data.levels = {};
    // 第 1 关始终解锁，保证可玩
    if (!data.levels[1]) {
      data.levels[1] = { bestScore: 0, bestAccuracy: 0, stars: 0, completed: false, unlocked: true };
    }
    return data;
  } catch {
    return defaultSave();
  }
}

export function save(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* 隐私模式 / 存储已满时静默忽略 */
  }
}

export function getLevelRecord(data: SaveData, id: number): LevelRecord {
  return (
    data.levels[id] ?? {
      bestScore: 0,
      bestAccuracy: 0,
      stars: 0,
      completed: false,
      unlocked: id === 1,
    }
  );
}

// 通关阈值：正确率达到 60% 即视为通关并解锁下一关。
const PASS_ACCURACY = 60;

/**
 * 提交一关成绩：更新最佳值并按正确率解锁下一关。
 * 返回更新后的全新 SaveData（已持久化）。
 */
export function submitResult(
  data: SaveData,
  id: number,
  result: { score: number; accuracy: number },
): SaveData {
  const rec = getLevelRecord(data, id);
  const stars =
    result.accuracy >= 90 ? 3 : result.accuracy >= 75 ? 2 : result.accuracy >= PASS_ACCURACY ? 1 : 0;
  const passed = result.accuracy >= PASS_ACCURACY;

  const levels = { ...data.levels };
  levels[id] = {
    bestScore: Math.max(rec.bestScore, result.score),
    bestAccuracy: Math.max(rec.bestAccuracy, result.accuracy),
    stars: Math.max(rec.stars, stars),
    completed: rec.completed || passed,
    unlocked: rec.unlocked || passed,
  };
  // 解锁下一关：只要达到通关正确率，就创建（或解锁）下一关记录。
  // 注意：新存档里下一关记录可能尚不存在（levels[id+1] 为 undefined），
  // 因此不能依赖其“已存在”才解锁，否则新玩家通关后无法进入下一关。
  if (passed && id + 1 <= LEVELS.length) {
    levels[id + 1] = { ...getLevelRecord(data, id + 1), unlocked: true };
  }

  const next: SaveData = { ...data, levels };
  save(next);
  return next;
}
