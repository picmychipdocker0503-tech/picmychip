import type { CurrenciesConfig } from '@payloadcms/plugin-ecommerce/types'

/**
 * Single source of truth for the store's supported currencies — shared between the server
 * plugin config (`src/plugins/index.ts`) and the client `EcommerceProvider`
 * (`src/providers/index.tsx`). `EcommerceProvider` doesn't inherit this from the server: if the
 * client isn't handed the same config directly, it silently falls back to the plugin library's
 * own built-in default (USD-only), which is what causes `$` to show up despite the store being
 * configured for INR everywhere else.
 */
export const currenciesConfig: CurrenciesConfig = {
  defaultCurrency: 'INR',
  supportedCurrencies: [{ code: 'INR', decimals: 2, label: 'Indian Rupee', symbol: '₹' }],
}
