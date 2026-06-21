export interface Influencer {
  id: string
  name: string
  avatar: string
  platform: string
  followers: number
  commissionRateFirst: number
  commissionRateSecond: number
  status: 'active' | 'expired'
  validFrom: string
  validTo: string
  storeLimit: string[]
  cooperativeProjects: string[]
}

export interface Project {
  id: string
  name: string
  category: string
  price: number
  isGift: boolean
}

export interface Customer {
  id: string
  phoneLast4: string
  fullPhone: string
  name: string
  firstVisitDate: string
  lastVisitDate: string
  source: 'influencer' | 'feed' | 'walkin'
  sourceCodeId?: string
  influencerId?: string
  influencerName?: string
  attribution?: AttributionResult
  attributionReason?: string
  hasAttributionConflict: boolean
}

export interface SourceCode {
  id: string
  code: string
  influencerId: string
  influencerName: string
  influencerAvatar: string
  projectIds: string[]
  projectNames: string[]
  validFrom: string
  validTo: string
  storeLimit: string[]
  totalUsage: number
  todayUsage: number
  status: 'active' | 'expired' | 'unused'
}

export type VisitType = 'first' | 'second' | 'followup'

export interface ConsultationRecord {
  id: string
  customerId: string
  customerName: string
  phoneLast4: string
  visitType: VisitType
  consultantId: string
  consultantName: string
  date: string
  time: string
  interestedProjects: string[]
  interestedProjectNames: string[]
  dealStatus: 'pending' | 'dealed' | 'not_dealed' | 'partly_paid'
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  installments: Installment[]
  refundRecords: RefundRecord[]
  hasGift: boolean
  giftProjectNames: string[]
  notes: string
  influencerId?: string
  influencerName?: string
  commissionFirst?: number
  commissionSecond?: number
  commissionFinal?: number
}

export interface Installment {
  id: string
  date: string
  amount: number
  method: string
  operator: string
}

export interface RefundRecord {
  id: string
  date: string
  originalProject: string
  newProject?: string
  amount: number
  refundAmount: number
  reason: string
  operator: string
}

export interface AttributionResult {
  channel: 'influencer' | 'feed' | 'walkin'
  influencerId?: string
  influencerName?: string
  confirmDate: string
  operator: string
}

export interface CommissionRecord {
  id: string
  consultationId: string
  customerId: string
  customerName: string
  influencerId: string
  influencerName: string
  visitType: VisitType
  visitTypeName: string
  dealDate: string
  dealAmount: number
  commissionRate: number
  commissionAmount: number
  status: 'pending' | 'confirmed' | 'paid' | 'refunded' | 'adjusted'
  statusName: string
  isGift: boolean
  hasRefund: boolean
  refundAdjustAmount: number
  finalCommission: number
  notes: string
}

export interface DailyReport {
  date: string
  storeName: string
  totalArrivals: number
  influencerArrivals: number
  firstVisits: number
  secondVisits: number
  totalDeals: number
  firstVisitDeals: number
  secondVisitDeals: number
  firstVisitDealRate: string
  secondVisitDealRate: string
  totalDealAmount: number
  totalCommissionEstimate: number
  commissionFirstVisit: number
  commissionSecondVisit: number
  pendingVerifications: number
  pendingVerificationList: string[]
  topInfluencers: {
    id: string
    name: string
    arrivals: number
    deals: number
    commission: number
  }[]
}

export interface Store {
  id: string
  name: string
  address: string
}
