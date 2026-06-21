import { create } from 'zustand'
import { customers, getCustomerById, getCustomersByPhone, getConflictingCustomers } from '@/data/customers'
import { consultationRecords, getTodayConsultations, getPendingConsultations, getConsultationById } from '@/data/commissions'
import { commissionRecords, getTodayCommissions, getCommissionsByInfluencer } from '@/data/commissions'
import { sourceCodes, getCodeByCode, getCodeById, getActiveCodes, getCodesByInfluencer } from '@/data/codes'
import { influencers, getInfluencerById, getInfluencerByName } from '@/data/influencers'
import { projects } from '@/data/projects'
import { Customer, ConsultationRecord, CommissionRecord, SourceCode, Influencer, Project, AttributionResult, RefundRecord } from '@/types'
import { calculateCommissionAmount, generateCommissionRecord, recalculateCommissionAfterRefund } from '@/utils/commission'

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

    if (!isDealConfirmed) {
      set(state => ({
        commissions: state.commissions.filter(c => c.consultationId !== consultationId)
      }))
      return
    }

    const existing = commissions.find(c => c.consultationId === consultationId)
    if (existing) {
      set(state => ({
        commissions: state.commissions.map(c => {
          if (c.consultationId !== consultationId) return c
          return {
            ...c,
            dealAmount: target.paidAmount,
            commissionAmount: target.commissionFinal || 0,
            hasRefund: target.refundRecords.length > 0,
            refundAdjustAmount: target.refundRecords.reduce((s, r) => s + r.refundAmount, 0),
            finalCommission: target.commissionFinal || 0,
            isGift: target.hasGift,
            status: target.dealStatus === 'dealed' ? 'confirmed' : 'pending',
            statusName: target.dealStatus === 'dealed' ? '已确认' : '待确认'
          }
        })
      }))
    } else {
      const newRecord = generateCommissionRecord(target)
      if (newRecord) {
        set(state => ({ commissions: [...state.commissions, newRecord] }))
      }
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
        const commissionFinal = recalculateCommissionAfterRefund(baseCommission, totalRefund, influencerId)
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
        const commissionFinal = recalculateCommissionAfterRefund(baseCommission, totalRefund, influencerId)
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
        const commissionFinal = recalculateCommissionAfterRefund(baseCommission, totalRefund, influencerId)
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
        const newRemaining = Math.max(0, newTotal - c.paidAmount)
        const influencerId = c.influencerId || ''
        const commissionFirst = c.visitType === 'first'
          ? calculateCommissionAmount(Math.min(c.paidAmount, newTotal), influencerId, 'first')
          : 0
        const commissionSecond = c.visitType !== 'first'
          ? calculateCommissionAmount(Math.min(c.paidAmount, newTotal), influencerId, 'second')
          : 0
        const totalRefund = c.refundRecords.reduce((s, r) => s + r.refundAmount, 0)
        const baseCommission = commissionFirst + commissionSecond
        const commissionFinal = recalculateCommissionAfterRefund(baseCommission, totalRefund, influencerId)
        return {
          ...c,
          totalAmount: newTotal,
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
