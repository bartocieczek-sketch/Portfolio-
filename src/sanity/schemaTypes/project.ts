import { defineArrayMember, defineField, defineType } from 'sanity';
import { ProjectsIcon } from '@sanity/icons/Projects';

export const project = defineType({
  name: 'project',
  title: 'Case study',
  type: 'document',
  icon: ProjectsIcon,
  groups: [
    { name: 'card', title: 'Home page card', default: true },
    { name: 'page', title: 'Case study page' },
  ],
  fields: [
    defineField({ name: 'title', description: 'Heading on the case study page.', type: 'string', group: ['card', 'page'], validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      description: 'Page address, e.g. "case-kfc" becomes /case-kfc.',
      type: 'slug',
      group: 'page',
      options: { source: 'title', slugify: (input) => `case-${input.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40)}` },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'cardTitle', description: 'Name shown on the home page card. Falls back to the title.', type: 'string', group: 'card' }),
    defineField({ name: 'year', type: 'string', group: 'card' }),
    defineField({ name: 'cardTags', title: 'Card tags', description: 'Lines shown at the bottom of the card on hover.', type: 'array', of: [defineArrayMember({ type: 'string' })], group: 'card' }),
    defineField({ name: 'cover', description: 'Card image (portrait, about 4:5).', type: 'image', options: { hotspot: true }, group: 'card', validation: (rule) => rule.required() }),
    defineField({
      name: 'intro',
      description: 'The first paragraph is shown brighter than the rest.',
      type: 'array',
      of: [defineArrayMember({ type: 'block', styles: [{ title: 'Normal', value: 'normal' }], lists: [], marks: { decorators: [{ title: 'Bold', value: 'strong' }], annotations: [] } })],
      group: 'page',
    }),
    defineField({ name: 'liveUrl', title: 'Live site URL', description: 'Leave empty to hide the "Visit live" button.', type: 'url', group: 'page' }),
    defineField({ name: 'client', type: 'string', group: 'page' }),
    defineField({ name: 'services', type: 'string', group: 'page' }),
    defineField({ name: 'credits', type: 'string', group: 'page' }),
    defineField({
      name: 'results',
      description: 'Measurable outcomes, shown large under the cover (e.g. +21% conversions). Leave empty to hide.',
      type: 'array',
      of: [defineArrayMember({ type: 'stat' })],
      validation: (rule) => rule.max(4),
      group: 'page',
    }),
    defineField({ name: 'yearLabel', title: 'Year (page)', description: 'e.g. 2025-2026 or COMING 2026', type: 'string', group: 'page' }),
    defineField({ name: 'gallery', type: 'array', of: [defineArrayMember({ type: 'media' })], group: 'page' }),
  ],
  preview: {
    select: { title: 'cardTitle', fallback: 'title', subtitle: 'year', media: 'cover' },
    prepare: ({ title, fallback, subtitle, media }) => ({ title: title || fallback, subtitle, media }),
  },
});
