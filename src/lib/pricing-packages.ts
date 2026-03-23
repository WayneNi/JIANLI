// Credit packages for display (used in pricing page)
export const CREDIT_PACKAGES_DISPLAY = [
  {
    id: 'credit_10',
    name: '体验包',
    price: 1000,
    credits: 100,
    bonus: 0,
    features: ['100 积分', '适合单次试用'],
  },
  {
    id: 'credit_20',
    name: '标准包',
    price: 2000,
    credits: 200,
    bonus: 0,
    features: ['200 积分', '适合偶尔使用'],
  },
  {
    id: 'credit_50',
    name: '大礼包',
    price: 5000,
    credits: 500,
    bonus: 20,
    features: ['500 + 20 积分', '相当于 ¥0.1/积分', '最划算的选择'],
    highlight: true,
    badge: '推荐',
  },
]

export const LIFETIME_DISPLAY = {
  id: 'lifetime',
  name: '终身会员',
  price: 9900,
  features: [
    '无限次简历优化',
    '无限次 ATS/面试/求职信',
    '终身模板更新',
    '优先客服支持',
  ],
}
