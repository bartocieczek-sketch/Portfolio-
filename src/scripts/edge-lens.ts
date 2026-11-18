/*
 * The home column's edge lens, for any page: pictures (and videos) that
 * reach the top or bottom band of the screen are drawn in WebGL over their
 * own (then hidden) DOM boxes, stretched toward the edge, flared wider,
 * smeared and colour-split, more so the faster things move. Away from the
 * bands the lens is zero, so nothing is drawn there and the DOM shows: the
 * hand-over can't be seen. Same shader maths as Hero.astro.
 */

type Media = HTMLImageElement | HTMLVideoElement;
type Motion = { speed: number; dx: number; dy: number };
type Opts = {
  /** the boxes to bend (each clips its picture with its own radius) */
  items: () => HTMLElement[];
  /** the picture inside a box (or the box itself, for a bare img) */
  media: (el: HTMLElement) => Media | null;
  /** where the canvas goes (it is fixed over the viewport) */
  parent: HTMLElement;
  z: number;
  /** speed (0..1) and direction of travel; default: page scroll */
  motion?: () => Motion | null;
  /** ms before the lens starts easing in */
  delay?: number;
};

const VS = `
precision highp float;
attribute vec2 aPos;
uniform vec4 uRect; uniform vec2 uView; uniform float uSpeed; uniform float uLens; uniform float uElong; uniform vec2 uDir;
varying vec2 vUv; varying float vEdge;
void main() {
  vUv = aPos;
  vec2 p = uRect.xy + aPos * uRect.zw;
  float cx = uRect.x + uRect.z * 0.5;
  float ny = (p.y - uView.y * 0.5) / (uView.y * 0.5);
  float t = 0.72 - 0.12 * uSpeed;
  float over = max(0.0, abs(ny) - t) * uLens;
  float k = 1.2 + 1.6 * uSpeed;
  p.y += sign(ny) * over * over * k * uView.y * 0.5;
  float e = smoothstep(t, 1.0, abs(ny)) * uLens;
  p.x = cx + (p.x - cx) * (1.0 + 0.2 * e);
  vec2 c = uRect.xy + uRect.zw * 0.5;
  vec2 dl = p - c;
  p += uDir * dot(dl, uDir) * uElong;
  vEdge = e;
  vec2 clip = p / uView * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex; uniform vec2 uImg; uniform vec4 uRect; uniform vec4 uMed; uniform vec2 uPos;
uniform float uAlpha; uniform float uSpeed; uniform float uRad; uniform vec2 uDir; uniform vec3 uBg;
varying vec2 vUv; varying float vEdge;
vec3 pick(vec2 uv) {
  return texture2D(uTex, uv).rgb;
}
void main() {
  vec2 size = uRect.zw;
  float r = min(uRad, min(size.x, size.y) * 0.5);
  vec2 q = abs(vUv * size - size * 0.5) - (size * 0.5 - r);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  float mask = 1.0 - smoothstep(-1.0, 1.0, d);
  if (mask <= 0.0) discard;
  // where this point falls in the picture (object-fit: cover + position)
  vec2 m = (vUv * size - uMed.xy) / uMed.zw;
  float rs = uMed.z / uMed.w; float ri = uImg.x / uImg.y;
  vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  vec2 uv = m * s + (1.0 - s) * uPos;
  float e = clamp(vEdge + uSpeed * 0.3, 0.0, 1.0);
  vec2 sm = uDir * 0.035 * e;
  vec2 sp = uDir * 0.018 * e;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    vec2 o = (float(i) / 4.0 - 0.5) * sm;
    col.r += texture2D(uTex, uv + o + sp).r;
    col.g += texture2D(uTex, uv + o).g;
    col.b += texture2D(uTex, uv + o - sp).b;
  }
  col /= 5.0;
  bool inside = m.x >= 0.0 && m.x <= 1.0 && m.y >= 0.0 && m.y <= 1.0;
  gl_FragColor = vec4(inside ? col : uBg, 1.0) * uAlpha * mask;
}`;

const hasGPU = () => {
  try {
    const c = document.createElement('canvas').getContext('webgl');
    const dbg = c?.getExtension('WEBGL_debug_renderer_info');
    const name = dbg ? String(c?.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    return !!c && !/swiftshader|llvmpipe|software/i.test(name);
  } catch {
    return false;
  }
};

export function edgeLens(o: Opts) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  if (!hasGPU()) return null;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = `position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:${o.z}`;
  o.parent.appendChild(canvas);
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const SX = 16;
  const SY = 64;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= SY; j++) for (let i = 0; i <= SX; i++) pos.push(i / SX, j / SY);
  for (let j = 0; j < SY; j++)
    for (let i = 0; i < SX; i++) {
      const a = j * (SX + 1) + i;
      idx.push(a, a + 1, a + SX + 1, a + 1, a + SX + 2, a + SX + 1);
    }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const U: Record<string, WebGLUniformLocation | null> = {};
  for (const n of ['uRect', 'uView', 'uSpeed', 'uLens', 'uElong', 'uDir', 'uImg', 'uMed', 'uPos', 'uAlpha', 'uRad', 'uBg'])
    U[n] = gl.getUniformLocation(prog, n);

  // textures: pictures by address (a CORS copy), videos per element
  type Tex = { tex: WebGLTexture; w: number; h: number; ready: boolean; bad?: boolean };
  const pics = new Map<string, Tex>();
  const vids = new WeakMap<HTMLVideoElement, Tex>();
  const mk = () => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const texOf = (m: Media): Tex | null => {
    if (m instanceof HTMLVideoElement) {
      if (m.readyState < 2 || !m.videoWidth) return null;
      let t = vids.get(m);
      if (!t) {
        t = { tex: mk(), w: m.videoWidth, h: m.videoHeight, ready: true };
        vids.set(m, t);
      }
      if (t.bad) return null;
      try {
        gl.bindTexture(gl.TEXTURE_2D, t.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, m);
      } catch {
        t.bad = true; // no CORS: this one stays plain
        return null;
      }
      return t;
    }
    const src = m.currentSrc || m.src;
    if (!src) return null;
    let t = pics.get(src);
    if (t) return t.ready && !t.bad ? t : null;
    const tt: Tex = { tex: mk(), w: 1, h: 1, ready: false };
    pics.set(src, tt);
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.decoding = 'async';
    im.onload = () => {
      try {
        gl.bindTexture(gl.TEXTURE_2D, tt.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        tt.w = im.naturalWidth;
        tt.h = im.naturalHeight;
        tt.ready = true;
      } catch {
        tt.bad = true;
      }
    };
    im.onerror = () => (tt.bad = true);
    im.src = src;
    return null;
  };
  const rgb = (s: string) => {
    const m = s.match(/[\d.]+/g);
    if (!m || (m[3] !== undefined && Number(m[3]) === 0)) return [1, 1, 1];
    return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255];
  };
  const posOf = (s: string) => {
    const p = s.split(' ').map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : v === 'left' || v === 'top' ? 0 : v === 'right' || v === 'bottom' ? 1 : 0.5));
    return [p[0] ?? 0.5, p[1] ?? 0.5];
  };

  const start = performance.now() + (o.delay ?? 600);
  const LENS_IN = 900;
  let paused = false;
  let lastY = window.scrollY;
  let lastT = performance.now();
  let vel = 0;
  let dirY = 1;
  const on = new Set<HTMLElement>();
  const release = (el: HTMLElement) => {
    if (on.delete(el)) el.classList.remove('lens-on');
  };
  const clear = () => {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  const frame = () => {
    const now = performance.now();
    const dt = Math.max(now - lastT, 1);
    lastT = now;
    const vw = innerWidth;
    const vh = innerHeight;
    // the page's own scroll speed (px per frame, as on home: /45)
    const sy = window.scrollY;
    const dy = sy - lastY;
    lastY = sy;
    vel += ((dy / dt) * 16.67 - vel) * 0.25;
    let mo = o.motion?.() ?? null;
    if (!mo) {
      if (Math.abs(dy) > 0.5) dirY = dy > 0 ? -1 : 1;
      mo = { speed: Math.min(Math.abs(vel) / 45, 1), dx: 0, dy: dirY };
    }
    if (paused || now < start) {
      on.forEach(release);
      return;
    }
    const li = Math.min((now - start) / LENS_IN, 1);
    const lensK = 1 - (1 - li) ** 3;
    const t = 0.72 - 0.12 * mo.speed;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const W = Math.round(vw * dpr);
    const H = Math.round(vh * dpr);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    gl.viewport(0, 0, W, H);
    clear();
    gl.uniform2f(U.uView, vw, vh);
    gl.uniform1f(U.uLens, lensK);
    gl.uniform1f(U.uSpeed, mo.speed * lensK);
    gl.uniform1f(U.uElong, 0); // only the bands bend here, so no stretch for speed
    const dn = Math.hypot(mo.dx, mo.dy) || 1;
    gl.uniform2f(U.uDir, mo.dx / dn, mo.dy / dn);
    const drawn: HTMLElement[] = [];
    // the bands the lens lives in (a little wider, for the flare)
    const top = (vh / 2) * (1 - t) + 2;
    const bot = (vh / 2) * (1 + t) - 2;
    for (const el of o.items()) {
      if (el.style.visibility === 'hidden') {
        release(el);
        continue;
      }
      const r = el.getBoundingClientRect();
      if (r.bottom < -r.height || r.top > vh + r.height || r.right < 0 || r.left > vw || !r.width) {
        release(el);
        continue;
      }
      if (r.top >= top && r.bottom <= bot) {
        release(el);
        continue;
      }
      const m = o.media(el);
      if (!m) {
        release(el);
        continue;
      }
      const tx = texOf(m);
      if (!tx) {
        release(el);
        continue;
      }
      const cs = getComputedStyle(el);
      const alpha = parseFloat(cs.opacity) || 0;
      const mr = m === el ? r : m.getBoundingClientRect();
      const ms = m === el ? cs : getComputedStyle(m);
      const [px, py] = posOf(ms.objectPosition || '50% 50%');
      const bg = rgb(cs.backgroundColor);
      gl.bindTexture(gl.TEXTURE_2D, tx.tex);
      gl.uniform4f(U.uRect, r.left, r.top, r.width, r.height);
      gl.uniform4f(U.uMed, mr.left - r.left, mr.top - r.top, mr.width, mr.height);
      gl.uniform2f(U.uImg, tx.w, tx.h);
      gl.uniform2f(U.uPos, px, py);
      gl.uniform1f(U.uAlpha, alpha);
      gl.uniform1f(U.uRad, parseFloat(cs.borderTopLeftRadius) || 0);
      gl.uniform3f(U.uBg, bg[0], bg[1], bg[2]);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      drawn.push(el);
    }
    // boxes drawn by WebGL hide in this same frame; the rest show again
    const now2 = new Set(drawn);
    on.forEach((el) => !now2.has(el) && release(el));
    for (const el of drawn) {
      if (!on.has(el)) {
        on.add(el);
        el.classList.add('lens-on');
      }
    }
  };
  const loop = () => {
    frame();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // a page change snapshots the DOM: give every box back first
  addEventListener('pageswap', () => {
    paused = true;
    on.forEach(release);
    clear();
  });
  addEventListener('pageshow', (e) => {
    if ((e as PageTransitionEvent).persisted) paused = false;
  });
  return {
    pause(p: boolean) {
      paused = p;
      if (p) {
        on.forEach(release);
        clear();
      }
    },
  };
}
