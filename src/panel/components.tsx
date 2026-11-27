import { useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Card, Flex, Grid, Heading, Spinner, Stack, Text } from '@sanity/ui';
import { AddIcon } from '@sanity/icons/Add';
import { CopyIcon } from '@sanity/icons/Copy';
import { LaunchIcon } from '@sanity/icons/Launch';
import { EditIcon } from '@sanity/icons/Edit';
import { useClient, useCurrentUser, type LayoutProps } from 'sanity';
import { createImageUrlBuilder } from '@sanity/image-url';
import { MARK_PATH_D, quoteTotals, renderQuoteHtml, type QuoteData } from '../lib/quote-render';
import { MATERIAL_STATUS, PROJECT_STATUS, QUOTE_STATUS } from './schema';

const API = '2026-11-01';
const SITE = 'https://bartocieczek.com';
const STAGE = 'https://portfolio-git-panel-sa-aa04.vercel.app';
const pl = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const label = (list: { title: string; value: string }[], v?: string) => list.find((s) => s.value === v)?.title ?? '';
const tone = (v?: string) =>
  ({ accepted: 'positive', published: 'positive', active: 'positive', sent: 'primary', ready: 'primary', drafted: 'caution', quote: 'caution', rejected: 'critical' })[v ?? ''] as
    | 'positive'
    | 'primary'
    | 'caution'
    | 'critical'
    | undefined;
const go = (path: string) => `/studio/${path}`;
const editUrl = (ws: string, id: string, type: string) => go(`${ws}/intent/edit/id=${id.replace(/^drafts\./, '')};type=${type}/`);
const createUrl = (type: string) => go(`panel/intent/create/template=${type};type=${type}/`);

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
[data-ui="Heading"]{letter-spacing:-.03em}
`;

export function BrandLayout(props: LayoutProps) {
  return (
    <>
      <style>{FONT_CSS}</style>
      {props.renderDefault(props)}
    </>
  );
}

/* ---------- small pieces ---------- */

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

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Stack space={3}>
      <Flex align="center" justify="space-between" gap={3}>
        <Text size={1} weight="medium" muted>
          {title}
        </Text>
        {action}
      </Flex>
      {children}
    </Stack>
  );
}

function Stat({ value, label: l }: { value: React.ReactNode; label: string }) {
  return (
    <Card padding={4} radius={4} border>
      <Stack space={3}>
        <Heading size={3}>{value}</Heading>
        <Text size={1} muted>
          {l}
        </Text>
      </Stack>
    </Card>
  );
}

function Row({ href, title, meta, badge, badgeTone, media, external }: { href: string; title: string; meta?: string; badge?: string; badgeTone?: ReturnType<typeof tone>; media?: string; external?: boolean }) {
  return (
    <Card as="a" href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener' : undefined} padding={3} radius={3} tone="inherit" style={{ textDecoration: 'none' }} data-as="a">
      <Flex align="center" gap={3}>
        {media !== undefined &&
          (media ? (
            <img src={media} alt="" width={40} height={50} style={{ borderRadius: 8, objectFit: 'cover', flex: 'none' }} />
          ) : (
            <Box style={{ width: 40, height: 50, borderRadius: 8, background: 'var(--card-muted-bg-color, #f3f3f3)', flex: 'none' }} />
          ))}
        <Stack space={2} flex={1}>
          <Text size={2} weight="medium" textOverflow="ellipsis">
            {title}
          </Text>
          {meta && (
            <Text size={1} muted textOverflow="ellipsis">
              {meta}
            </Text>
          )}
        </Stack>
        {badge && (
          <Badge tone={badgeTone} padding={2} radius={2}>
            {badge}
          </Badge>
        )}
      </Flex>
    </Card>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <Card padding={4} radius={3} border tone="transparent">
    <Text size={1} muted>
      {children}
    </Text>
  </Card>
);

/* ---------- Pulpit ---------- */

type Dash = {
  quotes: (QuoteData & { _id: string; status?: string; client?: string })[];
  materials: { _id: string; title: string; status?: string; year?: string; cover?: unknown; count: number }[];
  projects: { _id: string; name: string; status?: string; client?: string; end?: string }[];
  clients: number;
};
type SiteData = { order: string[] | null; projects: { _id: string; title: string; cardTitle?: string; year?: string; slug?: string; cover?: unknown; _updatedAt: string }[] };

const DASH_Q = `{
  "quotes": *[_type == "quote"] | order(coalesce(issuedAt, _createdAt) desc){_id, title, status, issuedAt, rate, items[]{min, max, group}, "client": client->name},
  "materials": *[_type == "caseMaterial"] | order(_updatedAt desc){_id, title, status, year, cover, "count": count(images)},
  "projects": *[_type == "panelProject"] | order(_updatedAt desc){_id, name, status, end, "client": client->name},
  "clients": count(*[_type == "client"])
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
    return data.projects
      .map((p) => {
        const id = p._id.replace(/^drafts\./, '');
        const isDraft = p._id.startsWith('drafts.');
        return { ...p, id, isDraft, onHome: order.includes(id), pos: order.indexOf(id) };
      })
      .sort((a, b) => (a.onHome === b.onHome ? (a.onHome ? a.pos - b.pos : b._updatedAt.localeCompare(a._updatedAt)) : a.onHome ? -1 : 1));
  }, [data]);
  // biome-ignore lint/suspicious/noExplicitAny: Sanity image source
  const thumb = (src: any) => (src?.asset ? img.image(src).width(80).height(100).fit('crop').auto('format').url() : '');
  return { projects, thumb, error, loading: !data && !error };
}

export function Dashboard() {
  const user = useCurrentUser();
  const { data, error } = useQuery<Dash>(DASH_Q);
  const site = useSite();
  const pimg = useMemo(() => createImageUrlBuilder({ projectId: 'jf65lv25', dataset: 'panel' }), []);

  if (error) return <Box padding={5}><Text>Nie udało się wczytać danych: {error}</Text></Box>;
  if (!data) return <Flex padding={6} justify="center"><Spinner muted /></Flex>;

  const open = data.quotes.filter((q) => q.status === 'draft' || q.status === 'sent');
  const openValue = open.reduce((s, q) => {
    const t = quoteTotals(q);
    return [s[0] + t.all[0] * t.rate, s[1] + t.all[1] * t.rate];
  }, [0, 0]);
  const fresh = data.materials.filter((m) => m.status === 'new' || m.status === 'ready');
  const active = data.projects.filter((p) => p.status === 'active');
  const live = site.projects.filter((p) => !p.isDraft && p.onHome);
  const first = user?.name?.split(' ')[0];

  return (
    <Box padding={[4, 5, 6]} style={{ maxWidth: 1180, margin: '0 auto' }}>
      <Stack space={6}>
        <Flex align={['flex-start', 'center']} justify="space-between" gap={4} wrap="wrap">
          <Flex align="center" gap={3}>
            <Mark size={36} />
            <Stack space={2}>
              <Heading size={4} as="h1">
                {first ? `Cześć, ${first}` : 'Panel'}
              </Heading>
              <Text size={1} muted>
                Wyceny, projekty i materiały do strony w jednym miejscu.
              </Text>
            </Stack>
          </Flex>
          <Flex gap={2} wrap="wrap">
            <Button as="a" href={createUrl('quote')} icon={AddIcon} text="Nowa wycena" tone="primary" mode="default" />
            <Button as="a" href={createUrl('caseMaterial')} icon={AddIcon} text="Materiały do case study" mode="ghost" />
          </Flex>
        </Flex>

        <Grid columns={[1, 2, 4]} gap={3}>
          <Stat value={open.length} label={open.length ? `otwarte wyceny · ${pl(openValue[0])}–${pl(openValue[1])} zł` : 'otwartych wycen'} />
          <Stat value={active.length} label="projektów w realizacji" />
          <Stat value={fresh.length} label="materiałów czeka na case study" />
          <Stat value={site.loading ? '…' : live.length} label="case studies na stronie" />
        </Grid>

        <Grid columns={[1, 1, 2]} gap={5}>
          <Section title="Wyceny" action={<Button as="a" href={go('panel/structure/quote')} text="Wszystkie" mode="bleed" fontSize={1} />}>
            <Stack space={1}>
              {data.quotes.length ? (
                data.quotes.slice(0, 6).map((q) => {
                  const t = quoteTotals(q);
                  return (
                    <Row
                      key={q._id}
                      href={editUrl('panel', q._id, 'quote')}
                      title={q.title || 'Bez tytułu'}
                      meta={[q.client, t.rate && t.all[1] ? `${pl(t.all[0] * t.rate)}–${pl(t.all[1] * t.rate)} zł` : '', q.issuedAt].filter(Boolean).join(' · ')}
                      badge={label(QUOTE_STATUS, q.status)}
                      badgeTone={tone(q.status)}
                    />
                  );
                })
              ) : (
                <Empty>Nie masz jeszcze wycen.</Empty>
              )}
            </Stack>
          </Section>

          <Section title="Materiały do case study" action={<Button as="a" href={go('panel/structure/caseMaterial')} text="Wszystkie" mode="bleed" fontSize={1} />}>
            <Stack space={1}>
              {data.materials.length ? (
                data.materials.slice(0, 6).map((m) => (
                  <Row
                    key={m._id}
                    href={editUrl('panel', m._id, 'caseMaterial')}
                    title={m.title || 'Bez nazwy'}
                    // biome-ignore lint/suspicious/noExplicitAny: Sanity image source
                    media={(m.cover as any)?.asset ? pimg.image(m.cover as any).width(80).height(100).fit('crop').url() : ''}
                    meta={[m.year, m.count ? `${m.count} zdjęć` : 'bez zdjęć'].filter(Boolean).join(' · ')}
                    badge={label(MATERIAL_STATUS, m.status)}
                    badgeTone={tone(m.status)}
                  />
                ))
              ) : (
                <Empty>Wrzuć zdjęcia i notatki z nowego projektu, a zrobię z nich case study.</Empty>
              )}
            </Stack>
          </Section>

          <Section title="Projekty" action={<Button as="a" href={go('panel/structure/panelProject')} text="Wszystkie" mode="bleed" fontSize={1} />}>
            <Stack space={1}>
              {data.projects.length ? (
                data.projects.slice(0, 6).map((p) => (
                  <Row key={p._id} href={editUrl('panel', p._id, 'panelProject')} title={p.name} meta={[p.client, p.end && `do ${p.end}`].filter(Boolean).join(' · ')} badge={label(PROJECT_STATUS, p.status)} badgeTone={tone(p.status)} />
                ))
              ) : (
                <Empty>Brak projektów. Klienci: {data.clients}.</Empty>
              )}
            </Stack>
          </Section>

          <Section title="Strona" action={<Button as="a" href={go('panel/strona')} text="Szczegóły" mode="bleed" fontSize={1} />}>
            <Stack space={1}>
              <Row href={SITE} external title="bartocieczek.com" meta="Wersja live" badge="Live" badgeTone="positive" />
              <Row href={STAGE} external title="Stage" meta="Zmiany przed wypuszczeniem" badge="Stage" badgeTone="caution" />
              <Row href={go('strona/structure')} title="Edytuj treści strony" meta="Strona główna, about, case studies" />
            </Stack>
          </Section>
        </Grid>
      </Stack>
    </Box>
  );
}

/* ---------- Strona ---------- */

export function SiteTool() {
  const { projects, thumb, error, loading } = useSite();
  return (
    <Box padding={[4, 5, 6]} style={{ maxWidth: 1180, margin: '0 auto' }}>
      <Stack space={5}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Stack space={2}>
            <Heading size={4} as="h1">
              Strona
            </Heading>
            <Text size={1} muted>
              Case studies w kolejności ze strony głównej. Treści edytujesz w obszarze „Strona”.
            </Text>
          </Stack>
          <Flex gap={2} wrap="wrap">
            <Button as="a" href={SITE} target="_blank" rel="noopener" icon={LaunchIcon} text="Live" mode="ghost" />
            <Button as="a" href={STAGE} target="_blank" rel="noopener" icon={LaunchIcon} text="Stage" mode="ghost" />
            <Button as="a" href={go('strona/structure')} icon={EditIcon} text="Edytuj stronę" tone="primary" />
          </Flex>
        </Flex>
        {error && <Text>Nie udało się wczytać strony: {error}</Text>}
        {loading && <Spinner muted />}
        <Grid columns={[1, 1, 2]} gap={2}>
          {projects.map((p) => (
            <Card key={p._id} radius={4} border padding={2}>
              <Flex gap={3} align="center">
                {thumb(p.cover) ? <img src={thumb(p.cover)} alt="" width={64} height={80} style={{ borderRadius: 10, objectFit: 'cover' }} /> : <Box style={{ width: 64, height: 80, borderRadius: 10, background: '#f3f3f3' }} />}
                <Stack space={2} flex={1}>
                  <Text size={2} weight="medium" textOverflow="ellipsis">
                    {p.cardTitle || p.title}
                  </Text>
                  <Text size={1} muted>
                    {[p.year, p.slug && `/${p.slug}`].filter(Boolean).join(' · ')}
                  </Text>
                  <Flex gap={1} wrap="wrap">
                    <Badge tone={p.isDraft ? 'caution' : 'positive'}>{p.isDraft ? 'Szkic' : 'Opublikowane'}</Badge>
                    <Badge tone={p.onHome ? 'primary' : 'default'}>{p.onHome ? `Na głównej #${p.pos + 1}` : 'Poza główną'}</Badge>
                  </Flex>
                </Stack>
                <Flex direction="column" gap={1}>
                  <Button as="a" href={editUrl('strona', p._id, 'project')} icon={EditIcon} mode="bleed" title="Edytuj" />
                  {p.slug && !p.isDraft && <Button as="a" href={`${SITE}/${p.slug}`} target="_blank" rel="noopener" icon={LaunchIcon} mode="bleed" title="Otwórz na stronie" />}
                </Flex>
              </Flex>
            </Card>
          ))}
        </Grid>
      </Stack>
    </Box>
  );
}

/* ---------- Podgląd wyceny ---------- */

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
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <Flex direction="column" style={{ height: '100%' }}>
      <Card padding={3} borderBottom>
        <Flex align="center" gap={2} wrap="wrap">
          <Box flex={1}>
            <Text size={1} muted textOverflow="ellipsis">
              {!url ? 'Brak klucza linku: uzupełnij go w zakładce „Wewnętrzne”.' : published ? url : 'Link zadziała po opublikowaniu wyceny.'}
            </Text>
          </Box>
          <Button icon={CopyIcon} text={copied ? 'Skopiowano' : 'Kopiuj link'} mode="ghost" disabled={!url} onClick={copy} />
          <Button as="a" href={url || undefined} target="_blank" rel="noopener" icon={LaunchIcon} text="Otwórz" mode="ghost" disabled={!url || !published} />
        </Flex>
      </Card>
      <Box flex={1} style={{ minHeight: 0 }}>
        <iframe title="Podgląd wyceny" srcDoc={html} style={{ border: 0, width: '100%', height: '100%', display: 'block', background: '#fff' }} />
      </Box>
    </Flex>
  );
}
