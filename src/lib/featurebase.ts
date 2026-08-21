import { boot } from 'featurebase-js'

export const FEATUREBASE_APP_ID = '6a630b8ebfd7b125f2342f3f'

/**
 * `<FeaturebaseProvider messenger={false}>` (see providers/index.tsx) skips
 * the SDK's actual `boot` call on page load, on purpose, so the widget's
 * runtime script/iframe/WebSocket aren't paid for by every visitor who never
 * opens chat. But `show()` alone never triggers that boot — it just queues a
 * "show" command the SDK has nothing booted to act on. Every explicit "Chat"
 * trigger in the app must call this immediately before `show()` so the
 * messenger actually boots on demand instead of silently no-oping.
 * `boot()` is idempotent (a second call just re-identifies), so this is safe
 * to call on every click.
 */
export function ensureFeaturebaseBooted() {
  boot({ appId: FEATUREBASE_APP_ID })
}
