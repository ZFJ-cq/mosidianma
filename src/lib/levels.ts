// 关卡配置：速度随关卡递增、词库逐步变难、题型交替。
import { WORD_TIERS } from './wordbank';

export type ChallengeMode = 'listen' | 'read'; // 听音猜词 / 看码猜词

export interface LevelConfig {
  id: number;
  name: string;
  mode: ChallengeMode; // 该关主打题型
  wpm: number; // 基础速度（WPM）
  questions: number; // 每关题数
  options: number; // 选项数量
  pool: string[]; // 抽词池
  rampWpm: number; // 关内每题递增的 WPM（速度随进度提升）
}

const TOTAL = 12; // 关卡总数

// 动态生成关卡：随进度解锁更难词库、提升速度、增加题量与选项。
function buildLevels(): LevelConfig[] {
  const levels: LevelConfig[] = [];
  for (let i = 0; i < TOTAL; i++) {
    const tierMax = Math.min(4, Math.floor(i / 2.4)); // 0..4 逐步纳入更难词库
    const pool = Array.from(
      new Set(WORD_TIERS.slice(0, tierMax + 1).flatMap((t) => t.words)),
    );
    const mode: ChallengeMode = i % 2 === 0 ? 'listen' : 'read';
    levels.push({
      id: i + 1,
      name: `第 ${i + 1} 关`,
      mode,
      wpm: Math.round((8 + i * 1.2) * 10) / 10, // 8 -> ~21.6 WPM
      questions: 5 + Math.floor(i / 2), // 5..10 题
      options: i < 4 ? 3 : 4, // 前期 3 选项，后期 4 选项
      pool,
      rampWpm: 0.4, // 每题再 +0.4 WPM
    });
  }
  return levels;
}

export const LEVELS: LevelConfig[] = buildLevels();

export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find((l) => l.id === id);
}
