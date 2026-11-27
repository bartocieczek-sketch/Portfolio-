import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_STEPS, quoteTotals, renderQuoteHtml, type QuoteItem } from '../lib/quote-render';
import {
  deleteDoc, fileOf, imageOf, imgUrl, newId, newKey, newToken, ref, saveDoc, today,
  type Client, type Data, type Material, type Project, type Quote,
} from './api';
import {
  DeleteBtn, Drop, Ico, Link, ListIn, MATERIAL_STATUS, PROJECT_STATUS, Pill, QUOTE_STATUS, Seg, SelectIn, TextIn,
  label, move, pl, range, shortDate, useNav, useUploads,
} from './ui';

type Ctx = { data: Data; reload: () => Promise<void>; toast: (t: string, err?: boolean) => void };

/* ---------- shared editor state ---------- */

function useEditor<T extends { _id: string; _type: string }>(initial: T, isNew: boolean, ctx: Ctx, listPath: string, pathOf: (id: string) => string) {
  const [doc, setDoc] = useState<T>(initial);
  const [base, setBase] = useState(() => JSON.stringify(initial));
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');
  const nav = useNav();
  const dirty = isNew || JSON.stringify(doc) !== base;
  const set = <K extends keyof T>(k: K, v: T[K]) => setDoc((d) => ({ ...d, [k]: v }));

  const save = async () => {
    if (!ctx.data.canWrite) return ctx.toast('Zapis wyłączony: brakuje tokenu zapisu w Vercelu.', true);
    setState('saving');
    try {
      const r = await saveDoc(doc);
      setBase(JSON.stringify(doc));
      setState('idle');
      ctx.toast('Zapisano');
      await ctx.reload();
      if (isNew) nav(pathOf(r.id));
    } catch (e) {
      setState('error');
      ctx.toast((e as Error).message, true);
    }
  };
  const remove = async () => {
    try {
      await deleteDoc(doc._id);
      ctx.toast('Usunięto');
      await ctx.reload();
      nav(listPath);
    } catch (e) {
      ctx.toast((e as Error).message, true);
    }
  };

  // Cmd/Ctrl+S saves, leaving with unsaved changes asks first
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current();
      }
    };
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('keydown', key);
    window.addEventListener('beforeunload', leave);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('beforeunload', leave);
    };
  }, [dirty]);

  const status = state === 'saving' ? 'Zapisuję…' : state === 'error' ? 'Błąd zapisu' : isNew ? 'Nowy dokument' : dirty ? 'Niezapisane zmiany' : 'Zapisano';
  const stateView = (
    <span className="pa-state" data-s={state === 'error' ? 'error' : dirty ? 'dirty' : undefined} aria-live="polite">
      {status}
    </span>
  );
  return { doc, setDoc, set, save, remove, dirty, saving: state === 'saving', stateView };
}

function Bar({ back, title, children }: { back: string; title: string; children: React.ReactNode }) {
  return (
    <div className="pa-edbar">
      <div className="ttl">
        <Link to={back} aria-label="Wróć">
          <Ico n="back" s={16} />
        </Link>
        <b>{title}</b>
      </div>
      {children}
    </div>
  );
}

const SaveBtn = ({ onClick, saving, dirty, disabled }: { onClick: () => void; saving: boolean; dirty: boolean; disabled?: boolean }) => (
  <button type="button" className="pa-btn" onClick={onClick} disabled={saving || !dirty || disabled} title="Zapisz (⌘S)">
    {saving ? 'Zapisuję…' : 'Zapisz'}
  </button>
);

const WriteNote = ({ data }: { data: Data }) =>
  data.canWrite ? null : <p className="pa-note" style={{ margin: '0 0 20px' }}>Podgląd działa, ale zapis jest wyłączony, dopóki w Vercelu nie ma tokenu SANITY_API_WRITE_TOKEN.</p>;

/* ---------- Quote ---------- */

export function newQuote(clientId?: string, projectId?: string): Quote {
  return {
    _id: newId('quote'),
    _type: 'quote',
    title: '',
    status: 'draft',
    issuedAt: today(),
    rate: 150,
    client: ref(clientId),
    project: ref(projectId),
    steps: DEFAULT_STEPS.map((s) => ({ ...s, _key: newKey() })),
    items: [{ _key: newKey(), name: '', description: '', min: 0, max: 0, group: 'design' }],
    scope: [],
    outOfScope: [],
    assumptions: [],
    shareToken: newToken(),
  };
}

export function QuoteEditor({ ctx, quote, isNew }: { ctx: Ctx; quote: Quote; isNew: boolean }) {
  const ed = useEditor(quote, isNew, ctx, '/panel/wyceny', (id) => `/panel/wyceny/${id}`);
  const { doc: q, set } = ed;
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);
  const clientName = ctx.data.panel.clients.find((c) => c._id === q.client?._ref)?.name;
  const html = useMemo(() => renderQuoteHtml({ ...q, clientName }, location.origin), [q, clientName]);
  const t = quoteTotals(q);
  const url = q.shareToken ? `${location.origin}/wycena/${q.shareToken}` : '';
  const published = !isNew;

  // scale the 1280px page to the preview pane
  const pane = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const el = pane.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, (el.clientWidth - 48) / 1280)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [tab]);
  const [frameH, setFrameH] = useState(2400);
  const onLoad = () => {
    const h = frame.current?.contentDocument?.documentElement.scrollHeight;
    if (h) setFrameH(h);
  };

  const items = q.items ?? [];
  const setItems = (v: QuoteItem[]) => set('items', v);
  const setItem = (i: number, patch: Partial<QuoteItem>) => setItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const steps = q.steps ?? [];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      ctx.toast('Nie udało się skopiować. Zaznacz link ręcznie.', true);
    }
  };

  return (
    <>
      <Bar back="/panel/wyceny" title={q.title || 'Nowa wycena'}>
        <span className="pa-tabs">
          <Seg value={tab} onChange={setTab} label="Widok" options={[{ value: 'edit', title: 'Edycja' }, { value: 'preview', title: 'Podgląd' }]} />
        </span>
        {ed.stateView}
        <button type="button" className="pa-btn ghost" onClick={copy} disabled={!url || !published} title={published ? url : 'Zapisz wycenę, żeby link zadziałał'}>
          <Ico n="copy" s={15} /> {copied ? 'Skopiowano' : 'Kopiuj link'}
        </button>
        <a className="pa-btn ghost" href={url || undefined} target="_blank" rel="noopener" aria-disabled={!published} style={!published ? { opacity: 0.45, pointerEvents: 'none' } : undefined}>
          Otwórz <Ico n="out" s={15} />
        </a>
        <SaveBtn onClick={ed.save} saving={ed.saving} dirty={ed.dirty} disabled={!q.title} />
      </Bar>
      <div className="pa-ed" data-tab={tab}>
        <form className="pa-form" onSubmit={(e) => (e.preventDefault(), ed.save())}>
          <WriteNote data={ctx.data} />
          <fieldset className="pa-fs">
            <legend>Podstawowe</legend>
            <TextIn label="Tytuł" value={q.title} onChange={(v) => set('title', v)} placeholder="Projekt UI aplikacji multimedialnych" />
            <TextIn label="Nad tytułem" value={q.eyebrow} onChange={(v) => set('eyebrow', v)} placeholder="Muzeum Wojska Polskiego · Moduł M1" />
            <div className="pa-row">
              <SelectIn label="Klient" value={q.client?._ref} empty="Bez klienta" onChange={(v) => set('client', ref(v))} options={ctx.data.panel.clients.map((c) => ({ value: c._id, title: c.name }))} />
              <SelectIn label="Projekt" value={q.project?._ref} empty="Bez projektu" onChange={(v) => set('project', ref(v))} options={ctx.data.panel.projects.map((p) => ({ value: p._id, title: p.name }))} />
            </div>
            <div className="pa-row three">
              <SelectIn label="Status" value={q.status} onChange={(v) => set('status', v)} options={QUOTE_STATUS} />
              <TextIn label="Data" type="date" value={q.issuedAt} onChange={(v) => set('issuedAt', v)} />
              <TextIn label="Stawka zł/h" type="number" value={q.rate} onChange={(v) => set('rate', v === '' ? undefined : Number(v))} />
            </div>
            <div className="pa-row">
              <TextIn label="Środkowa statystyka" value={q.stat2Value} onChange={(v) => set('stat2Value', v)} placeholder="13 aplikacji" />
              <TextIn label="Jej podpis" value={q.stat2Label} onChange={(v) => set('stat2Label', v)} placeholder="10 historycznych, 3 inne" />
            </div>
          </fieldset>

          <fieldset className="pa-fs">
            <legend>Rozbicie godzin</legend>
            <div className="pa-items">
              {items.map((it, i) => (
                <div className="pa-itm" key={it._key ?? i}>
                  <div className="top">
                    <input className="pa-in" aria-label="Pozycja" placeholder="Pozycja" value={it.name ?? ''} onChange={(e) => setItem(i, { name: e.target.value })} />
                    <input className="pa-in num" aria-label="Min godzin" type="number" min={0} placeholder="min" value={it.min ?? ''} onChange={(e) => setItem(i, { min: e.target.value === '' ? undefined : Number(e.target.value) })} />
                    <input className="pa-in num" aria-label="Max godzin" type="number" min={0} placeholder="max" value={it.max ?? ''} onChange={(e) => setItem(i, { max: e.target.value === '' ? undefined : Number(e.target.value) })} />
                    <span className="ops" style={{ display: 'flex' }}>
                      <button type="button" className="pa-ic" aria-label="W górę" disabled={i === 0} onClick={() => setItems(move(items, i, -1))}>
                        <Ico n="up" s={15} />
                      </button>
                      <button type="button" className="pa-ic" aria-label="W dół" disabled={i === items.length - 1} onClick={() => setItems(move(items, i, 1))}>
                        <Ico n="down" s={15} />
                      </button>
                      <button type="button" className="pa-ic" aria-label="Usuń pozycję" onClick={() => setItems(items.filter((_, j) => j !== i))}>
                        <Ico n="trash" s={15} />
                      </button>
                    </span>
                  </div>
                  <div className="bot">
                    <input className="pa-in" aria-label="Opis" placeholder="Opis (opcjonalnie)" value={it.description ?? ''} onChange={(e) => setItem(i, { description: e.target.value })} />
                    <select className="pa-in" aria-label="Grupa" value={it.group ?? 'design'} onChange={(e) => setItem(i, { group: e.target.value as 'design' | 'support' })} style={{ width: 170 }}>
                      <option value="design">Projekt</option>
                      <option value="support">Przekazanie i współpraca</option>
                    </select>
                  </div>
                </div>
              ))}
              <button type="button" className="pa-add" onClick={() => setItems([...items, { _key: newKey(), name: '', min: 0, max: 0, group: 'design' }])}>
                <Ico n="plus" s={14} /> Dodaj pozycję
              </button>
              <div className="pa-tot">
                <span>
                  Razem <b>{range(t.all[0], t.all[1], 'h')}</b>
                </span>
                {t.rate ? <b>{range(t.all[0] * t.rate, t.all[1] * t.rate, 'zł')}</b> : <span>bez stawki</span>}
              </div>
            </div>
          </fieldset>

          <fieldset className="pa-fs">
            <legend>Treść</legend>
            <TextIn label="Cel" area rows={3} value={q.goal} onChange={(v) => set('goal', v)} />
            <TextIn label="Cel, uzupełnienie" hint="Pokazuje się szarym tekstem pod celem." area rows={3} value={q.goalSub} onChange={(v) => set('goalSub', v)} />
            <ListIn label="Zakres" value={q.scope} onChange={(v) => set('scope', v)} addText="Dodaj punkt zakresu" />
            <ListIn label="Poza zakresem" value={q.outOfScope} onChange={(v) => set('outOfScope', v)} addText="Dodaj punkt" />
            <ListIn label="Założenia" value={q.assumptions} onChange={(v) => set('assumptions', v)} addText="Dodaj założenie" />
            <div className="pa-f">
              <span className="lab">Jak pracujemy</span>
              <small style={{ marginTop: -2 }}>Do 4 etapów.</small>
              <div className="pa-list">
                {steps.map((s, i) => (
                  <div className="pa-li" key={s._key ?? i}>
                    <div className="pa-row" style={{ gap: 6 }}>
                      <input className="pa-in" aria-label={`Etap ${i + 1}`} value={s.title ?? ''} onChange={(e) => set('steps', steps.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                      <input className="pa-in" aria-label={`Opis etapu ${i + 1}`} value={s.text ?? ''} onChange={(e) => set('steps', steps.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
                    </div>
                    <div className="ops">
                      <button type="button" className="pa-ic" aria-label="Usuń etap" onClick={() => set('steps', steps.filter((_, j) => j !== i))}>
                        <Ico n="trash" s={15} />
                      </button>
                    </div>
                  </div>
                ))}
                {steps.length < 4 && (
                  <button type="button" className="pa-add" onClick={() => set('steps', [...steps, { _key: newKey(), title: '', text: '' }])}>
                    <Ico n="plus" s={14} /> Dodaj etap
                  </button>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="pa-fs">
            <legend>Tylko dla Ciebie</legend>
            <TextIn label="Notatki" area rows={4} value={q.notes} onChange={(v) => set('notes', v)} />
            <div className="pa-f">
              <span className="lab">Link dla klienta</span>
              <small style={{ wordBreak: 'break-all' }}>{url}</small>
              <button type="button" className="pa-add" onClick={() => set('shareToken', newToken())}>
                Utwórz nowy link (stary przestanie działać)
              </button>
            </div>
          </fieldset>

          {!isNew && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #e6e6e6' }}>
              <button
                type="button"
                className="pa-btn ghost sm"
                onClick={() => {
                  const copyQ = { ...q, _id: newId('quote'), title: `${q.title} (kopia)`, status: 'draft', issuedAt: today(), shareToken: newToken() };
                  sessionStorage.setItem('pa-dup', JSON.stringify(copyQ));
                  location.href = '/panel/wyceny/nowa?kopia=1';
                }}
              >
                <Ico n="copy" s={15} /> Duplikuj
              </button>
              <DeleteBtn what="wycenę" onConfirm={ed.remove} />
            </div>
          )}
        </form>

        <div className="pa-prev" ref={pane}>
          <div className="stage">
            <div style={{ width: 1280 * scale, height: frameH * scale, margin: '0 auto' }}>
              <iframe ref={frame} title="Podgląd wyceny" srcDoc={html} onLoad={onLoad} style={{ height: frameH, transform: `scale(${scale})` }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Client ---------- */

export const newClient = (): Client => ({ _id: newId('client'), _type: 'client', name: '' });

export function ClientEditor({ ctx, client, isNew }: { ctx: Ctx; client: Client; isNew: boolean }) {
  const ed = useEditor(client, isNew, ctx, '/panel/klienci', (id) => `/panel/klienci/${id}`);
  const { doc: c, set } = ed;
  const up = useUploads();
  const projects = ctx.data.panel.projects.filter((p) => p.client?._ref === c._id);
  const quotes = ctx.data.panel.quotes.filter((q) => q.client?._ref === c._id);
  const logo = imgUrl(c.logo, 160, 160);
  return (
    <>
      <Bar back="/panel/klienci" title={c.name || 'Nowy klient'}>
        {ed.stateView}
        <SaveBtn onClick={ed.save} saving={ed.saving} dirty={ed.dirty} disabled={!c.name} />
      </Bar>
      <div className="pa-ed single">
        <form className="pa-form" onSubmit={(e) => (e.preventDefault(), ed.save())}>
          <WriteNote data={ctx.data} />
          <fieldset className="pa-fs">
            <legend>Klient</legend>
            <TextIn label="Nazwa" value={c.name} onChange={(v) => set('name', v)} />
            <div className="pa-row">
              <TextIn label="Osoba kontaktowa" value={c.contact} onChange={(v) => set('contact', v)} />
              <TextIn label="E-mail" type="email" value={c.email} onChange={(v) => set('email', v)} />
            </div>
            <div className="pa-row">
              <TextIn label="Telefon" type="tel" value={c.phone} onChange={(v) => set('phone', v)} />
              <TextIn label="Strona" type="url" value={c.website} onChange={(v) => set('website', v)} placeholder="https://" />
            </div>
            <TextIn label="Notatki" area rows={5} value={c.notes} onChange={(v) => set('notes', v)} />
          </fieldset>
          <fieldset className="pa-fs">
            <legend>Logo</legend>
            <div className="pa-cover" style={{ gridTemplateColumns: '88px minmax(0,1fr)' }}>
              <div className="im" style={{ aspectRatio: '1/1' }}>{logo && <img src={logo} alt="" />}</div>
              <div>
                <Drop accept="image/*" title={logo ? 'Zmień logo' : 'Dodaj logo'} hint="Przeciągnij plik albo kliknij" disabled={!ctx.data.canWrite} onFiles={(f) => up.run(f.slice(0, 1), (u) => set('logo', imageOf(u.ref)))} />
                {up.view}
                {logo && (
                  <button type="button" className="pa-add" style={{ marginTop: 8 }} onClick={() => set('logo', undefined)}>
                    Usuń logo
                  </button>
                )}
              </div>
            </div>
          </fieldset>
          {!isNew && (
            <div style={{ paddingTop: 12, borderTop: '1px solid #e6e6e6' }}>
              <DeleteBtn what="klienta" onConfirm={ed.remove} />
            </div>
          )}
        </form>
        <aside className="pa-side2">
          <div className="pa-box">
            <h3>Projekty</h3>
            {projects.length ? projects.map((p) => (
              <Link key={p._id} className="ln" to={`/panel/projekty/${p._id}`}>
                <span>{p.name}</span>
                <Pill list={PROJECT_STATUS} value={p.status} />
              </Link>
            )) : <p className="pa-sub" style={{ margin: 0 }}>Brak projektów.</p>}
          </div>
          <div className="pa-box">
            <h3>Wyceny</h3>
            {quotes.length ? quotes.map((q) => (
              <Link key={q._id} className="ln" to={`/panel/wyceny/${q._id}`}>
                <span>{q.title}</span>
                <Pill list={QUOTE_STATUS} value={q.status} />
              </Link>
            )) : <p className="pa-sub" style={{ margin: 0 }}>Brak wycen.</p>}
            {!isNew && (
              <Link className="pa-more" to={`/panel/wyceny/nowa?klient=${c._id}`} style={{ marginTop: 10 }}>
                Nowa wycena dla klienta <Ico n="arrow" s={15} />
              </Link>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

/* ---------- Project ---------- */

export const newProject = (clientId?: string): Project => ({ _id: newId('project'), _type: 'panelProject', name: '', status: 'lead', client: ref(clientId) });

export function ProjectEditor({ ctx, project, isNew }: { ctx: Ctx; project: Project; isNew: boolean }) {
  const ed = useEditor(project, isNew, ctx, '/panel/projekty', (id) => `/panel/projekty/${id}`);
  const { doc: p, set, setDoc } = ed;
  const up = useUploads();
  const [names, setNames] = useState<Record<string, { name: string; url: string }>>(() =>
    Object.fromEntries((project.fileList ?? []).map((f) => [f._key, { name: f.name, url: f.url }])),
  );
  const quotes = ctx.data.panel.quotes.filter((q) => q.project?._ref === p._id);
  const files = p.files ?? [];
  return (
    <>
      <Bar back="/panel/projekty" title={p.name || 'Nowy projekt'}>
        {ed.stateView}
        <SaveBtn onClick={ed.save} saving={ed.saving} dirty={ed.dirty} disabled={!p.name} />
      </Bar>
      <div className="pa-ed single">
        <form className="pa-form" onSubmit={(e) => (e.preventDefault(), ed.save())}>
          <WriteNote data={ctx.data} />
          <fieldset className="pa-fs">
            <legend>Projekt</legend>
            <TextIn label="Nazwa" value={p.name} onChange={(v) => set('name', v)} />
            <SelectIn label="Klient" value={p.client?._ref} empty="Bez klienta" onChange={(v) => set('client', ref(v))} options={ctx.data.panel.clients.map((c) => ({ value: c._id, title: c.name }))} />
            <div className="pa-f">
              <span className="lab">Status</span>
              <Seg value={(p.status ?? 'lead') as string} onChange={(v) => set('status', v)} label="Status" options={PROJECT_STATUS} />
            </div>
            <div className="pa-row three">
              <TextIn label="Start" type="date" value={p.start} onChange={(v) => set('start', v)} />
              <TextIn label="Koniec" type="date" value={p.end} onChange={(v) => set('end', v)} />
              <TextIn label="Budżet netto (zł)" type="number" value={p.budget} onChange={(v) => set('budget', v === '' ? undefined : Number(v))} />
            </div>
            <TextIn label="Case study na stronie" hint="Adres na bartocieczek.com, np. case-kfc" value={p.caseSlug} onChange={(v) => set('caseSlug', v)} />
            <TextIn label="Notatki" area rows={6} value={p.notes} onChange={(v) => set('notes', v)} />
          </fieldset>
          <fieldset className="pa-fs">
            <legend>Pliki</legend>
            <p className="hint">Brief, umowa, specyfikacja. Do 4 MB na plik.</p>
            <Drop accept="*" multiple title="Dodaj pliki" hint="Przeciągnij albo kliknij" disabled={!ctx.data.canWrite} onFiles={(f) => up.run(f, (u) => {
              const fr = fileOf(u.ref);
              setNames((n) => ({ ...n, [fr._key!]: { name: u.name, url: u.url } }));
              setDoc((d) => ({ ...d, files: [...(d.files ?? []), fr] }));
            })} />
            {up.view}
            {files.length > 0 && (
              <div className="pa-files">
                {files.map((f) => (
                  <div key={f._key}>
                    <a href={names[f._key!]?.url} target="_blank" rel="noopener">
                      {names[f._key!]?.name ?? 'Plik'}
                    </a>
                    <button type="button" className="pa-ic" aria-label="Usuń plik" onClick={() => set('files', files.filter((x) => x._key !== f._key))}>
                      <Ico n="trash" s={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </fieldset>
          {!isNew && (
            <div style={{ paddingTop: 12, borderTop: '1px solid #e6e6e6' }}>
              <DeleteBtn what="projekt" onConfirm={ed.remove} />
            </div>
          )}
        </form>
        <aside className="pa-side2">
          <div className="pa-box">
            <h3>Wyceny</h3>
            {quotes.length ? quotes.map((q) => {
              const t = quoteTotals(q);
              return (
                <Link key={q._id} className="ln" to={`/panel/wyceny/${q._id}`}>
                  <span>{q.title}</span>
                  <span style={{ color: '#525252', whiteSpace: 'nowrap' }}>{t.rate ? range(t.all[0] * t.rate, t.all[1] * t.rate, 'zł') : label(QUOTE_STATUS, q.status)}</span>
                </Link>
              );
            }) : <p className="pa-sub" style={{ margin: 0 }}>Brak wycen.</p>}
            {!isNew && (
              <Link className="pa-more" to={`/panel/wyceny/nowa?projekt=${p._id}${p.client?._ref ? `&klient=${p.client._ref}` : ''}`} style={{ marginTop: 10 }}>
                Nowa wycena dla projektu <Ico n="arrow" s={15} />
              </Link>
            )}
          </div>
          {p.caseSlug && (
            <a className="pa-btn ghost" href={`https://bartocieczek.com/${p.caseSlug}`} target="_blank" rel="noopener">
              Case study na stronie <Ico n="out" s={15} />
            </a>
          )}
        </aside>
      </div>
    </>
  );
}

/* ---------- Material ---------- */

export const newMaterial = (): Material => ({ _id: newId('material'), _type: 'caseMaterial', title: '', status: 'new', images: [], results: [] });

export function MaterialEditor({ ctx, material, isNew }: { ctx: Ctx; material: Material; isNew: boolean }) {
  const ed = useEditor(material, isNew, ctx, '/panel/materialy', (id) => `/panel/materialy/${id}`);
  const { doc: m, set, setDoc } = ed;
  const up = useUploads();
  const upCover = useUploads();
  const upVid = useUploads();
  const [vidNames, setVidNames] = useState<Record<string, { name: string; url: string }>>(() =>
    Object.fromEntries((material.videoList ?? []).map((f) => [f._key, { name: f.name, url: f.url }])),
  );
  const images = m.images ?? [];
  const cover = imgUrl(m.cover, 240, 300);
  const videos = m.videos ?? [];
  return (
    <>
      <Bar back="/panel/materialy" title={m.title || 'Nowe materiały'}>
        {ed.stateView}
        <SaveBtn onClick={ed.save} saving={ed.saving} dirty={ed.dirty} disabled={!m.title || up.busy || upCover.busy || upVid.busy} />
      </Bar>
      <div className="pa-ed single">
        <form className="pa-form" onSubmit={(e) => (e.preventDefault(), ed.save())}>
          <WriteNote data={ctx.data} />
          <fieldset className="pa-fs">
            <legend>Projekt</legend>
            <TextIn label="Nazwa na stronie" value={m.title} onChange={(v) => set('title', v)} placeholder="Comfy AI" />
            <div className="pa-row three">
              <TextIn label="Klient" value={m.client} onChange={(v) => set('client', v)} />
              <TextIn label="Rok" value={m.year} onChange={(v) => set('year', v)} />
              <TextIn label="Link do realizacji" type="url" value={m.liveUrl} onChange={(v) => set('liveUrl', v)} placeholder="https://" />
            </div>
            <TextIn label="Zakres usług" value={m.services} onChange={(v) => set('services', v)} placeholder="Art Direction, UX/UI Design" />
          </fieldset>

          <fieldset className="pa-fs">
            <legend>Okładka</legend>
            <div className="pa-cover">
              <div className="im">{cover && <img src={cover} alt="" />}</div>
              <div>
                <Drop accept="image/*" title={cover ? 'Zmień okładkę' : 'Dodaj okładkę'} hint="Pion 4:5, jak na stronie głównej" disabled={!ctx.data.canWrite} onFiles={(f) => upCover.run(f.slice(0, 1), (u) => set('cover', imageOf(u.ref)))} />
                {upCover.view}
              </div>
            </div>
          </fieldset>

          <fieldset className="pa-fs">
            <legend>Zdjęcia i ekrany</legend>
            <p className="hint">W kolejności, w jakiej mają być na stronie. Duże zdjęcia zmniejszam przed wysłaniem.</p>
            <Drop accept="image/*" multiple title="Dodaj zdjęcia" hint="Przeciągnij kilka naraz albo kliknij" disabled={!ctx.data.canWrite} onFiles={(f) => up.run(f, (u) => setDoc((d) => ({ ...d, images: [...(d.images ?? []), imageOf(u.ref)] })))} />
            {up.view}
            {images.length > 0 && (
              <div className="pa-thumbs">
                {images.map((im, i) => (
                  <div className="pa-th" key={im._key ?? i}>
                    <div className="im">
                      <img src={imgUrl(im, 320, 240)} alt={im.caption ?? ''} loading="lazy" />
                      {m.cover?.asset._ref === im.asset._ref && (
                        <span className="tag">
                          <Pill text="Okładka" onImg />
                        </span>
                      )}
                    </div>
                    <div className="ops">
                      <span style={{ display: 'flex' }}>
                        <button type="button" className="pa-ic" aria-label="W lewo" disabled={i === 0} onClick={() => set('images', move(images, i, -1))}>
                          <Ico n="left" s={15} />
                        </button>
                        <button type="button" className="pa-ic" aria-label="W prawo" disabled={i === images.length - 1} onClick={() => set('images', move(images, i, 1))}>
                          <Ico n="right" s={15} />
                        </button>
                      </span>
                      <span style={{ display: 'flex' }}>
                        <button type="button" className="pa-ic" aria-label="Ustaw jako okładkę" title="Ustaw jako okładkę" onClick={() => set('cover', imageOf(im.asset._ref))}>
                          <Ico n="star" s={15} />
                        </button>
                        <button type="button" className="pa-ic" aria-label="Usuń zdjęcie" onClick={() => set('images', images.filter((_, j) => j !== i))}>
                          <Ico n="trash" s={15} />
                        </button>
                      </span>
                    </div>
                    <input aria-label="Podpis" placeholder="Podpis" value={im.caption ?? ''} onChange={(e) => set('images', images.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} />
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="pa-fs">
            <legend>Wideo</legend>
            <p className="hint">Krótkie pliki do 4 MB albo linki do większych (Vimeo, YouTube, dysk).</p>
            <Drop accept="video/*" multiple title="Dodaj wideo" hint="Do 4 MB na plik" disabled={!ctx.data.canWrite} onFiles={(f) => upVid.run(f, (u) => {
              const fr = fileOf(u.ref);
              setVidNames((n) => ({ ...n, [fr._key!]: { name: u.name, url: u.url } }));
              setDoc((d) => ({ ...d, videos: [...(d.videos ?? []), fr] }));
            })} />
            {upVid.view}
            {videos.length > 0 && (
              <div className="pa-files">
                {videos.map((v) => (
                  <div key={v._key}>
                    <a href={vidNames[v._key!]?.url} target="_blank" rel="noopener">
                      {vidNames[v._key!]?.name ?? 'Wideo'}
                    </a>
                    <button type="button" className="pa-ic" aria-label="Usuń wideo" onClick={() => set('videos', videos.filter((x) => x._key !== v._key))}>
                      <Ico n="trash" s={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <ListIn label="Linki do wideo" value={m.videoLinks} onChange={(v) => set('videoLinks', v)} placeholder="https://vimeo.com/…" addText="Dodaj link" />
            </div>
          </fieldset>

          <fieldset className="pa-fs">
            <legend>Opowieść</legend>
            <TextIn label="O projekcie" hint="Problem, co zrobiłeś, efekt. Wystarczą notatki, ułożę z tego tekst." area rows={8} value={m.story} onChange={(v) => set('story', v)} />
            <ListIn label="Liczby i rezultaty" value={m.results} onChange={(v) => set('results', v)} placeholder="+100% konwersji" addText="Dodaj rezultat" />
            <TextIn label="Uwagi dla Claude" hint="Kolejność, co wyróżnić, czego nie pokazywać." area rows={3} value={m.forClaude} onChange={(v) => set('forClaude', v)} />
          </fieldset>
          {!isNew && (
            <div style={{ paddingTop: 12, borderTop: '1px solid #e6e6e6' }}>
              <DeleteBtn what="materiały" onConfirm={ed.remove} />
            </div>
          )}
        </form>
        <aside className="pa-side2">
          <div className="pa-box">
            <h3>Status</h3>
            <div className="pa-list">
              {MATERIAL_STATUS.map((s) => (
                <label key={s.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" name="mstatus" checked={(m.status ?? 'new') === s.value} onChange={() => set('status', s.value)} style={{ accentColor: '#111' }} />
                  {s.title}
                </label>
              ))}
            </div>
            <p className="pa-sub" style={{ margin: '10px 0 0', fontSize: 13 }}>Gdy wszystko jest wrzucone, ustaw „Gotowe dla Claude” i napisz mi w czacie.</p>
          </div>
          <div className="pa-box">
            <h3>Podsumowanie</h3>
            <p className="pa-sub" style={{ margin: 0 }}>
              {images.length} {images.length === 1 ? 'zdjęcie' : 'zdjęć'} · {videos.length + (m.videoLinks?.length ?? 0)} wideo{m.cover ? ' · okładka' : ' · bez okładki'}
            </p>
            {m.siteSlug && (
              <a className="pa-more" href={`https://bartocieczek.com/${m.siteSlug}`} target="_blank" rel="noopener" style={{ marginTop: 10 }}>
                Case study na stronie <Ico n="out" s={15} />
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

