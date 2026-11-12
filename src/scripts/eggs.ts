// Easter-egg candidates for home, one per preview link (/egg-1 … /egg-5).
import glyphs from '../lib/monogram-b.json';
import { mountMark, inOut } from '../lib/lab-mark';
import { createStage } from './fall-physics';

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


// ---------------------------------------------------------------- round two

const coverUrls = () => {
  const seen = new Set<string>();
  document.querySelectorAll<HTMLElement>('.vh__pill').forEach((p) => {
    const img = p.querySelector('img');
    const u = img?.currentSrc || img?.src || p.dataset.src;
    if (u) seen.add(u);
  });
  return [...seen];
};
const onEmpty = (t: EventTarget | null) => !(t as Element)?.closest?.('a, button, .vh__pill, input');

/** 6 — press B: the cursor leaves a trail of project pictures (B again to stop) */
export function eggTrail() {
  let on = false;
  let urls: string[] = [];
  let k = 0;
  let lx = -1e3;
  let ly = -1e3;
  const badge = el('egg-mode', 'Trail on — press <b>B</b> to stop');
  addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'b' || e.metaKey || e.ctrlKey) return;
    on = !on;
    if (on && !urls.length) urls = coverUrls();
    badge.classList.toggle('is-on', on);
  });
  addEventListener('pointermove', (e) => {
    if (!on || !urls.length) return;
    if (Math.hypot(e.clientX - lx, e.clientY - ly) < 70) return;
    lx = e.clientX;
    ly = e.clientY;
    const im = document.createElement('img');
    im.src = urls[k++ % urls.length];
    im.className = 'egg-trail';
    im.style.left = `${e.clientX}px`;
    im.style.top = `${e.clientY}px`;
    document.body.append(im);
    const r = (Math.random() - 0.5) * 10;
    im.animate(
      [
        { opacity: 0, transform: `translate(-50%,-50%) scale(0.6) rotate(${r}deg)` },
        { opacity: 1, transform: `translate(-50%,-50%) scale(1) rotate(${r}deg)`, offset: 0.15 },
        { opacity: 1, transform: `translate(-50%,-50%) scale(1) rotate(${r}deg)`, offset: 0.6 },
        { opacity: 0, transform: `translate(-50%,-30%) scale(0.92) rotate(${r}deg)` },
      ],
      { duration: 1100, easing: OUT, fill: 'both' },
    ).finished.then(() => im.remove());
  });
}

/** 7 — double-click the empty white: every word on the page drops to the floor; again to put it back */
export function eggGravity() {
  let down = false;
  const targets = () =>
    [...document.querySelectorAll<HTMLElement>('.nav a, .vh__intro > *, .vh__details .vh__col, .vh__hint, .vh__line')].filter(
      (n) => n.getBoundingClientRect().width > 0,
    );
  let anims: Animation[] = [];
  addEventListener('dblclick', (e) => {
    if (!onEmpty(e.target)) return;
    getSelection()?.removeAllRanges();
    if (!down) {
      anims = targets().map((n, i) => {
        const r = n.getBoundingClientRect();
        const fall = innerHeight - r.bottom - 6 - Math.random() * 10;
        const rot = (Math.random() - 0.5) * 28;
        return n.animate(
          [
            { transform: 'none' },
            { transform: `translateY(${fall}px) rotate(${rot}deg)`, offset: 0.62, easing: 'cubic-bezier(0.3, 0, 0.6, 0.4)' },
            { transform: `translateY(${fall - 26}px) rotate(${rot * 0.8}deg)`, offset: 0.78, easing: 'cubic-bezier(0.3, 0, 0.6, 0.4)' },
            { transform: `translateY(${fall}px) rotate(${rot}deg)`, offset: 0.9 },
            { transform: `translateY(${fall - 5}px) rotate(${rot}deg)`, offset: 0.95 },
            { transform: `translateY(${fall}px) rotate(${rot}deg)` },
          ],
          { duration: 1100 + Math.random() * 300, delay: i * 25 + Math.random() * 80, easing: 'cubic-bezier(0.55, 0, 1, 0.45)', fill: 'forwards' },
        );
      });
    } else {
      anims.forEach((a) => {
        a.playbackRate = -1.6;
        a.finished.then(() => a.cancel());
      });
    }
    down = !down;
  });
}

/** 8 — press and hold on the white: lights out, a soft torch follows the cursor */
export function eggTorch() {
  const dark = el('egg-dark');
  let x = innerWidth / 2;
  let y = innerHeight / 2;
  const put = () => dark.style.setProperty('--x', `${x}px`) || dark.style.setProperty('--y', `${y}px`);
  let hold = 0;
  addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    put();
  });
  addEventListener('pointerdown', (e) => {
    if (!onEmpty(e.target)) return;
    x = e.clientX;
    y = e.clientY;
    put();
    hold = window.setTimeout(() => dark.classList.add('is-on'), 450);
  });
  const off = () => {
    clearTimeout(hold);
    dark.classList.remove('is-on');
  };
  addEventListener('pointerup', off);
  addEventListener('pointercancel', off);
  addEventListener('blur', off);
}

/** 9 — shake the column (quick up-down-up): the covers wobble like jelly */
export function eggJelly() {
  const vp = document.querySelector<HTMLElement>('[data-vh-viewport]');
  if (!vp) return;
  let dirs: { d: number; t: number }[] = [];
  let busy = false;
  const note = (d: number) => {
    const now = performance.now();
    const last = dirs[dirs.length - 1];
    if (!last || Math.sign(last.d) !== Math.sign(d)) dirs.push({ d, t: now });
    dirs = dirs.filter((x) => now - x.t < 1100);
    if (dirs.length >= 4 && !busy) {
      dirs = [];
      busy = true;
      vp.animate(
        [
          { transform: 'none' },
          { transform: 'skewY(5deg) scaleX(1.04)' },
          { transform: 'skewY(-4deg) scaleX(0.97)' },
          { transform: 'skewY(3deg) scaleX(1.02)' },
          { transform: 'skewY(-1.6deg) scaleX(0.99)' },
          { transform: 'skewY(0.6deg)' },
          { transform: 'none' },
        ],
        { duration: 1100, easing: 'ease-out' },
      ).finished.then(() => (busy = false));
    }
  };
  addEventListener('wheel', (e) => Math.abs(e.deltaY) > 4 && note(e.deltaY), { passive: true });
  let ly = 0;
  addEventListener('touchmove', (e) => {
    const y = e.touches[0].clientY;
    if (Math.abs(y - ly) > 12) note(ly - y);
    ly = y;
  }, { passive: true });
  addEventListener('keydown', (e) => (e.key === 'ArrowUp' ? note(-1) : e.key === 'ArrowDown' ? note(1) : 0));
}

/** 10 — just start typing: the letters appear huge behind the column and fade */
export function eggTypeBehind() {
  // inside the home section, under the covers (they're drawn on a canvas above)
  const layer = el('egg-type');
  document.querySelector('[data-vh]')?.prepend(layer);
  let word = '';
  let t = 0;
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Backspace') word = word.slice(0, -1);
    else if (/^[\p{L}\p{N} &!?.]$/u.test(e.key)) word = (word + e.key).slice(-14);
    else return;
    layer.textContent = word;
    layer.classList.add('is-on');
    layer.animate([{ letterSpacing: '-0.02em' }, { letterSpacing: '-0.06em' }], { duration: 400, easing: OUT });
    clearTimeout(t);
    t = window.setTimeout(() => {
      layer.classList.remove('is-on');
      window.setTimeout(() => (word = ''), 600);
    }, 1800);
  });
}

/** 11 — type and the word appears huge behind the column; stop and the
 *  letters really fall: they tumble, stack on the floor and get shoved by the
 *  cursor (press one to pick it up and throw it). Double-click the empty
 *  white and the page's own words drop into the same pile; again to put
 *  them back. */
export function eggTypeAndFall() {
  const host = document.querySelector<HTMLElement>('[data-vh]') ?? document.body;
  let stage: ReturnType<typeof createStage> | null = null;
  const world = () => (stage ??= createStage());
  let row: HTMLElement | null = null;
  let letters: HTMLElement[] = [];
  let t = 0;
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Backspace') {
      letters.pop()?.remove();
    } else if (/^[\p{L}\p{N}&!?.]$/u.test(e.key) || e.key === ' ') {
      if (!row) {
        row = document.createElement('div');
        row.className = 'egg-fall';
        host.prepend(row);
        letters = [];
      }
      if (letters.length >= 14) return;
      const s = document.createElement('span');
      s.textContent = e.key === ' ' ? '\u00a0' : e.key;
      row.append(s);
      letters.push(s);
      s.animate([{ opacity: 0, transform: 'translateY(18%) scale(0.92)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: OUT });
    } else return;
    clearTimeout(t);
    t = window.setTimeout(() => {
      const r = row;
      const ls = letters.filter((l) => l.textContent !== '\u00a0');
      row = null;
      letters = [];
      if (!r || !ls.length) return;
      world().add(ls, 0.06);
      // the pile clears itself after a while
      window.setTimeout(() => {
        r.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: OUT, fill: 'forwards' }).finished.then(() => {
          world().remove(ls);
          r.remove();
        });
      }, 12000);
    }, 1100);
  });

  // the page's own words
  let down: HTMLElement[] = [];
  addEventListener('dblclick', (e) => {
    if (!onEmpty(e.target)) return;
    getSelection()?.removeAllRanges();
    if (!down.length) {
      // everything on screen: the menu, the words, the line and the covers
      // themselves (they're drawn where their boxes are, so they fall too)
      down = [...document.querySelectorAll<HTMLElement>('.nav a, .nav button, .vh__intro > *, .vh__details .vh__col, .vh__hint, .vh__line, .vh__pill')].filter((n) => {
        const r = n.getBoundingClientRect();
        return r.width > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(n).visibility !== 'hidden' && getComputedStyle(n).display !== 'none';
      });
      world().add(down, 0.08);
    } else {
      world().restore(down);
      down = [];
    }
  });
}
