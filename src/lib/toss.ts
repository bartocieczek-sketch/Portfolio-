/*
 * The site's two small sounds, synthesised with Web Audio (no files).
 *
 * A soft "toss" whoosh for the home column: a short burst of noise through a
 * band-pass filter whose centre slides down (about 1.1 kHz to 520 Hz in
 * 170 ms), with a gentle 40 ms swell. Synthesised with Web Audio, so there
 * is no file to load.
 *
 * Browsers only let a page make sound after a real gesture (a click, tap or
 * key; scrolling with a wheel or trackpad doesn't count), so the audio
 * wakes on the first one and stays quiet until then.
 */

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let last = 0;

const wake = () => {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      // half a second of white noise, reused by every whoosh
      noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.5), ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
};

if (typeof window !== 'undefined') {
  for (const ev of ['pointerdown', 'keydown', 'touchend'] as const) addEventListener(ev, wake, { passive: true });
}

/** one whoosh; `amt` (0..1) is how hard the column is moving */
export function toss(amt = 0.5) {
  if (!ctx || !noise || ctx.state !== 'running') return;
  const now = performance.now();
  if (now - last < 70) return; // a fast flick through many projects stays a flutter, not a buzz
  last = now;
  const t = ctx.currentTime;
  const dur = 0.17;
  const k = Math.max(0, Math.min(1, amt));
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.9 + Math.random() * 0.2; // no two quite alike
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  const hi = 1100 * (0.95 + k * 0.15);
  bp.frequency.setValueAtTime(hi, t);
  bp.frequency.linearRampToValueAtTime(hi * 0.47, t + dur);
  const g = ctx.createGain();
  const peak = 0.05 + k * 0.05;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.04);
  g.gain.linearRampToValueAtTime(0, t + dur);
  src.connect(bp).connect(g).connect(ctx.destination);
  src.start(t, Math.random() * 0.3, dur + 0.02);
}

/*
 * A soft "bump" for clicks: a low sine that drops from about 208 Hz to
 * 165 Hz over 120 ms, rounded off by a low-pass at 520 Hz, with a 10 ms
 * swell so it never clicks itself.
 */
let lastBump = 0;
export function bump() {
  if (!ctx || ctx.state === 'closed') return;
  const now = performance.now();
  if (now - lastBump < 40) return;
  lastBump = now;
  const t = ctx.currentTime + 0.005;
  const dur = 0.12;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(208, t);
  osc.frequency.linearRampToValueAtTime(165, t + dur);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 520;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.14, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(lp).connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// every click on something you can click plays the bump (on the click
// itself, so starting a drag doesn't; the press before it has woken the
// audio, so even the very first click is heard)
if (typeof window !== 'undefined') {
  const CLICKABLE = 'a[href], button, [role="button"], summary, label[for], input[type="checkbox"], input[type="radio"], [data-media], .wk__img, .wk__zoom, .wk__dim';
  addEventListener(
    'click',
    (e) => {
      if (e.button !== 0 || e.detail === 0) return; // (keyboard clicks are handled below)
      if ((e.target as Element | null)?.closest?.(CLICKABLE)) bump();
    },
    { capture: true, passive: true },
  );
  addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if ((e.target as Element | null)?.closest?.(CLICKABLE)) bump();
  });
}
