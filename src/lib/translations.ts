export const locales = ['en', 'hi'] as const
export type Locale = (typeof locales)[number]

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
}

/**
 * UI-chrome-only translations — nav/footer/buttons that are static strings
 * in the code. Product/guide/blog content is authored in English in the
 * CMS and is intentionally NOT machine-translated here (technical component
 * specs need real subject-matter translation, not guesswork).
 */
export const translations = {
  en: {
    createAccount: 'Create an account',
    signIn: 'Sign In',
    searchPlaceholder: 'Search for products...',
    addToCart: 'Add To Cart',
    added: 'Added',
    buyNow: 'Buy Now',
    redirecting: 'Redirecting...',
    compare: 'Compare',
    comparing: 'Comparing',
    addToFavorites: 'Add to favorites',
    removeFromFavorites: 'Remove from favorites',
    sortBy: 'Sort by',
    showing: 'Showing',
    of: 'of',
    products: 'products',
    gridView: 'Grid view',
    listView: 'List view',
    loadMore: 'Load More',
    newsletterHeading: 'Subscribe to our Newsletter',
    quickLinks: 'Quick Links',
    securePayments: 'Secure payments via PayU',
    backToBlog: 'Back to Blog',
    account: 'Account',
    favorites: 'Favorites',
  },
  hi: {
    createAccount: 'खाता बनाएं',
    signIn: 'साइन इन करें',
    searchPlaceholder: 'उत्पाद खोजें...',
    addToCart: 'कार्ट में डालें',
    added: 'जोड़ा गया',
    buyNow: 'अभी खरीदें',
    redirecting: 'रीडायरेक्ट हो रहा है...',
    compare: 'तुलना करें',
    comparing: 'तुलना में',
    addToFavorites: 'पसंदीदा में जोड़ें',
    removeFromFavorites: 'पसंदीदा से हटाएं',
    sortBy: 'क्रमबद्ध करें',
    showing: 'दिखा रहे हैं',
    of: 'में से',
    products: 'उत्पाद',
    gridView: 'ग्रिड दृश्य',
    listView: 'सूची दृश्य',
    loadMore: 'और लोड करें',
    newsletterHeading: 'हमारे न्यूज़लेटर की सदस्यता लें',
    quickLinks: 'त्वरित लिंक',
    securePayments: 'PayU के माध्यम से सुरक्षित भुगतान',
    backToBlog: 'ब्लॉग पर वापस जाएं',
    account: 'खाता',
    favorites: 'पसंदीदा',
  },
} as const

export type TranslationKey = keyof (typeof translations)['en']
