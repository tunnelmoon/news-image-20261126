// THE DAILY WORLD - front page for Thursday 26 November 2026.
// Draws the whole front page in code (no assets, no network) and writes
// a deterministic PNG to (MAKEFUN_OUTPUT_DIR ?? "/output")/entry.png.
//
// Lead story, verified in 26 November 2026 news roundups: Pakistan's
// Muhammad Zeeshan Ali is picked for China's Shenzhou-24 mission, the
// first foreign astronaut selected to visit the Tiangong station.
// Also today: hostages freed in Cartagena, Bangladesh garment pay up 36%,
// North Korea orders Switzerland's office shut, US consumer confidence
// at a near two-year high.

import { deflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
type RGB = [number, number, number];
const PAPER: RGB = [246, 241, 229];
const INK: RGB = [25, 25, 25];
const RED: RGB = [164, 31, 31];
const NAVY_TOP: RGB = [13, 31, 60];
const NAVY_BOT: RGB = [29, 74, 122];
const EARTH: RGB = [47, 111, 178];
const EARTH_LIGHT: RGB = [127, 178, 229];
const CLOUD: RGB = [207, 227, 245];
const LAND: RGB = [63, 125, 78];
const WHITE: RGB = [244, 244, 244];
const PANEL_GREY: RGB = [210, 214, 218];
const SOLAR: RGB = [38, 84, 160];
const FLAME_OUT: RGB = [226, 88, 34];
const FLAME_IN: RGB = [245, 166, 35];
const SUN: RGB = [245, 214, 130];

// ------------------------------------------------------- 5x7 bitmap font
// Each glyph is 7 rows of 5 bits ("1" = ink). Uppercase, digits and a
// small set of punctuation only; all page text is set in capitals.
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
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  ":": ["00000", "01100", "00000", "00000", "01100", "00000", "00000"],
  ";": ["00000", "01100", "00000", "01100", "00100", "01000", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
};

const CHAR_ADVANCE = 6; // 5 px glyph + 1 px gap, before scaling

function textWidth(s: string, scale: number): number {
  return s.length * CHAR_ADVANCE * scale;
}

// Greedy word wrap to maxWidth pixels at the given scale.
function wrapText(s: string, maxWidth: number, scale: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? cur + " " + w : w;
    if (textWidth(next, scale) <= maxWidth || !cur) {
      cur = next;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ------------------------------------------------------------------ canvas
class Canvas {
  data = new Uint8Array(W * H * 3);
  clip: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: W, h: H };

  constructor() {
    this.fillRect(0, 0, W, H, PAPER);
  }

  setClip(x: number, y: number, w: number, h: number): void {
    this.clip = { x, y, w, h };
  }

  clearClip(): void {
    this.clip = { x: 0, y: 0, w: W, h: H };
  }

  set(x: number, y: number, c: RGB): void {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    if (x < this.clip.x || x >= this.clip.x + this.clip.w) return;
    if (y < this.clip.y || y >= this.clip.y + this.clip.h) return;
    const i = (y * W + x) * 3;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
  }

  fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
    }
  }

  fillCircle(cx: number, cy: number, r: number, c: RGB): void {
    for (let yy = -r; yy <= r; yy++) {
      const dx = Math.floor(Math.sqrt(r * r - yy * yy));
      for (let xx = -dx; xx <= dx; xx++) this.set(cx + xx, cy + yy, c);
    }
  }

  // Filled triangle via scanline interpolation.
  fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      const edges: Array<[number, number, number, number]> = [
        [x0, y0, x1, y1],
        [x1, y1, x2, y2],
        [x2, y2, x0, y0],
      ];
      for (const [ax, ay, bx, by] of edges) {
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
        }
      }
      if (xs.length >= 2) {
        const lo = Math.ceil(Math.min(...xs));
        const hi = Math.floor(Math.max(...xs));
        for (let x = lo; x <= hi; x++) this.set(x, y, c);
      }
    }
  }

  // Filled ellipse (rx, ry radii) by row spans.
  fillEllipse(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
    for (let yy = -ry; yy <= ry; yy++) {
      const t = 1 - (yy * yy) / (ry * ry);
      if (t < 0) continue;
      const dx = Math.floor(rx * Math.sqrt(t));
      for (let xx = -dx; xx <= dx; xx++) this.set(cx + xx, cy + yy, c);
    }
  }

  drawText(x: number, y: number, s: string, scale: number, c: RGB): void {
    let cx = x;
    for (const ch of s) {
      const glyph = FONT[ch] ?? FONT["?"];
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (glyph[row][col] === "1") {
            this.fillRect(cx + col * scale, y + row * scale, scale, scale, c);
          }
        }
      }
      cx += CHAR_ADVANCE * scale;
    }
  }

  drawTextCentered(y: number, s: string, scale: number, c: RGB): void {
    this.drawText(Math.floor((W - textWidth(s, scale)) / 2), y, s, scale, c);
  }
}

// Deterministic pseudo-random (LCG, fixed seed) for the stars.
function makeRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------- PNG writer
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table.push(c >>> 0);
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePNG(canvas: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    Buffer.from(canvas.data.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ the page
function drawPage(): Canvas {
  const cv = new Canvas();
  const MX = 44; // side margin
  const RIGHT = W - MX;

  // Masthead
  cv.drawTextCentered(30, "THE DAILY WORLD", 6, INK);
  cv.fillRect(MX, 88, RIGHT - MX, 3, INK);
  cv.fillRect(MX, 94, RIGHT - MX, 1, INK);

  // Dateline
  cv.drawText(MX, 108, "THURSDAY 26 NOVEMBER 2026", 2, INK);
  const edition = "WORLD EDITION";
  cv.drawText(RIGHT - textWidth(edition, 2), 108, edition, 2, INK);
  cv.fillRect(MX, 134, RIGHT - MX, 1, INK);

  // Kicker + headline
  cv.drawText(MX, 150, "SPACE", 2, RED);
  const headline = ["PAKISTAN'S FIRST", "ASTRONAUT TO FLY", "TO CHINA'S STATION"];
  headline.forEach((line, i) => cv.drawText(MX, 180 + i * 43, line, 5, INK));

  // Standfirst
  const stand = wrapText(
    "MUHAMMAD ZEESHAN ALI IS PICKED FOR SHENZHOU-24, THE FIRST FOREIGN ASTRONAUT TO VISIT THE TIANGONG STATION.",
    RIGHT - MX,
    2,
  );
  stand.forEach((line, i) => cv.drawText(MX, 320 + i * 17, line, 2, INK));

  cv.fillRect(MX, 368, RIGHT - MX, 1, INK);

  // ---- main illustration panel: rocket, station and Earth over deep sky
  const PX = MX;
  const PY = 384;
  const PW = RIGHT - MX;
  const PH = 316;
  // Clip all panel art to the panel: the Earth disc is far larger than
  // the panel and must not spill onto the strip below it.
  cv.setClip(PX, PY, PW, PH);
  for (let y = 0; y < PH; y++) {
    const t = y / PH;
    const r = Math.round(NAVY_TOP[0] + (NAVY_BOT[0] - NAVY_TOP[0]) * t);
    const g = Math.round(NAVY_TOP[1] + (NAVY_BOT[1] - NAVY_TOP[1]) * t);
    const b = Math.round(NAVY_TOP[2] + (NAVY_BOT[2] - NAVY_TOP[2]) * t);
    cv.fillRect(PX, PY + y, PW, 1, [r, g, b]);
  }
  const rand = makeRand(26);
  for (let i = 0; i < 130; i++) {
    const sx = PX + Math.floor(rand() * PW);
    const sy = PY + Math.floor(rand() * (PH - 90));
    const bright = rand() > 0.75 ? 2 : 1;
    cv.fillRect(sx, sy, bright, bright, WHITE);
  }
  // Sun, top left of the panel
  cv.fillCircle(PX + 110, PY + 52, 26, SUN);
  // Space station, upper left
  cv.fillRect(PX + 150, PY + 96, 46, 10, SOLAR);
  cv.fillRect(PX + 196, PY + 90, 92, 22, WHITE);
  cv.fillRect(PX + 288, PY + 96, 46, 10, SOLAR);
  cv.fillRect(PX + 236, PY + 78, 3, 12, WHITE);
  cv.fillCircle(PX + 237, PY + 76, 4, WHITE);
  // Earth rising along the bottom of the panel
  cv.fillCircle(512, PY + PH + 250, 360, EARTH);
  cv.fillEllipse(430, PY + PH - 22, 150, 14, EARTH_LIGHT);
  cv.fillEllipse(620, PY + PH - 52, 110, 10, CLOUD);
  cv.fillEllipse(380, PY + PH - 60, 90, 9, CLOUD);
  cv.fillEllipse(700, PY + PH - 12, 130, 12, LAND);
  // Rocket climbing at centre right (raised so the flame stays in-panel)
  const RX = 700;
  cv.fillTriangle(RX - 22, PY + 180, RX + 22, PY + 180, RX, PY + 138, RED); // nose
  cv.fillRect(RX - 22, PY + 180, 44, 92, WHITE); // body
  cv.fillRect(RX - 22, PY + 202, 44, 4, RED); // band
  cv.fillCircle(RX, PY + 228, 9, [127, 178, 229]); // window
  cv.fillTriangle(RX - 22, PY + 238, RX - 22, PY + 272, RX - 40, PY + 272, RED); // fin L
  cv.fillTriangle(RX + 22, PY + 238, RX + 22, PY + 272, RX + 40, PY + 272, RED); // fin R
  cv.fillTriangle(RX - 13, PY + 272, RX + 13, PY + 272, RX, PY + 306, FLAME_OUT); // flame
  cv.fillTriangle(RX - 7, PY + 272, RX + 7, PY + 272, RX, PY + 292, FLAME_IN);
  cv.clearClip();
  // Panel border
  cv.fillRect(PX, PY, PW, 2, INK);
  cv.fillRect(PX, PY + PH - 2, PW, 2, INK);
  cv.fillRect(PX, PY, 2, PH, INK);
  cv.fillRect(PX + PW - 2, PY, 2, PH, INK);

  // Caption under the panel
  cv.drawTextCentered(
    712,
    "SHENZHOU-24 WILL CARRY PAKISTAN'S FIRST ASTRONAUT TO THE TIANGONG STATION.",
    1,
    INK,
  );
  cv.fillRect(MX, 740, RIGHT - MX, 1, INK);

  // ---- ALSO TODAY strip, 2 x 2
  cv.drawText(MX, 756, "ALSO TODAY", 2, RED);
  const items: Array<[string, string]> = [
    ["CARTAGENA:", "HOSTAGES FREED AFTER A 17-HOUR SUPERMARKET SIEGE."],
    ["BANGLADESH:", "GARMENT WORKERS WIN A 36% RISE IN MINIMUM PAY."],
    ["NORTH KOREA:", "PYONGYANG ORDERS SWITZERLAND TO SHUT ITS OFFICE."],
    ["AMERICA:", "CONSUMER CONFIDENCE AT A NEAR TWO-YEAR HIGH."],
  ];
  const boxW = Math.floor((RIGHT - MX - 24) / 2);
  const boxH = 90;
  items.forEach(([lead, body], i) => {
    const bx = MX + (i % 2) * (boxW + 24);
    const by = 780 + Math.floor(i / 2) * (boxH + 8);
    cv.fillRect(bx, by, boxW, 1, INK);
    cv.fillRect(bx, by + boxH - 1, boxW, 1, INK);
    cv.fillRect(bx, by, 1, boxH, INK);
    cv.fillRect(bx + boxW - 1, by, 1, boxH, INK);
    const full = lead + " " + body;
    const lines = wrapText(full, boxW - 24, 1);
    lines.slice(0, 3).forEach((line, li) => {
      const ly = by + 14 + li * 12;
      if (li === 0) {
        cv.drawText(bx + 12, ly, lead, 1, RED);
        cv.drawText(bx + 12 + textWidth(lead + " ", 1), ly, line.slice(lead.length + 1), 1, INK);
      } else {
        cv.drawText(bx + 12, ly, line, 1, INK);
      }
    });
  });

  // Footer
  cv.drawTextCentered(984, "THE DAILY WORLD - THURSDAY 26 NOVEMBER 2026", 1, INK);
  return cv;
}

// ---------------------------------------------------------------------- main
function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const png = encodePNG(drawPage());
  const outPath = join(outDir, "entry.png");
  writeFileSync(outPath, png);

  // Round-trip read-back check: signature, IHDR size, gate limits.
  const back = readFileSync(outPath);
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!back.subarray(0, 8).equals(sig)) throw new Error("not a PNG");
  const w = back.readUInt32BE(16);
  const h = back.readUInt32BE(20);
  if (w !== W || h !== H) throw new Error(`bad dimensions ${w}x${h}`);
  if (back.length > 1048576) throw new Error(`too big: ${back.length} bytes`);
  const sha = createHash("sha256").update(back).digest("hex");
  console.log(`entry.png ${w}x${h} ${back.length} bytes sha256 ${sha}`);
}

main();
