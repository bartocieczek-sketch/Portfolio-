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
