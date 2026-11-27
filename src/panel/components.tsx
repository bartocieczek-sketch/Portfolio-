import { useEffect, useMemo, useState } from 'react';
import { useClient, useCurrentUser, type LayoutProps } from 'sanity';
import { createImageUrlBuilder } from '@sanity/image-url';
import { MARK_PATH_D, quoteTotals, renderQuoteHtml, type QuoteData } from '../lib/quote-render';
import { MATERIAL_STATUS, PROJECT_STATUS, QUOTE_STATUS } from './schema';

const API = '2026-11-01';
const SITE = 'https://bartocieczek.com';
const STAGE = 'https://portfolio-git-panel-sa-aa04.vercel.app';
const pl = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const money = (a: number, b: number) => (a === b ? `${pl(a)} zł` : `${pl(a)}–${pl(b)} zł`);
const label = (list: { title: string; value: string }[], v?: string) => list.find((s) => s.value === v)?.title ?? '';
const go = (path: string) => `/studio/${path}`;
const editUrl = (ws: string, id: string, type: string) => go(`${ws}/intent/edit/id=${id.replace(/^drafts\./, '')};type=${type}/`);
const createUrl = (type: string) => go(`panel/intent/create/template=${type};type=${type}/`);
const DAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
const MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const shortDate = (iso?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]?.slice(0, 3)}${y !== new Date().getFullYear() ? ` ${y}` : ''}`;
};
const plural = (n: number, one: string, few: string, many: string) => {
  const t = n % 10, h = n % 100;
  return n === 1 ? one : t >= 2 && t <= 4 && !(h >= 12 && h <= 14) ? few : many;
};

/* ---------- brand ---------- */

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="28 -1483 1749 1507" width={size} height={(size * 1507) / 1749} aria-hidden="true" style={{ display: 'block' }}>
      <path transform="scale(1,-1)" d={MARK_PATH_D} fill="currentColor" />
    </svg>
  );
}

const FONT_CSS = `
@font-face{font-family:"PP Neue Montreal";src:url(/fonts/PPNeueMontreal-Regular.woff2) format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"PP Neue Montreal";src:url(/fonts/PPNeueMontreal-Medium.woff2) format("woff2");font-weight:500;font-display:swap}
@font-face{font-family:"PP Neue Montreal";src:url(/fonts/PPNeueMontreal-Bold.woff2) format("woff2");font-weight:700;font-display:swap}
body{-webkit-font-smoothing:antialiased}
::selection{background:#111;color:#fff}
`;

export function BrandLayout(props: LayoutProps) {
  return (
    <>
      <style>{FONT_CSS}</style>
      {props.renderDefault(props)}
    </>
  );
}

/* ---------- panel styles (bartocieczek.com) ---------- */

const CSS = `
.bo{--ink:#111;--muted:#8c8c8c;--line:#e6e6e6;--soft:#f5f5f5;--r:20px;--ease:cubic-bezier(.23,1,.32,1);
  height:100%;overflow:auto;background:#fff;color:var(--ink);font-family:"PP Neue Montreal","Neue Montreal","Inter","Helvetica Neue",Arial,sans-serif;
  font-size:15px;line-height:1.5;letter-spacing:-.02em;-webkit-font-smoothing:antialiased;scrollbar-width:thin;scrollbar-color:#d4d4d4 transparent}
.bo *,.bo *::before,.bo *::after{box-sizing:border-box;min-width:0}
.bo a{color:inherit;text-decoration:none}
.bo :focus-visible{outline:2px solid var(--ink);outline-offset:3px;border-radius:4px}
.bo-wrap{max-width:1240px;margin:0 auto;padding:clamp(28px,4vw,56px) clamp(20px,3vw,40px) 72px}
.bo-top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:20px;border-bottom:1px solid var(--line)}
.bo-who{display:flex;align-items:center;gap:12px}
.bo-who b{font-weight:500;font-size:15px;line-height:1.2;display:block}
.bo-who small,.bo-muted{color:var(--muted)}
.bo-who small{font-size:13px;display:block;letter-spacing:0}
.bo-date{font-size:13px;color:var(--muted);letter-spacing:0;text-transform:none}
.bo-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:clamp(24px,4vw,64px);align-items:end;padding:clamp(40px,6vw,88px) 0 clamp(32px,4vw,56px)}
.bo-h1{font-size:clamp(40px,5.2vw,72px);line-height:.98;letter-spacing:-.045em;font-weight:500;margin:0;text-wrap:balance}
.bo-lead{font-size:clamp(20px,2vw,26px);line-height:1.2;letter-spacing:-.03em;font-weight:500;color:var(--muted);margin:20px 0 0;max-width:34ch;text-wrap:balance}
.bo-lead em{font-style:normal;color:var(--ink)}
.bo-actions{display:flex;flex-direction:column}
.bo-line{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 4px;border-top:1px solid var(--line);font-size:16px;font-weight:500;letter-spacing:-.01em;overflow:hidden;isolation:isolate;cursor:pointer;background:none;border-left:0;border-right:0;border-bottom:0;color:inherit;font-family:inherit;text-align:left;width:100%}
.bo-line:last-child{border-bottom:1px solid var(--line)}
.bo-line::before{content:"";position:absolute;inset:0;background:var(--ink);transform:translateY(-101%);transition:transform .35s var(--ease);z-index:-1}
.bo-line span,.bo-line svg{transition:transform .35s var(--ease),color .2s ease}
.bo-line svg{flex:none}
@media (hover:hover) and (pointer:fine){.bo-line:hover::before{transform:none}.bo-line:hover span,.bo-line:hover svg{color:#fff}.bo-line:hover span{transform:translateX(8px)}.bo-line:hover svg{transform:translateX(-4px)}}
.bo-line:active span{transform:translateX(8px) scale(.985)}
.bo-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:clamp(24px,4vw,64px)}
.bo-sec{padding-top:clamp(32px,4vw,48px)}
.bo-sec+.bo-sec{border-top:1px solid var(--line);margin-top:clamp(32px,4vw,48px)}
.bo-sech{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 14px}
.bo-sech h2{font-size:24px;line-height:1.1;letter-spacing:-.035em;font-weight:500;margin:0}
.bo-sech h2 sup{font-size:13px;color:var(--muted);letter-spacing:0;margin-left:4px;vertical-align:super;font-weight:400}
.bo-link{position:relative;font-size:14px;font-weight:500;padding:6px 0;white-space:nowrap}
.bo-link::after{content:"";position:absolute;left:0;right:0;bottom:3px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:100% 50%;transition:transform .3s var(--ease)}
@media (hover:hover){.bo-link:hover::after{transform:scaleX(1);transform-origin:0 50%}}
.bo-rows{display:flex;flex-direction:column;border-top:1px solid var(--line)}
.bo-row{position:relative;isolation:isolate;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;padding:14px 0;border-bottom:1px solid var(--line)}
.bo-row::before{content:"";position:absolute;inset:3px -12px;border-radius:12px;background:var(--soft);opacity:0;transition:opacity .15s ease;z-index:-1}
.bo-row.has-media{grid-template-columns:44px minmax(0,1fr) auto}
@media (hover:hover){a.bo-row:hover::before{opacity:1}}
a.bo-row:active::before{opacity:1;background:#efefef}
.bo-row b{display:block;font-weight:500;font-size:16px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bo-row small{display:block;color:var(--muted);font-size:13px;letter-spacing:0;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bo-row .num{text-align:right;font-weight:500;letter-spacing:-.03em;white-space:nowrap}
.bo-row .num small{text-align:right}
.bo-thumb{width:44px;aspect-ratio:4/5;border-radius:8px;object-fit:cover;background:var(--soft);display:block}
.bo-st{display:inline-flex;align-items:center;gap:7px;font-size:13px;letter-spacing:0;color:var(--muted);white-space:nowrap}
.bo-st::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.55}
.bo-st[data-s=sent],.bo-st[data-s=ready],.bo-st[data-s=active],.bo-st[data-s=quote]{color:var(--ink)}
.bo-st[data-s=sent]::before,.bo-st[data-s=ready]::before,.bo-st[data-s=active]::before{opacity:1}
.bo-st[data-s=accepted],.bo-st[data-s=published],.bo-st[data-s=done]{color:#1f7a4d}
.bo-st[data-s=accepted]::before,.bo-st[data-s=published]::before{opacity:1}
.bo-st[data-s=rejected]{color:#b3261e}
.bo-empty{padding:22px 0;border-bottom:1px solid var(--line);color:var(--muted);font-size:15px;max-width:44ch}
.bo-empty a{color:var(--ink);font-weight:500}
.bo-covers{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:20px clamp(12px,1.6vw,20px)}
.bo-cover{display:block}
.bo-cover .fr{position:relative;aspect-ratio:4/5;border-radius:var(--r);overflow:hidden;background:var(--soft)}
.bo-cover img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s var(--ease)}
@media (hover:hover){.bo-cover:hover img{transform:scale(1.03)}}
.bo-cover .tag{position:absolute;left:10px;top:10px;background:#fff;color:var(--ink);font-size:12px;letter-spacing:0;padding:4px 9px;border-radius:999px;font-weight:500}
.bo-cover .meta{display:flex;justify-content:space-between;gap:10px;margin-top:10px}
.bo-cover b{font-weight:500;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bo-cover small{color:var(--muted);font-size:13px;letter-spacing:0;white-space:nowrap}
.bo-cover .acts{display:flex;gap:14px;margin-top:2px}
.bo-sk{background:linear-gradient(90deg,#f3f3f3 0%,#ececec 50%,#f3f3f3 100%);background-size:200% 100%;animation:bo-sk 1.2s linear infinite;border-radius:10px}
@keyframes bo-sk{to{background-position:-200% 0}}
.bo-error{padding:16px 18px;border:1px solid var(--line);border-radius:14px;color:#b3261e;font-size:14px}
@media (max-width:900px){.bo-hero,.bo-grid{grid-template-columns:minmax(0,1fr)}.bo-hero{align-items:start}}
@media (max-width:520px){.bo-covers{grid-template-columns:repeat(2,minmax(0,1fr))}.bo-who small{display:none}}
@media (prefers-reduced-motion:reduce){.bo *{transition:none!important;animation:none!important}}
`;
const Styles = () => <style>{CSS}</style>;

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const Out = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M7 17L17 7M9 7h8v8" />
  </svg>
);

function Status({ list, value }: { list: { title: string; value: string }[]; value?: string }) {
  if (!value) return null;
  return (
    <span className="bo-st" data-s={value}>
      {label(list, value)}
    </span>
  );
}

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bo-rows" aria-busy="true" aria-label="Wczytywanie">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bo-row">
          <div>
            <div className="bo-sk" style={{ height: 16, width: `${60 - i * 7}%` }} />
            <div className="bo-sk" style={{ height: 12, width: '34%', marginTop: 8 }} />
          </div>
          <div className="bo-sk" style={{ height: 16, width: 90 }} />
        </div>
      ))}
    </div>
  );
}

function Top({ right }: { right?: React.ReactNode }) {
  const now = new Date();
  return (
    <header className="bo-top">
      <div className="bo-who">
        <Mark size={34} />
        <div>
          <b>Bart Ocieczek</b>
          <small>Panel</small>
        </div>
      </div>
      {right ?? (
        <span className="bo-date">
          {DAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]}
        </span>
      )}
    </header>
  );
}

/* ---------- data ---------- */

function useQuery<T>(query: string, dataset?: string) {
  const base = useClient({ apiVersion: API });
  const client = useMemo(() => base.withConfig({ ...(dataset ? { dataset } : {}), perspective: 'drafts', useCdn: false }), [base, dataset]);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    client
      .fetch<T>(query)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(String(e?.message ?? e)));
    return () => {
      live = false;
    };
  }, [client, query]);
  return { data, error };
}

type Dash = {
  quotes: (QuoteData & { _id: string; status?: string; client?: string })[];
  materials: { _id: string; title: string; status?: string; year?: string; cover?: unknown; count: number }[];
  projects: { _id: string; name: string; status?: string; client?: string; end?: string }[];
};
type SiteData = { order: string[] | null; projects: { _id: string; title: string; cardTitle?: string; year?: string; slug?: string; cover?: unknown; _updatedAt: string }[] };

const DASH_Q = `{
  "quotes": *[_type == "quote"] | order(coalesce(issuedAt, _createdAt) desc){_id, title, status, issuedAt, rate, items[]{min, max, group}, "client": client->name},
  "materials": *[_type == "caseMaterial"] | order(_updatedAt desc){_id, title, status, year, cover, "count": count(images)},
  "projects": *[_type == "panelProject"] | order(_updatedAt desc){_id, name, status, end, "client": client->name}
}`;
const SITE_Q = `{
  "order": *[_id == "homePage"][0].projects[]._ref,
  "projects": *[_type == "project"] | order(_updatedAt desc){_id, title, cardTitle, year, "slug": slug.current, cover, _updatedAt}
}`;

function useSite() {
  const { data, error } = useQuery<SiteData>(SITE_Q, 'production');
  const img = useMemo(() => createImageUrlBuilder({ projectId: 'jf65lv25', dataset: 'production' }), []);
  const projects = useMemo(() => {
    if (!data) return [];
    const order = data.order ?? [];
    const byId = new Map<string, (typeof data.projects)[number] & { hasDraft?: boolean; isDraft?: boolean }>();
    for (const p of data.projects) {
      const id = p._id.replace(/^drafts\./, '');
      const isDraft = p._id.startsWith('drafts.');
      const prev = byId.get(id);
      if (!prev) byId.set(id, { ...p, isDraft, hasDraft: isDraft });
      else if (isDraft) prev.hasDraft = true;
      else byId.set(id, { ...p, isDraft: false, hasDraft: prev.hasDraft });
    }
    return [...byId.entries()]
      .map(([id, p]) => ({ ...p, id, onHome: order.includes(id), pos: order.indexOf(id) }))
      .sort((a, b) => (a.onHome === b.onHome ? (a.onHome ? a.pos - b.pos : b._updatedAt.localeCompare(a._updatedAt)) : a.onHome ? -1 : 1));
  }, [data]);
  // biome-ignore lint/suspicious/noExplicitAny: Sanity image source
  const cover = (src: any, w = 480) => (src?.asset ? img.image(src).width(w).height(Math.round(w * 1.25)).fit('crop').auto('format').url() : '');
  return { projects, cover, error, loading: !data && !error };
}

/* ---------- Pulpit ---------- */

export function Dashboard() {
  const user = useCurrentUser();
  const { data, error } = useQuery<Dash>(DASH_Q);
  const site = useSite();
  const pimg = useMemo(() => createImageUrlBuilder({ projectId: 'jf65lv25', dataset: 'panel' }), []);
  const first = user?.name?.split(' ')[0];

  const open = data?.quotes.filter((q) => q.status === 'draft' || q.status === 'sent') ?? [];
  const openValue = open.reduce((s, q) => {
    const t = quoteTotals(q);
    return [s[0] + t.all[0] * t.rate, s[1] + t.all[1] * t.rate];
  }, [0, 0]);
  const waiting = data?.materials.filter((m) => m.status === 'new' || m.status === 'ready') ?? [];
  const active = data?.projects.filter((p) => p.status === 'active') ?? [];
  const live = site.projects.filter((p) => !p.isDraft && p.onHome);

  return (
    <div className="bo">
      <Styles />
      <div className="bo-wrap">
        <Top />

        <section className="bo-hero">
          <div>
            <h1 className="bo-h1">{first ? `Cześć, ${first}.` : 'Cześć.'}</h1>
            {data && (
              <p className="bo-lead">
                {open.length ? (
                  <>
                    <em>
                      {open.length} {plural(open.length, 'otwarta wycena', 'otwarte wyceny', 'otwartych wycen')}
                    </em>{' '}
                    {openValue[1] ? `na ${money(openValue[0], openValue[1])}` : ''}
                  </>
                ) : (
                  <em>Brak otwartych wycen</em>
                )}
                {', '}
                {active.length
                  ? `${active.length} ${plural(active.length, 'projekt', 'projekty', 'projektów')} w realizacji`
                  : 'nic w realizacji'}
                {waiting.length ? (
                  <>
                    {' i '}
                    <em>
                      {waiting.length} {plural(waiting.length, 'materiał czeka', 'materiały czekają', 'materiałów czeka')}
                    </em>{' '}
                    na case study.
                  </>
                ) : (
                  '.'
                )}
              </p>
            )}
          </div>
          <nav className="bo-actions" aria-label="Szybkie akcje">
            <a className="bo-line" href={createUrl('quote')}>
              <span>Nowa wycena</span>
              <Arrow />
            </a>
            <a className="bo-line" href={createUrl('caseMaterial')}>
              <span>Wrzuć materiały do case study</span>
              <Arrow />
            </a>
            <a className="bo-line" href={go('strona/structure')}>
              <span>Edytuj stronę</span>
              <Arrow />
            </a>
          </nav>
        </section>

        {error && <p className="bo-error">Nie udało się wczytać danych panelu: {error}</p>}

        <div className="bo-grid">
          <div>
            <section className="bo-sec">
              <div className="bo-sech">
                <h2>
                  Wyceny{data ? <sup>{data.quotes.length}</sup> : null}
                </h2>
                <a className="bo-link" href={go('panel/structure/quote')}>
                  Wszystkie
                </a>
              </div>
              {!data ? (
                <Skeleton />
              ) : data.quotes.length ? (
                <div className="bo-rows">
                  {data.quotes.slice(0, 6).map((q) => {
                    const t = quoteTotals(q);
                    return (
                      <a key={q._id} className="bo-row" href={editUrl('panel', q._id, 'quote')}>
                        <div>
                          <b>{q.title || 'Bez tytułu'}</b>
                          <small>{[q.client, shortDate(q.issuedAt)].filter(Boolean).join(' · ')}</small>
                        </div>
                        <div className="num">
                          {t.rate && t.all[1] ? money(t.all[0] * t.rate, t.all[1] * t.rate) : '—'}
                          <small>
                            <Status list={QUOTE_STATUS} value={q.status} />
                          </small>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="bo-empty">
                  Nie masz jeszcze wycen. <a href={createUrl('quote')}>Zrób pierwszą</a>, a link dla klienta dostaniesz w podglądzie.
                </p>
              )}
            </section>

            <section className="bo-sec">
              <div className="bo-sech">
                <h2>
                  Projekty{data ? <sup>{data.projects.length}</sup> : null}
                </h2>
                <a className="bo-link" href={go('panel/structure/panelProject')}>
                  Wszystkie
                </a>
              </div>
              {!data ? (
                <Skeleton rows={2} />
              ) : data.projects.length ? (
                <div className="bo-rows">
                  {data.projects.slice(0, 5).map((p) => (
                    <a key={p._id} className="bo-row" href={editUrl('panel', p._id, 'panelProject')}>
                      <div>
                        <b>{p.name}</b>
                        <small>{[p.client, p.end && `do ${shortDate(p.end)}`].filter(Boolean).join(' · ')}</small>
                      </div>
                      <Status list={PROJECT_STATUS} value={p.status} />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="bo-empty">
                  Brak projektów. <a href={createUrl('panelProject')}>Dodaj projekt</a>, żeby trzymać w jednym miejscu klienta, wyceny i pliki.
                </p>
              )}
            </section>
          </div>

          <div>
            <section className="bo-sec">
              <div className="bo-sech">
                <h2>
                  Materiały{data ? <sup>{data.materials.length}</sup> : null}
                </h2>
                <a className="bo-link" href={go('panel/structure/caseMaterial')}>
                  Wszystkie
                </a>
              </div>
              {!data ? (
                <Skeleton rows={3} />
              ) : data.materials.length ? (
                <div className="bo-rows">
                  {data.materials.slice(0, 5).map((m) => {
                    // biome-ignore lint/suspicious/noExplicitAny: Sanity image source
                    const src = (m.cover as any)?.asset ? pimg.image(m.cover as any).width(88).height(110).fit('crop').auto('format').url() : '';
                    return (
                      <a key={m._id} className="bo-row has-media" href={editUrl('panel', m._id, 'caseMaterial')}>
                        {src ? <img className="bo-thumb" src={src} alt="" /> : <span className="bo-thumb" />}
                        <div>
                          <b>{m.title || 'Bez nazwy'}</b>
                          <small>{[m.year, m.count ? `${m.count} ${plural(m.count, 'zdjęcie', 'zdjęcia', 'zdjęć')}` : 'bez zdjęć'].filter(Boolean).join(' · ')}</small>
                        </div>
                        <Status list={MATERIAL_STATUS} value={m.status} />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="bo-empty">
                  Skończyłeś projekt? <a href={createUrl('caseMaterial')}>Wrzuć zdjęcia i notatki</a>, a ułożę z nich case study na stronie.
                </p>
              )}
            </section>

            <section className="bo-sec">
              <div className="bo-sech">
                <h2>
                  Na stronie<sup>{site.loading ? '' : live.length}</sup>
                </h2>
                <a className="bo-link" href={go('panel/strona')}>
                  Wszystkie
                </a>
              </div>
              {site.error ? (
                <p className="bo-error">Nie udało się wczytać strony: {site.error}</p>
              ) : site.loading ? (
                <div className="bo-covers">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="bo-sk" style={{ aspectRatio: '4/5', borderRadius: 20 }} />
                  ))}
                </div>
              ) : (
                <div className="bo-covers" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
                  {live.slice(0, 3).map((p) => (
                    <a key={p.id} className="bo-cover" href={`${SITE}/${p.slug}`} target="_blank" rel="noopener">
                      <div className="fr">{site.cover(p.cover, 360) && <img src={site.cover(p.cover, 360)} alt={p.cardTitle || p.title} loading="lazy" />}</div>
                      <div className="meta">
                        <b>{p.cardTitle || p.title}</b>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Strona ---------- */

export function SiteTool() {
  const { projects, cover, error, loading } = useSite();
  const onHome = projects.filter((p) => p.onHome);
  const rest = projects.filter((p) => !p.onHome);

  const Card = ({ p }: { p: (typeof projects)[number] }) => (
    <div className="bo-cover">
      <a href={editUrl('strona', p.id, 'project')} aria-label={`Edytuj ${p.cardTitle || p.title}`}>
        <div className="fr">
          {cover(p.cover) && <img src={cover(p.cover)} alt="" loading="lazy" />}
          {(p.isDraft || p.hasDraft) && <span className="tag">{p.isDraft ? 'Szkic' : 'Niezapisane zmiany'}</span>}
        </div>
      </a>
      <div className="meta">
        <b>{p.cardTitle || p.title}</b>
        <small>{[p.onHome ? `#${p.pos + 1}` : null, p.year].filter(Boolean).join(' · ')}</small>
      </div>
      <div className="acts">
        <a className="bo-link" href={editUrl('strona', p.id, 'project')}>
          Edytuj
        </a>
        {p.slug && !p.isDraft && (
          <a className="bo-link" href={`${SITE}/${p.slug}`} target="_blank" rel="noopener">
            Na stronie
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="bo">
      <Styles />
      <div className="bo-wrap">
        <Top
          right={
            <span style={{ display: 'flex', gap: 20 }}>
              <a className="bo-link" href={SITE} target="_blank" rel="noopener">
                Live
              </a>
              <a className="bo-link" href={STAGE} target="_blank" rel="noopener">
                Stage
              </a>
            </span>
          }
        />
        <section className="bo-hero">
          <div>
            <h1 className="bo-h1">Strona</h1>
            <p className="bo-lead">
              {loading ? (
                ' '
              ) : (
                <>
                  <em>
                    {onHome.length} {plural(onHome.length, 'case study', 'case studies', 'case studies')}
                  </em>{' '}
                  na głównej w tej kolejności
                  {rest.length ? `, ${rest.length} poza nią` : ''}.
                </>
              )}
            </p>
          </div>
          <nav className="bo-actions" aria-label="Akcje strony">
            <a className="bo-line" href={go('strona/structure/homePage')}>
              <span>Zmień kolejność na głównej</span>
              <Arrow />
            </a>
            <a className="bo-line" href={go('strona/structure')}>
              <span>Edytuj treści strony</span>
              <Arrow />
            </a>
            <a className="bo-line" href={SITE} target="_blank" rel="noopener">
              <span>Otwórz bartocieczek.com</span>
              <Out />
            </a>
          </nav>
        </section>

        {error && <p className="bo-error">Nie udało się wczytać strony: {error}</p>}
        {loading ? (
          <div className="bo-covers">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="bo-sk" style={{ aspectRatio: '4/5', borderRadius: 20 }} />
            ))}
          </div>
        ) : (
          <>
            <div className="bo-covers">
              {onHome.map((p) => (
                <Card key={p.id} p={p} />
              ))}
            </div>
            {rest.length > 0 && (
              <section className="bo-sec" style={{ borderTop: '1px solid #e6e6e6', marginTop: 48 }}>
                <div className="bo-sech">
                  <h2>
                    Poza główną<sup>{rest.length}</sup>
                  </h2>
                </div>
                <div className="bo-covers">
                  {rest.map((p) => (
                    <Card key={p.id} p={p} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Podgląd wyceny ---------- */

const PREVIEW_CSS = `
.bo-pv{display:flex;flex-direction:column;height:100%;background:#fff}
.bo-bar{display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid #e6e6e6;font-family:"PP Neue Montreal","Inter","Helvetica Neue",Arial,sans-serif;letter-spacing:-.01em}
.bo-url{flex:1;min-width:0;font-size:13px;color:#8c8c8c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bo-url b{color:#111;font-weight:500}
.bo-btn{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border-radius:999px;font-family:inherit;font-size:14px;font-weight:500;line-height:1;letter-spacing:-.01em;border:1px solid #111;background:#111;color:#fff;cursor:pointer;text-decoration:none;transition:transform .16s ease-out,background-color .15s ease,color .15s ease;white-space:nowrap}
.bo-btn.ghost{background:#fff;color:#111;border-color:#e6e6e6}
@media (hover:hover){.bo-btn:hover{background:#2a2a2a}.bo-btn.ghost:hover{background:#f5f5f5;color:#111}}
.bo-btn:active{transform:scale(.97)}
.bo-btn[aria-disabled=true]{opacity:.4;pointer-events:none}
.bo-btn:focus-visible{outline:2px solid #111;outline-offset:2px}
.bo-frame{flex:1;min-height:0;border:0;width:100%;display:block;background:#fff}
`;

// biome-ignore lint/suspicious/noExplicitAny: document pane props
export function QuotePreview(props: any) {
  const doc = props.document?.displayed ?? {};
  const published = !!props.document?.published;
  const client = useClient({ apiVersion: API });
  const [clientName, setClientName] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const ref = doc.client?._ref;
  useEffect(() => {
    if (!ref) return setClientName('');
    client.fetch<string>(`*[_id in [$id, "drafts." + $id]][0].name`, { id: ref }).then((n) => setClientName(n ?? '')).catch(() => {});
  }, [client, ref]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const html = useMemo(() => renderQuoteHtml({ ...doc, clientName }, origin), [doc, clientName, origin]);
  const url = doc.shareToken ? `${origin}/wycena/${doc.shareToken}` : '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div className="bo-pv">
      <style>{PREVIEW_CSS}</style>
      <div className="bo-bar">
        <div className="bo-url" title={url}>
          {!url ? 'Brak klucza linku: uzupełnij go w zakładce „Wewnętrzne”.' : published ? (
            <>
              <b>Link dla klienta</b> · {url.replace(/^https?:\/\//, '')}
            </>
          ) : (
            'Link zadziała po opublikowaniu wyceny.'
          )}
        </div>
        <button type="button" className="bo-btn ghost" onClick={copy} aria-disabled={!url}>
          {copied ? 'Skopiowano' : 'Kopiuj link'}
        </button>
        <a className="bo-btn" href={url || undefined} target="_blank" rel="noopener" aria-disabled={!url || !published}>
          Otwórz <Out />
        </a>
      </div>
      <iframe className="bo-frame" title="Podgląd wyceny" srcDoc={html} />
    </div>
  );
}
