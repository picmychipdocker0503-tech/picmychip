import { getZohoOrganizationId, zohoFetch } from './auth'

type ZohoOrganization = {
  organization_id: string
  state?: string
  state_code?: string
}

let cachedState: { fetchedAt: number; state: string | undefined } | null = null
const CACHE_TTL_MS = 60 * 60 * 1000 // an org's registered state changes essentially never

/**
 * Reads the seller's registered state directly from Zoho rather than relying
 * on a manually-set env var/Site Settings field — the two drift out of sync
 * whenever the org changes (confirmed live: ZOHO_BUSINESS_STATE was left at
 * "Karnataka" from a previous org after switching to a new one actually
 * registered in Tamil Nadu, causing every sales order to pick the wrong
 * intra/inter-state tax and get rejected by Zoho either way). Falls back to
 * the caller's provided default only if this lookup fails.
 */
export async function getZohoOrganizationState(): Promise<string | undefined> {
  if (cachedState && Date.now() - cachedState.fetchedAt < CACHE_TTL_MS) {
    return cachedState.state
  }

  try {
    const data = await zohoFetch<{ organizations: ZohoOrganization[] }>('/organizations')
    const org = data.organizations?.find((o) => o.organization_id === getZohoOrganizationId())
    cachedState = { state: org?.state, fetchedAt: Date.now() }
    return cachedState.state
  } catch {
    return undefined
  }
}
