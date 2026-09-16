// 生成 PWA 所需的 PNG 图标（无第三方依赖，使用 Node 内置 zlib 编码 PNG）。
// 运行：npm run gen:icons
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// ---- 极简 PNG 编码器（RGBA, 8bit） ----
function crc32(buf) {
  const table =
    crc32.table ||
    (crc32.table = (() => {
      const t = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
      }
      return t;
    })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePNG(size, draw) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    const rowOff = y * stride;
    raw[rowOff] = 0; // 过滤字节：无
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x, y);
      const p = rowOff + 1 + x * 4;
      raw[p] = r;
      raw[p + 1] = g;
      raw[p + 2] = b;
      raw[p + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 位深
  ihdr[9] = 6; // 颜色类型：RGBA
  const idat = deflateSync(raw);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// 绘制图标：天蓝底 + 白色“划”与“点”组成的摩斯符号
function drawIcon(size, maskable) {
  const bg = [14, 165, 233]; // #0ea5e9
  const fg = [255, 255, 255];
  const cy = size / 2;
  // maskable 图标需保留安全区，内容收缩到中心 80%
  const scale = maskable ? 0.8 : 1.0;
  const ox = maskable ? size * 0.1 : 0;
  const oy = maskable ? size * 0.1 : 0;
  const dashX0 = size * 0.18, dashX1 = size * 0.55;
  const dy0 = cy - size * 0.05, dy1 = cy + size * 0.05;
  const dotCx = size * 0.72, dotCy = cy, dotR = size * 0.07;
  return (x, y) => {
    const lx = (x - ox) / scale;
    const ly = (y - oy) / scale;
    let r = bg[0], g = bg[1], b = bg[2];
    const isDash = lx >= dashX0 && lx <= dashX1 && ly >= dy0 && ly <= dy1;
    const isDot = (lx - dotCx) ** 2 + (ly - dotCy) ** 2 <= dotR * dotR;
    if (isDash || isDot) {
      r = fg[0];
      g = fg[1];
      b = fg[2];
    }
    return [r, g, b, 255];
  };
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', makePNG(192, drawIcon(192, false)));
writeFileSync('public/icons/icon-512.png', makePNG(512, drawIcon(512, false)));
writeFileSync('public/icons/maskable-512.png', makePNG(512, drawIcon(512, true)));
console.log('PWA 图标已生成：public/icons/{icon-192,icon-512,maskable-512}.png');
