// Credit package configurations
export const CREDIT_PACKAGES = {
  // Credit top-up packages
  CREDIT_10: {
    id: 'credit_10',
    name: '体验包',
    price: 1000, // ¥10 in cents
    credits: 100,
    bonus: 0,
    stripePriceId: process.env.STRIPE_PRICE_CREDIT_10 || 'price_xxx',
  },
  CREDIT_20: {
    id: 'credit_20',
    name: '标准包',
    price: 2000, // ¥20 in cents
    credits: 200,
    bonus: 0,
    stripePriceId: process.env.STRIPE_PRICE_CREDIT_20 || 'price_xxx',
  },
  CREDIT_50: {
    id: 'credit_50',
    name: '大礼包',
    price: 5000, // ¥50 in cents
    credits: 500,
    bonus: 20, // +20 bonus credits
    stripePriceId: process.env.STRIPE_PRICE_CREDIT_50 || 'price_xxx',
  },
} as const

// Lifetime membership
export const LIFETIME_PACKAGE = {
  id: 'lifetime',
  name: '终身会员',
  price: 9900, // ¥99 in cents
  stripePriceId: process.env.STRIPE_PRICE_LIFETIME || 'price_xxx',
} as const

// Feature credit costs
export const CREDIT_COSTS = {
  OPTIMIZE: 10,      // Resume optimization with STAR method
  ATS: 5,            // ATS optimization
  INTERVIEW: 5,      // Interview questions generation
  COVER_LETTER: 5,   // Cover letter generation
} as const

export type FeatureType = keyof typeof CREDIT_COSTS

// Check if a package is a credit package
export function isCreditPackage(packageId: string): packageId is keyof typeof CREDIT_PACKAGES {
  return packageId in CREDIT_PACKAGES
}

// Get package by ID
export function getPackage(packageId: string) {
  if (isCreditPackage(packageId)) {
    return CREDIT_PACKAGES[packageId]
  }
  if (packageId === 'lifetime') {
    return LIFETIME_PACKAGE
  }
  return null
}

// Mock mode - simulates Stripe without actual payment
export const MOCK_MODE = process.env.MOCK_STRIPE === 'true' || !process.env.STRIPE_SECRET_KEY
