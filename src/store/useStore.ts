import { create } from 'zustand'
import { customers, getCustomerById, getCustomersByPhone, getConflictingCustomers } from '@/data/customers'
import { consultationRecords, getTodayConsultations, getPendingConsultations, getConsultationById } from '@/data/commissions'
import { commissionRecords, getTodayCommissions, getCommissionsByInfluencer } from '@/data/commissions'
import { sourceCodes, getCodeByCode, getCodeById, getActiveCodes } from '@/data/codes'
import { influencers, getInfluencerById } from '@/data/influencers'
import { projects } from '@/data/projects'
import { Customer, ConsultationRecord, CommissionRecord, SourceCode, Influencer, Project, AttributionResult } from '@/types'

interface StoreState {
  customers: Customer[]
  consultations: ConsultationRecord[]
  commissions: CommissionRecord[]
  codes: SourceCode[]
  influencers: Influencer[]
  projects: Project[]
  currentCustomer: Customer | null
  currentConsultation: ConsultationRecord | null
  searchPhone: string
  searchCode: string
  attributionModalVisible: boolean
  conflictingCustomer: Customer | null
  setSearchPhone: (phone: string) => void
  setSearchCode: (code: string) => void
  setCurrentCustomer: (customer: Customer | null) => void
  setCurrentConsultation: (consultation: ConsultationRecord | null) => void
  searchByPhone: (phone: string) => Customer[]
  searchByCode: (code: string) => SourceCode | undefined
  getPendingConflicts: () => Customer[]
  showAttributionModal: (customer: Customer) => void
  hideAttributionModal: () => void
  confirmAttribution: (customerId: string, result: AttributionResult, reason: string) => void
  updateConsultation: (id: string, updates: Partial<ConsultationRecord>) => void
  addInstallment: (consultationId: string, amount: number, method: string) => void
  addCommissionRecord: (record: CommissionRecord) => void
}

export const useStore = create<StoreState>((set, get) => ({
  customers,
  consultations: consultationRecords,
  commissions: commissionRecords,
  codes: sourceCodes,
  influencers,
  projects,
  currentCustomer: null,
  currentConsultation: null,
  searchPhone: '',
  searchCode: '',
  attributionModalVisible: false,
  conflictingCustomer: null,

  setSearchPhone: (phone: string) => set({ searchPhone: phone }),
  setSearchCode: (code: string) => set({ searchCode: code }),
  setCurrentCustomer: (customer) => set({ currentCustomer: customer }),
  setCurrentConsultation: (consultation) => set({ currentConsultation: consultation }),

  searchByPhone: (phone: string) => {
    return getCustomersByPhone(phone)
  },

  searchByCode: (code: string) => {
    return getCodeByCode(code)
  },

  getPendingConflicts: () => {
    return getConflictingCustomers()
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
          ? { ...c, attribution: result, attributionReason: reason, hasAttributionConflict: false }
          : c
      ),
      attributionModalVisible: false,
      conflictingCustomer: null
    }))
  },

  updateConsultation: (id: string, updates: Partial<ConsultationRecord>) => {
    set(state => ({
      consultations: state.consultations.map(c =>
        c.id === id ? { ...c, ...updates } : c
      )
    }))
  },

  addInstallment: (consultationId: string, amount: number, method: string) => {
    set(state => {
      const consultations = state.consultations.map(c => {
        if (c.id !== consultationId) return c
        const newPaidAmount = c.paidAmount + amount
        const newRemaining = Math.max(0, c.totalAmount - newPaidAmount)
        const newStatus = newRemaining <= 0 ? 'dealed' : 'partly_paid'
        return {
          ...c,
          paidAmount: newPaidAmount,
          remainingAmount: newRemaining,
          dealStatus: newStatus,
          installments: [
            ...c.installments,
            {
              id: 'ins_' + Date.now(),
              date: new Date().toISOString().split('T')[0],
              amount,
              method,
              operator: '当前用户'
            }
          ]
        }
      })
      return { consultations }
    })
  },

  addCommissionRecord: (record: CommissionRecord) => {
    set(state => ({
      commissions: [...state.commissions, record]
    }))
  }
}))
