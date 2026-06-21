import { Customer } from '@/types'

export const customers: Customer[] = [
  {
    id: 'c001',
    phoneLast4: '6821',
    fullPhone: '138****6821',
    name: '王女士',
    firstVisitDate: '2026-06-20',
    lastVisitDate: '2026-06-22',
    source: 'influencer',
    sourceCodeId: 'code004',
    influencerId: 'inf003',
    influencerName: '变美专家老王',
    hasAttributionConflict: false
  },
  {
    id: 'c002',
    phoneLast4: '2345',
    fullPhone: '139****2345',
    name: '李小姐',
    firstVisitDate: '2026-06-15',
    lastVisitDate: '2026-06-22',
    source: 'influencer',
    sourceCodeId: 'code003',
    influencerId: 'inf002',
    influencerName: '医美测评Lily',
    hasAttributionConflict: false
  },
  {
    id: 'c003',
    phoneLast4: '9876',
    fullPhone: '186****9876',
    name: '张女士',
    firstVisitDate: '2026-06-10',
    lastVisitDate: '2026-06-21',
    source: 'influencer',
    sourceCodeId: 'code001',
    influencerId: 'inf001',
    influencerName: '美丽日记小美',
    hasAttributionConflict: false
  },
  {
    id: 'c004',
    phoneLast4: '5566',
    fullPhone: '150****5566',
    name: '陈女士',
    firstVisitDate: '2026-06-22',
    lastVisitDate: '2026-06-22',
    source: 'influencer',
    sourceCodeId: 'code008',
    influencerId: 'inf006',
    influencerName: '整形医生张博士',
    hasAttributionConflict: false
  },
  {
    id: 'c005',
    phoneLast4: '7788',
    fullPhone: '137****7788',
    name: '刘女士',
    firstVisitDate: '2026-06-01',
    lastVisitDate: '2026-06-22',
    source: 'feed',
    hasAttributionConflict: true,
    attribution: {
      channel: 'influencer',
      influencerId: 'inf001',
      influencerName: '美丽日记小美',
      confirmDate: '2026-06-01',
      operator: '前台小张'
    },
    attributionReason: '顾客先通过信息流看到后，又通过达人视频领取了优惠券，最终以达人核销为准'
  },
  {
    id: 'c006',
    phoneLast4: '3344',
    fullPhone: '158****3344',
    name: '赵小姐',
    firstVisitDate: '2026-06-22',
    lastVisitDate: '2026-06-22',
    source: 'walkin',
    hasAttributionConflict: false
  },
  {
    id: 'c007',
    phoneLast4: '1234',
    fullPhone: '188****1234',
    name: '周女士',
    firstVisitDate: '2026-05-20',
    lastVisitDate: '2026-06-22',
    source: 'influencer',
    sourceCodeId: 'code006',
    influencerId: 'inf004',
    influencerName: '精致女孩Sara',
    hasAttributionConflict: false
  },
  {
    id: 'c008',
    phoneLast4: '8888',
    fullPhone: '136****8888',
    name: '吴女士',
    firstVisitDate: '2026-06-18',
    lastVisitDate: '2026-06-22',
    source: 'influencer',
    sourceCodeId: 'code004',
    influencerId: 'inf003',
    influencerName: '变美专家老王',
    hasAttributionConflict: false
  },
  {
    id: 'c009',
    phoneLast4: '6666',
    fullPhone: '159****6666',
    name: '孙女士',
    firstVisitDate: '2026-06-22',
    lastVisitDate: '2026-06-22',
    source: 'feed',
    hasAttributionConflict: true
  },
  {
    id: 'c010',
    phoneLast4: '9999',
    fullPhone: '135****9999',
    name: '郑小姐',
    firstVisitDate: '2026-06-08',
    lastVisitDate: '2026-06-21',
    source: 'influencer',
    sourceCodeId: 'code003',
    influencerId: 'inf002',
    influencerName: '医美测评Lily',
    hasAttributionConflict: false
  }
]

export const getCustomerById = (id: string): Customer | undefined => {
  return customers.find(c => c.id === id)
}

export const getCustomersByPhone = (phoneLast4: string): Customer[] => {
  return customers.filter(c => c.phoneLast4 === phoneLast4)
}

export const getCustomersByInfluencer = (influencerId: string): Customer[] => {
  return customers.filter(c => c.influencerId === influencerId)
}

export const getTodayNewCustomers = (): Customer[] => {
  const today = '2026-06-22'
  return customers.filter(c => c.firstVisitDate === today)
}

export const getConflictingCustomers = (): Customer[] => {
  return customers.filter(c => c.hasAttributionConflict && !c.attribution)
}
