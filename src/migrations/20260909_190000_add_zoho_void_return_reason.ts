import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds 'zoho-void' as a return-requests.reason option — used by
 * reconcileOrderWithZohoSalesOrder (src/lib/orderIntegrations/syncZohoSalesOrder.ts)
 * to auto-create an approved return request (triggering the existing
 * processReturnRefund refund flow) when a sales order is voided directly in
 * Zoho Books. Without this, that create() would fail against production
 * (invalid enum value) even though local dev's schema push already allows it.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_return_requests_reason" ADD VALUE IF NOT EXISTS 'zoho-void';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Postgres has no ALTER TYPE ... DROP VALUE — 'zoho-void' intentionally
  // stays in enum_return_requests_reason after rollback (harmless, unused).
}
