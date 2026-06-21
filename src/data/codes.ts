import { SourceCode } from '@/types'
import { influencers } from './influencers'
import { getProjectsByIds } from './projects'

const getProjectNames = (ids: string[]): string[] => {
  return getProjectsByIds(ids).map(p => p.name)
}

export const sourceCodes: SourceCode[] = [
  {
    id: 'code001',
    code: 'MLRM88',
    influencerId: 'inf001',
    influencerName: '美丽日记小美',
    influencerAvatar: influencers[0].avatar,
    projectIds: ['p001', 'p002', 'p003'],
    projectNames: getProjectNames(['p001', 'p002', 'p003']),
    validFrom: '2026-06-01',
    validTo: '2026-07-31',
    storeLimit: ['store001', 'store002'],
    totalUsage: 156,
    todayUsage: 8,
    status: 'active'
  },
  {
    id: 'code002',
    code: 'MEILI66',
    influencerId: 'inf001',
    influencerName: '美丽日记小美',
    influencerAvatar: influencers[0].avatar,
    projectIds: ['p004', 'p008', 'p010'],
    projectNames: getProjectNames(['p004', 'p008', 'p010']),
    validFrom: '2026-06-10',
    validTo: '2026-08-10',
    storeLimit: ['store001'],
    totalUsage: 89,
    todayUsage: 5,
    status: 'active'
  },
  {
    id: 'code003',
    code: 'LILY2026',
    influencerId: 'inf002',
    influencerName: '医美测评Lily',
    influencerAvatar: influencers[1].avatar,
    projectIds: ['p001', 'p005', 'p008', 'p010'],
    projectNames: getProjectNames(['p001', 'p005', 'p008', 'p010']),
    validFrom: '2026-05-01',
    validTo: '2026-06-30',
    storeLimit: ['store001'],
    totalUsage: 234,
    todayUsage: 12,
    status: 'active'
  },
  {
    id: 'code004',
    code: 'LZW666',
    influencerId: 'inf003',
    influencerName: '变美专家老王',
    influencerAvatar: influencers[2].avatar,
    projectIds: ['p002', 'p003', 'p007', 'p015'],
    projectNames: getProjectNames(['p002', 'p003', 'p007', 'p015']),
    validFrom: '2026-06-01',
    validTo: '2026-06-30',
    storeLimit: ['store001', 'store002', 'store003'],
    totalUsage: 445,
    todayUsage: 18,
    status: 'active'
  },
  {
    id: 'code005',
    code: 'ZBHAPPY',
    influencerId: 'inf003',
    influencerName: '变美专家老王',
    influencerAvatar: influencers[2].avatar,
    projectIds: ['p006', 'p013', 'p014'],
    projectNames: getProjectNames(['p006', 'p013', 'p014']),
    validFrom: '2026-06-15',
    validTo: '2026-07-15',
    storeLimit: ['store001', 'store003'],
    totalUsage: 78,
    todayUsage: 3,
    status: 'active'
  },
  {
    id: 'code006',
    code: 'SARA77',
    influencerId: 'inf004',
    influencerName: '精致女孩Sara',
    influencerAvatar: influencers[3].avatar,
    projectIds: ['p001', 'p005', 'p008'],
    projectNames: getProjectNames(['p001', 'p005', 'p008']),
    validFrom: '2026-06-01',
    validTo: '2026-09-30',
    storeLimit: ['store002'],
    totalUsage: 42,
    todayUsage: 2,
    status: 'active'
  },
  {
    id: 'code007',
    code: 'SKINMO520',
    influencerId: 'inf005',
    influencerName: '护肤达人小沫',
    influencerAvatar: influencers[4].avatar,
    projectIds: ['p001', 'p004', 'p010'],
    projectNames: getProjectNames(['p001', 'p004', 'p010']),
    validFrom: '2026-03-01',
    validTo: '2026-04-30',
    storeLimit: ['store001', 'store002'],
    totalUsage: 312,
    todayUsage: 0,
    status: 'expired'
  },
  {
    id: 'code008',
    code: 'ZHANG99',
    influencerId: 'inf006',
    influencerName: '整形医生张博士',
    influencerAvatar: influencers[5].avatar,
    projectIds: ['p006', 'p007', 'p013', 'p014', 'p015'],
    projectNames: getProjectNames(['p006', 'p007', 'p013', 'p014', 'p015']),
    validFrom: '2026-06-01',
    validTo: '2026-12-31',
    storeLimit: ['store001', 'store003'],
    totalUsage: 198,
    todayUsage: 7,
    status: 'active'
  },
  {
    id: 'code009',
    code: 'VIP6666',
    influencerId: 'inf002',
    influencerName: '医美测评Lily',
    influencerAvatar: influencers[1].avatar,
    projectIds: ['p001', 'p008', 'p009'],
    projectNames: getProjectNames(['p001', 'p008', 'p009']),
    validFrom: '2026-07-01',
    validTo: '2026-09-01',
    storeLimit: ['store001'],
    totalUsage: 0,
    todayUsage: 0,
    status: 'unused'
  }
]

export const getCodeByCode = (code: string): SourceCode | undefined => {
  return sourceCodes.find(c => c.code.toLowerCase() === code.toLowerCase())
}

export const getCodeById = (id: string): SourceCode | undefined => {
  return sourceCodes.find(c => c.id === id)
}

export const getCodesByInfluencer = (influencerId: string): SourceCode[] => {
  return sourceCodes.filter(c => c.influencerId === influencerId)
}

export const getActiveCodes = (): SourceCode[] => {
  return sourceCodes.filter(c => c.status === 'active')
}

export const getTodayCodes = (): SourceCode[] => {
  return sourceCodes.filter(c => c.todayUsage > 0)
}
