import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { quoteTotals } from '../lib/quote-render';
import { imgUrl, loadData, type Data, type Material, type Project, type Quote, type SiteProject } from './api';
import { ClientEditor, MaterialEditor, ProjectEditor, QuoteEditor, newClient, newMaterial, newProject, newQuote } from './editors';
import { CSS } from './styles';
import {
  Blank, Card, Ico, Link, MATERIAL_STATUS, Mark, NavCtx, PROJECT_STATUS, Pill, QUOTE_STATUS, QuoteThumb, Seg, Skel,
  norm, pl, plural, range, shortDate, useToast, type IconName,
} from './ui';

const SITE = 'https://bartocieczek.com';
const STAGE = 'https://portfolio-git-panel-sa-aa04.vercel.app';
const STUDIO = '/studio/strona/structure';

type PageId = 'overview' | 'quotes' | 'projects' | 'clients' | 'cases' | 'materials';
const PAGES: Record<PageId, { title: string; path: string; icon: IconName; desc: string }> = {
  overview: { title: 'Przegląd', path: '/panel', icon: 'overview', desc: 'Wyceny, projekty i strona w jednym miejscu. Sprawdź, co na Ciebie czeka.' },
  quotes: { title: 'Wyceny', path: '/panel/wyceny', icon: 'quote', desc: 'Wszystkie wyceny z podglądem tego, co zobaczy klient.' },
  projects: { title: 'Projekty', path: '/panel/projekty', icon: 'project', desc: 'Projekty z klientem, terminami, wycenami i plikami.' },
  clients: { title: 'Klienci', path: '/panel/klienci', icon: 'client', desc: 'Kontakty i to, co z nimi robisz.' },
  cases: { title: 'Case studies', path: '/panel/strona', icon: 'site', desc: 'Projekty na bartocieczek.com w kolejności ze strony głównej.' },
  materials: { title: 'Materiały', path: '/panel/materialy', icon: 'material', desc: 'Zdjęcia i notatki z nowych projektów. Ustaw „Gotowe dla Claude”, a ułożę z nich case study.' },
};
const SEG_TO_PAGE: Record<string, PageId> = { '': 'overview', wyceny: 'quotes', projekty: 'projects', klienci: 'clients', strona: 'cases', materialy: 'materials' };

function useRoute() {
  const [loc, setLoc] = useState(() => ({ path: location.pathname, search: location.search }));
  useEffect(() => {
    const on = () => setLoc({ path: location.pathname, search: location.search });
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  const nav = useCallback((to: string) => {
    const dirty = document.querySelector('.pa-state[data-s=dirty]');
    if (dirty && !confirm('Masz niezapisane zmiany. Wyjść bez zapisu?')) return;
    history.pushState(null, '', to);
    setLoc({ path: location.pathname, search: location.search });
  }, []);
  return { ...loc, nav };
}

type SiteCase = SiteProject & { isDraft: boolean; hasDraft: boolean; onHome: boolean; pos: number };
function siteCases(data: Data | null): SiteCase[] {
  if (!data) return [];
  const order = data.site.order ?? [];
  const map = new Map<string, SiteCase>();
  for (const p of data.site.projects) {
    const id = p._id.replace(/^drafts\./, '');
    const isDraft = p._id.startsWith('drafts.');
    const prev = map.get(id);
    if (!prev) map.set(id, { ...p, _id: id, isDraft, hasDraft: isDraft, onHome: order.includes(id), pos: order.indexOf(id) });
    else if (isDraft) map.set(id, { ...p, _id: id, isDraft: prev.isDraft, hasDraft: true, onHome: prev.onHome, pos: prev.pos });
    else prev.isDraft = false;
  }
  return [...map.values()].sort((a, b) => (a.onHome === b.onHome ? (a.onHome ? a.pos - b.pos : b._updatedAt.localeCompare(a._updatedAt)) : a.onHome ? -1 : 1));
}

/* ---------- cards ---------- */

const quoteCard = (q: Quote) => {
  const t = quoteTotals(q);
  return (
    <Card
      key={q._id}
      to={`/panel/wyceny/${q._id}`}
      preview={<QuoteThumb q={q} clientName={q.clientName} />}
      title={q.title || 'Bez tytułu'}
      pill={<Pill list={QUOTE_STATUS} value={q.status} />}
      desc={[q.clientName, q.eyebrow && q.eyebrow !== q.clientName ? q.eyebrow : null].filter(Boolean).join(' · ') || undefined}
      footL={[t.all[1] ? range(t.all[0], t.all[1], 'h') : null, shortDate(q.issuedAt)].filter(Boolean).join(' · ')}
      footR={t.rate && t.all[1] ? <b>{range(t.all[0] * t.rate, t.all[1] * t.rate, 'zł')}</b> : undefined}
    />
  );
};
const caseCard = (p: SiteCase) => {
  const src = imgUrl(p.cover, 560, 700, 'production');
  return (
    <Card
      key={p._id}
      to={`${STUDIO}/project;${p._id}`}
      external
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
  const src = imgUrl(m.cover ?? m.images?.[0], 560, short ? 245 : 700);
  return (
    <Card
      key={m._id}
      to={`/panel/materialy/${m._id}`}
      preview={<div className={`pa-pv ${short ? 'wide' : 'tall'}`}>{src ? <img src={src} alt="" loading="lazy" /> : <div className="empty"><Ico n="material" s={28} /></div>}</div>}
      title={m.title || 'Bez nazwy'}
      pill={<Pill list={MATERIAL_STATUS} value={m.status} />}
      desc={[m.client, m.year].filter(Boolean).join(' · ') || undefined}
      footL={[`${m.images?.length ?? 0} ${plural(m.images?.length ?? 0, 'zdjęcie', 'zdjęcia', 'zdjęć')}`, (m.videos?.length ?? 0) + (m.videoLinks?.length ?? 0) ? `${(m.videos?.length ?? 0) + (m.videoLinks?.length ?? 0)} wideo` : null].filter(Boolean).join(' · ')}
    />
  );
};
const projectCard = (p: Project) => (
  <Card
    key={p._id}
    to={`/panel/projekty/${p._id}`}
    preview={
      <div className="pa-pv wide">
        <span className="mono">{(p.clientName || p.name).slice(0, 2)}</span>
      </div>
    }
    title={p.name}
    pill={<Pill list={PROJECT_STATUS} value={p.status} />}
    desc={[p.clientName, p.start && p.end ? `${shortDate(p.start)} – ${shortDate(p.end)}` : p.end ? `do ${shortDate(p.end)}` : null].filter(Boolean).join(' · ') || undefined}
    footL={[`${p.quotes ?? 0} ${plural(p.quotes ?? 0, 'wycena', 'wyceny', 'wycen')}`, p.files?.length ? `${p.files.length} ${plural(p.files.length, 'plik', 'pliki', 'plików')}` : null].filter(Boolean).join(' · ')}
    footR={p.budget ? <b>{pl(p.budget)} zł</b> : undefined}
  />
);

/* ---------- app ---------- */

export function PortalApp() {
  const { path, search, nav } = useRoute();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const [quoteFilter, setQuoteFilter] = useState<'all' | 'open' | 'accepted' | 'rejected'>('all');
  const [matFilter, setMatFilter] = useState<'all' | 'waiting' | 'done'>('all');
  const toast = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    try {
      setData(await loadData());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    reload();
    const on = () => document.visibilityState === 'visible' && reload();
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, [reload]);

  const parts = path.replace(/^\/panel\/?/, '').split('/').filter(Boolean);
  const page: PageId = SEG_TO_PAGE[parts[0] ?? ''] ?? 'overview';
  const docId = parts[1];
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    setMenu(false);
  }, [path]);
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

  const P = data?.panel;
  const cases = useMemo(() => siteCases(data), [data]);
  const match = (...xs: (string | undefined)[]) => !q || norm(xs.filter(Boolean).join(' ')).includes(norm(q));
  const quotes = P?.quotes.filter((x) => match(x.title, x.clientName, x.eyebrow)) ?? [];
  const projects = P?.projects.filter((x) => match(x.name, x.clientName)) ?? [];
  const clients = P?.clients.filter((x) => match(x.name, x.contact, x.email)) ?? [];
  const materials = P?.materials.filter((x) => match(x.title, x.client)) ?? [];
  const casesF = cases.filter((x) => match(x.title, x.cardTitle, x.slug));

  const openQ = P?.quotes.filter((x) => x.status === 'draft' || x.status === 'sent') ?? [];
  const openVal = openQ.reduce((s, x) => {
    const t = quoteTotals(x);
    return [s[0] + t.all[0] * t.rate, s[1] + t.all[1] * t.rate];
  }, [0, 0]);
  const waiting = P?.materials.filter((m) => m.status === 'new' || m.status === 'ready') ?? [];
  const active = P?.projects.filter((p) => p.status === 'active') ?? [];
  const live = cases.filter((p) => !p.isDraft && p.onHome);
  const loading = !data && !error;
  const ctx = data ? { data, reload, toast: toast.show } : null;

  /* ----- editor routes ----- */
  let editor: React.ReactNode = null;
  if (docId && ctx && P) {
    const sp = new URLSearchParams(search);
    if (page === 'quotes') {
      let doc: Quote | undefined;
      if (docId === 'nowa') {
        const dup = sp.get('kopia') ? sessionStorage.getItem('pa-dup') : null;
        doc = dup ? JSON.parse(dup) : newQuote(sp.get('klient') ?? undefined, sp.get('projekt') ?? undefined);
      } else doc = P.quotes.find((x) => x._id === docId);
      editor = doc ? <QuoteEditor key={docId + search} ctx={ctx} quote={doc} isNew={docId === 'nowa'} /> : null;
    } else if (page === 'clients') {
      const doc = docId === 'nowy' ? newClient() : P.clients.find((x) => x._id === docId);
      editor = doc ? <ClientEditor key={docId} ctx={ctx} client={doc} isNew={docId === 'nowy'} /> : null;
    } else if (page === 'projects') {
      const doc = docId === 'nowy' ? newProject(sp.get('klient') ?? undefined) : P.projects.find((x) => x._id === docId);
      editor = doc ? <ProjectEditor key={docId + search} ctx={ctx} project={doc} isNew={docId === 'nowy'} /> : null;
    } else if (page === 'materials') {
      const doc = docId === 'nowe' ? newMaterial() : P.materials.find((x) => x._id === docId);
      editor = doc ? <MaterialEditor key={docId} ctx={ctx} material={doc} isNew={docId === 'nowe'} /> : null;
    }
    if (!editor)
      editor = (
        <div className="pa-page">
          <Blank title="Nie ma takiego dokumentu" text="Mógł zostać usunięty." to={PAGES[page].path} cta="Wróć do listy" />
        </div>
      );
  }

  const navItem = (id: PageId, n?: number) => (
    <Link key={id} to={PAGES[id].path} className="pa-item" aria-current={page === id ? 'page' : undefined}>
      <Ico n={PAGES[id].icon} />
      <span>{PAGES[id].title}</span>
      {n !== undefined && <em>{n}</em>}
    </Link>
  );
  const meta = PAGES[page];
  const newPath = { overview: '/panel/wyceny/nowa', quotes: '/panel/wyceny/nowa', projects: '/panel/projekty/nowy', clients: '/panel/klienci/nowy', materials: '/panel/materialy/nowe', cases: '' }[page];
  const newText = { overview: 'Nowa wycena', quotes: 'Nowa wycena', projects: 'Nowy projekt', clients: 'Nowy klient', materials: 'Wrzuć materiały', cases: '' }[page];

  return (
    <NavCtx.Provider value={nav}>
      <div className="pa" data-menu={menu ? 'open' : undefined}>
        <style>{CSS}</style>
        <aside className="pa-side" aria-label="Nawigacja">
          <Link to="/panel" className="pa-brand">
            <Mark size={30} />
            <b>Bart Ocieczek</b>
          </Link>
          <div className="pa-group">
            <h4>Praca</h4>
            <nav className="pa-nav">
              {navItem('overview')}
              {navItem('quotes', P?.quotes.length)}
              {navItem('projects', P?.projects.length)}
              {navItem('clients', P?.clients.length)}
            </nav>
          </div>
          <div className="pa-group">
            <h4>Strona</h4>
            <nav className="pa-nav">
              {navItem('cases', data ? cases.length : undefined)}
              {navItem('materials', P?.materials.length)}
            </nav>
          </div>
          <div className="pa-promo">
            <b>Nowy projekt na stronie?</b>
            <p>Wrzuć zdjęcia i notatki, ustaw „Gotowe dla Claude” i napisz mi w czacie.</p>
            <Link className="pa-more" to="/panel/materialy/nowe">
              Wrzuć materiały <Ico n="arrow" s={15} />
            </Link>
          </div>
          <div className="pa-user">
            <i>BO</i>
            <div>
              <b>Bart Ocieczek</b>
              <small>bartocieczek.com</small>
            </div>
            <form method="post" action="/api/panel/logout">
              <button type="submit" aria-label="Wyloguj" title="Wyloguj">
                <Ico n="logout" s={17} />
              </button>
            </form>
          </div>
        </aside>

        <div className="pa-main" ref={mainRef} style={editor ? { overflow: 'hidden' } : undefined}>
          {editor ? (
            loading ? <Skel /> : editor
          ) : (
            <>
              <div className="pa-top">
                <button type="button" className="pa-burger" aria-label={menu ? 'Zamknij menu' : 'Otwórz menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>
                  <Ico n={menu ? 'close' : 'menu'} />
                </button>
                <div className="pa-crumb">
                  <Link to="/panel">Panel</Link> <span aria-hidden="true">›</span> <b>{meta.title}</b>
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
                    <h1 className="pa-h1">{page === 'overview' ? 'Cześć, Bart' : meta.title}</h1>
                    <p className="pa-desc">{meta.desc}</p>
                  </div>
                  <div className="pa-acts">
                    {page === 'cases' ? (
                      <>
                        <a className="pa-btn ghost" href={`${STUDIO}/homePage`}>
                          Kolejność na głównej
                        </a>
                        <a className="pa-btn" href={`${STUDIO}/project`}>
                          <Ico n="edit" s={16} /> Edytuj case studies
                        </a>
                      </>
                    ) : (
                      <Link className="pa-btn" to={newPath}>
                        <Ico n="plus" s={16} /> {newText}
                      </Link>
                    )}
                  </div>
                </div>

                {error && <p className="pa-err">{error}</p>}
                {data && !data.canWrite && <p className="pa-note" style={{ marginTop: 20 }}>Zapis jest wyłączony, dopóki w Vercelu nie ma tokenu SANITY_API_WRITE_TOKEN. Wszystko widzisz, ale zmiany się nie zapiszą.</p>}

                {page === 'overview' && (
                  <>
                    <div className="pa-stats">
                      <div className="pa-stat">
                        <header>
                          Otwarte wyceny <Ico n="quote" />
                        </header>
                        <strong>
                          {data ? openQ.length : '–'}
                          <small>{openVal[1] ? range(openVal[0], openVal[1], 'zł') : 'w toku'}</small>
                        </strong>
                      </div>
                      <div className="pa-stat">
                        <header>
                          W realizacji <Ico n="clock" />
                        </header>
                        <strong>
                          {data ? active.length : '–'}
                          <small>{plural(active.length, 'projekt', 'projekty', 'projektów')}</small>
                        </strong>
                      </div>
                      <div className="pa-stat">
                        <header>
                          Czeka na case study <Ico n="wait" />
                        </header>
                        <strong>
                          {data ? waiting.length : '–'}
                          <small>{plural(waiting.length, 'materiał', 'materiały', 'materiałów')}</small>
                        </strong>
                      </div>
                      <div className="pa-stat">
                        <header>
                          Na stronie <Ico n="site" />
                        </header>
                        <strong>
                          {data ? live.length : '–'}
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
                        <Link className="pa-more" to="/panel/wyceny">
                          Wszystkie wyceny <Ico n="arrow" s={15} />
                        </Link>
                      </div>
                      {loading ? <Skel /> : <div className="pa-grid three">{quotes.length ? quotes.slice(0, 3).map(quoteCard) : <Blank title="Nie masz jeszcze wycen" text="Pierwsza wycena dostanie podgląd i link dla klienta w Twoim stylu." to="/panel/wyceny/nowa" cta="Nowa wycena" />}</div>}
                    </section>

                    <section className="pa-sec">
                      <div className="pa-sechead">
                        <div>
                          <h2 className="pa-h2">Na stronie</h2>
                          <p className="pa-sub">Case studies z bartocieczek.com w kolejności ze strony głównej.</p>
                        </div>
                        <Link className="pa-more" to="/panel/strona">
                          Wszystkie case studies <Ico n="arrow" s={15} />
                        </Link>
                      </div>
                      {loading ? <Skel n={4} tall /> : <div className="pa-grid covers">{casesF.slice(0, 4).map(caseCard)}</div>}
                    </section>

                    <section className="pa-sec">
                      <div className="pa-sechead">
                        <div>
                          <h2 className="pa-h2">Projekty i materiały</h2>
                          <p className="pa-sub">To, nad czym teraz pracujesz, i to, co czeka na stronę.</p>
                        </div>
                      </div>
                      {loading ? (
                        <Skel />
                      ) : (
                        <div className="pa-grid three">
                          {projects.slice(0, 2).map(projectCard)}
                          {materials.slice(0, 1).map((m) => materialCard(m, true))}
                          {!projects.length && !materials.length && <Blank title="Pusto" text="Dodaj projekt albo wrzuć materiały do case study." to="/panel/projekty/nowy" cta="Nowy projekt" />}
                        </div>
                      )}
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
                            return list.length ? list.map(quoteCard) : <Blank title={q ? 'Nic nie pasuje' : 'Brak wycen w tym widoku'} text={q ? `Nie ma wycen dla „${q}”.` : 'Zmień filtr albo zrób nową wycenę.'} to="/panel/wyceny/nowa" cta="Nowa wycena" />;
                          })()}
                        </div>
                      )}
                    </section>
                  </>
                )}

                {page === 'projects' && (
                  <section className="pa-sec" style={{ marginTop: 32 }}>
                    {loading ? <Skel /> : <div className="pa-grid three">{projects.length ? projects.map(projectCard) : <Blank title="Brak projektów" text="Projekt trzyma razem klienta, terminy, wyceny i pliki." to="/panel/projekty/nowy" cta="Nowy projekt" />}</div>}
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
                          const logo = imgUrl(c.logo, 60, 60);
                          return (
                            <Link key={c._id} className="pa-tr" to={`/panel/klienci/${c._id}`}>
                              <b>
                                <span className="av">{logo ? <img src={logo} alt="" /> : c.name.slice(0, 2)}</span>
                                {c.name}
                              </b>
                              <span>{[c.contact, c.email].filter(Boolean).join(' · ') || '—'}</span>
                              <span>{c.projects ?? 0}</span>
                              <span>{c.quotes ?? 0}</span>
                              <Ico n="arrow" s={16} />
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="pa-grid">
                        <Blank title="Brak klientów" text="Dodaj klienta, żeby podpinać go do projektów i wycen." to="/panel/klienci/nowy" cta="Nowy klient" />
                      </div>
                    )}
                  </section>
                )}

                {page === 'cases' && (
                  <section className="pa-sec" style={{ marginTop: 32 }}>
                    <p className="pa-sub" style={{ marginTop: -12, marginBottom: 20 }}>Treść case studies edytujesz w edytorze strony. Nowe dodaję z Twoich materiałów.</p>
                    {loading ? <Skel n={6} tall /> : <div className="pa-grid covers">{casesF.map(caseCard)}</div>}
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
                        <div className="pa-grid covers">
                          {(() => {
                            const list = materials.filter((m) => matFilter === 'all' || (matFilter === 'waiting' ? m.status === 'new' || m.status === 'ready' : m.status === 'drafted' || m.status === 'published'));
                            return list.length ? list.map((m) => materialCard(m)) : <Blank title="Brak materiałów" text="Skończyłeś projekt? Wrzuć zdjęcia i notatki, a zrobię z nich case study." to="/panel/materialy/nowe" cta="Wrzuć materiały" />;
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
            </>
          )}
        </div>
        {toast.view}
      </div>
    </NavCtx.Provider>
  );
}
