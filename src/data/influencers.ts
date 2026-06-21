import { Influencer } from '@/types'

export const influencers: Influencer[] = [
  {
    id: 'inf001',
    name: '美丽日记小美',
    avatar: 'https://picsum.photos/id/64/200/200',
    platform: '抖音',
    followers: 520000,
    commissionRateFirst: 0.25,
    commissionRateSecond: 0.10,
    status: 'active',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    storeLimit: ['store001', 'store002'],
    cooperativeProjects: ['p001', 'p002', 'p003', 'p004', 'p008', 'p010']
  },
  {
    id: 'inf002',
    name: '医美测评Lily',
    avatar: 'https://picsum.photos/id/91/200/200',
    platform: '小红书',
    followers: 380000,
    commissionRateFirst: 0.22,
    commissionRateSecond: 0.08,
    status: 'active',
    validFrom: '2026-03-01',
    validTo: '2026-08-31',
    storeLimit: ['store001'],
    cooperativeProjects: ['p001', 'p005', 'p008', 'p009', 'p010']
  },
  {
    id: 'inf003',
    name: '变美专家老王',
    avatar: 'https://picsum.photos/id/177/200/200',
    platform: '抖音',
    followers: 1200000,
    commissionRateFirst: 0.30,
    commissionRateSecond: 0.12,
    status: 'active',
    validFrom: '2026-01-01',
    validTo: '2026-06-30',
    storeLimit: ['store001', 'store002', 'store003'],
    cooperativeProjects: ['p002', 'p003', 'p006', 'p007', 'p013', 'p014', 'p015']
  },
  {
    id: 'inf004',
    name: '精致女孩Sara',
    avatar: 'https://picsum.photos/id/338/200/200',
    platform: '小红书',
    followers: 150000,
    commissionRateFirst: 0.18,
    commissionRateSecond: 0.06,
    status: 'active',
    validFrom: '2026-04-01',
    validTo: '2026-09-30',
    storeLimit: ['store002'],
    cooperativeProjects: ['p001', 'p005', 'p008', 'p010']
  },
  {
    id: 'inf005',
    name: '护肤达人小沫',
    avatar: 'https://picsum.photos/id/1027/200/200',
    platform: '抖音',
    followers: 860000,
    commissionRateFirst: 0.28,
    commissionRateSecond: 0.10,
    status: 'expired',
    validFrom: '2025-10-01',
    validTo: '2026-04-30',
    storeLimit: ['store001', 'store002'],
    cooperativeProjects: ['p001', 'p002', 'p004', 'p008', 'p010']
  },
  {
    id: 'inf006',
    name: '整形医生张博士',
    avatar: 'https://picsum.photos/id/1025/200/200',
    platform: '视频号',
    followers: 680000,
    commissionRateFirst: 0.20,
    commissionRateSecond: 0.07,
    status: 'active',
    validFrom: '2026-02-01',
    validTo: '2027-01-31',
    storeLimit: ['store001', 'store003'],
    cooperativeProjects: ['p006', 'p007', 'p013', 'p014', 'p015']
  }
]

export const getInfluencerById = (id: string): Influencer | undefined => {
  return influencers.find(i => i.id === id)
}

export const getInfluencerByName = (name: string): Influencer | undefined => {
  return influencers.find(i => i.name.includes(name))
}

export const getActiveInfluencers = (): Influencer[] => {
  return influencers.filter(i => i.status === 'active')
}

export const formatFollowers = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}
