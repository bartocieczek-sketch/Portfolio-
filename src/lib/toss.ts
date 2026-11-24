/*
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
