import type { Block } from 'payload'
import { link } from '@/fields/link'

export const FeatureBento: Block = {
  slug: 'featureBento',
  interfaceName: 'FeatureBentoBlock',
  labels: {
    singular: 'Bento Feature Grid',
    plural: 'Bento Feature Grids',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Eyebrow / Badge Text',
      defaultValue: 'ENGINEER-FIRST PLATFORM',
    },
    {
      name: 'heading',
      type: 'text',
      label: 'Section Heading',
      required: true,
      defaultValue: 'Everything makers and engineers need to build faster.',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Section Description',
      defaultValue:
        'From precision SMD passives to powerful microcontrollers, every component is spec-verified and backed by real engineering data.',
    },
    {
      name: 'cards',
      type: 'array',
      label: 'Bento Grid Cards',
      minRows: 1,
      maxRows: 8,
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Card Title',
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          label: 'Card Description',
        },
        {
          name: 'badge',
          type: 'text',
          label: 'Card Badge (Optional)',
        },
        {
          name: 'size',
          type: 'select',
          defaultValue: 'small',
          label: 'Card Size / Span',
          options: [
            { label: 'Standard (1 Column)', value: 'small' },
            { label: 'Wide (2 Columns)', value: 'medium' },
            { label: 'Full Width (3 Columns)', value: 'large' },
          ],
        },
        {
          name: 'cardType',
          type: 'select',
          defaultValue: 'default',
          label: 'Interactive Visual Type',
          options: [
            { label: 'Standard / Icon', value: 'default' },
            { label: 'Live Spec Table', value: 'specs' },
            { label: 'Code / Pinout Snippet', value: 'code' },
            { label: 'Accent Highlight Card', value: 'highlight' },
            { label: 'Media / Image Card', value: 'media' },
          ],
        },
        {
          name: 'specRows',
          type: 'array',
          label: 'Spec Key-Values',
          admin: {
            condition: (_: unknown, siblingData: { cardType?: string }) => siblingData?.cardType === 'specs',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'codeSnippet',
          type: 'textarea',
          label: 'Code / Terminal Snippet',
          admin: {
            condition: (_: unknown, siblingData: { cardType?: string }) => siblingData?.cardType === 'code',
          },
        },
        {
          name: 'codeLanguage',
          type: 'text',
          label: 'Code Header / Language',
          defaultValue: 'main.cpp',
          admin: {
            condition: (_: unknown, siblingData: { cardType?: string }) => siblingData?.cardType === 'code',
          },
        },
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          admin: {
            condition: (_: unknown, siblingData: { cardType?: string }) =>
              ['media', 'highlight'].includes(siblingData?.cardType ?? ''),
          },
        },
        {
          name: 'enableLink',
          type: 'checkbox',
          label: 'Enable Action Link',
        },
        link({
          overrides: {
            admin: {
              condition: (_: unknown, siblingData: { enableLink?: boolean }) => Boolean(siblingData?.enableLink),
            },
          },
        }),
      ],
    },
  ],
}
