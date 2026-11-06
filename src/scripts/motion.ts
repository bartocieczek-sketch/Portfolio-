// Site-wide scroll motion, modelled on bymonolog.com:
//  • [data-split] text rises line by line out of an invisible mask
//  • [data-parallax] media drifts slower than the page inside its frame

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Split text ----------
   Each word is wrapped in a clipping mask; words on the same line share a
   delay, so lines rise one after another (~80 ms apart). Wrapping words
   rather than whole lines keeps nested markup (e.g. muted spans) intact. */

/** Flex/grid parents would turn every word into its own item; keep the words together. */
function holderFor(node: Text): DocumentFragment | HTMLElement {
  const d = node.parentElement ? getComputedStyle(node.parentElement).display : '';
  if (/flex|grid/.test(d)) {
    const s = document.createElement('span');
    return s;
  }
  return document.createDocumentFragment();
}

function wrapWords(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
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
      const mask = document.createElement('span');
      mask.className = 'sw';
      const inner = document.createElement('span');
      inner.className = 'swi';
      inner.textContent = part;
      mask.append(inner);
      frag.append(mask);
    }
    node.replaceWith(frag);
  }
}

/** Give every word a --l (line index) based on where it wraps. */
function assignLines(root: HTMLElement) {
  let line = -1;
  let lastTop = Number.NEGATIVE_INFINITY;
  root.querySelectorAll<HTMLElement>('.sw').forEach((w) => {
    const top = w.offsetTop;
    if (top > lastTop + 2) {
      line++;
      lastTop = top;
    }
    w.style.setProperty('--l', String(line));
  });
}

const splitEls = [...document.querySelectorAll<HTMLElement>('[data-split]')];
if (splitEls.length) {
  for (const el of splitEls) {
    wrapWords(el);
    assignLines(el);
    el.classList.add('is-split');
  }

  if (reduceMotion) {
    splitEls.forEach((el) => el.classList.add('is-split-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-split-in');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    splitEls.forEach((el) => {
      // Elements started by another script (e.g. after the home intro) opt out here
      if (el.dataset.split !== 'manual') io.observe(el);
    });
  }

  // Line breaks change with width; recompute which words share a line
  let t = 0;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = window.setTimeout(() => splitEls.forEach(assignLines), 150);
  });
}

/* ---------- Parallax ----------
   The inner media is scaled up 15% and shifted against the scroll, so it
   moves slower than its frame. Only frames on screen are updated. */

const frames = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
if (frames.length && !reduceMotion) {
  const visible = new Set<HTMLElement>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target as HTMLElement);
        else visible.delete(e.target as HTMLElement);
      }
    },
    { rootMargin: '20% 0px' },
  );
  frames.forEach((f) => {
    f.classList.add('has-parallax');
    io.observe(f);
  });

  const update = () => {
    const vh = window.innerHeight;
    for (const frame of visible) {
      const inner = frame.firstElementChild as HTMLElement | null;
      if (!inner) continue;
      const r = frame.getBoundingClientRect();
      // -1 when the frame enters at the bottom, +1 when it leaves at the top
      const p = Math.max(-1, Math.min(1, (vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2)));
      const shift = p * r.height * 0.07;
      inner.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) scale(1.15)`;
    }
    requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}
