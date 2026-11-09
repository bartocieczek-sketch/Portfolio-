// "Swarm build" section reveal (inspired by califa.github.io/swarm-site):
// when a [data-build] section scrolls into view, a team of multiplayer-style
// cursors builds it — dragging out selection boxes with live W × H badges,
// revealing images as the box is drawn and typing text word by word — while
// design-tool rulers and smart guides appear around the page.
//
// Blocks are taken from [data-build-item], [data-split] and [data-reveal]
// inside a [data-build] section. Only blocks below the fold on load are
// animated; anything already visible is left alone. Skipped entirely for
// reduced motion and in the Sanity visual-editing preview.
//
// This module must be imported before ./motion so it can claim blocks first.

type Kind = 'text' | 'box';
type State = 'pending' | 'queued' | 'building' | 'done';

interface Item {
  el: HTMLElement;
  kind: Kind;
  section: Section;
  state: State;
}
interface Cursor {
  el: HTMLElement;
  x: number;
  y: number;
  busy: boolean;
  idle?: number;
}
interface Section {
  el: HTMLElement;
  layer: HTMLElement;
  queue: Item[];
  workers: Cursor[];
  started: boolean;
}

const MAX_WORKERS = 5;
const AMBIENT = 3;
// Site tones only: off-white to mid grey, so the agents read as part of the page
const COLORS = ['#dfdfdf', '#a8a8a8', '#f4f4f4', '#7d7d7d', '#c6c6c6'];
const NAMES = ['Design', 'Copy', 'Motion', 'Dev', 'Layout', 'Type', 'Grid', 'QA', 'Brand', 'Color'];
// Motion tokens (see global.css)
const EASE_MOVE = 'cubic-bezier(0.77, 0, 0.175, 1)'; // travelling across the screen
const EASE_DRAW = 'cubic-bezier(0.23, 1, 0.32, 1)'; // drawing a box (entrance)
const CLIP_FROM = 'inset(0 100% 100% 0)';
const CLIP_TO = 'inset(0 0% 0% 0)';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let spawned = 0;

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const preview = root.hasAttribute('data-preview');
const sectionEls = [...document.querySelectorAll<HTMLElement>('[data-build]')];


/* ---------------- Rulers (desktop only) ---------------- */

const rulers = (() => {
  if (!sectionEls.length || window.matchMedia('(max-width: 809px), (pointer: coarse)').matches) {
    return { inc() {}, dec() {} };
  }
  const top = document.createElement('canvas');
  const left = document.createElement('canvas');
  top.className = 'bruler bruler--top';
  left.className = 'bruler bruler--left';
  top.setAttribute('aria-hidden', 'true');
  left.setAttribute('aria-hidden', 'true');
  document.body.append(top, left);
  const S = 20; // ruler thickness
  let count = 0;
  let raf = 0;
  let hideTimer = 0;

  const size = (c: HTMLCanvasElement, w: number, h: number, dpr: number) => {
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  };

  const draw = () => {
    raf = requestAnimationFrame(draw);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sels = [...document.querySelectorAll<HTMLElement>('.bsel')].map((s) => s.getBoundingClientRect());
    const font = "500 9px 'Chivo Mono', ui-monospace, monospace";

    // top
    let ctx = size(top, vw, S, dpr);
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, vw, S);
    ctx.fillStyle = 'rgba(223, 223, 223, 0.1)';
    for (const r of sels) ctx.fillRect(r.left, 0, r.width, S);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < vw; x += 10) {
      const h = x % 100 === 0 ? 8 : x % 50 === 0 ? 5 : 3;
      ctx.moveTo(x + 0.5, S);
      ctx.lineTo(x + 0.5, S - h);
    }
    ctx.moveTo(0, S - 0.5);
    ctx.lineTo(vw, S - 0.5);
    ctx.stroke();
    ctx.font = font;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#666';
    for (let x = 100; x < vw; x += 100) ctx.fillText(String(x), x + 3, 4);
    ctx.fillStyle = '#dfdfdf';
    for (const r of sels) {
      ctx.fillText(String(Math.round(r.left)), r.left + 3, 4);
      const end = String(Math.round(r.right));
      ctx.fillText(end, r.right - ctx.measureText(end).width - 3, 4);
    }
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, S, S);

    // left
    ctx = size(left, S, vh - S, dpr);
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, S, vh);
    ctx.fillStyle = 'rgba(223, 223, 223, 0.1)';
    for (const r of sels) ctx.fillRect(0, r.top - S, S, r.height);
    const sy = window.scrollY;
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    for (let d = Math.ceil((sy + S) / 10) * 10; d < sy + vh; d += 10) {
      const y = d - sy - S;
      const w = d % 100 === 0 ? 8 : d % 50 === 0 ? 5 : 3;
      ctx.moveTo(S, y + 0.5);
      ctx.lineTo(S - w, y + 0.5);
    }
    ctx.moveTo(S - 0.5, 0);
    ctx.lineTo(S - 0.5, vh);
    ctx.stroke();
    ctx.font = font;
    ctx.fillStyle = '#666';
    for (let d = Math.ceil((sy + S) / 100) * 100; d < sy + vh; d += 100) {
      const y = d - sy - S;
      ctx.save();
      ctx.translate(4, y + 3);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(String(d), 0, -9);
      ctx.restore();
    }
  };

  return {
    inc() {
      count++;
      clearTimeout(hideTimer);
      root.classList.add('is-building');
      if (!raf) raf = requestAnimationFrame(draw);
    },
    dec() {
      count = Math.max(0, count - 1);
      if (count) return;
      hideTimer = window.setTimeout(() => {
        root.classList.remove('is-building');
        // keep drawing while the rulers fade out
        window.setTimeout(() => {
          if (count) return;
          cancelAnimationFrame(raf);
          raf = 0;
        }, 400);
      }, 700);
    },
  };
})();

/* ---------------- Setup ---------------- */

function init() {
  const vh = window.innerHeight;
  // On a normal visit the agents build everything, including the first screen.
  // When a cover is flying back from a case study, the first screen is left as is.
  const buildFirstScreen = !root.classList.contains('is-returning');
  const io = new IntersectionObserver(onIntersect, { rootMargin: '0px 0px -12% 0px' });

  for (const el of sectionEls) {
    const layer = document.createElement('div');
    layer.className = 'blayer';
    layer.setAttribute('aria-hidden', 'true');
    el.append(layer);
    const section: Section = { el, layer, queue: [], workers: [], started: false };

    const candidates = [...el.querySelectorAll<HTMLElement>('[data-build-item], [data-split], [data-reveal]')];
    // Use the innermost blocks only
    const blocks = candidates.filter((c) => !candidates.some((o) => o !== c && c.contains(o)));

    for (const block of blocks) {
      if (!buildFirstScreen && block.getBoundingClientRect().top < vh * 0.92) continue; // already visible: leave alone
      // Take the block over from the regular reveal/split animations
      block.removeAttribute('data-split');
      block.removeAttribute('data-reveal');
      const kind: Kind =
        block.matches('img, video, canvas, picture, figure') || block.querySelector('img, video, canvas, picture') || !block.textContent?.trim()
          ? 'box'
          : 'text';
      block.classList.add(kind === 'box' ? 'bp-box' : 'bp-text');
      const item: Item = { el: block, kind, section, state: 'pending' };
      itemByEl.set(block, item);
      waiting.add(item);
      io.observe(block);
    }
  }
  if (waiting.size) window.addEventListener('scroll', onScroll, { passive: true });
  // lets other scripts (the hero's WebGL covers) know which blocks are queued
  root.dataset.build = 'ready';
}

const itemByEl = new WeakMap<Element, Item>();
const waiting = new Set<Item>();

// Fast jumps (End key, anchor links) can skip over blocks without them ever
// intersecting; anything that ends up above the viewport is shown at once.
let sweepQueued = false;
function sweep() {
  sweepQueued = false;
  // At the end of the page the last blocks can't scroll up to the trigger line
  const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
  for (const item of waiting) {
    const r = item.el.getBoundingClientRect();
    if (atEnd && item.state === 'pending' && r.top < window.innerHeight) {
      enqueue(item);
      continue;
    }
    if (r.bottom >= 0) continue;
    const q = item.section.queue;
    const i = q.indexOf(item);
    if (i >= 0) q.splice(i, 1);
    finish(item);
  }
  if (!waiting.size) window.removeEventListener('scroll', onScroll);
}
function onScroll() {
  if (sweepQueued) return;
  sweepQueued = true;
  requestAnimationFrame(sweep);
}

function onIntersect(entries: IntersectionObserverEntry[]) {
  for (const e of entries) {
    const item = itemByEl.get(e.target);
    if (!item) continue;
    if (e.isIntersecting && item.state === 'pending') {
      enqueue(item);
    } else if (!e.isIntersecting && e.boundingClientRect.bottom < 0 && (item.state === 'pending' || item.state === 'queued')) {
      // Scrolled past before a cursor got to it: just show it
      const q = item.section.queue;
      const i = q.indexOf(item);
      if (i >= 0) q.splice(i, 1);
      finish(item);
    }
  }
}

function enqueue(item: Item) {
  const sec = item.section;
  item.state = 'queued';
  sec.queue.push(item);
  if (!sec.started) {
    sec.started = true;
    for (let i = 0; i < AMBIENT; i++) window.setTimeout(() => ambient(sec), 150 + i * 260);
  }
  dispatch(sec);
}

function dispatch(sec: Section) {
  while (sec.queue.length) {
    let w = sec.workers.find((c) => !c.busy);
    if (!w && sec.workers.length < MAX_WORKERS) {
      w = spawn(sec, rel(sec.queue[0].el, sec.el));
      sec.workers.push(w);
    }
    if (!w) return;
    const item = sec.queue.shift()!;
    run(sec, w, item);
  }
}

// Marks a section while agents are working in it
const activeIn = new WeakMap<Section, number>();
function constructing(sec: Section, d: number) {
  const n = (activeIn.get(sec) ?? 0) + d;
  activeIn.set(sec, n);
  if (n > 0) sec.el.classList.add('is-constructing');
  else
    window.setTimeout(() => {
      if (!activeIn.get(sec) && !sec.queue.length) sec.el.classList.remove('is-constructing');
    }, 500);
}

async function run(sec: Section, w: Cursor, item: Item) {
  w.busy = true;
  clearTimeout(w.idle);
  rulers.inc();
  constructing(sec, 1);
  try {
    await buildItem(sec, w, item);
  } finally {
    rulers.dec();
    constructing(sec, -1);
    w.busy = false;
    if (sec.queue.length) dispatch(sec);
    else w.idle = window.setTimeout(() => retire(sec, w), 900);
  }
}

/* ---------------- Cursors ---------------- */

const ARROW =
  '<svg class="bcur__arrow" width="18" height="20" viewBox="0 0 18 20"><path d="M1 1v14.5l3.8-3.6 2.8 6.3 2.6-1.1-2.7-6.2h5.3z" style="fill: var(--c)" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const IBEAM =
  '<svg class="bcur__ibeam" width="10" height="18" viewBox="0 0 10 18"><path d="M2 1.5h6M2 16.5h6M5 1.5v15" fill="none" stroke="#181818" stroke-width="3" stroke-linecap="round"/><path d="M2 1.5h6M2 16.5h6M5 1.5v15" fill="none" style="stroke: var(--c)" stroke-width="1.5" stroke-linecap="round"/></svg>';

function makeCursor(sec: Section, x: number, y: number): Cursor {
  const el = document.createElement('div');
  const n = spawned++;
  el.className = 'bcur';
  el.style.setProperty('--c', COLORS[n % COLORS.length]);
  el.innerHTML = `${ARROW}${IBEAM}<span class="bcur__tag">${NAMES[n % NAMES.length]}</span>`;
  el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  sec.layer.append(el);
  return { el, x, y, busy: false };
}

/** A new cursor flies in from the side nearest to its first job. */
function spawn(sec: Section, near: { x: number; y: number }): Cursor {
  const width = sec.el.clientWidth;
  const fromLeft = near.x < width / 2;
  return makeCursor(sec, fromLeft ? -40 : width + 40, near.y + rand(-160, 160));
}

async function moveTo(c: Cursor, x: number, y: number, duration?: number, easing = EASE_MOVE) {
  const from = `translate3d(${c.x}px, ${c.y}px, 0)`;
  const to = `translate3d(${x}px, ${y}px, 0)`;
  const dur = duration ?? clamp(Math.hypot(x - c.x, y - c.y) * 0.55, 260, 700);
  c.x = x;
  c.y = y;
  const a = c.el.animate([{ transform: from }, { transform: to }], { duration: dur, easing, fill: 'forwards' });
  await a.finished.catch(() => {});
  c.el.style.transform = to;
  a.cancel();
}

async function retire(sec: Section, w: Cursor) {
  if (w.busy) return;
  w.busy = true; // not available while leaving
  const width = sec.el.clientWidth;
  await moveTo(w, w.x < width / 2 ? -60 : width + 60, w.y + rand(-140, 140));
  w.el.remove();
  sec.workers.splice(sec.workers.indexOf(w), 1);
  if (sec.queue.length) dispatch(sec);
}

/** Decorative cursors that wander around the visible part of the section. */
async function ambient(sec: Section) {
  const r = sec.el.getBoundingClientRect();
  const width = sec.el.clientWidth;
  const y0 = Math.max(0, -r.top) + 40;
  const y1 = Math.min(r.height, window.innerHeight - r.top) - 40;
  if (y1 <= y0) return;
  rulers.inc();
  const fromLeft = Math.random() < 0.5;
  const c = makeCursor(sec, fromLeft ? -40 : width + 40, rand(y0, y1));
  for (let i = 0; i < 2; i++) {
    await moveTo(c, rand(width * 0.1, width * 0.9), rand(y0, y1));
    await wait(rand(150, 600));
  }
  await moveTo(c, Math.random() < 0.5 ? -60 : width + 60, c.y + rand(-120, 120));
  c.el.remove();
  rulers.dec();
}

/* ---------------- Building a block ---------------- */

function rel(el: HTMLElement, section: HTMLElement) {
  const r = el.getBoundingClientRect();
  const s = section.getBoundingClientRect();
  return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
}

function addEl(parent: HTMLElement, cls: string, css: Partial<CSSStyleDeclaration> = {}) {
  const el = document.createElement('div');
  el.className = cls;
  Object.assign(el.style, css);
  parent.append(el);
  return el;
}

async function buildItem(sec: Section, w: Cursor, item: Item) {
  if (item.state === 'done') return;
  item.state = 'building';
  waiting.delete(item);
  const r = rel(item.el, sec.el);
  if (r.w < 2 || r.h < 2) return finish(item);

  await moveTo(w, r.x, r.y);
  if ((item.state as State) === 'done') return; // revealed meanwhile

  const px = (n: number) => `${n}px`;
  const sel = addEl(sec.layer, 'bsel', { left: px(r.x), top: px(r.y), width: px(r.w), height: px(r.h) });
  const box = addEl(sel, 'bsel__box');
  for (const pos of ['tl', 'tr', 'bl', 'br']) addEl(sel, `bh ${pos}`);
  const badge = addEl(sec.layer, 'bbadge');
  const gh = addEl(sec.layer, 'bguide h', { top: px(r.y) });
  const gv = addEl(sec.layer, 'bguide v', { left: px(r.x) });
  for (const g of [gh, gv]) g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: 'forwards' });

  // Drag the selection from the top-left to the bottom-right corner
  const isBox = item.kind === 'box';
  // images are drawn in a little slower so the reveal reads as one smooth sweep
  const dur = isBox ? 900 : 300;
  box.animate([{ clipPath: CLIP_FROM }, { clipPath: CLIP_TO }], { duration: dur, easing: EASE_DRAW, fill: 'forwards' });
  let reveal: Animation | undefined;
  if (isBox) {
    reveal = item.el.animate([{ clipPath: CLIP_FROM }, { clipPath: CLIP_TO }], { duration: dur, easing: EASE_DRAW, fill: 'both' });
    // 'bp-drawing' tells WebGL covers to follow the animated clip
    item.el.classList.add('bp-drawing');
    item.el.classList.remove('bp-box');
  }

  // Live W × H badge under the box, read from where the cursor actually is
  let tracking = true;
  const track = () => {
    if (!tracking) return;
    const m = new DOMMatrixReadOnly(getComputedStyle(w.el).transform);
    const cw = clamp(m.m41 - r.x, 0, r.w);
    const ch = clamp(m.m42 - r.y, 0, r.h);
    badge.textContent = `${Math.round(cw)} × ${Math.round(ch)}`;
    badge.style.transform = `translate3d(${r.x + cw / 2}px, ${r.y + ch + 8}px, 0) translateX(-50%)`;
    requestAnimationFrame(track);
  };
  requestAnimationFrame(track);
  await moveTo(w, r.x + r.w, r.y + r.h, dur, EASE_DRAW);
  tracking = false;
  badge.textContent = `${Math.round(r.w)} × ${Math.round(r.h)}`;
  badge.style.transform = `translate3d(${r.x + r.w / 2}px, ${r.y + r.h + 8}px, 0) translateX(-50%)`;
  sel.classList.add('has-handles');
  reveal?.cancel();
  item.el.classList.remove('bp-drawing');

  if (!isBox) await type(sec, w, item);
  await wait(220);

  // Deselect
  const out = { duration: 200, easing: 'ease', fill: 'forwards' as FillMode };
  await Promise.all([sel, badge, gh, gv].map((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], out).finished.catch(() => {})));
  for (const el of [sel, badge, gh, gv]) el.remove();
  finish(item);
}

/** Flex/grid parents would turn every word into its own item; keep the words together. */
function holderFor(node: Text): DocumentFragment | HTMLElement {
  const d = node.parentElement ? getComputedStyle(node.parentElement).display : '';
  if (/flex|grid/.test(d)) {
    const s = document.createElement('span');
    return s;
  }
  return document.createDocumentFragment();
}

function wrapWords(el: HTMLElement) {
  if (el.querySelector('.bw')) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  for (const node of texts) {
    if (!node.textContent?.trim()) continue;
    const frag = holderFor(node);
    for (const part of node.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.append(document.createTextNode(part));
        continue;
      }
      const span = document.createElement('span');
      span.className = 'bw';
      span.textContent = part;
      frag.append(span);
    }
    node.replaceWith(frag);
  }
}

/** Type the block's text word by word with an I-beam cursor. */
async function type(sec: Section, w: Cursor, item: Item) {
  const el = item.el;
  wrapWords(el);
  el.classList.add('is-typing');
  el.classList.remove('bp-text');
  const words = [...el.querySelectorAll<HTMLElement>('.bw')];
  if (!words.length) {
    el.classList.remove('is-typing');
    return;
  }
  const s = sec.el.getBoundingClientRect();
  const pos = words.map((wd) => {
    const b = wd.getBoundingClientRect();
    return { x: b.right - s.left + 2, y: b.top - s.top + b.height / 2 };
  });
  w.el.classList.add('is-ibeam');
  const dur = clamp(words.length * 36, 240, 1100);
  await new Promise<void>((resolve) => {
    const t0 = performance.now();
    let shown = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const n = Math.max(1, Math.ceil(p * words.length));
      while (shown < n) words[shown++].classList.add('on');
      const q = pos[n - 1];
      w.x = q.x;
      w.y = q.y;
      w.el.style.transform = `translate3d(${q.x}px, ${q.y}px, 0)`;
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
  el.classList.remove('is-typing');
  w.el.classList.remove('is-ibeam');
}

function finish(item: Item) {
  item.state = 'done';
  waiting.delete(item);
  item.el.classList.remove('bp-text', 'bp-box', 'is-typing');
}

/* ---------------- Followers ----------------
   Once the first screen is built, a few of the agents stay around and trail
   the visitor's own cursor, each with its own lag, like collaborators in a
   shared file. Mouse/trackpad only. */

function followers() {
  if (reduceMotion || preview || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'bfollow';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);

  // offset from the pointer and how quickly each one catches up
  const crew = [
    { name: 'Design', c: '#111111', ox: -46, oy: 26, k: 0.11 },
    { name: 'Motion', c: '#555555', ox: 34, oy: 38, k: 0.075 },
    { name: 'Dev', c: '#8c8c8c', ox: -10, oy: 64, k: 0.05 },
  ].map((m, i) => {
    const el = document.createElement('div');
    el.className = 'bcur';
    el.style.setProperty('--c', m.c);
    el.innerHTML = `${ARROW}<span class="bcur__tag">${m.name}</span>`;
    layer.append(el);
    return { ...m, el, x: -100, y: -100, phase: i * 2.1 };
  });

  let px = -100;
  let py = -100;
  let seen = false;
  window.addEventListener(
    'pointermove',
    (e) => {
      px = e.clientX;
      py = e.clientY;
      if (!seen) {
        seen = true;
        // arrive from just outside the nearest edge rather than popping in
        for (const m of crew) {
          m.x = px + m.ox * 4;
          m.y = py + m.oy * 4;
        }
      }
      layer.classList.add('is-on');
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => layer.classList.remove('is-on'));

  const tick = (now: number) => {
    requestAnimationFrame(tick);
    if (!seen) return;
    const t = now / 1000;
    for (const m of crew) {
      // a slow drift around their spot so they never sit perfectly still
      const tx = px + m.ox + Math.sin(t * 0.8 + m.phase) * 6;
      const ty = py + m.oy + Math.cos(t * 0.6 + m.phase) * 5;
      m.x += (tx - m.x) * m.k;
      m.y += (ty - m.y) * m.k;
      m.el.style.transform = `translate3d(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px, 0)`;
    }
  };
  requestAnimationFrame(tick);
}

// Start last, once every helper above is defined
// Switched off for now: flip to true to bring the cursor build back
const BUILD_ON = false;
if (BUILD_ON && sectionEls.length && !reduceMotion && !preview) init();
// Followers are switched off for now: flip to true to bring them back
const FOLLOWERS_ON = false;
if (FOLLOWERS_ON) window.setTimeout(followers, root.classList.contains('is-returning') ? 300 : 2600);
