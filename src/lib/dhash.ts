// A tiny "looks the same" check for pictures, from the blurry preview Sanity
// already keeps for every image (metadata.lqip, a ~20px JPEG or PNG). Two
// uploads of the same photo (re-exported, re-cropped a little, another file
// name) give nearly the same 64-bit difference hash; different photos don't.
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

type Pixels = { width: number; height: number; data: Uint8Array | Buffer };

function decode(lqip: string): Pixels | null {
  const m = /^data:image\/(jpeg|png);base64,(.+)$/.exec(lqip);
  if (!m) return null;
  const buf = Buffer.from(m[2], 'base64');
  try {
    if (m[1] === 'jpeg') return jpeg.decode(buf, { useTArray: true });
    const png = PNG.sync.read(buf);
    return { width: png.width, height: png.height, data: png.data };
  } catch {
    return null;
  }
}

/** 64-bit dHash (9×8 luma, each cell compared with its right neighbour) */
export function lqipHash(lqip?: string | null): string | null {
  if (!lqip) return null;
  const px = decode(lqip);
  if (!px) return null;
  const W = 9;
  const H = 8;
  const lum: number[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // box-average the source cell
      const x0 = Math.floor((x * px.width) / W);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * px.width) / W));
      const y0 = Math.floor((y * px.height) / H);
      const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * px.height) / H));
      let s = 0;
      let n = 0;
      for (let yy = y0; yy < y1; yy++)
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * px.width + xx) * 4;
          s += px.data[i] * 0.299 + px.data[i + 1] * 0.587 + px.data[i + 2] * 0.114;
          n++;
        }
      lum.push(s / n);
    }
  }
  let bits = '';
  for (let y = 0; y < H; y++) for (let x = 0; x < W - 1; x++) bits += lum[y * W + x] > lum[y * W + x + 1] ? '1' : '0';
  return bits;
}

export function hashDistance(a: string, b: string): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

/** How much detail sits right at the picture's edges (where a parallax zoom
    trims ~7%): the busiest edge band's local contrast, relative to the
    picture's overall contrast. ~0 = quiet margins (safe to trim), ≥ ~0.8 =
    content runs to the edge (a UI, a layout, text). null when unknown. */
export function edgeDetail(lqip?: string | null): number | null {
  if (!lqip) return null;
  const px = decode(lqip);
  if (!px || px.width < 6 || px.height < 6) return null;
  const { width: w, height: h, data } = px;
  const L = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  };
  const grad = (x: number, y: number) => {
    let g = 0;
    let n = 0;
    if (x + 1 < w) {
      g += Math.abs(L(x, y) - L(x + 1, y));
      n++;
    }
    if (y + 1 < h) {
      g += Math.abs(L(x, y) - L(x, y + 1));
      n++;
    }
    return n ? g / n : 0;
  };
  let all = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) all += grad(x, y);
  all /= w * h;
  const band = Math.max(1, Math.round(Math.min(w, h) * 0.08));
  const bands = [
    (x: number, y: number) => y < band,
    (x: number, y: number) => y >= h - band,
    (x: number, y: number) => x < band,
    (x: number, y: number) => x >= w - band,
  ];
  let worst = 0;
  for (const inBand of bands) {
    let s = 0;
    let n = 0;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (inBand(x, y)) {
          s += grad(x, y);
          n++;
        }
    if (n) worst = Math.max(worst, s / n);
  }
  return all > 0.5 ? worst / all : 0;
}
