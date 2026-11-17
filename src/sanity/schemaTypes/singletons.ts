import { defineArrayMember, defineField, defineType } from 'sanity';
import { CogIcon } from '@sanity/icons/Cog';
import { HomeIcon } from '@sanity/icons/Home';
import { UserIcon } from '@sanity/icons/User';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({ name: 'name', type: 'string' }),
    defineField({ name: 'role', description: 'Shown in the footer.', type: 'string' }),
    defineField({ name: 'seoTitle', title: 'SEO title', type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3 }),
    defineField({ name: 'callUrl', title: 'Intro call link', description: 'Used by "Let\'s cooperate" and "30 min intro call".', type: 'url' }),
    defineField({ name: 'email', type: 'string' }),
    defineField({ name: 'socials', type: 'array', of: [defineArrayMember({ type: 'link' })] }),
    defineField({ name: 'footerHeadline', type: 'string' }),
    defineField({ name: 'copyright', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
});

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  icon: HomeIcon,
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'work', title: 'Work' },
    { name: 'testimonial', title: 'Testimonial' },
  ],
  fields: [
    defineField({ name: 'heroText', type: 'text', rows: 3, group: 'hero' }),
    defineField({ name: 'heroVideo', type: 'file', options: { accept: 'video/*' }, group: 'hero' }),
    defineField({ name: 'badgeLabel', type: 'string', group: 'hero' }),
    defineField({ name: 'badgeUrl', type: 'url', group: 'hero' }),
    defineField({ name: 'established', type: 'string', group: 'hero' }),
    defineField({ name: 'location', type: 'string', group: 'hero' }),
    defineField({ name: 'workHeadline', type: 'string', group: 'work' }),
    defineField({ name: 'viewAllLabel', type: 'string', group: 'work' }),
    defineField({
      name: 'projects',
      title: 'Case studies',
      description: 'Drag to reorder. Shown two per row.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'project' }] })],
      group: 'work',
    }),
    defineField({ name: 'brandsLabel', type: 'string', group: 'work' }),
    defineField({ name: 'brands', type: 'array', of: [defineArrayMember({ type: 'brand' })], group: 'work' }),
    defineField({ name: 'testimonialsHeading', type: 'string', group: 'testimonial' }),
    defineField({ name: 'testimonial', type: 'testimonial', group: 'testimonial' }),
    defineField({ name: 'ctaText', title: 'Footer text', type: 'string', group: 'testimonial' }),

  ],
  preview: { prepare: () => ({ title: 'Home page' }) },
});

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  icon: UserIcon,
  groups: [
    { name: 'page', title: 'Page', default: true },
    { name: 'services', title: 'Services' },
    { name: 'work', title: 'Experience & numbers' },
    { name: 'pulse', title: 'Pulse' },
    { name: 'hours', title: 'After hours' },
    { name: 'talk', title: 'Let’s talk & footer' },
    { name: 'old', title: 'Older fields' },
  ],
  fields: [
    defineField({ name: 'heroTitle', title: 'Hero title', type: 'string', group: 'page', placeholder: 'About me', description: 'Big blackletter title at the top (default: About me).' }),
    defineField({
      name: 'story',
      title: 'About paragraph',
      type: 'text',
      placeholder: 'Hi, I’m Bart, {photo} a designer & developer from Kraków. Senior Web Designer at GRAFIT {logo:GRAFIT}, Young Jury at Awwwards {logo:Awwwards}. Building with AI {ai}, fuelled by sport {sport} and coffee {coffee}. My pulse {pulse} proves it.',
      rows: 6,
      group: 'page',
      description: 'Tokens put a small picture in the line: {photo}, {logo:GRAFIT} (any company from Experience), {ai}, {sport}, {coffee}, {pulse}.',
    }),
    defineField({ name: 'servicesIntro', title: 'Services intro', type: 'text', rows: 3, group: 'services', placeholder: 'I design and build websites and digital products end to end, from the first idea and the look of it to the shipped, fast, animated page.' }),
    defineField({
      name: 'services',
      title: 'Services',
      description: 'Each service is also a branch of the graph below it; its items are the skills on that branch. Empty = Design, Technology, AI, Strategy as they are now.',
      type: 'array',
      group: 'services',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'service',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'items', title: 'What it covers', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
          ],
          preview: { select: { title: 'title', items: 'items' }, prepare: ({ title, items }) => ({ title, subtitle: (items ?? []).join(', ') }) },
        }),
      ],
    }),
    defineField({ name: 'experienceLabel', title: 'Experience label', type: 'string', group: 'work', placeholder: 'Experience & what I do' }),
    defineField({ name: 'pulseTitle', title: 'Pulse headline', type: 'string', group: 'pulse', placeholder: 'Coffee in, sport out.' }),
    defineField({ name: 'pulseText', title: 'Pulse instruction', type: 'text', rows: 2, group: 'pulse', placeholder: 'Hold the dot to brew a coffee, it fills a ring. Then hold Run: the laps burn the coffees off again.' }),
    defineField({ name: 'hoursTitle', title: 'Headline', type: 'string', group: 'hours', placeholder: 'After hours' }),
    defineField({
      name: 'hours',
      title: 'Chapters',
      type: 'array',
      group: 'hours',
      description: 'Each chapter swaps the word under the headline while its photos fly past. Empty = Running, Cycling, Gaming with placeholder photos.',
      of: [
        {
          type: 'object',
          name: 'hoursChapter',
          fields: [
            defineField({ name: 'word', title: 'Word', type: 'string', validation: (r) => r.required(), description: 'e.g. Running' }),
            defineField({ name: 'note', title: 'Small line', type: 'string', description: 'e.g. 5 am, before the city wakes up' }),
            defineField({ name: 'bpm', title: 'Pulse (bpm)', type: 'number', description: 'Shown in the pulse variant, e.g. 158 for running' }),
            defineField({ name: 'photos', title: 'Photos', type: 'array', of: [{ type: 'image', options: { hotspot: true } }], description: '3 or 4 work best; portrait and landscape mixed.' }),
          ],
          preview: { select: { title: 'word', subtitle: 'note', media: 'photos.0' } },
        },
      ],
    }),
    defineField({
      name: 'talkText',
      title: 'Let’s talk paragraph',
      type: 'text',
      rows: 4,
      group: 'talk',
      placeholder: 'Every good thing I’ve made started with a short conversation. {photo} It’s {time} in Kraków and I’m {live} free to talk.',
      description: 'Tokens: {photo}, {time} (live time in Kraków), {live} (a pulsing dot).',
    }),
    defineField({ name: 'talkCta', title: 'Let’s talk link text', type: 'string', group: 'talk', placeholder: 'Let’s talk ↗' }),
    defineField({ name: 'callNote', title: 'Book a call note', type: 'string', group: 'talk', placeholder: '30 min, pick a time that suits you' }),
    defineField({ name: 'footerMiddle', title: 'Footer, middle', type: 'string', group: 'talk', placeholder: 'Designer & developer, Kraków', description: 'Shown before the live time.' }),
    defineField({ name: 'footerCoffee', title: 'Footer, right (no coffees yet)', type: 'string', group: 'talk', placeholder: 'Made with a lot of coffee', description: 'Changes to a count once someone brews in the pulse section.' }),
    defineField({ name: 'title', type: 'string', group: 'old' }),
    defineField({ name: 'quote', group: 'old', type: 'string' }),
    defineField({ name: 'portrait', group: 'page', type: 'image' }),
    defineField({ name: 'introLead', group: 'old', type: 'text', rows: 3 }),
    defineField({ name: 'introBody', group: 'old', type: 'text', rows: 3 }),
    defineField({ name: 'currentRole', group: 'old', type: 'string' }),
    defineField({ name: 'focus', group: 'old', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
    defineField({ name: 'experienceLead', group: 'old', type: 'text', rows: 3 }),
    defineField({ name: 'experienceBody', group: 'old', type: 'text', rows: 4 }),
    defineField({ name: 'experience', group: 'work', type: 'array', of: [defineArrayMember({ type: 'experienceItem' })] }),
    defineField({
      name: 'stats',
      title: 'In numbers',
      group: 'work',
      description: 'The “In numbers” rows (e.g. 7 + “Years in digital design”). Empty = the current placeholder figures.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stat',
          fields: [
            defineField({ name: 'value', type: 'number', validation: (r) => r.required() }),
            defineField({ name: 'suffix', type: 'string', description: 'e.g. + or %' }),
            defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
          ],
          preview: { select: { v: 'value', s: 'suffix', l: 'label' }, prepare: ({ v, s, l }) => ({ title: `${v ?? ''}${s ?? ''}`, subtitle: l }) },
        }),
      ],
    }),
    defineField({
      name: 'clients',
      title: 'Clients & brands',
      group: 'work',
      description: 'The “Worked with” rows (SVG or transparent PNG logos work best). Empty = KFC, Żabka, GRAFIT, FlyingBisons, dirt, Viktor, Asiacell as now; once you add any, this list replaces that one.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'client',
          fields: [
            defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'logo', type: 'image' }),
            defineField({ name: 'url', type: 'url' }),
          ],
          preview: { select: { title: 'name', media: 'logo' } },
        }),
      ],
    }),
    defineField({ name: 'ctaText', title: 'Footer text (old)', type: 'string', group: 'old' }),
  ],
  preview: { prepare: () => ({ title: 'About page' }) },
});
