import { defineArrayMember, defineField, defineType } from 'sanity';
import { UsersIcon } from '@sanity/icons/Users';
import { CaseIcon } from '@sanity/icons/Case';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { ImagesIcon } from '@sanity/icons/Images';
import { DEFAULT_STEPS } from '../lib/quote-render';

const token = () => {
  const a = new Uint8Array(18);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
};
const key = () => Math.random().toString(36).slice(2, 10);

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
const label = (list: { title: string; value: string }[], v?: string) => list.find((s) => s.value === v)?.title ?? '';

export const client = defineType({
  name: 'client',
  title: 'Klient',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({ name: 'name', title: 'Nazwa', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'contact', title: 'Osoba kontaktowa', type: 'string' }),
    defineField({ name: 'email', title: 'E-mail', type: 'string' }),
    defineField({ name: 'phone', title: 'Telefon', type: 'string' }),
    defineField({ name: 'website', title: 'Strona', type: 'url' }),
    defineField({ name: 'logo', title: 'Logo', type: 'image' }),
    defineField({ name: 'notes', title: 'Notatki', type: 'text', rows: 4 }),
  ],
  preview: { select: { title: 'name', subtitle: 'contact', media: 'logo' } },
});

export const panelProject = defineType({
  name: 'panelProject',
  title: 'Projekt',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({ name: 'name', title: 'Nazwa', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'client', title: 'Klient', type: 'reference', to: [{ type: 'client' }] }),
    defineField({ name: 'status', title: 'Status', type: 'string', options: { list: PROJECT_STATUS, layout: 'radio', direction: 'horizontal' }, initialValue: 'lead' }),
    defineField({ name: 'start', title: 'Start', type: 'date' }),
    defineField({ name: 'end', title: 'Koniec', type: 'date' }),
    defineField({ name: 'budget', title: 'Budżet netto (PLN)', type: 'number' }),
    defineField({ name: 'caseSlug', title: 'Case study na stronie', description: 'Adres na bartocieczek.com, np. case-kfc', type: 'string' }),
    defineField({ name: 'notes', title: 'Notatki', type: 'text', rows: 6 }),
    defineField({ name: 'files', title: 'Pliki', type: 'array', of: [defineArrayMember({ type: 'file' })] }),
  ],
  preview: {
    select: { title: 'name', client: 'client.name', status: 'status' },
    prepare: ({ title, client, status }) => ({ title, subtitle: [client, label(PROJECT_STATUS, status)].filter(Boolean).join(' · ') }),
  },
});

export const quote = defineType({
  name: 'quote',
  title: 'Wycena',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    { name: 'main', title: 'Podstawowe', default: true },
    { name: 'content', title: 'Treść' },
    { name: 'hours', title: 'Godziny' },
    { name: 'internal', title: 'Wewnętrzne' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Tytuł', description: 'Nagłówek wyceny, np. „Projekt UI aplikacji multimedialnych”.', type: 'string', group: 'main', validation: (r) => r.required() }),
    defineField({ name: 'eyebrow', title: 'Nad tytułem', description: 'Np. „Muzeum Wojska Polskiego · Moduł M1”.', type: 'string', group: 'main' }),
    defineField({ name: 'client', title: 'Klient', type: 'reference', to: [{ type: 'client' }], group: 'main' }),
    defineField({ name: 'project', title: 'Projekt', type: 'reference', to: [{ type: 'panelProject' }], group: 'main' }),
    defineField({ name: 'status', title: 'Status', type: 'string', options: { list: QUOTE_STATUS, layout: 'radio', direction: 'horizontal' }, initialValue: 'draft', group: 'main' }),
    defineField({ name: 'issuedAt', title: 'Data', type: 'date', initialValue: () => new Date().toISOString().slice(0, 10), group: 'main' }),
    defineField({ name: 'rate', title: 'Stawka netto (zł/h)', type: 'number', initialValue: 150, group: 'main' }),
    defineField({ name: 'stat2Value', title: 'Środkowa statystyka', description: 'Np. „13 aplikacji”. Puste = liczba pozycji.', type: 'string', group: 'main' }),
    defineField({ name: 'stat2Label', title: 'Podpis statystyki', description: 'Np. „10 historycznych, 2 × Kampament, Artyleria”.', type: 'string', group: 'main' }),
    defineField({ name: 'goal', title: 'Cel', type: 'text', rows: 3, group: 'content' }),
    defineField({ name: 'goalSub', title: 'Cel – uzupełnienie', type: 'text', rows: 3, group: 'content' }),
    defineField({ name: 'scope', title: 'Zakres', type: 'array', of: [defineArrayMember({ type: 'string' })], group: 'content' }),
    defineField({
      name: 'steps',
      title: 'Jak pracujemy',
      type: 'array',
      group: 'content',
      initialValue: () => DEFAULT_STEPS.map((s) => ({ ...s, _key: key(), _type: 'step' })),
      of: [defineArrayMember({ type: 'object', name: 'step', fields: [defineField({ name: 'title', title: 'Etap', type: 'string' }), defineField({ name: 'text', title: 'Opis', type: 'string' })] })],
      validation: (r) => r.max(4),
    }),
    defineField({ name: 'outOfScope', title: 'Poza zakresem', type: 'array', of: [defineArrayMember({ type: 'string' })], group: 'content' }),
    defineField({ name: 'assumptions', title: 'Założenia', type: 'array', of: [defineArrayMember({ type: 'string' })], group: 'content' }),
    defineField({
      name: 'items',
      title: 'Rozbicie godzin',
      type: 'array',
      group: 'hours',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'item',
          fields: [
            defineField({ name: 'name', title: 'Pozycja', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'description', title: 'Opis', type: 'string' }),
            defineField({ name: 'min', title: 'Min h', type: 'number', validation: (r) => r.min(0) }),
            defineField({ name: 'max', title: 'Max h', type: 'number', validation: (r) => r.min(0) }),
            defineField({ name: 'group', title: 'Grupa', type: 'string', options: { list: [{ title: 'Projekt', value: 'design' }, { title: 'Przekazanie i współpraca', value: 'support' }], layout: 'radio', direction: 'horizontal' }, initialValue: 'design' }),
          ],
          preview: {
            select: { title: 'name', min: 'min', max: 'max', group: 'group' },
            prepare: ({ title, min, max, group }) => ({ title, subtitle: `${min ?? 0}–${max ?? 0} h${group === 'support' ? ' · przekazanie' : ''}` }),
          },
        }),
      ],
    }),
    defineField({ name: 'shareToken', title: 'Klucz linku', description: 'Tworzy adres publicznego linku. Zmień, żeby unieważnić stary link.', type: 'string', initialValue: token, group: 'internal' }),
    defineField({ name: 'notes', title: 'Notatki (tylko dla Ciebie)', type: 'text', rows: 5, group: 'internal' }),
  ],
  orderings: [{ title: 'Najnowsze', name: 'issuedDesc', by: [{ field: 'issuedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', client: 'client.name', status: 'status', date: 'issuedAt' },
    prepare: ({ title, client, status, date }) => ({ title, subtitle: [client, label(QUOTE_STATUS, status), date].filter(Boolean).join(' · ') }),
  },
});

export const caseMaterial = defineType({
  name: 'caseMaterial',
  title: 'Materiały do case study',
  type: 'document',
  icon: ImagesIcon,
  fields: [
    defineField({ name: 'title', title: 'Projekt', description: 'Nazwa, która ma być na stronie.', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'status', title: 'Status', type: 'string', options: { list: MATERIAL_STATUS, layout: 'radio', direction: 'horizontal' }, initialValue: 'new' }),
    defineField({ name: 'client', title: 'Klient', type: 'string' }),
    defineField({ name: 'year', title: 'Rok', type: 'string' }),
    defineField({ name: 'services', title: 'Zakres usług', description: 'Np. „Art Direction, UX/UI Design”.', type: 'string' }),
    defineField({ name: 'liveUrl', title: 'Link do realizacji', type: 'url' }),
    defineField({ name: 'story', title: 'O projekcie', description: 'Co było problemem, co zrobiłeś, jakie są efekty. Wystarczą notatki, ułożę z tego tekst.', type: 'text', rows: 8 }),
    defineField({ name: 'results', title: 'Liczby i rezultaty', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
    defineField({ name: 'cover', title: 'Okładka (4:5)', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'images',
      title: 'Zdjęcia i ekrany',
      type: 'array',
      options: { layout: 'grid' },
      of: [defineArrayMember({ type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'caption', title: 'Podpis', type: 'string' })] })],
    }),
    defineField({ name: 'videos', title: 'Wideo', type: 'array', of: [defineArrayMember({ type: 'file', options: { accept: 'video/*' } })] }),
    defineField({ name: 'forClaude', title: 'Uwagi dla Claude', description: 'Np. kolejność zdjęć, co wyróżnić, czego nie pokazywać.', type: 'text', rows: 4 }),
    defineField({ name: 'siteSlug', title: 'Adres case study', description: 'Uzupełniam, gdy case study powstanie na stronie.', type: 'string', readOnly: true }),
  ],
  preview: {
    select: { title: 'title', status: 'status', media: 'cover', year: 'year' },
    prepare: ({ title, status, media, year }) => ({ title, subtitle: [label(MATERIAL_STATUS, status), year].filter(Boolean).join(' · '), media }),
  },
});

export const panelSchema = [client, panelProject, quote, caseMaterial];
