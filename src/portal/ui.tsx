import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MARK_PATH_D, renderQuoteHtml } from '../lib/quote-render';
import { upload, type Quote } from './api';

/* ---------- routing ---------- */

export const NavCtx = createContext<(to: string) => void>(() => {});
export const useNav = () => useContext(NavCtx);

export function Link({ to, className, children, ...rest }: { to: string; className?: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const nav = useNav();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || to.startsWith('http')) return;
        e.preventDefault();
        nav(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/* ---------- helpers ---------- */

export const pl = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const range = (a: number, b: number, u: string) => (a === b ? `${pl(a)} ${u}` : `${pl(a)}–${pl(b)} ${u}`);
const MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
export const shortDate = (iso?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}${y !== new Date().getFullYear() ? ` ${y}` : ''}`;
};
export const plural = (n: number, one: string, few: string, many: string) => {
  const t = n % 10, h = n % 100;
  return n === 1 ? one : t >= 2 && t <= 4 && !(h >= 12 && h <= 14) ? few : many;
};
export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
export const label = (list: { title: string; value: string }[], v?: string) => list.find((s) => s.value === v)?.title ?? '';

export const QUOTE_STATUS = [
  { title: 'Szkic', value: 'draft' },
  { title: 'Wysłana', value: 'sent' },
  { title: 'Zaakceptowana', value: 'accepted' },
  { title: 'Odrzucona', value: 'rejected' },
];
export const PROJECT_STATUS = [
  { title: 'Rozmowa', value: 'lead' },
  { title: 'Wycena', value: 'quote' },
  { title: 'W realizacji', value: 'active' },
  { title: 'Zakończony', value: 'done' },
];
export const MATERIAL_STATUS = [
  { title: 'Nowe', value: 'new' },
  { title: 'Gotowe dla Claude', value: 'ready' },
  { title: 'Szkic na stronie', value: 'drafted' },
  { title: 'Opublikowane', value: 'published' },
];

/* ---------- icons ---------- */

const P = {
  overview: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  quote: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/>',
  project: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M9 6V4h6v2"/>',
  client: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  site: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  material: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5-11 11"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  out: '<path d="M7 17L17 7M9 7h8v8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  wait: '<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  left: '<path d="M15 6l-6 6 6 6"/>',
  right: '<path d="M9 6l6 6-6 6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  upload: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
  logout: '<path d="M15 4h4v16h-4M10 12h10M6 8l-4 4 4 4"/>',
  file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
};
export type IconName = keyof typeof P;
export const Ico = ({ n, s = 18 }: { n: IconName; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: P[n] }} />
);
export const Mark = ({ size = 28 }: { size?: number }) => (
  <svg viewBox="28 -1483 1749 1507" width={size} height={(size * 1507) / 1749} aria-hidden="true" style={{ display: 'block' }}>
    <path transform="scale(1,-1)" d={MARK_PATH_D} fill="currentColor" />
  </svg>
);

/* ---------- display ---------- */

export function Pill({ list, value, text, onImg }: { list?: { title: string; value: string }[]; value?: string; text?: string; onImg?: boolean }) {
  const t = text ?? (list ? label(list, value) : '');
  if (!t) return null;
  return (
    <span className={`pa-pill${onImg ? ' onimg' : ''}`} data-s={value}>
      {t}
    </span>
  );
}

/** A small, scaled live render of the quote, like a screen preview. */
export function QuoteThumb({ q, clientName }: { q: Quote; clientName?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale((el.clientWidth * 0.82) / 1280));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const html = useMemo(() => renderQuoteHtml({ ...q, clientName }, location.origin).replace('<body>', '<body style="overflow:hidden">'), [q, clientName]);
  return (
    <div className="pa-pv" ref={box}>
      <iframe className="doc" title="" aria-hidden="true" tabIndex={-1} loading="lazy" scrolling="no" srcDoc={html} style={{ transform: `translateX(-50%) scale(${scale})` }} />
    </div>
  );
}

export function Card({ to, external, preview, title, pill, desc, footL, footR }: { to: string; external?: boolean; preview: React.ReactNode; title: string; pill?: React.ReactNode; desc?: string; footL?: React.ReactNode; footR?: React.ReactNode }) {
  const inner = (
    <>
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
    </>
  );
  return external ? (
    <a className="pa-card" href={to} target="_blank" rel="noopener">
      {inner}
    </a>
  ) : (
    <Link className="pa-card" to={to}>
      {inner}
    </Link>
  );
}

export const Blank = ({ title, text, to, cta }: { title: string; text: string; to?: string; cta?: string }) => (
  <div className="pa-blank">
    <b>{title}</b>
    <p>{text}</p>
    {to && cta && (
      <Link className="pa-btn" to={to}>
        <Ico n="plus" s={16} /> {cta}
      </Link>
    )}
  </div>
);

export const Skel = ({ n = 3, tall }: { n?: number; tall?: boolean }) => (
  <div className="pa-grid three" aria-busy="true" aria-label="Wczytywanie">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className="pa-sk" style={{ aspectRatio: tall ? '4/6' : '16/14' }} />
    ))}
  </div>
);

export function Seg<T extends string>({ value, onChange, options, label: aria = 'Filtr' }: { value: T; onChange: (v: T) => void; options: { value: T; title: string; n?: number }[]; label?: string }) {
  return (
    <div className="pa-seg" role="group" aria-label={aria}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.title}
          {o.n !== undefined ? ` ${o.n}` : ''}
        </button>
      ))}
    </div>
  );
}

/* ---------- forms ---------- */

let fid = 0;
export function Field({ label: l, hint, children, id }: { label: string; hint?: string; children: (id: string) => React.ReactNode; id?: string }) {
  const [auto] = useState(() => id ?? `f${++fid}`);
  return (
    <div className="pa-f">
      <label htmlFor={auto}>{l}</label>
      {children(auto)}
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function TextIn({ label: l, hint, value, onChange, type = 'text', placeholder, area, rows }: { label: string; hint?: string; value?: string | number; onChange: (v: string) => void; type?: string; placeholder?: string; area?: boolean; rows?: number }) {
  return (
    <Field label={l} hint={hint}>
      {(id) =>
        area ? (
          <textarea id={id} className="pa-in" rows={rows ?? 4} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input id={id} className="pa-in" type={type} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        )
      }
    </Field>
  );
}

export function SelectIn({ label: l, value, onChange, options, empty }: { label: string; value?: string; onChange: (v: string) => void; options: { value: string; title: string }[]; empty?: string }) {
  return (
    <Field label={l}>
      {(id) => (
        <select id={id} className="pa-in" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {empty !== undefined && <option value="">{empty}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.title}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function move<T>(arr: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const a = [...arr];
  [a[i], a[j]] = [a[j], a[i]];
  return a;
}

/** Editable list of short texts (scope, assumptions, results). */
export function ListIn({ label: l, hint, value, onChange, placeholder, addText = 'Dodaj' }: { label: string; hint?: string; value?: string[]; onChange: (v: string[]) => void; placeholder?: string; addText?: string }) {
  const list = value ?? [];
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [focusLast, setFocusLast] = useState(false);
  useEffect(() => {
    if (focusLast) {
      refs.current[list.length - 1]?.focus();
      setFocusLast(false);
    }
  }, [focusLast, list.length]);
  return (
    <div className="pa-f">
      <span className="lab">{l}</span>
      {hint && <small style={{ marginTop: -2 }}>{hint}</small>}
      <div className="pa-list">
        {list.map((t, i) => (
          <div className="pa-li" key={i}>
            <textarea
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="pa-in"
              rows={1}
              style={{ minHeight: 40, height: 'auto', fieldSizing: 'content' } as React.CSSProperties}
              aria-label={`${l} ${i + 1}`}
              value={t}
              placeholder={placeholder}
              onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onChange([...list.slice(0, i + 1), '', ...list.slice(i + 1)]);
                  setTimeout(() => refs.current[i + 1]?.focus(), 0);
                }
              }}
            />
            <div className="ops">
              <button type="button" className="pa-ic" aria-label="W górę" disabled={i === 0} onClick={() => onChange(move(list, i, -1))}>
                <Ico n="up" s={15} />
              </button>
              <button type="button" className="pa-ic" aria-label="W dół" disabled={i === list.length - 1} onClick={() => onChange(move(list, i, 1))}>
                <Ico n="down" s={15} />
              </button>
              <button type="button" className="pa-ic" aria-label="Usuń" onClick={() => onChange(list.filter((_, j) => j !== i))}>
                <Ico n="trash" s={15} />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="pa-add"
          onClick={() => {
            onChange([...list, '']);
            setFocusLast(true);
          }}
        >
          <Ico n="plus" s={14} /> {addText}
        </button>
      </div>
    </div>
  );
}

/* ---------- uploads ---------- */

export type Uploaded = Awaited<ReturnType<typeof upload>>;

export function Drop({ accept, multiple, onFiles, title, hint, disabled }: { accept: string; multiple?: boolean; onFiles: (f: File[]) => void; title: string; hint: string; disabled?: boolean }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <label
      className="pa-drop"
      data-over={over}
      style={{ position: 'relative', display: 'block', opacity: disabled ? 0.5 : 1 }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) onFiles([...e.dataTransfer.files].filter((f) => accept.split(',').some((a) => (a.endsWith('/*') ? f.type.startsWith(a.slice(0, -1)) : f.type === a || a === '*'))));
      }}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
      <Ico n="upload" s={20} />
      <b>{title}</b>
      <span style={{ fontSize: 13 }}>{hint}</span>
    </label>
  );
}

/** Uploads files one by one and reports progress. */
export function useUploads() {
  const [items, setItems] = useState<{ name: string; state: 'wait' | 'up' | 'ok' | 'err'; msg?: string }[]>([]);
  const run = async (files: File[], onDone: (u: Uploaded) => void) => {
    const start = items.length;
    setItems((x) => [...x, ...files.map((f) => ({ name: f.name, state: 'wait' as const }))]);
    for (let i = 0; i < files.length; i++) {
      const at = start + i;
      setItems((x) => x.map((it, j) => (j === at ? { ...it, state: 'up' } : it)));
      try {
        const u = await upload(files[i]);
        onDone(u);
        setItems((x) => x.map((it, j) => (j === at ? { ...it, state: 'ok' } : it)));
      } catch (e) {
        setItems((x) => x.map((it, j) => (j === at ? { ...it, state: 'err', msg: (e as Error).message } : it)));
      }
    }
    setTimeout(() => setItems((x) => x.filter((it) => it.state === 'err')), 2500);
  };
  const view = items.length ? (
    <div className="pa-up" aria-live="polite">
      {items.map((it, i) => (
        <span key={i} data-s={it.state}>
          {it.state === 'wait' ? 'Czeka' : it.state === 'up' ? 'Wysyłam' : it.state === 'ok' ? 'Gotowe' : 'Błąd'} · {it.name}
          {it.msg ? ` · ${it.msg}` : ''}
        </span>
      ))}
    </div>
  ) : null;
  return { run, view, busy: items.some((i) => i.state === 'up' || i.state === 'wait') };
}

/* ---------- toast ---------- */

export function useToast() {
  const [t, setT] = useState<{ text: string; err?: boolean } | null>(null);
  const timer = useRef<number>();
  const show = (text: string, err = false) => {
    setT({ text, err });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setT(null), err ? 5000 : 2200);
  };
  const view = t ? (
    <div className="pa-toast" role="status" data-s={t.err ? 'err' : undefined}>
      {t.text}
    </div>
  ) : null;
  return { show, view };
}

/** Delete with a second, explicit click. */
export function DeleteBtn({ onConfirm, what }: { onConfirm: () => void; what: string }) {
  const [ask, setAsk] = useState(false);
  return ask ? (
    <span className="pa-confirm">
      Usunąć {what}?
      <button type="button" className="pa-btn danger sm" onClick={onConfirm}>
        Usuń
      </button>
      <button type="button" className="pa-btn ghost sm" onClick={() => setAsk(false)}>
        Anuluj
      </button>
    </span>
  ) : (
    <button type="button" className="pa-btn ghost sm" onClick={() => setAsk(true)}>
      <Ico n="trash" s={15} /> Usuń
    </button>
  );
}
