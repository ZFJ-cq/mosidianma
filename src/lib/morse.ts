// 摩斯电码核心映射与互转逻辑。
// 覆盖常用字符：A-Z、0-9 及部分标点（符合 ITU 标准）。

export const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.',
};

// 反向映射：摩斯串 -> 字符
export const MORSE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k]),
);

// 文本转码时：字母间用单空格分隔，单词间用 ' / ' 分隔
export const MORSE_WORD_SEP = ' / ';
export const MORSE_LETTER_SEP = ' ';

/**
 * 文本 -> 摩斯电码
 * - 统一转大写后逐词处理
 * - 不可编码字符会被忽略（仅保留可编码字符）
 */
export function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split(/\s+/) // 按空白切词
    .filter(Boolean)
    .map((word) =>
      word
        .split('')
        .map((ch) => MORSE_MAP[ch] ?? '')
        .filter(Boolean)
        .join(MORSE_LETTER_SEP),
    )
    .filter(Boolean)
    .join(MORSE_WORD_SEP);
}

/**
 * 摩斯电码 -> 文本
 * 输入约定：字母间单空格、单词间 ' / '、点划用 '.' 与 '-' 表示。
 */
export function morseToText(morse: string): string {
  return morse
    .trim()
    .split(MORSE_WORD_SEP)
    .map((word) =>
      word
        .trim()
        .split(MORSE_LETTER_SEP)
        .map((code) => MORSE_REVERSE[code] ?? '')
        .join(''),
    )
    .join(' ')
    .trim();
}

/** 判断字符是否可被摩斯编码（用于输入提示） */
export function isEncodable(ch: string): boolean {
  return ch.toUpperCase() in MORSE_MAP;
}
