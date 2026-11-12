// Easter-egg candidates for home, one per preview link (/egg-1 … /egg-5).
import glyphs from '../lib/monogram-b.json';
import { mountMark, inOut } from '../lib/lab-mark';

const OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const [B_PATH, B_BOX] = glyphs.g.B as [string, number[], number];
const B_VIEW = `${B_BOX[0]} ${-B_BOX[3]} ${B_BOX[2] - B_BOX[0]} ${B_BOX[3] - B_BOX[1]}`;
const bSvg = () => `<svg viewBox="${B_VIEW}" aria-hidden="true"><path transform="scale(1,-1)" d="${B_PATH}" fill="currentColor"/></svg>`;

const el = (cls: string, html = '') => {
  const d = document.createElement('div');
  d.className = cls;
  d.innerHTML = html;
  document.body.append(d);
  return d;
};

/** 1 — click the B logo five times: a big chrome B spins once in the middle */
export function eggLogoSpin() {
  const logo = document.querySelector<HTMLAnchorElement>('.nav__home');
  if (!logo) return;
  let clicks: number[] = [];
  let busy = false;
  logo.addEventListener('click', (e) => {
    // on home the logo has nowhere to go, so clicks just count
    e.preventDefault();
    const now = performance.now();
    clicks = clicks.filter((t) => now - t < 1800);
    clicks.push(now);
    logo.animate([{ transform: 'scale(0.86)' }, { transform: 'none' }], { duration: 260, easing: OUT });
    if (clicks.length < 5 || busy) return;
    clicks = [];
    busy = true;
    const layer = el('egg-spin');
    const c = document.createElement('canvas');
    layer.append(c);
    const DUR = 1900;
    // one full turn and a bit, fast in the middle, settling face-on, then away
    mountMark(c, (ms) => {
      const k = inOut(ms / 1500);
      return { rx: Math.sin(k * Math.PI) * 0.35, ry: -Math.PI + k * Math.PI * 3, rz: Math.sin(k * Math.PI) * -0.12 };
    }, { z: 6.4 });
    c.animate(
      [
        { opacity: 0, transform: 'scale(0.7)' },
        { opacity: 1, transform: 'scale(1)', offset: 0.25 },
        { opacity: 1, transform: 'scale(1)', offset: 0.78 },
        { opacity: 0, transform: 'scale(1.08)' },
      ],
      { duration: DUR, easing: OUT, fill: 'both' },
    ).finished.then(() => {
      layer.remove();
      busy = false;
    });
  });
}

/** 2 — a quiet counter of the projects seen; all of them earns a thank-you */
export function eggSeenAll() {
  const seen = new Set<number>();
  let n = 0;
  let done = false;
  const pill = el('egg-pill');
  let hideT = 0;
  addEventListener('vh:project', (e) => {
    const d = (e as CustomEvent<{ i: number; n: number }>).detail;
    n = d.n;
    if (done) return;
    seen.add(d.i);
    if (seen.size < 2) return;
    pill.classList.add('is-on');
    clearTimeout(hideT);
    if (seen.size >= n) {
      done = true;
      pill.innerHTML = `<span class="egg-pill__n">${n} / ${n}</span> seen it all — thanks for looking ✦`;
      pill.animate([{ transform: 'translateX(-50%) scale(1)' }, { transform: 'translateX(-50%) scale(1.06)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 420, easing: OUT });
      hideT = window.setTimeout(() => pill.classList.remove('is-on'), 4200);
    } else {
      pill.innerHTML = `<span class="egg-pill__n">${seen.size} / ${n}</span> projects seen`;
      hideT = window.setTimeout(() => pill.classList.remove('is-on'), 2200);
    }
  });
}

/** 3 — type "hi": Let's cooperate gives a little wave and a bubble opens */
export function eggHi(callUrl: string) {
  let buf = '';
  let open = false;
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-2);
    if (buf !== 'hi' || open) return;
    open = true;
    const links = [...document.querySelectorAll<HTMLAnchorElement>('.nav a')];
    const coop = links.find((a) => /cooperate/i.test(a.textContent ?? '')) ?? links[links.length - 1];
    const r = coop.getBoundingClientRect();
    coop.animate(
      [{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' }],
      { duration: 600, easing: 'ease-in-out' },
    );
    const b = el('egg-bubble', `<a href="${callUrl}" target="_blank" rel="noopener">Hi! Let’s talk <span>→</span></a>`);
    b.style.top = `${r.bottom + 12}px`;
    b.style.right = `${innerWidth - r.right}px`;
    b.animate([{ opacity: 0, transform: 'translateY(-6px) scale(0.94)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: OUT, fill: 'both' });
    setTimeout(() => {
      b.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-4px)' }], { duration: 300, easing: OUT, fill: 'both' }).finished.then(() => {
        b.remove();
        open = false;
      });
    }, 6000);
  });
}

/** 4 — leave the mouse still for a few seconds: the cursor turns into a slowly turning B */
export function eggIdleCursor() {
  if (!matchMedia('(pointer: fine)').matches) return;
  const b = el('egg-cursor', bSvg());
  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let t = 0;
  const show = () => {
    b.style.transform = `translate(${x}px, ${y}px)`;
    b.classList.add('is-on');
    document.documentElement.classList.add('egg-nocursor');
  };
  const arm = () => {
    clearTimeout(t);
    t = window.setTimeout(show, 3000);
  };
  addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    if (b.classList.contains('is-on')) {
      b.classList.remove('is-on');
      document.documentElement.classList.remove('egg-nocursor');
    }
    arm();
  });
  arm();
}

/** 5 — late at night the site goes dark and says hello (forced on for preview) */
export function eggNight(force: boolean) {
  const h = new Date().getHours();
  if (!force && !(h >= 22 || h < 6)) return;
  document.documentElement.classList.add('egg-night');
  const note = el('egg-night-note', 'Working late too? <span>☕</span>');
  note.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 2600, easing: OUT, fill: 'both' });
}

