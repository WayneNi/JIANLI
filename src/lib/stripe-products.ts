// Credit package configurations
export const CREDIT_PACKAGES = {
  CREDIT_10: {
    id: 'credit_10',
    name: '体验包',
    price: 1000, // ¥10 in cents
    credits: 100,
    bonus: 0,
  },
  CREDIT_20: {
    id: 'credit_20',
    name: '标准包',
    price: 2000, // ¥20 in cents
    credits: 200,
    bonus: 0,
  },
  CREDIT_50: {
    id: 'credit_50',
    name: '大礼包',
    price: 5000, // ¥50 in cents
    credits: 500,
    bonus: 20,
  },
} as const

// Lifetime membership
export const LIFETIME_PACKAGE = {
  id: 'lifetime',
  name: '终身会员',
  price: 9900, // ¥99 in cents
} as const

// Feature credit costs
export const CREDIT_COSTS = {
  OPTIMIZE: 10,
  ATS: 5,
  INTERVIEW: 5,
  COVER_LETTER: 5,
} as const

export type FeatureType = keyof typeof CREDIT_COSTS

// Package display info for pricing page
export const CREDIT_PACKAGES_DISPLAY = [
  { ...CREDIT_PACKAGES.CREDIT_10, features: ['100 积分', '支持微信/支付宝'] },
  { ...CREDIT_PACKAGES.CREDIT_20, features: ['200 积分', '支持微信/支付宝'] },
  { ...CREDIT_PACKAGES.CREDIT_50, features: ['500 积分 + 20 bonus', '支持微信/支付宝'], highlight: true, badge: '最划算' },
]

export const LIFETIME_DISPLAY = {
  ...LIFETIME_PACKAGE,
  features: [
    '无限使用所有功能',
    '简历优化无限次',
    'ATS优化无限次',
    '面试问题无限次',
    '求职信无限次',
  ],
}

export function isCreditPackage(packageId: string): packageId is keyof typeof CREDIT_PACKAGES {
  return packageId in CREDIT_PACKAGES
}

export function getPackage(packageId: string) {
  if (isCreditPackage(packageId)) {
    return CREDIT_PACKAGES[packageId]
  }
  if (packageId === 'lifetime') {
    return LIFETIME_PACKAGE
  }
  return null
}
