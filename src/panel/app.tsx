// Panel app: one Studio tool with its own sidebar, top bar and pages,
// laid out like a client portal (benchmark: Startify), in bartocieczek.com CI.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useClient, useCurrentUser } from 'sanity';
import { createImageUrlBuilder } from '@sanity/image-url';
import { MARK_PATH_D, quoteTotals, renderQuoteHtml, type QuoteData } from '../lib/quote-render';
import { MATERIAL_STATUS, PROJECT_STATUS, QUOTE_STATUS } from './schema';

const API = '2026-11-01';
const SITE = 'https://bartocieczek.com';
const STAGE = 'https://portfolio-git-panel-sa-aa04.vercel.app';
const pl = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const range = (a: number, b: number, u: string) => (a === b ? `${pl(a)} ${u}` : `${pl(a)}–${pl(b)} ${u}`);
const label = (list: { title: string; value: string }[], v?: string) => list.find((s) => s.value === v)?.title ?? '';
const go = (path: string) => `/studio/${path}`;
const editUrl = (ws: string, id: string, type: string) => go(`${ws}/intent/edit/id=${id.replace(/^drafts\./, '')};type=${type}/`);
const createUrl = (type: string) => go(`panel/intent/create/template=${type};type=${type}/`);
const MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const shortDate = (iso?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}${y !== new Date().getFullYear() ? ` ${y}` : ''}`;
};
const plural = (n: number, one: string, few: string, many: string) => {
  const t = n % 10, h = n % 100;
  return n === 1 ? one : t >= 2 && t <= 4 && !(h >= 12 && h <= 14) ? few : many;
};
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');

/* ---------- data ---------- */

type Quote = QuoteData & { _id: string; status?: string; clientName?: string; clientId?: string; projectId?: string; _updatedAt: string };
type Project = { _id: string; name: string; status?: string; clientName?: string; clientId?: string; start?: string; end?: string; budget?: number; caseSlug?: string; quotes: number; files: number };
type Client = { _id: string; name: string; contact?: string; email?: string; logo?: unknown; projects: number; quotes: number };
type Material = { _id: string; title: string; status?: string; year?: string; client?: string; cover?: unknown; images: number; videos: number; _updatedAt: string };
type SiteProject = { _id: string; title: string; cardTitle?: string; year?: string; slug?: string; cover?: unknown; _updatedAt: string };
type PanelData = { quotes: Quote[]; projects: Project[]; clients: Client[]; materials: Material[] };

const PANEL_Q = `{
  "quotes": *[_type == "quote"] | order(coalesce(issuedAt, _createdAt) desc){..., "clientName": client->name, "clientId": client._ref, "projectId": project._ref},
  "projects": *[_type == "panelProject"] | order(_updatedAt desc){_id, name, status, start, end, budget, caseSlug, "clientName": client->name, "clientId": client._ref,
    "quotes": count(*[_type == "quote" && project._ref == ^._id]), "files": count(files)},
  "clients": *[_type == "client"] | order(name asc){_id, name, contact, email, logo,
    "projects": count(*[_type == "panelProject" && client._ref == ^._id]), "quotes": count(*[_type == "quote" && client._ref == ^._id])},
  "materials": *[_type == "caseMaterial"] | order(_updatedAt desc){_id, title, status, year, client, cover, "images": count(images), "videos": count(videos), _updatedAt}
}`;
const SITE_Q = `{
  "order": *[_id == "homePage"][0].projects[]._ref,
  "projects": *[_type == "project"] | order(_updatedAt desc){_id, title, cardTitle, year, "slug": slug.current, cover, _updatedAt}
}`;

/** Drafts win over published copies; keep one entry per document. */
function dedupe<T extends { _id: string }>(list: T[]): (T & { isDraft: boolean; hasDraft: boolean })[] {
  const map = new Map<string, T & { isDraft: boolean; hasDraft: boolean }>();
  for (const d of list) {
    const id = d._id.replace(/^drafts\./, '');
    const isDraft = d._id.startsWith('drafts.');
    const prev = map.get(id);
    if (!prev) map.set(id, { ...d, _id: id, isDraft, hasDraft: isDraft });
    else if (isDraft) map.set(id, { ...d, _id: id, isDraft: prev.isDraft && isDraft, hasDraft: true });
    else prev.isDraft = false;
  }
  return [...map.values()];
}

function useData() {
  const base = useClient({ apiVersion: API });
  const raw = useMemo(() => base.withConfig({ perspective: 'raw', useCdn: false }), [base]);
  const prod = useMemo(() => base.withConfig({ dataset: 'production', perspective: 'raw', useCdn: false }), [base]);
  const [panel, setPanel] = useState<PanelData | null>(null);
  const [site, setSite] = useState<{ order: string[]; projects: (SiteProject & { isDraft: boolean; hasDraft: boolean; onHome: boolean; pos: number })[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    raw
      .fetch<PanelData>(PANEL_Q)
      .then((d) => {
        if (!live) return;
        setPanel({ quotes: dedupe(d.quotes), projects: dedupe(d.projects), clients: dedupe(d.clients), materials: dedupe(d.materials) });
      })
      .catch((e) => live && setError(String(e?.message ?? e)));
    prod
      .fetch<{ order: string[] | null; projects: SiteProject[] }>(SITE_Q)
      .then((d) => {
        if (!live) return;
        const order = d.order ?? [];
        const projects = dedupe(d.projects)
          .map((p) => ({ ...p, onHome: order.includes(p._id), pos: order.indexOf(p._id) }))
          .sort((a, b) => (a.onHome === b.onHome ? (a.onHome ? a.pos - b.pos : b._updatedAt.localeCompare(a._updatedAt)) : a.onHome ? -1 : 1));
        setSite({ order, projects });
      })
      .catch((e) => live && setError(String(e?.message ?? e)));
    return () => {
      live = false;
    };
  }, [raw, prod, tick]);

  // Refresh when the tab comes back into view (after editing in Baza)
  useEffect(() => {
    const on = () => document.visibilityState === 'visible' && setTick((t) => t + 1);
    document.addEventListener('visibilitychange', on);
    window.addEventListener('focus', on);
    return () => {
      document.removeEventListener('visibilitychange', on);
      window.removeEventListener('focus', on);
    };
  }, []);
  return { panel, site, error };
}

const prodImg = createImageUrlBuilder({ projectId: 'jf65lv25', dataset: 'production' });
const panelImg = createImageUrlBuilder({ projectId: 'jf65lv25', dataset: 'panel' });
// biome-ignore lint/suspicious/noExplicitAny: Sanity image source
const imgUrl = (b: typeof prodImg, src: any, w: number, h: number) => (src?.asset ? b.image(src).width(w).height(h).fit('crop').auto('format').url() : '');

/* ---------- icons (one stroke family) ---------- */

const P = {
  overview: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  quote: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/>',
  project: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M9 6V4h6v2"/>',
  client: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  site: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  material: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5-11 11"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  out: '<path d="M7 17L17 7M9 7h8v8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  wait: '<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};
const Ico = ({ n, s = 18 }: { n: keyof typeof P; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: P[n] }} />
);
const Mark = ({ size = 28 }: { size?: number }) => (
  <svg viewBox="28 -1483 1749 1507" width={size} height={(size * 1507) / 1749} aria-hidden="true" style={{ display: 'block' }}>
    <path transform="scale(1,-1)" d={MARK_PATH_D} fill="currentColor" />
  </svg>
);

/* ---------- styles ---------- */

const CSS = `
.pa{--ink:#111;--ink2:#525252;--muted:#8c8c8c;--line:#e6e6e6;--bg:#fafafa;--card:#fff;--soft:#f3f3f3;--r:16px;--ease:cubic-bezier(.23,1,.32,1);
  display:grid;grid-template-columns:248px minmax(0,1fr);height:100%;background:var(--bg);color:var(--ink);
  font-family:"PP Neue Montreal","Neue Montreal","Inter","Helvetica Neue",Arial,sans-serif;font-size:14px;line-height:1.5;letter-spacing:-.01em;-webkit-font-smoothing:antialiased}
.pa *,.pa *::before,.pa *::after{box-sizing:border-box;min-width:0}
.pa a{color:inherit;text-decoration:none}
.pa button{font:inherit;color:inherit;letter-spacing:inherit}
.pa :focus-visible{outline:2px solid var(--ink);outline-offset:2px;border-radius:8px}
.pa ::selection{background:#111;color:#fff}

.pa-side{background:#fff;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:22px;padding:24px 16px 16px;overflow:auto;scrollbar-width:none}
.pa-brand{display:flex;align-items:center;gap:10px;padding:0 8px}
.pa-brand b{font-weight:500;font-size:16px;letter-spacing:-.02em}
.pa-ws{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--line);border-radius:12px}
.pa-ws i{width:34px;height:34px;border-radius:9px;background:var(--ink);color:#fff;display:grid;place-items:center;font-style:normal;font-weight:500;flex:none}
.pa-ws b{display:block;font-weight:500;font-size:14px;line-height:1.25}
.pa-ws small{display:block;color:var(--muted);font-size:12px;letter-spacing:0}
.pa-group h4{margin:0 0 6px;padding:0 10px;font-size:12px;font-weight:500;color:var(--muted);letter-spacing:0}
.pa-nav{display:flex;flex-direction:column;gap:2px}
.pa-item{display:flex;align-items:center;gap:11px;width:100%;padding:9px 10px;border:0;background:none;border-radius:9px;color:var(--ink2);cursor:pointer;text-align:left;font-size:14px;transition:background-color .15s ease,color .15s ease}
.pa-item span{flex:1}
.pa-item em{font-style:normal;font-size:11px;color:var(--ink2);background:#fff;border:1px solid var(--line);border-radius:6px;padding:1px 6px;font-variant-numeric:tabular-nums;letter-spacing:0}
@media (hover:hover){.pa-item:hover{background:var(--soft);color:var(--ink)}}
.pa-item[aria-current=page]{background:var(--soft);color:var(--ink);font-weight:500}
.pa-item[aria-current=page] em{border-color:#d9d9d9}
.pa-promo{margin-top:auto;border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--bg)}
.pa-promo b{display:block;font-weight:500;font-size:13px;margin-bottom:4px}
.pa-promo p{margin:0 0 10px;color:var(--ink2);font-size:12.5px;line-height:1.45;letter-spacing:0}
.pa-user{display:flex;align-items:center;gap:10px;padding:4px 6px}
.pa-user img,.pa-user i{width:32px;height:32px;border-radius:50%;object-fit:cover;background:var(--soft);display:grid;place-items:center;font-style:normal;font-weight:500;font-size:12px;flex:none}
.pa-user b{display:block;font-weight:500;font-size:13px;line-height:1.2}
.pa-user small{display:block;color:var(--muted);font-size:12px;letter-spacing:0}

.pa-main{display:flex;flex-direction:column;min-height:0;overflow:auto;scrollbar-width:thin;scrollbar-color:#d4d4d4 transparent}
.pa-top{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:16px;height:60px;padding:0 clamp(16px,3vw,40px);background:rgba(255,255,255,.92);backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--line)}
.pa-crumb{flex:1;display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink2);white-space:nowrap;overflow:hidden}
.pa-crumb b{color:var(--ink);font-weight:500}
.pa-search{display:flex;align-items:center;gap:8px;height:36px;padding:0 10px;border:1px solid var(--line);border-radius:10px;background:#fff;width:min(280px,34vw);color:var(--muted);transition:border-color .15s ease}
.pa-search:focus-within{border-color:#bdbdbd}
.pa-search input{flex:1;border:0;outline:0;background:none;font:inherit;font-size:13px;color:var(--ink);min-width:0}
.pa-search kbd{font:inherit;font-size:11px;border:1px solid var(--line);border-radius:5px;padding:0 5px;color:var(--ink2);letter-spacing:0}
.pa-tl{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;color:var(--ink);padding:8px 4px;white-space:nowrap}
.pa-tl svg{color:var(--muted)}
.pa-burger{display:none;border:1px solid var(--line);background:#fff;border-radius:9px;width:36px;height:36px;place-items:center;cursor:pointer}

.pa-page{padding:clamp(28px,4vw,44px) clamp(16px,3vw,48px) 40px;max-width:1360px;width:100%}
.pa-path{font-size:12px;color:var(--muted);letter-spacing:0;margin-bottom:14px}
.pa-path b{color:var(--ink);font-weight:500}
.pa-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap}
.pa-h1{font-size:clamp(32px,3.6vw,44px);line-height:1.02;letter-spacing:-.04em;font-weight:500;margin:0}
.pa-desc{margin:12px 0 0;color:var(--ink2);font-size:16px;line-height:1.5;max-width:62ch;letter-spacing:-.01em}

.pa-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));background:#fff;border:1px solid var(--line);border-radius:var(--r);margin-top:32px;overflow:hidden}
.pa-stat{padding:18px 20px 20px;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:18px}
.pa-stat:last-child{border-right:0}
.pa-stat header{display:flex;justify-content:space-between;align-items:center;color:var(--ink2);font-size:13px;letter-spacing:0}
.pa-stat header svg{color:var(--muted)}
.pa-stat strong{font-size:28px;line-height:1;letter-spacing:-.04em;font-weight:500;white-space:nowrap}
.pa-stat strong small{font-size:13px;letter-spacing:0;color:var(--ink2);font-weight:400;margin-left:6px}

.pa-sec{margin-top:52px}
.pa-sechead{display:flex;align-items:flex-end;justify-content:space-between;gap:8px 16px;flex-wrap:wrap;margin-bottom:18px}
.pa-h2{font-size:26px;line-height:1.1;letter-spacing:-.035em;font-weight:500;margin:0}
.pa-sub{margin:6px 0 0;color:var(--ink2);font-size:14px}
.pa-more{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;white-space:nowrap;padding:4px 0}
.pa-more svg{transition:transform .25s var(--ease)}
@media (hover:hover){.pa-more:hover svg{transform:translateX(3px)}}

.pa-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;align-items:start}
.pa-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}
.pa-card{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;transition:transform .25s var(--ease),box-shadow .25s var(--ease),border-color .2s ease}
@media (hover:hover){a.pa-card:hover{transform:translateY(-2px);box-shadow:0 10px 28px -12px rgba(0,0,0,.14);border-color:#dcdcdc}}
a.pa-card:active{transform:translateY(0) scale(.995)}
.pa-pv{position:relative;aspect-ratio:16/10;background:var(--soft);overflow:hidden;border-bottom:1px solid var(--line)}
.pa-pv.tall{aspect-ratio:4/5}
.pa-pv img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s var(--ease)}
@media (hover:hover){a.pa-card:hover .pa-pv img{transform:scale(1.03)}}
.pa-pv .doc{position:absolute;left:50%;top:18px;width:1280px!important;max-width:none!important;height:1600px!important;max-height:none!important;transform-origin:top center;border:0;pointer-events:none;background:#fff;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.06),0 8px 24px -8px rgba(0,0,0,.12)}
.pa-pv .tag{position:absolute;left:12px;top:12px}
.pa-pv .empty{position:absolute;inset:0;display:grid;place-items:center;color:var(--muted)}
.pa-body{padding:16px 18px 0;display:flex;flex-direction:column;gap:6px;flex:1}
.pa-title{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.pa-title b{font-weight:500;font-size:17px;line-height:1.25;letter-spacing:-.025em}
.pa-body p{margin:0;color:var(--ink2);font-size:13px;line-height:1.45;letter-spacing:0}
.pa-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 18px 0;padding:12px 0 14px;border-top:1px solid var(--line);font-size:12px;color:var(--ink2);letter-spacing:0}
.pa-foot b{color:var(--ink);font-weight:500;font-size:13px;letter-spacing:-.02em}
.pa-foot svg{color:var(--ink);transition:transform .25s var(--ease);flex:none}
@media (hover:hover){a.pa-card:hover .pa-foot svg{transform:translateX(3px)}}

.pa-pill{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:500;white-space:nowrap;letter-spacing:0;background:var(--soft);color:var(--ink2);flex:none}
.pa-pill::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.pa-pill[data-s=sent],.pa-pill[data-s=ready],.pa-pill[data-s=quote]{background:#111;color:#fff}
.pa-pill[data-s=active]{background:#e9f1ff;color:#1d4ed8}
.pa-pill[data-s=accepted],.pa-pill[data-s=published],.pa-pill[data-s=done],.pa-pill[data-s=live]{background:#eaf5ee;color:#1f7a4d}
.pa-pill[data-s=rejected]{background:#fdecec;color:#b3261e}
.pa-pill[data-s=drafted],.pa-pill[data-s=changes]{background:#fff4e0;color:#9a5b00}
.pa-pill.onimg{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.08)}

.pa-tools{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-top:28px}
.pa-seg{display:inline-flex;gap:2px;padding:3px;background:#efefef;border-radius:10px}
.pa-seg button{border:0;background:none;padding:6px 12px;border-radius:7px;font-size:13px;color:var(--ink2);cursor:pointer;white-space:nowrap;transition:background-color .15s ease,color .15s ease}
.pa-seg button[aria-pressed=true]{background:#fff;color:var(--ink);font-weight:500;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.pa-btn{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;border-radius:999px;background:#111;color:#fff;border:1px solid #111;font-size:14px;font-weight:500;white-space:nowrap;cursor:pointer;transition:transform .16s ease-out,background-color .15s ease}
.pa-btn.ghost{background:#fff;color:#111;border-color:var(--line)}
.pa a.pa-btn{color:#fff}.pa a.pa-btn.ghost{color:#111}
@media (hover:hover){.pa-btn:hover{background:#2a2a2a}.pa-btn.ghost:hover{background:var(--soft)}}
.pa-btn:active{transform:scale(.97)}
.pa-acts{display:flex;gap:8px;flex-wrap:wrap}

.pa-table{background:#fff;border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.pa-tr{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1.4fr) 90px 90px 28px;gap:16px;align-items:center;padding:14px 18px;border-bottom:1px solid var(--line);transition:background-color .15s ease}
.pa-tr:last-child{border-bottom:0}
.pa-tr.th{font-size:12px;color:var(--muted);letter-spacing:0;padding-top:11px;padding-bottom:11px;background:var(--bg)}
@media (hover:hover){a.pa-tr:hover{background:var(--bg)}}
.pa-tr b{font-weight:500;font-size:15px;display:flex;align-items:center;gap:10px}
.pa-tr .av{width:30px;height:30px;border-radius:8px;background:var(--soft);display:grid;place-items:center;font-size:12px;font-weight:500;flex:none;overflow:hidden}
.pa-tr .av img{width:100%;height:100%;object-fit:cover}
.pa-tr span{color:var(--ink2);font-size:13px;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.pa-blank{grid-column:1/-1;border:1px dashed #d9d9d9;border-radius:var(--r);padding:36px 24px;text-align:center;color:var(--ink2);background:#fff}
.pa-blank b{display:block;color:var(--ink);font-weight:500;font-size:16px;margin-bottom:4px}
.pa-blank p{margin:0 auto 16px;max-width:46ch}
.pa-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.pa-link{display:flex;flex-direction:column;gap:10px;padding:22px;background:#fff;border:1px solid var(--line);border-radius:var(--r);transition:border-color .2s ease}
@media (hover:hover){.pa-link:hover{border-color:#cfcfcf}}
.pa-link b{font-size:19px;font-weight:500;letter-spacing:-.03em}
.pa-link p{margin:0;color:var(--ink2)}
.pa-link span{display:inline-flex;align-items:center;gap:6px;font-weight:500;margin-top:6px}
.pa-err{margin-top:24px;padding:14px 16px;border:1px solid #f3c7c4;background:#fdf3f2;border-radius:12px;color:#8c1d18}
.pa-sk{background:linear-gradient(90deg,#f0f0f0 0%,#e8e8e8 50%,#f0f0f0 100%);background-size:200% 100%;animation:pa-sk 1.2s linear infinite;border-radius:var(--r)}
@keyframes pa-sk{to{background-position:-200% 0}}
.pa-pfoot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:56px;padding-top:18px;border-top:1px solid var(--line);font-size:12px;color:var(--muted);letter-spacing:0}

@media (max-width:1100px){.pa-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.pa-stat:nth-child(2){border-right:0}.pa-stat:nth-child(-n+2){border-bottom:1px solid var(--line)}.pa-grid.three{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:860px){
  .pa{grid-template-columns:minmax(0,1fr)}
  .pa-side{position:fixed;inset:0 auto 0 0;width:280px;z-index:20;transform:translateX(-100%);transition:transform .3s var(--ease);box-shadow:0 0 0 100vmax rgba(0,0,0,0)}
  .pa[data-menu=open] .pa-side{transform:none;box-shadow:0 0 0 100vmax rgba(0,0,0,.25)}
  .pa-burger{display:grid}
  .pa-search{width:auto;flex:1}.pa-crumb{display:none}.pa-tl.hide{display:none}
  .pa-tr{grid-template-columns:minmax(0,1fr) auto}.pa-tr>*:nth-child(3),.pa-tr>*:nth-child(4),.pa-tr>*:nth-child(5){display:none}.pa-tr.th{display:none}
  .pa-links{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:560px){.pa-grid.three,.pa-grid{grid-template-columns:minmax(0,1fr)}.pa .pa-grid.covers{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px}.pa-grid.covers .pa-body{padding:12px 12px 0}.pa-grid.covers .pa-title{flex-direction:column;gap:6px}.pa-grid.covers .pa-foot{margin:10px 12px 0}.pa-grid.covers .pa-foot>span:first-child{display:none}.pa-stat{padding:14px 14px 16px;gap:12px}.pa-stat strong{font-size:24px}.pa-stat strong small{display:block;margin:6px 0 0;font-size:12px}.pa-search kbd{display:none}}
@media (prefers-reduced-motion:reduce){.pa *{transition:none!important;animation:none!important}}
`;

/* ---------- small pieces ---------- */

function Pill({ list, value, text, onImg }: { list?: { title: string; value: string }[]; value?: string; text?: string; onImg?: boolean }) {
  const t = text ?? (list ? label(list, value) : '');
  if (!t) return null;
  return (
    <span className={`pa-pill${onImg ? ' onimg' : ''}`} data-s={value}>
      {t}
    </span>
  );
}

/** A small, scaled live render of the quote, like a screen preview. */
function QuoteThumb({ q }: { q: Quote }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale((el.clientWidth * 0.82) / 1280));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const html = useMemo(() => renderQuoteHtml({ ...q, clientName: q.clientName }, typeof window !== 'undefined' ? window.location.origin : ''), [q]);
  return (
    <div className="pa-pv" ref={box}>
      <iframe className="doc" title="" aria-hidden="true" tabIndex={-1} loading="lazy" srcDoc={html} style={{ transform: `translateX(-50%) scale(${scale})` }} />
    </div>
  );
}

function Card({ href, external, preview, title, pill, desc, footL, footR }: { href: string; external?: boolean; preview: React.ReactNode; title: string; pill?: React.ReactNode; desc?: string; footL?: React.ReactNode; footR?: React.ReactNode }) {
  return (
    <a className="pa-card" href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener' : undefined}>
      {preview}
      <div className="pa-body">
        <div className="pa-title">
          <b>{title}</b>
          {pill}
        </div>
        {desc && <p>{desc}</p>}
      </div>
      <div className="pa-foot">
        <span>{footL}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {footR}
          <Ico n={external ? 'out' : 'arrow'} s={16} />
        </span>
      </div>
    </a>
  );
}

const Blank = ({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) => (
  <div className="pa-blank">
    <b>{title}</b>
    <p>{text}</p>
    <a className="pa-btn" href={href}>
      <Ico n="plus" s={16} /> {cta}
    </a>
  </div>
);

const Skel = ({ n = 3, tall }: { n?: number; tall?: boolean }) => (
  <div className="pa-grid three" aria-busy="true">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className="pa-sk" style={{ aspectRatio: tall ? '4/6' : '16/14' }} />
    ))}
  </div>
);

function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; title: string; n?: number }[] }) {
  return (
    <div className="pa-seg" role="group" aria-label="Filtr">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.title}
          {o.n !== undefined ? ` ${o.n}` : ''}
        </button>
      ))}
    </div>
  );
}

/* ---------- cards per type ---------- */

const quoteCard = (q: Quote) => {
  const t = quoteTotals(q);
  return (
    <Card
      key={q._id}
      href={editUrl('panel', q._id, 'quote')}
      preview={<QuoteThumb q={q} />}
      title={q.title || 'Bez tytułu'}
      pill={<Pill list={QUOTE_STATUS} value={q.status} />}
      desc={[q.clientName, q.eyebrow && q.eyebrow !== q.clientName ? q.eyebrow : null].filter(Boolean).join(' · ') || undefined}
      footL={[t.all[1] ? range(t.all[0], t.all[1], 'h') : null, shortDate(q.issuedAt)].filter(Boolean).join(' · ')}
      footR={t.rate && t.all[1] ? <b>{range(t.all[0] * t.rate, t.all[1] * t.rate, 'zł')}</b> : undefined}
    />
  );
};

type SiteP = NonNullable<ReturnType<typeof useData>['site']>['projects'][number];
const caseCard = (p: SiteP) => {
  const src = imgUrl(prodImg, p.cover, 560, 700);
  return (
    <Card
      key={p._id}
      href={editUrl('strona', p._id, 'project')}
      preview={
        <div className="pa-pv tall">
          {src ? <img src={src} alt="" loading="lazy" /> : <div className="empty"><Ico n="material" s={28} /></div>}
          <span className="tag">{p.isDraft ? <Pill text="Szkic" value="drafted" onImg /> : p.hasDraft ? <Pill text="Niezapisane zmiany" value="changes" onImg /> : null}</span>
        </div>
      }
      title={p.cardTitle || p.title}
      pill={!p.isDraft ? <Pill text={p.onHome ? `Na głównej #${p.pos + 1}` : 'Poza główną'} value={p.onHome ? 'live' : undefined} /> : undefined}
      footL={[p.year, p.slug && `/${p.slug}`].filter(Boolean).join(' · ')}
      footR={<span>Edytuj</span>}
    />
  );
};

const materialCard = (m: Material, short = false) => {
  const src = imgUrl(panelImg, m.cover, 560, 700);
  return (
    <Card
      key={m._id}
      href={editUrl('panel', m._id, 'caseMaterial')}
      preview={<div className={`pa-pv${short ? '' : ' tall'}`} style={short ? { aspectRatio: '16/7' } : undefined}>{src ? <img src={src} alt="" loading="lazy" /> : <div className="empty"><Ico n="material" s={28} /></div>}</div>}
      title={m.title || 'Bez nazwy'}
      pill={<Pill list={MATERIAL_STATUS} value={m.status} />}
      desc={[m.client, m.year].filter(Boolean).join(' · ') || undefined}
      footL={[`${m.images} ${plural(m.images, 'zdjęcie', 'zdjęcia', 'zdjęć')}`, m.videos ? `${m.videos} wideo` : null].filter(Boolean).join(' · ')}
    />
  );
};

const projectCard = (p: Project) => (
  <Card
    key={p._id}
    href={editUrl('panel', p._id, 'panelProject')}
    preview={
      <div className="pa-pv" style={{ aspectRatio: '16/7', display: 'grid', placeItems: 'center' }}>
        <span style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-.05em', color: '#111' }}>{(p.clientName || p.name).slice(0, 2)}</span>
      </div>
    }
    title={p.name}
    pill={<Pill list={PROJECT_STATUS} value={p.status} />}
    desc={[p.clientName, p.start && p.end ? `${shortDate(p.start)} – ${shortDate(p.end)}` : p.end ? `do ${shortDate(p.end)}` : null].filter(Boolean).join(' · ') || undefined}
    footL={[`${p.quotes} ${plural(p.quotes, 'wycena', 'wyceny', 'wycen')}`, p.files ? `${p.files} ${plural(p.files, 'plik', 'pliki', 'plików')}` : null].filter(Boolean).join(' · ')}
    footR={p.budget ? <b>{pl(p.budget)} zł</b> : undefined}
  />
);

/* ---------- pages ---------- */

type PageId = 'overview' | 'quotes' | 'projects' | 'clients' | 'cases' | 'materials';
const PAGES: Record<PageId, { title: string; icon: keyof typeof P; desc: string }> = {
  overview: { title: 'Przegląd', icon: 'overview', desc: 'Wyceny, projekty i strona w jednym miejscu. Sprawdź, co czeka na Ciebie, i przejdź dalej.' },
  quotes: { title: 'Wyceny', icon: 'quote', desc: 'Wszystkie wyceny z podglądem. Otwórz wycenę, żeby ją edytować i skopiować link dla klienta.' },
  projects: { title: 'Projekty', icon: 'project', desc: 'Projekty z klientem, terminami, wycenami i plikami.' },
  clients: { title: 'Klienci', icon: 'client', desc: 'Kontakty i to, co z nimi robisz.' },
  cases: { title: 'Case studies', icon: 'site', desc: 'Projekty na bartocieczek.com w kolejności ze strony głównej.' },
  materials: { title: 'Materiały', icon: 'material', desc: 'Zdjęcia i notatki z nowych projektów. Oznacz je jako „Gotowe dla Claude”, a ułożę z nich case study.' },
};

export function PanelApp() {
  const user = useCurrentUser();
  const { panel, site, error } = useData();
  const [page, setPage] = useState<PageId>(() => {
    try {
      return (sessionStorage.getItem('pa-page') as PageId) || 'overview';
    } catch {
      return 'overview';
    }
  });
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const [quoteFilter, setQuoteFilter] = useState<'all' | 'open' | 'accepted' | 'rejected'>('all');
  const [matFilter, setMatFilter] = useState<'all' | 'waiting' | 'done'>('all');
  const searchRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem('pa-page', page);
    } catch {}
    mainRef.current?.scrollTo({ top: 0 });
    setMenu(false);
  }, [page]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  const match = (...parts: (string | undefined)[]) => !q || norm(parts.filter(Boolean).join(' ')).includes(norm(q));
  const quotes = panel?.quotes.filter((x) => match(x.title, x.clientName, x.eyebrow)) ?? [];
  const projects = panel?.projects.filter((x) => match(x.name, x.clientName)) ?? [];
  const clients = panel?.clients.filter((x) => match(x.name, x.contact, x.email)) ?? [];
  const materials = panel?.materials.filter((x) => match(x.title, x.client)) ?? [];
  const cases = site?.projects.filter((x) => match(x.title, x.cardTitle, x.slug)) ?? [];

  const openQ = panel?.quotes.filter((x) => x.status === 'draft' || x.status === 'sent') ?? [];
  const openVal = openQ.reduce((s, x) => {
    const t = quoteTotals(x);
    return [s[0] + t.all[0] * t.rate, s[1] + t.all[1] * t.rate];
  }, [0, 0]);
  const waiting = panel?.materials.filter((m) => m.status === 'new' || m.status === 'ready') ?? [];
  const active = panel?.projects.filter((p) => p.status === 'active') ?? [];
  const live = site?.projects.filter((p) => !p.isDraft && p.onHome) ?? [];
  const first = user?.name?.split(' ')[0];
  const initials = (user?.name ?? 'B O').split(' ').map((s) => s[0]).slice(0, 2).join('');

  const nav = (id: PageId, n?: number) => (
    <button key={id} type="button" className="pa-item" aria-current={page === id ? 'page' : undefined} onClick={() => setPage(id)}>
      <Ico n={PAGES[id].icon} />
      <span>{PAGES[id].title}</span>
      {n !== undefined && <em>{n}</em>}
    </button>
  );

  const meta = PAGES[page];
  const loading = !panel && !error;

  return (
    <div className="pa" data-menu={menu ? 'open' : undefined}>
      <style>{CSS}</style>

      <aside className="pa-side" aria-label="Nawigacja panelu" onClick={(e) => e.target === e.currentTarget && setMenu(false)}>
        <div className="pa-brand">
          <Mark size={30} />
          <b>Bart Ocieczek</b>
        </div>
        <div className="pa-ws">
          <i>B</i>
          <div>
            <b>Studio</b>
            <small>Panel · wyceny i strona</small>
          </div>
        </div>
        <div className="pa-group">
          <h4>Praca</h4>
          <nav className="pa-nav">
            {nav('overview')}
            {nav('quotes', panel?.quotes.length)}
            {nav('projects', panel?.projects.length)}
            {nav('clients', panel?.clients.length)}
          </nav>
        </div>
        <div className="pa-group">
          <h4>Strona</h4>
          <nav className="pa-nav">
            {nav('cases', site?.projects.length)}
            {nav('materials', panel?.materials.length)}
          </nav>
        </div>
        <div className="pa-promo">
          <b>Nowy projekt na stronie?</b>
          <p>Wrzuć zdjęcia i notatki, ustaw „Gotowe dla Claude” i napisz mi w czacie.</p>
          <a className="pa-more" href={createUrl('caseMaterial')}>
            Wrzuć materiały <Ico n="arrow" s={15} />
          </a>
        </div>
        <div className="pa-user">
          {user?.imageUrl ? <img src={user.imageUrl} alt="" /> : <i>{initials}</i>}
          <div>
            <b>{user?.name ?? 'Bart Ocieczek'}</b>
            <small>bartocieczek.com</small>
          </div>
        </div>
      </aside>

      <div className="pa-main" ref={mainRef}>
        <div className="pa-top">
          <button type="button" className="pa-burger" aria-label={menu ? 'Zamknij menu' : 'Otwórz menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>
            <Ico n={menu ? 'close' : 'menu'} />
          </button>
          <div className="pa-crumb">
            Panel <span aria-hidden="true">›</span> <b>{meta.title}</b>
          </div>
          <label className="pa-search">
            <Ico n="search" s={16} />
            <input ref={searchRef} type="search" placeholder={page === 'overview' ? 'Szukaj w panelu' : `Szukaj: ${meta.title.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Szukaj" />
            <kbd>⌘K</kbd>
          </label>
          <a className="pa-tl hide" href={SITE} target="_blank" rel="noopener">
            Live <Ico n="out" s={14} />
          </a>
          <a className="pa-tl hide" href={STAGE} target="_blank" rel="noopener">
            Stage <Ico n="out" s={14} />
          </a>
        </div>

        <div className="pa-page">
          <div className="pa-path">
            Panel / <b>{meta.title}</b>
          </div>
          <div className="pa-head">
            <div>
              <h1 className="pa-h1">{page === 'overview' ? (first ? `Cześć, ${first}` : 'Przegląd') : meta.title}</h1>
              <p className="pa-desc">{meta.desc}</p>
            </div>
            <div className="pa-acts">
              {page === 'overview' || page === 'quotes' ? (
                <a className="pa-btn" href={createUrl('quote')}>
                  <Ico n="plus" s={16} /> Nowa wycena
                </a>
              ) : page === 'projects' ? (
                <a className="pa-btn" href={createUrl('panelProject')}>
                  <Ico n="plus" s={16} /> Nowy projekt
                </a>
              ) : page === 'clients' ? (
                <a className="pa-btn" href={createUrl('client')}>
                  <Ico n="plus" s={16} /> Nowy klient
                </a>
              ) : page === 'materials' ? (
                <a className="pa-btn" href={createUrl('caseMaterial')}>
                  <Ico n="plus" s={16} /> Wrzuć materiały
                </a>
              ) : (
                <>
                  <a className="pa-btn ghost" href={go('strona/structure/homePage')}>
                    Kolejność na głównej
                  </a>
                  <a className="pa-btn" href={go('strona/structure/project')}>
                    <Ico n="edit" s={16} /> Edytuj case studies
                  </a>
                </>
              )}
            </div>
          </div>

          {error && <p className="pa-err">Nie udało się wczytać danych: {error}</p>}

          {page === 'overview' && (
            <>
              <div className="pa-stats">
                <div className="pa-stat">
                  <header>
                    Otwarte wyceny <Ico n="quote" s={18} />
                  </header>
                  <strong>
                    {panel ? openQ.length : '–'}
                    <small>{openVal[1] ? range(openVal[0], openVal[1], 'zł') : 'w toku'}</small>
                  </strong>
                </div>
                <div className="pa-stat">
                  <header>
                    W realizacji <Ico n="clock" s={18} />
                  </header>
                  <strong>
                    {panel ? active.length : '–'}
                    <small>{plural(active.length, 'projekt', 'projekty', 'projektów')}</small>
                  </strong>
                </div>
                <div className="pa-stat">
                  <header>
                    Czeka na case study <Ico n="wait" s={18} />
                  </header>
                  <strong>
                    {panel ? waiting.length : '–'}
                    <small>{plural(waiting.length, 'materiał', 'materiały', 'materiałów')}</small>
                  </strong>
                </div>
                <div className="pa-stat">
                  <header>
                    Na stronie <Ico n="site" s={18} />
                  </header>
                  <strong>
                    {site ? live.length : '–'}
                    <small>case studies na głównej</small>
                  </strong>
                </div>
              </div>

              <section className="pa-sec">
                <div className="pa-sechead">
                  <div>
                    <h2 className="pa-h2">Wyceny</h2>
                    <p className="pa-sub">Ostatnie wyceny z podglądem tego, co zobaczy klient.</p>
                  </div>
                  <button type="button" className="pa-more" style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => setPage('quotes')}>
                    Wszystkie wyceny <Ico n="arrow" s={15} />
                  </button>
                </div>
                {loading ? <Skel /> : <div className="pa-grid three">{quotes.length ? quotes.slice(0, 3).map(quoteCard) : <Blank title="Nie masz jeszcze wycen" text="Pierwsza wycena dostanie podgląd i link dla klienta w Twoim stylu." href={createUrl('quote')} cta="Nowa wycena" />}</div>}
              </section>

              <section className="pa-sec">
                <div className="pa-sechead">
                  <div>
                    <h2 className="pa-h2">Na stronie</h2>
                    <p className="pa-sub">Case studies z bartocieczek.com w kolejności ze strony głównej.</p>
                  </div>
                  <button type="button" className="pa-more" style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => setPage('cases')}>
                    Wszystkie case studies <Ico n="arrow" s={15} />
                  </button>
                </div>
                {!site && !error ? <Skel n={4} tall /> : <div className="pa-grid covers" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>{cases.slice(0, 4).map(caseCard)}</div>}
              </section>

              <section className="pa-sec">
                <div className="pa-sechead">
                  <div>
                    <h2 className="pa-h2">Projekty i materiały</h2>
                    <p className="pa-sub">To, nad czym teraz pracujesz, i to, co czeka na stronę.</p>
                  </div>
                </div>
                {loading ? (
                  <Skel n={3} />
                ) : (
                  <div className="pa-grid three">
                    {projects.slice(0, 2).map(projectCard)}
                    {materials.slice(0, 1).map((m) => materialCard(m, true))}
                    {!projects.length && !materials.length && <Blank title="Pusto" text="Dodaj projekt albo wrzuć materiały do case study." href={createUrl('panelProject')} cta="Nowy projekt" />}
                  </div>
                )}
              </section>

              <section className="pa-sec">
                <div className="pa-links">
                  <a className="pa-link" href={go('panel/structure')}>
                    <Ico n="edit" s={22} />
                    <b>Baza</b>
                    <p>Wszystkie dokumenty panelu w zwykłym widoku edycji.</p>
                    <span>
                      Otwórz bazę <Ico n="arrow" s={15} />
                    </span>
                  </a>
                  <a className="pa-link" href={go('strona/structure')}>
                    <Ico n="site" s={22} />
                    <b>Treści strony</b>
                    <p>Strona główna, about, case studies i ustawienia bartocieczek.com.</p>
                    <span>
                      Edytuj stronę <Ico n="arrow" s={15} />
                    </span>
                  </a>
                </div>
              </section>
            </>
          )}

          {page === 'quotes' && (
            <>
              <div className="pa-tools">
                <Seg
                  value={quoteFilter}
                  onChange={setQuoteFilter}
                  options={[
                    { value: 'all', title: 'Wszystkie', n: quotes.length },
                    { value: 'open', title: 'Otwarte', n: quotes.filter((x) => x.status === 'draft' || x.status === 'sent').length },
                    { value: 'accepted', title: 'Zaakceptowane', n: quotes.filter((x) => x.status === 'accepted').length },
                    { value: 'rejected', title: 'Odrzucone', n: quotes.filter((x) => x.status === 'rejected').length },
                  ]}
                />
              </div>
              <section className="pa-sec" style={{ marginTop: 20 }}>
                {loading ? (
                  <Skel n={6} />
                ) : (
                  <div className="pa-grid three">
                    {(() => {
                      const list = quotes.filter((x) => quoteFilter === 'all' || (quoteFilter === 'open' ? x.status === 'draft' || x.status === 'sent' : x.status === quoteFilter));
                      return list.length ? list.map(quoteCard) : <Blank title={q ? 'Nic nie pasuje' : 'Brak wycen w tym widoku'} text={q ? `Nie ma wycen dla „${q}”.` : 'Zmień filtr albo zrób nową wycenę.'} href={createUrl('quote')} cta="Nowa wycena" />;
                    })()}
                  </div>
                )}
              </section>
            </>
          )}

          {page === 'projects' && (
            <section className="pa-sec" style={{ marginTop: 32 }}>
              {loading ? <Skel /> : <div className="pa-grid three">{projects.length ? projects.map(projectCard) : <Blank title="Brak projektów" text="Projekt trzyma razem klienta, terminy, wyceny i pliki." href={createUrl('panelProject')} cta="Nowy projekt" />}</div>}
            </section>
          )}

          {page === 'clients' && (
            <section className="pa-sec" style={{ marginTop: 32 }}>
              {loading ? (
                <div className="pa-sk" style={{ height: 220 }} />
              ) : clients.length ? (
                <div className="pa-table">
                  <div className="pa-tr th">
                    <span>Klient</span>
                    <span>Kontakt</span>
                    <span>Projekty</span>
                    <span>Wyceny</span>
                    <span />
                  </div>
                  {clients.map((c) => {
                    const logo = imgUrl(panelImg, c.logo, 60, 60);
                    return (
                      <a key={c._id} className="pa-tr" href={editUrl('panel', c._id, 'client')}>
                        <b>
                          <span className="av">{logo ? <img src={logo} alt="" /> : c.name.slice(0, 2)}</span>
                          {c.name}
                        </b>
                        <span>{[c.contact, c.email].filter(Boolean).join(' · ') || '—'}</span>
                        <span>{c.projects}</span>
                        <span>{c.quotes}</span>
                        <Ico n="arrow" s={16} />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="pa-grid">
                  <Blank title="Brak klientów" text="Dodaj klienta, żeby podpinać go do projektów i wycen." href={createUrl('client')} cta="Nowy klient" />
                </div>
              )}
            </section>
          )}

          {page === 'cases' && (
            <section className="pa-sec" style={{ marginTop: 32 }}>
              {!site && !error ? <Skel n={6} tall /> : <div className="pa-grid covers" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>{cases.map(caseCard)}</div>}
            </section>
          )}

          {page === 'materials' && (
            <>
              <div className="pa-tools">
                <Seg
                  value={matFilter}
                  onChange={setMatFilter}
                  options={[
                    { value: 'all', title: 'Wszystkie', n: materials.length },
                    { value: 'waiting', title: 'Czekają', n: materials.filter((m) => m.status === 'new' || m.status === 'ready').length },
                    { value: 'done', title: 'Na stronie', n: materials.filter((m) => m.status === 'drafted' || m.status === 'published').length },
                  ]}
                />
              </div>
              <section className="pa-sec" style={{ marginTop: 20 }}>
                {loading ? (
                  <Skel n={4} tall />
                ) : (
                  <div className="pa-grid covers" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
                    {(() => {
                      const list = materials.filter((m) => matFilter === 'all' || (matFilter === 'waiting' ? m.status === 'new' || m.status === 'ready' : m.status === 'drafted' || m.status === 'published'));
                      return list.length ? list.map((m) => materialCard(m)) : <Blank title="Brak materiałów" text="Skończyłeś projekt? Wrzuć zdjęcia i notatki, a zrobię z nich case study." href={createUrl('caseMaterial')} cta="Wrzuć materiały" />;
                    })()}
                  </div>
                )}
              </section>
            </>
          )}

          <footer className="pa-pfoot">
            <span>Bart Ocieczek · Panel</span>
            <a href={SITE} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              bartocieczek.com <Ico n="out" s={13} />
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}
