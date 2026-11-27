// One template for a quote, used by the panel preview (Studio) and the
// public link (/wycena/[token]). Pure string output, no dependencies,
// so it runs on the server and in the browser alike.

export type QuoteItem = { _key?: string; name?: string; description?: string; min?: number; max?: number; group?: 'design' | 'support' };
export type QuoteStep = { _key?: string; title?: string; text?: string };
export type QuoteData = {
  title?: string;
  eyebrow?: string;
  goal?: string;
  goalSub?: string;
  stat2Value?: string;
  stat2Label?: string;
  rate?: number;
  issuedAt?: string;
  scope?: string[];
  items?: QuoteItem[];
  steps?: QuoteStep[];
  outOfScope?: string[];
  assumptions?: string[];
  clientName?: string;
};

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const pl = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const dec = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const range = (a: number, b: number, unit: string) => (a === b ? `${pl(a)} ${unit}` : `${pl(a)}–${pl(b)} ${unit}`);
const dateLabel = (iso?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return y && m && d ? `${d}.${m}.${y}` : '';
};

export function quoteTotals(q: QuoteData) {
  const items = (q.items ?? []).filter((i) => i && (i.name || i.min || i.max));
  const sum = (list: QuoteItem[]) => list.reduce((a, i) => [a[0] + num(i.min), a[1] + num(i.max)], [0, 0]);
  const all = sum(items);
  const design = sum(items.filter((i) => i.group !== 'support'));
  const support = sum(items.filter((i) => i.group === 'support'));
  const rate = num(q.rate) || 0;
  return { items, all, design, support, rate };
}

const MARK_PATH =
  'M387 286Q378 281 368.5 276.5Q359 272 352 269Q346 266 342 266Q320 266 320 289Q320 301 331 308Q489 395 651.5 519.0Q814 643 813 857Q812 991 723.0 1133.0Q634 1275 453 1275Q330 1275 225.0 1188.5Q120 1102 120 995Q120 884 184.0 801.0Q248 718 389 697Q502 694 571 744Q580 751 592.5 765.5Q605 780 617 780Q632 780 636.0 767.0Q640 754 631 745Q608 720 566 694Q500 652 415 652Q188 649 101.0 763.5Q14 878 31.0 1058.0Q48 1238 195.5 1364.0Q343 1490 536 1482Q701 1475 800.0 1411.0Q899 1347 951 1250Q956 1239 967 1241Q979 1241 981 1253Q1009 1354 1086.5 1416.0Q1164 1478 1284 1478Q1399 1478 1485.0 1404.5Q1571 1331 1610 1166Q1639 1057 1691 1059Q1712 1059 1715.5 1042.5Q1719 1026 1699 1016L1473 911Q1462 905 1464 894Q1465 883 1477 880Q1596 853 1686.5 750.5Q1777 648 1777 501Q1773 270 1473 93Q1308 -3 1155.0 -20.0Q1002 -37 867 10Q713 64 603.5 191.5Q494 319 387 286ZM1049 758 1439 942Q1448 949 1448 956Q1448 966 1440 971Q1372 1011 1338 1144Q1311 1242 1270.0 1303.0Q1229 1364 1150 1356Q1044 1332 1025.5 1242.0Q1007 1152 1020 1037Q1042 852 916.0 702.5Q790 553 649 449Q739 450 836 357Q904 290 977.5 233.0Q1051 176 1133 138Q1236 89 1339.0 100.5Q1442 112 1516 208Q1570 278 1571.5 371.5Q1573 465 1501.5 560.0Q1430 655 1323.5 690.0Q1217 725 1058 715Q1036 714 1032.5 731.5Q1029 749 1049 758Z';
export const markSvg = (cls = 'mark') =>
  `<svg class="${cls}" viewBox="28 -1483 1749 1507" aria-hidden="true"><path transform="scale(1,-1)" d="${MARK_PATH}" fill="currentColor"/></svg>`;
export const MARK_PATH_D = MARK_PATH;

const I = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  screen: '<rect x="6" y="2" width="12" height="20" rx="1"/><path d="M10 18h4"/>',
  coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  step: ['<path d="M4 6h16M4 12h10M4 18h7"/>', '<path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5z"/>', '<path d="M6 4l13 8-13 8z"/>', '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'],
};
const icon = (p: string, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${p}</svg>`;

export const DEFAULT_STEPS: QuoteStep[] = [
  { title: 'Schematy', text: 'Układ ekranów i ścieżki użytkownika.' },
  { title: 'Projekt graficzny', text: 'Koncepcja, szablon i kluczowe ekrany.' },
  { title: 'Prototyp', text: 'Klikalna wersja do akceptacji.' },
  { title: 'Przekazanie', text: 'Specyfikacja, assety i odbiór.' },
];

/** Full standalone HTML document. `origin` is where /fonts/*.woff2 live. */
export function renderQuoteHtml(q: QuoteData, origin = ''): string {
  const { items, all, design, support, rate } = quoteTotals(q);
  const top = Math.max(1, ...items.map((i) => num(i.max)));
  const steps = q.steps?.length ? q.steps : DEFAULT_STEPS;
  const list = (arr: string[] | undefined, svg: string) =>
    (arr ?? []).filter(Boolean).map((t) => `<li>${icon(svg)}<span>${esc(t)}</span></li>`).join('');
  const date = dateLabel(q.issuedAt);

  const rows = items
    .map(
      (i) => `<div class="h-row"><div><b>${esc(i.name)}</b>${i.description ? `<small>${esc(i.description)}</small>` : ''}<div class="meter"><i style="width:${(num(i.max) / top) * 100}%"></i><s style="width:${(num(i.min) / top) * 100}%"></s></div></div><div class="h">${range(num(i.min), num(i.max), 'h')}${rate ? `<small>${range(num(i.min) * rate, num(i.max) * rate, 'zł')}</small>` : ''}</div></div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${esc(q.title || 'Wycena')} · Bart Ocieczek</title>
<style>
@font-face{font-family:"PP Neue Montreal";src:url(${origin}/fonts/PPNeueMontreal-Regular.woff2) format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"PP Neue Montreal";src:url(${origin}/fonts/PPNeueMontreal-Medium.woff2) format("woff2");font-weight:500;font-display:swap}
:root{color-scheme:light;--bg:#fff;--text:#111;--muted:#8c8c8c;--faint:#b8b8b8;--line:#e6e6e6;--card:#fff;--soft:#f3f3f3;--radius:20px;--ease-out:cubic-bezier(.23,1,.32,1)}
*,*::before,*::after{box-sizing:border-box;min-width:0}
body{margin:0;background:var(--bg);color:var(--text);font-family:"PP Neue Montreal","Neue Montreal","Inter","Helvetica Neue",Arial,sans-serif;font-size:16px;line-height:1.6;letter-spacing:-.02em;-webkit-font-smoothing:antialiased;overflow-x:clip}
small,.step p{letter-spacing:0}
.wrap{max-width:860px;margin:0 auto;padding:0 24px}
.label{font-size:13px;letter-spacing:-.01em;color:var(--muted);font-weight:500}
header.brand{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px 0;border-bottom:1px solid var(--line)}
.who{display:flex;align-items:center;gap:12px}.mark{width:34px;height:auto;display:block;color:var(--text)}
.who b{display:block;font-weight:500;font-size:15px;line-height:1.2}.who small{display:block;color:var(--muted);font-size:13px;line-height:1.3}
.site{color:var(--text);text-decoration:none;font-size:14px;font-weight:500;position:relative}
.site::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:1px;background:var(--text);transform:scaleX(0);transform-origin:100% 50%;transition:transform .3s var(--ease-out)}
.site:hover::after{transform:scaleX(1);transform-origin:0 50%}
.hero{padding:92px 0 70px}
.hero h1{font-size:clamp(34px,6vw,48px);font-weight:500;letter-spacing:-.035em;line-height:1.02;margin:12px 0 34px;text-wrap:balance}
.card{border:1px solid var(--line);background:var(--card);border-radius:var(--radius);overflow:hidden}
.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}
.stat{padding:20px 20px 18px;border-right:1px solid var(--line)}.stat:last-child{border-right:0}
.stat svg{display:block;margin-bottom:22px}
.stat b{display:block;font-weight:500;font-size:18px;letter-spacing:-.03em;white-space:nowrap}
.stat small{color:var(--muted);font-size:12px}
section.row{display:grid;grid-template-columns:208px minmax(0,1fr);gap:24px;padding:62px 0;border-top:1px solid var(--line)}
section.row>.label{padding-top:4px}
.prose p{margin:0 0 14px;max-width:520px;white-space:pre-line}.prose p.sub{color:var(--muted)}
.list{list-style:none;margin:0;padding:0}
.list>li{display:flex;gap:16px;padding:14px 0;border-bottom:1px solid var(--line);align-items:flex-start}
.list>li:first-child{padding-top:0}.list>li:last-child{border-bottom:0}
.list svg{flex:none;margin-top:3px}.list.out svg{color:var(--faint)}.list.out span{color:var(--muted)}
.h-row{display:grid;grid-template-columns:minmax(0,1fr) 120px;gap:16px;padding:16px 20px;border-bottom:1px solid var(--line);align-items:start}
.h-row:last-child{border-bottom:0}
.h-row b{display:block;font-weight:500;font-size:15px}
.h-row small{display:block;color:var(--muted);font-size:13px;line-height:1.5;margin-top:3px}
.h-row .h{text-align:right;white-space:nowrap;letter-spacing:-.04em;font-weight:500}
.h-row .h small{font-weight:400;font-size:12px}
.h-row.sum{background:var(--soft)}
.meter{height:3px;background:var(--line);margin-top:10px;position:relative}
.meter i{position:absolute;inset:0 auto 0 0;background:#111;opacity:.35}.meter s{position:absolute;inset:0 auto 0 0;background:#111}
.steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
.step .ic{display:flex;align-items:center;gap:12px;margin-bottom:18px}
.step .ic span{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:var(--soft);flex:none}
.step .ic i{flex:1;height:1px;background:var(--line)}.step:last-child .ic i{visibility:hidden}
.step h3{font-size:16px;font-weight:500;margin:0 0 8px}.step p{margin:0;color:var(--muted);font-size:14px}
.assume{list-style:none;margin:0;padding:0;counter-reset:a}
.assume li{counter-increment:a;display:grid;grid-template-columns:28px minmax(0,1fr);padding:12px 0;border-bottom:1px solid var(--line);font-size:15px}
.assume li:first-child{padding-top:0}.assume li:last-child{border-bottom:0}.assume li::before{content:counter(a)}
.total{border-radius:var(--radius);display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;background:#111;color:#fff;padding:28px 24px}
.total .label{color:#8c8c8c}.total small{display:block;color:#8c8c8c;font-size:12px;margin-top:4px}
.total strong{font-weight:500;font-size:clamp(26px,5vw,34px);letter-spacing:-.03em;white-space:nowrap}
.t-sub{margin-top:14px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
.t-sub div{padding:16px 20px;border-right:1px solid var(--line)}.t-sub div:last-child{border-right:0}
.t-sub b{display:block;font-weight:500;font-size:15px;white-space:nowrap}.t-sub small{color:var(--muted);font-size:12px}
footer{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:28px 0 40px;border-top:1px solid var(--line)}
footer .mark{width:22px}
@media (max-width:720px){section.row{grid-template-columns:minmax(0,1fr);gap:22px;padding:46px 0}.stats,.t-sub{grid-template-columns:minmax(0,1fr)}.stat,.t-sub div{border-right:0;border-bottom:1px solid var(--line)}.stat:last-child,.t-sub div:last-child{border-bottom:0}.steps{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:28px}.step .ic i{display:none}.hero{padding:60px 0 50px}}
@media (max-width:520px){.who small{display:none}.steps{grid-template-columns:minmax(0,1fr)}.h-row{grid-template-columns:minmax(0,1fr);padding:14px 16px}.h-row .h{text-align:left;display:flex;gap:10px;align-items:baseline}}
</style></head><body><div class="wrap">
<header class="brand"><div class="who">${markSvg()}<div><b>Bart Ocieczek</b><small>Digital Designer &amp; Developer</small></div></div><a class="site" href="https://bartocieczek.com" target="_blank" rel="noopener">bartocieczek.com</a></header>
<div class="hero">${q.eyebrow ? `<span class="label">${esc(q.eyebrow)}</span>` : ''}<h1>${esc(q.title || 'Wycena')}</h1>
<div class="card stats">
<div class="stat">${icon(I.clock)}<b>${range(all[0], all[1], 'h')}</b><small>ok. ${dec(all[0] / 8)}–${dec(all[1] / 8)} dni roboczych</small></div>
<div class="stat">${icon(I.screen)}<b>${esc(q.stat2Value || `${items.length} pozycji`)}</b><small>${esc(q.stat2Label || 'w rozbiciu godzin')}</small></div>
<div class="stat">${icon(I.coins)}<b>${rate ? range(all[0] * rate, all[1] * rate, 'PLN') : '—'}</b><small>${rate ? `netto, przy stawce ${pl(rate)} zł/h` : 'stawka do ustalenia'}</small></div>
</div></div>
${q.goal || q.goalSub ? `<section class="row"><span class="label">Cel</span><div class="prose">${q.goal ? `<p>${esc(q.goal)}</p>` : ''}${q.goalSub ? `<p class="sub">${esc(q.goalSub)}</p>` : ''}</div></section>` : ''}
${q.scope?.length ? `<section class="row"><span class="label">Zakres</span><ul class="list">${list(q.scope, I.check)}</ul></section>` : ''}
${items.length ? `<section class="row"><span class="label">Rozbicie godzin</span><div class="card">${rows}<div class="h-row sum"><div><b>Razem</b></div><div class="h">${range(all[0], all[1], 'h')}</div></div></div></section>` : ''}
<section class="row"><span class="label">Jak pracujemy</span><div class="steps">${steps
    .map((s, n) => `<div class="step"><div class="ic"><span>${icon(I.step[n % 4], 15)}</span><i></i></div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`)
    .join('')}</div></section>
${q.outOfScope?.length ? `<section class="row"><span class="label">Poza zakresem</span><ul class="list out">${list(q.outOfScope, I.x)}</ul></section>` : ''}
${q.assumptions?.length ? `<section class="row"><span class="label">Założenia</span><ol class="assume">${q.assumptions.filter(Boolean).map((a) => `<li>${esc(a)}</li>`).join('')}</ol></section>` : ''}
${rate && items.length ? `<section class="row"><span class="label">Koszt całkowity</span><div><div class="total"><div><span class="label">Projekt, netto</span><small>${range(all[0], all[1], 'h')}</small></div><strong>${range(all[0] * rate, all[1] * rate, 'PLN')}</strong></div>
<div class="card t-sub"><div><b>${range(design[0] * rate, design[1] * rate, 'PLN')}</b><small>Projekt (${range(design[0], design[1], 'h')})</small></div><div><b>${range(support[0] * rate, support[1] * rate, 'PLN')}</b><small>Przekazanie i współpraca (${range(support[0], support[1], 'h')})</small></div></div></div></section>` : ''}
<footer>${markSvg()}<span class="label">Bart Ocieczek${q.clientName ? ` · ${esc(q.clientName)}` : ''}${date ? ` · ${date}` : ''}</span></footer>
</div></body></html>`;
}
