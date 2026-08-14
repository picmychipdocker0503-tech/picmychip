import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { processReturnRefund } from '@/hooks/processReturnRefund'

export const ReturnRequests: CollectionConfig = {
  slug: 'return-requests',
  access: {
    // Created only via the /returns server route after it verifies the requester
    // owns the order (matches the order's accessToken/email or logged-in customer id).
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  hooks: {
    afterChange: [processReturnRefund],
  },
  admin: {
    group: 'Sales',
    components: {
      beforeList: ['@/components/admin/ReturnsListStats#ReturnsListStats'],
    },
    defaultColumns: ['order', 'reason', 'status', 'refundStatus', 'createdAt'],
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
    },
    {
      name: 'customerEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
    },
    {
      name: 'reason',
      type: 'select',
      required: true,
      options: [
        { label: 'Damaged / defective', value: 'damaged' },
        { label: 'Wrong item received', value: 'wrong-item' },
        { label: 'Not as described', value: 'not-as-described' },
        { label: 'No longer needed', value: 'no-longer-needed' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'requested',
      options: [
        { label: 'Requested', value: 'requested' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Completed', value: 'completed' },
      ],
      access: {
        update: adminOnlyFieldAccess,
      },
      admin: {
        position: 'sidebar',
        components: {
          Cell: '@/components/admin/cells/ReturnStatusCell#ReturnStatusCell',
        },
      },
    },
    {
      name: 'refundAmount',
      type: 'number',
      admin: {
        position: 'sidebar',
        description:
          'Defaults to the full order amount when left blank. Review/adjust before setting status to Approved — that triggers the actual refund.',
      },
    },
    {
      name: 'refundStatus',
      type: 'select',
      defaultValue: 'not-applicable',
      options: [
        { label: 'Not applicable yet', value: 'not-applicable' },
        { label: 'Processed via PayU', value: 'processed' },
        { label: 'Failed — needs manual attention', value: 'failed' },
        { label: 'Manual refund required (COD / gift card)', value: 'manual-required' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'refundNote',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
}
