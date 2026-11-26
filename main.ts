// THE DAILY WORLD - Thursday 26 November 2026
// A newspaper front page summing up the day's world news, drawn entirely
// in code at run time: a minimal PNG encoder plus a small 5x7 bitmap font.
// Node 22, standard library only. No assets, no network, deterministic output.
//
// Run: MAKEFUN_OUTPUT_DIR=out node main.ts   -> writes out/entry.png (1024x1024)

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------
const W = 1024;
const H = 1024;
const px = new Uint8Array(W * H * 3);

const CREAM: [number, number, number] = [245, 238, 220];
const INK: [number, number, number] = [18, 18, 18];
const BLACK: [number, number, number] = [0, 0, 0];
const WHITE: [number, number, number] = [255, 255, 255];
const NAVY: [number, number, number] = [13, 30, 58];
const NAVY2: [number, number, number] = [24, 52, 92];
const RED: [number, number, number] = [178, 34, 34];
const GOLD: [number, number, number] = [212, 175, 55];
const EARTH_BLUE: [number, number, number] = [52, 120, 198];
const EARTH_GREEN: [number, number, number] = [74, 160, 90];
const GREY: [number, number, number] = [90, 88, 80];
const STEEL: [number, number, number] = [196, 200, 208];
const STEEL_DARK: [number, number, number] = [120, 126, 136];
const FLAME: [number, number, number] = [255, 140, 40];
const FLAME2: [number, number, number] = [255, 205, 80];

function setPx(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPx(xx, yy, c);
  }
}

function hline(x0: number, x1: number, y: number, c: [number, number, number], t = 1): void {
  for (let t0 = 0; t0 < t; t0++) for (let x = x0; x <= x1; x++) setPx(x, y + t0, c);
}

function vline(x: number, y0: number, y1: number, c: [number, number, number], t = 1): void {
  for (let t0 = 0; t0 < t; t0++) for (let y = y0; y <= y1; y++) setPx(x + t0, y, c);
}

function line(x0: number, y0: number, x1: number, y1: number, c: [number, number, number]): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    setPx(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

function fillCircle(cx: number, cy: number, r: number, c: [number, number, number]): void {
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    for (let x = -half; x <= half; x++) setPx(cx + x, cy + y, c);
  }
}

function fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: [number, number, number]): void {
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    const edges: Array<[number, number, number, number]> = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(Math.round(ax + ((y - ay) / (by - ay)) * (bx - ax)));
      }
    }
    if (xs.length >= 2) {
      const lo = Math.min(...xs);
      const hi = Math.max(...xs);
      for (let x = lo; x <= hi; x++) setPx(x, y, c);
    }
  }
}

// ---------------------------------------------------------------------------
// 5x7 bitmap font (uppercase, digits, common punctuation)
// Each glyph: 7 rows of 5 bits, written as strings.
// ---------------------------------------------------------------------------
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "|": ["00100", "00100", "00100", "00100", "00100", "00100", "00100"],
};

function textWidth(s: string, scale: number): number {
  // 5 px glyph + 1 px gap, scaled; no trailing gap after the last char.
  if (s.length === 0) return 0;
  return s.length * 6 * scale - scale;
}

function drawText(x: number, y: number, s: string, scale: number, c: [number, number, number]): void {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = FONT[ch] ?? FONT["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") {
          fillRect(cx + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentered(cx: number, y: number, s: string, scale: number, c: [number, number, number]): void {
  drawText(cx - Math.floor(textWidth(s, scale) / 2), y, s, scale, c);
}

// Wrap words to fit maxWidth px at the given scale; returns lines.
function wrapText(s: string, scale: number, maxWidth: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur === "" ? w : cur + " " + w;
    if (textWidth(trial, scale) <= maxWidth) {
      cur = trial;
    } else {
      if (cur !== "") lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------------------
// Minimal PNG encoder (truecolour RGB, filter 0, zlib level 9, deterministic)
// ---------------------------------------------------------------------------
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Drawing the front page
// ---------------------------------------------------------------------------
const M = 36; // page margin
const CW = W - 2 * M; // content width = 952

function drawPage(): void {
  fillRect(0, 0, W, H, CREAM);

  // Outer double frame
  fillRect(10, 10, W - 20, 3, INK);
  fillRect(10, H - 13, W - 20, 3, INK);
  fillRect(10, 10, 3, H - 20, INK);
  fillRect(W - 13, 10, 3, H - 20, INK);
  hline(18, W - 19, 18, INK);
  hline(18, W - 19, H - 19, INK);
  vline(18, 18, H - 19, INK);
  vline(W - 19, 18, H - 19, INK);

  // ---- Masthead: black band ---------------------------------------------
  fillRect(M, 26, CW, 92, BLACK);
  drawTextCentered(W / 2, 44, "THE DAILY WORLD", 6, WHITE);
  drawTextCentered(W / 2, 94, "ONE DAY  -  ONE PAGE  -  THE WORLD IN BRIEF", 1, GOLD);

  // ---- Dateline strip ----------------------------------------------------
  hline(M, W - M, 132, INK, 2);
  drawTextCentered(W / 2, 142, "THURSDAY 26 NOVEMBER 2026", 2, RED);
  drawText(M, 142, "VOL. 1", 2, INK);
  drawText(W - M - textWidth("NO. 1", 2), 142, "NO. 1", 2, INK);
  hline(M, W - M, 164, INK, 2);

  // ---- Main headline ------------------------------------------------------
  const hy = 182;
  drawTextCentered(W / 2, hy, "PAKISTAN'S FIRST", 5, INK);
  drawTextCentered(W / 2, hy + 44, "ASTRONAUT TO FLY TO", 5, INK);
  drawTextCentered(W / 2, hy + 88, "CHINA'S STATION", 5, RED);

  // ---- Standfirst ---------------------------------------------------------
  const sf = wrapText(
    "Muhammad Zeeshan Ali is selected for the Shenzhou-24 mission, the first foreign astronaut to visit the Tiangong space station.",
    2,
    CW - 40,
  );
  let sy = hy + 146;
  for (const ln of sf) {
    drawTextCentered(W / 2, sy, ln, 2, INK);
    sy += 20;
  }

  // ---- Illustration panel: orbit scene ------------------------------------
  const px0 = M;
  const py0 = 480;
  const pw = CW;
  const ph = 176;
  fillRect(px0, py0, pw, ph, NAVY);
  // stars
  const stars: Array<[number, number, number]> = [
    [60, 500, 2], [130, 520, 1], [210, 495, 2], [300, 530, 1], [380, 498, 2],
    [470, 525, 1], [560, 500, 2], [640, 528, 1], [720, 498, 2], [810, 522, 1],
    [890, 500, 2], [940, 540, 1], [100, 600, 1], [250, 620, 1], [700, 610, 1],
    [860, 600, 2], [420, 620, 1], [520, 600, 1], [940, 490, 2], [40, 545, 1],
  ];
  for (const [sx, syy, s] of stars) fillRect(px0 + sx, syy, s, s, WHITE);

  // Earth: disc tucked fully inside the panel's bottom-left corner
  const ex = px0 + 115;
  const ey = py0 + ph - 80;
  const er = 75;
  fillCircle(ex, ey, er, EARTH_BLUE);
  fillCircle(ex - 21, ey - 48, 17, EARTH_GREEN); // land mass 1
  fillCircle(ex + 9, ey - 59, 11, EARTH_GREEN); // land mass 2
  fillCircle(ex + 28, ey - 35, 13, EARTH_GREEN); // land mass 3
  fillCircle(ex - 39, ey - 20, 9, EARTH_GREEN); // land mass 4
  // cloud wisps
  fillRect(ex - 45, ey - 59, 35, 3, WHITE);
  fillRect(ex - 10, ey - 44, 45, 3, WHITE);
  fillRect(ex - 30, ey - 29, 30, 2, WHITE);
  // thin atmosphere rim (drawn as a partial arc of light pixels)
  for (let a = 200; a <= 340; a++) {
    const rad = (a * Math.PI) / 180;
    setPx(Math.round(ex + (er + 1) * Math.cos(rad)), Math.round(ey + (er + 1) * Math.sin(rad)), [150, 200, 240]);
    setPx(Math.round(ex + (er + 2) * Math.cos(rad)), Math.round(ey + (er + 2) * Math.sin(rad)), [150, 200, 240]);
  }

  // Space station (Tiangong): central hub, two solar panel wings, docking node
  const sx0 = px0 + 560;
  const sy0 = py0 + 66;
  fillRect(sx0, sy0 - 8, 150, 16, STEEL); // main module
  fillRect(sx0 + 150, sy0 - 5, 26, 10, STEEL_DARK); // docking node
  fillRect(sx0 + 176, sy0 - 12, 12, 24, STEEL); // small module
  fillRect(sx0 - 96, sy0 - 14, 96, 28, NAVY2); // left solar wing
  fillRect(sx0 + 188, sy0 - 14, 96, 28, NAVY2); // right solar wing
  for (let i = 0; i < 6; i++) {
    vline(sx0 - 96 + 16 + i * 16, sy0 - 14, sy0 + 13, GOLD);
    vline(sx0 + 188 + 16 + i * 16, sy0 - 14, sy0 + 13, GOLD);
  }
  hline(sx0 - 96, sx0 + 284, sy0 - 15, STEEL, 2);
  hline(sx0 - 96, sx0 + 284, sy0 + 14, STEEL, 2);
  // station label
  drawText(sx0 + 8, sy0 + 26, "TIANGONG STATION", 1, WHITE);

  // Rocket climbing top-right, nose up, flame below
  const rx = px0 + 880;
  const ry = py0 + 18;
  fillTriangle(rx - 14, ry + 62, rx + 14, ry + 62, rx, ry, WHITE); // nose cone
  fillRect(rx - 14, ry + 62, 28, 52, WHITE); // body
  fillRect(rx - 14, ry + 62, 28, 8, RED); // band
  fillRect(rx - 6, ry + 80, 12, 22, RED); // window stripe
  fillTriangle(rx - 14, ry + 114, rx - 26, ry + 138, rx - 14, ry + 96, RED); // left fin
  fillTriangle(rx + 14, ry + 114, rx + 26, ry + 138, rx + 14, ry + 96, RED); // right fin
  fillTriangle(rx - 9, ry + 114, rx + 9, ry + 114, rx, ry + 150, FLAME); // flame outer
  fillTriangle(rx - 5, ry + 114, rx + 5, ry + 114, rx, ry + 134, FLAME2); // flame inner
  drawText(rx - 100, ry + 78, "SHENZHOU-24", 1, WHITE);

  // panel frame
  hline(px0, px0 + pw - 1, py0, INK, 3);
  hline(px0, px0 + pw - 1, py0 + ph - 1, INK, 3);
  vline(px0, py0, py0 + ph - 1, INK, 3);
  vline(px0 + pw - 1, py0, py0 + ph - 1, INK, 3);

  // ---- Caption under the panel -------------------------------------------
  drawTextCentered(
    W / 2,
    668,
    "The Tiangong station in orbit. Ali will fly aboard Shenzhou-24.",
    2,
    GREY,
  );

  // ---- ALSO TODAY header --------------------------------------------------
  hline(M, W - M, 700, INK, 2);
  drawText(M, 712, "ALSO TODAY", 3, INK);
  hline(M + textWidth("ALSO TODAY", 3) + 16, W - M, 722, INK, 2);

  // ---- 2x2 strip ----------------------------------------------------------
  const gx = M;
  const gy = 748;
  const colW = Math.floor((CW - 24) / 2);
  const rowH = 96;
  const items: Array<[string, string]> = [
    ["CARTAGENA", "Hostages freed after a 17-hour supermarket siege."],
    ["BANGLADESH", "Garment workers win a 36% rise in minimum pay."],
    ["NORTH KOREA", "Pyongyang orders Switzerland to shut its office."],
    ["AMERICA", "Consumer confidence at a near two-year high."],
  ];
  items.forEach(([label, body], i) => {
    const cx = gx + (i % 2) * (colW + 24);
    const cy = gy + Math.floor(i / 2) * rowH;
    drawText(cx, cy, label, 2, RED);
    const lines = wrapText(body, 2, colW);
    lines.forEach((ln, li) => drawText(cx, cy + 22 + li * 20, ln, 2, INK));
  });
  // divider between the two columns
  vline(gx + colW + 12, gy, gy + 2 * rowH - 18, INK);

  // ---- Footer --------------------------------------------------------------
  hline(M, W - M, 956, INK, 2);
  drawTextCentered(W / 2, 970, "THE DAILY WORLD  |  THURSDAY 26 NOVEMBER 2026", 2, INK);
}

// ---------------------------------------------------------------------------
// Gate validation: signature, dimensions, 1 MiB cap, round-trip read-back
// ---------------------------------------------------------------------------
function validate(png: Buffer): void {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) {
    if (png[i] !== sig[i]) throw new Error("bad PNG signature");
  }
  if (png.readUInt32BE(16) !== W || png.readUInt32BE(20) !== H) {
    throw new Error("bad PNG dimensions");
  }
  if (png.length > 1048576) throw new Error("PNG over 1 MiB cap");
  // Round-trip: parse chunks, check CRCs, inflate IDAT, check raw size.
  let off = 8;
  const idatParts: Buffer[] = [];
  while (off < png.length) {
    const len = png.readUInt32BE(off);
    const type = png.toString("ascii", off + 4, off + 8);
    const data = png.subarray(off + 8, off + 8 + len);
    const want = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
    if (png.readUInt32BE(off + 8 + len) !== want) throw new Error(`bad CRC in ${type}`);
    if (type === "IDAT") idatParts.push(Buffer.from(data));
    if (type === "IEND") break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idatParts));
  if (raw.length !== H * (1 + W * 3)) throw new Error("round-trip size mismatch");
  for (let y = 0; y < H; y++) {
    if (raw[y * (1 + W * 3)] !== 0) throw new Error("round-trip filter mismatch");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  fs.mkdirSync(outDir, { recursive: true });
  drawPage();
  const png = encodePNG();
  validate(png);
  const outPath = path.join(outDir, "entry.png");
  fs.writeFileSync(outPath, png);
  console.log(`wrote ${outPath} (${png.length} bytes, ${W}x${H})`);
}

main();
