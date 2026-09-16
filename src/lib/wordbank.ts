// 词库：按难度分层，供闯关模式抽题使用。
// 为保证摩斯可编码，仅使用 A-Z 字母（大写）。

export interface WordTier {
  tier: number;
  words: string[];
}

// 5 个难度层：从 3 字母常用词逐步过渡到 5~6 字母较难词。
export const WORD_TIERS: WordTier[] = [
  {
    tier: 0,
    words: ['SOS', 'CAT', 'DOG', 'SUN', 'MAP', 'TEA', 'ICE', 'KEY', 'BUS', 'EGG', 'FOX', 'HAT', 'JAR', 'OWL', 'PEN', 'RAT', 'SKY', 'VAN', 'WEB', 'ZOO'],
  },
  {
    tier: 1,
    words: ['MOON', 'STAR', 'FIRE', 'WIND', 'ROCK', 'LEAF', 'FISH', 'BIRD', 'WAVE', 'SNOW', 'GOLD', 'IRON', 'TIME', 'LAMP', 'BOOK', 'SHIP', 'TREE', 'WOLF', 'BEAR', 'FROG'],
  },
  {
    tier: 2,
    words: ['LIGHT', 'WATER', 'EARTH', 'NIGHT', 'HEART', 'MUSIC', 'PLANT', 'STORM', 'CLOUD', 'SMILE', 'DREAM', 'GHOST', 'RIVER', 'FLAME', 'STONE', 'BREAD', 'SWORD', 'CROWN', 'TRAIN', 'MOUSE'],
  },
  {
    tier: 3,
    words: ['PLANET', 'ROCKET', 'SIGNAL', 'RADIOS', 'ORANGE', 'PURPLE', 'SILVER', 'THUNDER', 'WINTER', 'SUMMER', 'HUNTER', 'PIRATE', 'TEMPLE', 'FOREST', 'ANCHOR', 'BRIDGE', 'CASTLE', 'WIZARD', 'DRAGON', 'MYSTIC'],
  },
  {
    tier: 4,
    words: ['STATION', 'MACHINE', 'CAPTAIN', 'MESSAGE', 'RECEIVER', 'ANTENNA', 'KEYBOARD', 'MOUNTAIN', 'LIBRARY', 'DANGER', 'FREEDOM', 'JOURNEY', 'MYSTERY', 'PHANTOM', 'CRYSTAL', 'DIAMOND', 'EXPLORER', 'SAILOR', 'WINDOW', 'GARDEN'],
  },
];
