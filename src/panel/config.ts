import { createElement } from 'react';
import { buildLegacyTheme, type StudioTheme } from 'sanity';
import { structureTool, type StructureResolver, type DefaultDocumentNodeResolver } from 'sanity/structure';
import { DashboardIcon } from '@sanity/icons/Dashboard';
import { EarthGlobeIcon } from '@sanity/icons/EarthGlobe';
import { BrandLayout, Dashboard, Mark, QuotePreview, SiteTool } from './components';
import { panelSchema } from './schema';

/** bartocieczek.com: white, #111 ink, grey #8c8c8c, PP Neue Montreal */
export const brandTheme: StudioTheme = buildLegacyTheme({
  '--font-family-base': '"PP Neue Montreal", "Neue Montreal", "Inter", "Helvetica Neue", Arial, sans-serif',
  '--font-family-monospace': 'ui-monospace, "SF Mono", Menlo, monospace',
  '--black': '#111111',
  '--white': '#ffffff',
  '--gray': '#8c8c8c',
  '--gray-base': '#8c8c8c',
  '--brand-primary': '#111111',
  '--component-bg': '#ffffff',
  '--component-text-color': '#111111',
  '--default-button-color': '#666666',
  '--default-button-primary-color': '#111111',
  '--default-button-success-color': '#1f7a4d',
  '--default-button-warning-color': '#b7791f',
  '--default-button-danger-color': '#c53030',
  '--focus-color': '#111111',
  '--main-navigation-color': '#ffffff',
  '--main-navigation-color--inverted': '#111111',
  '--state-info-color': '#111111',
  '--state-success-color': '#1f7a4d',
  '--state-warning-color': '#b7791f',
  '--state-danger-color': '#c53030',
});

export const brandIcon = () => createElement(Mark, { size: 22 });

const panelStructure: StructureResolver = (S) =>
  S.list()
    .title('Baza')
    .items([
      S.documentTypeListItem('quote').title('Wyceny'),
      S.documentTypeListItem('panelProject').title('Projekty'),
      S.documentTypeListItem('client').title('Klienci'),
      S.divider(),
      S.documentTypeListItem('caseMaterial').title('Materiały do case study'),
    ]);

const defaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) =>
  schemaType === 'quote'
    ? S.document().views([S.view.form().title('Edycja').id('edit'), S.view.component(QuotePreview).title('Podgląd').id('preview')])
    : S.document();

export const panelWorkspace = {
  name: 'panel',
  title: 'Panel',
  subtitle: 'Wyceny, projekty, materiały',
  icon: brandIcon,
  theme: brandTheme,
  studio: { components: { layout: BrandLayout } },
  plugins: [structureTool({ title: 'Baza', structure: panelStructure, defaultDocumentNode })],
  tools: (prev: { name: string }[]) => [
    { name: 'pulpit', title: 'Pulpit', icon: DashboardIcon, component: Dashboard },
    ...prev,
    { name: 'strona', title: 'Strona', icon: EarthGlobeIcon, component: SiteTool },
  ],
  schema: { types: panelSchema },
};
