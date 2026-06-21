import { create } from 'zustand'
import { customers, getCustomerById, getCustomersByPhone, getConflictingCustomers } from '@/data/customers'
import { consultationRecords, getTodayConsultations, getPendingConsultations, getConsultationById } from '@/data/commissions'
import { commissionRecords, getTodayCommissions, getCommissionsByInfluencer } from '@/data/commissions'
import { sourceCodes, getCodeByCode, getCodeById, getActiveCodes, getCodesByInfluencer } from '@/data/codes'
import { influencers, getInfluencerById, getInfluencerByName } from '@/data/influencers'
import { projects } from '@/data/projects'
import { Customer, ConsultationRecord, CommissionRecord, SourceCode, Influencer, Project, AttributionResult, RefundRecord } from '@/types'
import { calculateCommissionAmount, generateCommissionRecord, recalculateCommissionAfterRefund, getCommissionRate, getVisitTypeName } from '@/utils/commission'

interface StoreState {
  customers: Customer[]
  consultations: ConsultationRecord[]
  commissions: CommissionRecord[]
  codes: SourceCode[]
  influencers: Influencer[]
  projects: Project[]
  currentCustomer: Customer | null
  currentConsultation: ConsultationRecord | null
  pendingDealConsultationId: string | null
  searchPhone: string
  searchCode: string
  attributionModalVisible: boolean
  conflictingCustomer: Customer | null
  setSearchPhone: (phone: string) => void
  setSearchCode: (code: string) => void
  setCurrentCustomer: (customer: Customer | null) => void
  setCurrentConsultation: (consultation: ConsultationRecord | null) => void
  setPendingDealConsultationId: (id: string | null) => void
  searchByPhone: (phone: string) => Customer[]
  searchByCode: (keyword: string) => { exactMatch?: SourceCode; influencerMatches: SourceCode[] }
  getPendingConflicts: () => Customer[]
  showAttributionModal: (customer: Customer) => void
  hideAttributionModal: () => void
  confirmAttribution: (customerId: string, result: AttributionResult, reason: string) => void
  markToVerify: (consultationId: string) => void
  updateConsultation: (id: string, updates: Partial<ConsultationRecord>) => void
  recalculateConsultationCommission: (id: string) => void
  addInstallment: (consultationId: string, amount: number, method: string) => void
  addRefund: (consultationId: string, refund: Omit<RefundRecord, 'id' | 'date' | 'operator'>) => void
  updateTotalAmount: (consultationId: string, newTotal: number) => void
  toggleGift: (consultationId: string, hasGift: boolean, giftProjectNames?: string[]) => void
  updateAttribution: (consultationId: string, channel: 'influencer' | 'feed' | 'walkin', influencerId?: string, influencerName?: string, reason?: string) => void
  addCommissionRecord: (record: CommissionRecord) => void
  confirmDeal: (consultationId: string) => void
  syncCommissionFromConsultation: (consultationId: string) => void
}

export const useStore = create<StoreState>((set, get) => ({
  customers: [...customers],
  consultations: [...consultationRecords],
  commissions: [...commissionRecords],
  codes: sourceCodes,
  influencers,
  projects,
  currentCustomer: null,
  currentConsultation: null,
  pendingDealConsultationId: null,
  searchPhone: '',
  searchCode: '',
  attributionModalVisible: false,
  conflictingCustomer: null,

  setSearchPhone: (phone: string) => set({ searchPhone: phone }),
  setSearchCode: (code: string) => set({ searchCode: code }),
  setCurrentCustomer: (customer) => set({ currentCustomer: customer }),
  setCurrentConsultation: (consultation) => set({ currentConsultation: consultation }),
  setPendingDealConsultationId: (id) => set({ pendingDealConsultationId: id }),

  searchByPhone: (phone: string) => {
    return getCustomersByPhone(phone)
  },

  searchByCode: (keyword: string) => {
    const trimmed = keyword.trim()
    if (!trimmed) return { exactMatch: undefined, influencerMatches: [] }
    const exactMatch = getCodeByCode(trimmed)
    const matchedInfluencer = getInfluencerByName(trimmed)
    let influencerMatches: SourceCode[] = []
    if (matchedInfluencer) {
      influencerMatches = getCodesByInfluencer(matchedInfluencer.id).filter(c => c.status === 'active')
    } else {
      influencerMatches = getActiveCodes().filter(c =>
        c.influencerName.toLowerCase().includes(trimmed.toLowerCase())
      )
    }
    return { exactMatch, influencerMatches }
  },

  getPendingConflicts: () => {
    return get().customers.filter(c => c.hasAttributionConflict)
  },

  showAttributionModal: (customer: Customer) => {
    set({ attributionModalVisible: true, conflictingCustomer: customer })
  },

  hideAttributionModal: () => {
    set({ attributionModalVisible: false, conflictingCustomer: null })
  },

  confirmAttribution: (customerId: string, result: AttributionResult, reason: string) => {
    set(state => ({
      customers: state.customers.map(c =>
        c.id === customerId
          ? {
              ...c,
              attribution: result,
              attributionReason: reason,
              hasAttributionConflict: false,
              source: result.channel,
              influencerId: result.influencerId,
              influencerName: result.influencerName
            }
          : c
      ),
      attributionModalVisible: false,
      conflictingCustomer: null
    }))
  },

  markToVerify: (consultationId: string) => {
    set(state => {
      const consultations = state.consultations.map(c => {
        if (c.id !== consultationId) return c
        return { ...c, dealStatus: 'to_verify' as const }
      })
      return { consultations, pendingDealConsultationId: consultationId }
    })
  },

  syncCommissionFromConsultation: (consultationId: string) => {
    const { consultations, commissions } = get()
    const target = consultations.find(c => c.id === consultationId)
    if (!target) return

    const isDealConfirmed = target.dealStatus === 'dealed' || target.dealStatus === 'partly_paid'

    if (!isDealConfirmed || !target.influencerId || target.paidAmount <= 0) {
      set(state => ({
        commissions: state.commissions.filter(c => c.consultationId !== consultationId)
      }))
      return
    }

    const rate = getCommissionRate(target.influencerId, target.visitType)
    const baseCommission = calculateCommissionAmount(target.paidAmount, target.influencerId, target.visitType)
    const hasRefund = target.refundRecords.length > 0
    const finalCommission = hasRefund
      ? recalculateCommissionAfterRefund(baseCommission, target.refundRecords, target.influencerId, target.visitType)
      : baseCommission
    const refundAdjustAmount = baseCommission - finalCommission
    const status = hasRefund ? 'adjusted' : (target.dealStatus === 'dealed' ? 'confirmed' : 'pending')
    const statusName = hasRefund ? '已调整' : (target.dealStatus === 'dealed' ? '已确认' : '待确认')

    const existing = commissions.find(c => c.consultationId === consultationId)
    if (existing) {
      set(state => ({
        commissions: state.commissions.map(c => {
          if (c.consultationId !== consultationId) return c
          return {
            ...c,
            influencerId: target.influencerId || '',
            influencerName: target.influencerName || '',
            visitType: target.visitType,
            visitTypeName: getVisitTypeName(target.visitType),
            dealDate: target.date,
            dealAmount: target.paidAmount,
            commissionRate: rate,
            commissionAmount: baseCommission,
            hasRefund,
            refundAdjustAmount,
            finalCommission,
            isGift: target.hasGift,
            status,
            statusName
          }
        })
      }))
    } else {
      const newRecord: CommissionRecord = {
        id: 'com_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        consultationId: target.id,
        customerId: target.customerId,
        customerName: target.customerName,
        influencerId: target.influencerId || '',
        influencerName: target.influencerName || '',
        visitType: target.visitType,
        visitTypeName: getVisitTypeName(target.visitType),
        dealDate: target.date,
        dealAmount: target.paidAmount,
        commissionRate: rate,
        commissionAmount: baseCommission,
        status,
        statusName,
        isGift: target.hasGift,
        hasRefund,
        refundAdjustAmount,
        finalCommission,
        notes: target.notes || ''
      }
      set(state => ({ commissions: [...state.commissions, newRecord] }))
    }
  },

  updateConsultation: (id: string, updates: Partial<ConsultationRecord>) => {
    set(state => ({
      consultations: state.consultations.map(c => c.id === id ? { ...c, ...updates } : c)
    }))
    get().recalculateConsultationCommission(id)
    const target = get().consultations.find(c => c.id === id)
    if (target && target.dealStatus === 'to_verify') {
      get().syncCommissionFromConsultation(id)
    }
  },

  recalculateConsultationCommission: (id: string) => {
    set(state => {
      const consultations = state.consultations.map(c => {
        if (c.id !== id) return c
        const influencerId = c.influencerId || ''
        const commissionFirst = c.visitType === 'first'
          ? calculateCommissionAmount(c.paidAmount, influencerId, 'first')
          : 0
        const commissionSecond = c.visitType !== 'first'
          ? calculateCommissionAmount(c.paidAmount, influencerId, 'second')
          : 0
        const totalRefund = c.refundRecords.reduce((s, r) => s + r.refundAmount, 0)
        const baseCommission = commissionFirst + commissionSecond
        const commissionFinal = recalculateCommissionAfterRefund(baseCommission, totalRefund, influencerId, c.visitType)
        return { ...c, commissionFirst, commissionSecond, commissionFinal }
      })
      return { consultations }
    })
  },

  addInstallment: (consultationId: string, amount: number, method: string) => {
    if (amount <= 0) {
      get().syncCommissionFromConsultation(consultationId)
      return
    }
    set(state => {
      const consultations = state.consultations.map(c => {
        if (c.id !== consultationId) return c
        const newInsId = 'ins_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
        const newPaidAmount = c.paidAmount + amount
        const newRemaining = Math.max(0, c.totalAmount - newPaidAmount)
        const influencerId = c.influencerId || ''
        const commissionFirst = c.visitType === 'first'
          ? calculateCommissionAmount(newPaidAmount, influencerId, 'first')
          : 0
        const commissionSecond = c.visitType !== 'first'
          ? calculateCommissionAmount(newPaidAmount, influencerId, 'second')
          : 0
        const totalRefund = c.refundRecords.reduce((s, r) => s + r.refundAmount, 0)
        const baseCommission = commissionFirst + commissionSecond
        const commissionFinal = recalculateCommissionAfterRefund(baseCommission, totalRefund, influencerId, c.visitType)
        return {
          ...c,
          paidAmount: newPaidAmount,
          remainingAmount: newRemaining,
          commissionFirst,
          commissionSecond,
          commissionFinal,
          installments: [
            ...c.installments,
            {
              id: newInsId,
              date: '2026-06-22',
              amount,
              method,
              operator: '前台操作员'
            }
          ]
        }
      })
      return { consultations }
    })
    get().syncCommissionFromConsultation(consultationId)
  },

  addRefund: (consultationId: string, refund: Omit<RefundRecord, 'id' | 'date' | 'operator'>) => {
    set(state => {
      const consultations = state.consultations.map(c => {
        if (c.id !== consultationId) return c
        const newRefund: RefundRecord = {
          ...refund,
          id: 'ref_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          date: '2026-06-22',
          operator: '前台操作员'
        }
        const totalRefund = [...c.refundRecords, newRefund].reduce((s, r) => s + r.refundAmount, 0)
        const newPaid = Math.max(0, c.paidAmount - refund.refundAmount)
        const newRemaining = c.totalAmount - newPaid
        const influencerId = c.influencerId || ''
        const commissionFirst = c.visitType === 'first'
          ? calculateCommissionAmount(newPaid, influencerId, 'first')
          : 0
        const commissionSecond = c.visitType !== 'first'
          ? calculateCommissionAmount(newPaid, influencerId, 'second')
          : 0
        const baseCommission = commissionFirst + commissionSecond
        const commissionFinal = recalculateCommissionAfterRefund(baseCommission, totalRefund, influencerId, c.visitType)
        return {
          ...c,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          commissionFirst,
          commissionSecond,
          commissionFinal,
          refundRecords: [...c.refundRecords, newRefund]
        }
      })
      return { consultations }
    })
    get().syncCommissionFromConsultation(consultationId)
  },

  updateTotalAmount: (consultationId: string, newTotal: number) => {
    set(state => {
      const consultations = state.consultations.map(c => {
        if (c.id !== consultationId) return c
        const effectivePaid = Math.min(c.paidAmount, Math.max(0, newTotal))
        const newRemaining = Math.max(0, newTotal - effectivePaid)
        const influencerId = c.influencerId || ''
        const commissionFirst = c.visitType === 'first'
          ? calculateCommissionAmount(effectivePaid, influencerId, 'first')
          : 0
        const commissionSecond = c.visitType !== 'first'
          ? calculateCommissionAmount(effectivePaid, influencerId, 'second')
          : 0
        const totalRefund = c.refundRecords.reduce((s, r) => s + r.refundAmount, 0)
        const baseCommission = commissionFirst + commissionSecond
        const commissionFinal = recalculateCommissionAfterRefund(baseCommission, totalRefund, influencerId, c.visitType)
        return {
          ...c,
          totalAmount: Math.max(0, newTotal),
          paidAmount: effectivePaid,
          remainingAmount: newRemaining,
          commissionFirst,
          commissionSecond,
          commissionFinal
        }
      })
      return { consultations }
    })
    get().syncCommissionFromConsultation(consultationId)
  },

  toggleGift: (consultationId: string, hasGift: boolean, giftProjectNames?: string[]) => {
    set(state => ({
      consultations: state.consultations.map(c => {
        if (c.id !== consultationId) return c
        return {
          ...c,
          hasGift,
          giftProjectNames: giftProjectNames || c.giftProjectNames
        }
      })
    }))
    get().syncCommissionFromConsultation(consultationId)
  },

  updateAttribution: (consultationId: string, channel: 'influencer' | 'feed' | 'walkin', influencerId?: string, influencerName?: string, reason?: string) => {
    set(state => {
      const consultations = state.consultations.map(c => {
        if (c.id !== consultationId) return c
        const safeInfId = channel === 'influencer' ? influencerId : undefined
        const safeInfName = channel === 'influencer' ? influencerName : undefined
        return {
          ...c,
          influencerId: safeInfId,
          influencerName: safeInfName
        }
      })
      const target = consultations.find(c => c.id === consultationId)
      let customers = state.customers
      if (target) {
        customers = state.customers.map(cus => {
          if (cus.id !== target.customerId) return cus
          return {
            ...cus,
            source: channel,
            influencerId: channel === 'influencer' ? influencerId : undefined,
            influencerName: channel === 'influencer' ? influencerName : undefined,
            attributionReason: reason || cus.attributionReason,
            attribution: cus.attribution
              ? { ...cus.attribution, channel, influencerId, influencerName }
              : undefined
          }
        })
      }
      return { consultations, customers }
    })
    get().recalculateConsultationCommission(consultationId)
    get().syncCommissionFromConsultation(consultationId)
  },

  addCommissionRecord: (record: CommissionRecord) => {
    set(state => ({
      commissions: [...state.commissions, record]
    }))
  },

  confirmDeal: (consultationId: string) => {
    set(state => {
      const consultations = state.consultations.map(c => {
        if (c.id !== consultationId) return c
        const newStatus = c.remainingAmount <= 0 ? 'dealed' : 'partly_paid'
        return { ...c, dealStatus: newStatus as 'dealed' | 'partly_paid' }
      })
      return { consultations, pendingDealConsultationId: null }
    })
    get().syncCommissionFromConsultation(consultationId)
  }
}))
