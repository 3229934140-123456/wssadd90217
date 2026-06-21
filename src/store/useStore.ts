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
  updateConsultation: (id: string, updates: Partial<ConsultationRecord>) => void
  recalculateConsultationCommission: (id: string) => void
  addInstallment: (consultationId: string, amount: number, method: string) => void
  addRefund: (consultationId: string, refund: Omit<RefundRecord, 'id' | 'date' | 'operator'>) => void
  updateTotalAmount: (consultationId: string, newTotal: number) => void
  toggleGift: (consultationId: string, hasGift: boolean, giftProjectNames?: string[]) => void
  addCommissionRecord: (record: CommissionRecord) => void
  confirmDeal: (consultationId: string, verified: boolean) => void
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

  updateConsultation: (id: string, updates: Partial<ConsultationRecord>) => {
    set(state => {
      const consultations = state.consultations.map(c =>
        c.id === id ? { ...c, ...updates } : c
      )
      const target = consultations.find(c => c.id === id)
      let commissions = state.commissions
      if (target && target.dealStatus !== 'pending' && target.dealStatus !== 'not_dealed' && target.paidAmount > 0) {
        commissions = state.commissions.map(com => {
          if (com.consultationId !== id) return com
          const influencerId = target.influencerId || com.influencerId
          const commissionFirst = calculateCommissionAmount(target.paidAmount, influencerId, 'first')
          const commissionSecond = calculateCommissionAmount(target.paidAmount, influencerId, 'second')
          const totalRefund = target.refundRecords.reduce((s, r) => s + r.refundAmount, 0)
          const finalCommission = recalculateCommissionAfterRefund(
            target.visitType === 'first' ? commissionFirst : commissionSecond,
            totalRefund,
            influencerId
          )
          return {
            ...com,
            dealAmount: target.paidAmount,
            hasRefund: target.refundRecords.length > 0,
            refundAdjustAmount: totalRefund > 0 ? Math.abs(commissionFirst - finalCommission) : 0,
            finalCommission
          }
        })
      }
      return { consultations, commissions }
    })
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
      const target = consultations.find(c => c.id === id)
      let commissions = state.commissions
      if (target && target.paidAmount > 0) {
        const existing = commissions.find(c => c.consultationId === id)
        if (existing) {
          commissions = commissions.map(c => {
            if (c.consultationId !== id) return c
            return {
              ...c,
              dealAmount: target.paidAmount,
              commissionAmount: target.commissionFinal || 0,
              hasRefund: target.refundRecords.length > 0,
              refundAdjustAmount: target.refundRecords.reduce((s, r) => s + r.refundAmount, 0),
              finalCommission: target.commissionFinal || 0,
              isGift: target.hasGift
            }
          })
        } else if (target.dealStatus === 'dealed' || target.dealStatus === 'partly_paid') {
          const newRecord = generateCommissionRecord(target)
          if (newRecord) commissions = [...commissions, newRecord]
        }
      }
      return { consultations, commissions }
    })
  },

  addInstallment: (consultationId: string, amount: number, method: string) => {
    if (amount <= 0) return
    set(state => {
      const consultations = state.consultations.map(c => {
        if (c.id !== consultationId) return c
        const existingIds = new Set(c.installments.map(i => i.id))
        const newInsId = 'ins_' + Date.now()
        const safeId = existingIds.has(newInsId) ? 'ins_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6) : newInsId
        const newPaidAmount = c.paidAmount + amount
        const newTotal = Math.max(c.totalAmount, newPaidAmount)
        const newRemaining = Math.max(0, newTotal - newPaidAmount)
        const newStatus = newRemaining <= 0 ? 'dealed' : 'partly_paid'
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
          totalAmount: newTotal,
          paidAmount: newPaidAmount,
          remainingAmount: newRemaining,
          dealStatus: newStatus,
          commissionFirst,
          commissionSecond,
          commissionFinal,
          installments: [
            ...c.installments,
            {
              id: safeId,
              date: new Date().toISOString().split('T')[0],
              amount,
              method,
              operator: '当前用户'
            }
          ]
        }
      })
      const target = consultations.find(c => c.id === consultationId)
      let commissions = state.commissions
      if (target && target.paidAmount > 0) {
        const existing = commissions.find(c => c.consultationId === consultationId)
        if (existing) {
          commissions = commissions.map(c => {
            if (c.consultationId !== consultationId) return c
            return {
              ...c,
              dealAmount: target.paidAmount,
              commissionAmount: target.commissionFinal || 0,
              finalCommission: target.commissionFinal || 0,
              status: target.dealStatus === 'dealed' ? 'confirmed' : 'pending',
              statusName: target.dealStatus === 'dealed' ? '已确认' : '待确认'
            }
          })
        } else {
          const newRecord = generateCommissionRecord(target)
          if (newRecord) commissions = [...commissions, newRecord]
        }
      }
      return { consultations, commissions }
    })
  },

  addRefund: (consultationId: string, refund: Omit<RefundRecord, 'id' | 'date' | 'operator'>) => {
    set(state => {
      const consultations = state.consultations.map(c => {
        if (c.id !== consultationId) return c
        const newRefund: RefundRecord = {
          ...refund,
          id: 'ref_' + Date.now(),
          date: new Date().toISOString().split('T')[0],
          operator: '当前用户'
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
      const target = consultations.find(c => c.id === consultationId)
      let commissions = state.commissions
      if (target) {
        commissions = commissions.map(c => {
          if (c.consultationId !== consultationId) return c
          return {
            ...c,
            dealAmount: target.paidAmount,
            commissionAmount: target.commissionFinal || 0,
            hasRefund: true,
            refundAdjustAmount: target.refundRecords.reduce((s, r) => s + r.refundAmount, 0),
            finalCommission: target.commissionFinal || 0,
            status: 'adjusted',
            statusName: '已调整'
          }
        })
      }
      return { consultations, commissions }
    })
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
  },

  toggleGift: (consultationId: string, hasGift: boolean, giftProjectNames?: string[]) => {
    set(state => {
      const consultations = state.consultations.map(c => {
        if (c.id !== consultationId) return c
        return {
          ...c,
          hasGift,
          giftProjectNames: giftProjectNames || c.giftProjectNames
        }
      })
      return { consultations }
    })
    get().recalculateConsultationCommission(consultationId)
  },

  addCommissionRecord: (record: CommissionRecord) => {
    set(state => ({
      commissions: [...state.commissions, record]
    }))
  },

  confirmDeal: (consultationId: string, verified: boolean) => {
    set(state => {
      const consultations = state.consultations.map(c => {
        if (c.id !== consultationId) return c
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
        return {
          ...c,
          commissionFirst,
          commissionSecond,
          commissionFinal,
          dealStatus: verified ? (c.remainingAmount <= 0 ? 'dealed' : 'partly_paid') : c.dealStatus
        }
      })
      const target = consultations.find(c => c.id === consultationId)
      let commissions = state.commissions
      if (target && verified && target.paidAmount > 0) {
        const existing = commissions.find(c => c.consultationId === consultationId)
        if (existing) {
          commissions = commissions.map(c => {
            if (c.consultationId !== consultationId) return c
            return {
              ...c,
              dealAmount: target.paidAmount,
              commissionAmount: target.commissionFinal || 0,
              finalCommission: target.commissionFinal || 0,
              status: target.dealStatus === 'dealed' ? 'confirmed' : 'pending',
              statusName: target.dealStatus === 'dealed' ? '已确认' : '待确认'
            }
          })
        } else {
          const newRecord = generateCommissionRecord(target)
          if (newRecord) commissions = [...commissions, newRecord]
        }
      }
      return { consultations, commissions, pendingDealConsultationId: null }
    })
  }
}))
