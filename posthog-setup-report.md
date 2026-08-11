<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Picmychip e-commerce project (Next.js 16.2.6, App Router, Payload CMS). The integration covers client-side initialization via `instrumentation-client.ts`, a reverse proxy through Next.js rewrites, server-side tracking via `posthog-node` for critical business operations, user identification on login and signup, and a `posthog.reset()` call on logout.

**New files created:**
- `instrumentation-client.ts` — client-side PostHog initialization (Next.js 15.3+ approach)
- `src/lib/posthog-server.ts` — per-request server-side PostHog client factory
- `src/components/product/TrackProductView.tsx` — client component that fires `product_viewed` on mount

**Files edited:**
- `next.config.ts` — added `/ingest` reverse proxy rewrites and `skipTrailingSlashRedirect: true`
- `src/components/Cart/AddToCart.tsx` — `product_added_to_cart`, `buy_now_clicked`
- `src/components/product/ProductDescription.tsx` — `product_wishlisted`
- `src/app/(app)/cart/page.tsx` — `coupon_applied`, `gift_card_applied`
- `src/components/checkout/CheckoutPage.tsx` — `checkout_started` (card, COD, and gift-card paths)
- `src/components/forms/CheckoutForm/index.tsx` — `payment_submitted`, `order_placed_card`
- `src/app/(app)/checkout/place-order/route.ts` — server-side `order_placed` (COD / gift-card)
- `src/app/(app)/returns/submitReturnRequest.ts` — server-side `return_request_submitted`
- `src/app/(app)/wishlist/page.tsx` — `wishlist_item_added_to_cart`
- `src/components/forms/CreateAccountForm/index.tsx` — `user_signed_up` + `posthog.identify()`
- `src/components/forms/LoginForm/index.tsx` — `user_logged_in` + `posthog.identify()`
- `src/app/(app)/logout/LogoutPage/index.tsx` — `user_logged_out` + `posthog.reset()`
- `src/app/(app)/products/[slug]/page.tsx` — renders `<TrackProductView />`

## Events instrumented

| Event | Description | File |
|---|---|---|
| `product_viewed` | Fired when a user views a product detail page — top of the purchase funnel. | `src/components/product/TrackProductView.tsx` |
| `product_added_to_cart` | Fired when a user clicks Add to Cart on the product page. | `src/components/Cart/AddToCart.tsx` |
| `buy_now_clicked` | Fired when a user clicks Buy Now, adding to cart and going directly to checkout. | `src/components/Cart/AddToCart.tsx` |
| `product_wishlisted` | Fired when a user adds a product to their wishlist. | `src/components/product/ProductDescription.tsx` |
| `coupon_applied` | Fired when a coupon code is successfully applied to the cart. | `src/app/(app)/cart/page.tsx` |
| `gift_card_applied` | Fired when a gift card code is successfully applied to the cart. | `src/app/(app)/cart/page.tsx` |
| `checkout_started` | Fired when the user initiates payment (any method) on the checkout page. | `src/components/checkout/CheckoutPage.tsx` |
| `payment_submitted` | Fired when the user submits the Stripe payment form. | `src/components/forms/CheckoutForm/index.tsx` |
| `order_placed_card` | Fired client-side when Stripe payment is confirmed and the order is created. | `src/components/forms/CheckoutForm/index.tsx` |
| `order_placed` | Fired server-side when a COD or gift-card-covered order is created. | `src/app/(app)/checkout/place-order/route.ts` |
| `wishlist_item_added_to_cart` | Fired when a user moves a wishlist item to the cart. | `src/app/(app)/wishlist/page.tsx` |
| `return_request_submitted` | Fired server-side when a customer submits a return request. | `src/app/(app)/returns/submitReturnRequest.ts` |
| `user_signed_up` | Fired after successful account creation; also calls `posthog.identify()`. | `src/components/forms/CreateAccountForm/index.tsx` |
| `user_logged_in` | Fired after successful login; also calls `posthog.identify()`. | `src/components/forms/LoginForm/index.tsx` |
| `user_logged_out` | Fired on logout; also calls `posthog.reset()`. | `src/app/(app)/logout/LogoutPage/index.tsx` |

## Next steps

We've built a dashboard and five insights for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics (wizard):** https://us.posthog.com/project/526897/dashboard/1900602
- **Purchase Conversion Funnel (wizard):** https://us.posthog.com/project/526897/insights/2LWLJORi
- **Orders placed over time (wizard):** https://us.posthog.com/project/526897/insights/mgoQcy7a
- **New user signups (wizard):** https://us.posthog.com/project/526897/insights/qG4efUxQ
- **Checkout started by payment method (wizard):** https://us.posthog.com/project/526897/insights/M2g8xTZ7
- **Wishlist engagement (wizard):** https://us.posthog.com/project/526897/insights/opIiWzmV

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any onboarding docs so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — currently `identify` is called on login and signup. If a logged-in user refreshes the page, the Auth provider's `useEffect` (which calls `/api/users/me`) fetches the user but does not call `posthog.identify()`. Consider adding an `identify` call in the Auth provider's `fetchMe` success path so returning sessions stay linked to the correct person.
- [ ] This project found PostgreSQL and Stripe data sources. Run `npx @posthog/wizard warehouse` to connect them to PostHog's data warehouse for richer revenue and user analytics.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
