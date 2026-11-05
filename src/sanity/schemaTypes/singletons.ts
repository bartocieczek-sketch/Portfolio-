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
    { name: 'sales', title: 'Sales sections' },
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

    defineField({
      name: 'availability',
      description: 'Short line next to the call button, e.g. "Booking projects for January 2027". Leave empty to hide.',
      type: 'string',
      group: 'sales',
    }),
    defineField({ name: 'statsHeading', type: 'string', group: 'sales' }),
    defineField({ name: 'stats', description: 'Proof in numbers. Shown under the work grid.', type: 'array', of: [defineArrayMember({ type: 'stat' })], validation: (rule) => rule.max(4), group: 'sales' }),
    defineField({ name: 'servicesHeading', type: 'string', group: 'sales' }),
    defineField({ name: 'services', type: 'array', of: [defineArrayMember({ type: 'service' })], group: 'sales' }),
    defineField({ name: 'processHeading', type: 'string', group: 'sales' }),
    defineField({ name: 'process', title: 'Process steps', type: 'array', of: [defineArrayMember({ type: 'service' })], validation: (rule) => rule.max(5), group: 'sales' }),
    defineField({ name: 'faqHeading', title: 'FAQ heading', type: 'string', group: 'sales' }),
    defineField({ name: 'faq', title: 'FAQ', type: 'array', of: [defineArrayMember({ type: 'faqItem' })], group: 'sales' }),
  ],
  preview: { prepare: () => ({ title: 'Home page' }) },
});

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'quote', type: 'string' }),
    defineField({ name: 'portrait', type: 'image' }),
    defineField({ name: 'introLead', type: 'text', rows: 3 }),
    defineField({ name: 'introBody', type: 'text', rows: 3 }),
    defineField({ name: 'currentRole', type: 'string' }),
    defineField({ name: 'focus', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
    defineField({ name: 'experienceLead', type: 'text', rows: 3 }),
    defineField({ name: 'experienceBody', type: 'text', rows: 4 }),
    defineField({ name: 'experience', type: 'array', of: [defineArrayMember({ type: 'experienceItem' })] }),
    defineField({ name: 'ctaText', title: 'Footer text', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'About page' }) },
});
