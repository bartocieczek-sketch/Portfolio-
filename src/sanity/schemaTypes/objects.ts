import { defineArrayMember, defineField, defineType } from 'sanity';
import { LinkIcon } from '@sanity/icons/Link';
import { ImageIcon } from '@sanity/icons/Image';
import { TagIcon } from '@sanity/icons/Tag';
import { CaseIcon } from '@sanity/icons/Case';
import { CommentIcon } from '@sanity/icons/Comment';

export const link = defineType({
  name: 'link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'url', title: 'URL', type: 'string', validation: (rule) => rule.required() }),
  ],
});

export const media = defineType({
  name: 'media',
  title: 'Media',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'kind',
      type: 'string',
      options: {
        list: [
          { title: 'Image', value: 'image' },
          { title: 'Video', value: 'video' },
          { title: 'Lottie animation', value: 'lottie' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'image',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'size',
      description: 'Full width spans the whole gallery; two half-width items sit side by side.',
      type: 'string',
      options: {
        list: [
          { title: 'Full width', value: 'full' },
          { title: 'Half width', value: 'half' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'half',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.kind !== 'image',
      fields: [defineField({ name: 'alt', title: 'Alternative text', type: 'string' })],
    }),
    defineField({
      name: 'video',
      type: 'file',
      options: { accept: 'video/*' },
      hidden: ({ parent }) => parent?.kind !== 'video',
    }),
    defineField({
      name: 'poster',
      description: 'Optional still frame shown before the video loads.',
      type: 'image',
      hidden: ({ parent }) => parent?.kind !== 'video',
    }),
    defineField({
      name: 'lottie',
      description: 'Lottie JSON file.',
      type: 'file',
      options: { accept: '.json,application/json' },
      hidden: ({ parent }) => parent?.kind !== 'lottie',
    }),
  ],
  preview: {
    select: { kind: 'kind', size: 'size', image: 'image', poster: 'poster', video: 'video.asset.originalFilename', lottie: 'lottie.asset.originalFilename' },
    prepare: ({ kind, size, image, poster, video, lottie }) => ({
      title: kind === 'video' ? video || 'Video' : kind === 'lottie' ? lottie || 'Lottie' : 'Image',
      subtitle: `${kind ?? 'image'} · ${size === 'full' ? 'full width' : 'half width'}`,
      media: kind === 'image' ? image : poster,
    }),
  },
});

export const brand = defineType({
  name: 'brand',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'logo',
      description: 'SVG works best. Shown in light grey on the dark background.',
      type: 'image',
      options: { accept: 'image/svg+xml,image/png' },
    }),
  ],
  preview: { select: { title: 'name', media: 'logo' } },
});

export const experienceItem = defineType({
  name: 'experienceItem',
  title: 'Experience',
  type: 'object',
  icon: CaseIcon,
  fields: [
    defineField({ name: 'company', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'role', type: 'string' }),
    defineField({ name: 'period', description: 'e.g. JUN 2026 - PRESENT', type: 'string' }),
    defineField({ name: 'logo', type: 'image' }),
  ],
  preview: { select: { title: 'company', subtitle: 'role', media: 'logo' } },
});

export const testimonial = defineType({
  name: 'testimonial',
  type: 'object',
  icon: CommentIcon,
  fields: [
    defineField({ name: 'quote', type: 'text', rows: 4 }),
    defineField({ name: 'name', type: 'string' }),
    defineField({ name: 'role', type: 'string' }),
    defineField({ name: 'thumbnail', description: 'Image or GIF shown with a play button.', type: 'image' }),
    defineField({ name: 'video', description: 'Plays in a lightbox when the thumbnail is clicked.', type: 'file', options: { accept: 'video/*' } }),
  ],
});
