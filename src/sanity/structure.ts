import type { StructureResolver } from 'sanity/structure';
import { CogIcon } from '@sanity/icons/Cog';
import { HomeIcon } from '@sanity/icons/Home';
import { UserIcon } from '@sanity/icons/User';

export const singletonTypes = new Set(['siteSettings', 'homePage', 'aboutPage']);

const singleton = (S: Parameters<StructureResolver>[0], type: string, title: string, icon: typeof CogIcon) =>
  S.listItem().title(title).icon(icon).id(type).child(S.document().schemaType(type).documentId(type).title(title));

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      singleton(S, 'homePage', 'Home page', HomeIcon),
      singleton(S, 'aboutPage', 'About page', UserIcon),
      S.divider(),
      S.documentTypeListItem('project').title('Case studies'),
      S.divider(),
      singleton(S, 'siteSettings', 'Site settings', CogIcon),
    ]);
