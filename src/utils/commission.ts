import { getInfluencerById } from '@/data/influencers'
import { getProjectsByIds } from '@/data/projects'
import { ConsultationRecord, CommissionRecord, RefundRecord } from '@/types'

export const calculateCommissionAmount = (
  dealAmount: number,
  influencerId: string,
  visitType: 'first' | 'second' | 'followup'
): number => {
  const influencer = getInfluencerById(influencerId)
  if (!influencer) return 0
  const rate = visitType === 'first' ? influencer.commissionRateFirst : influencer.commissionRateSecond
  return Math.round(dealAmount * rate * 100) / 100
}

export const getCommissionRate = (
  influencerId: string,
  visitType: 'first' | 'second' | 'followup'
): number => {
  const influencer = getInfluencerById(influencerId)
  if (!influencer) return 0
  return visitType === 'first' ? influencer.commissionRateFirst : influencer.commissionRateSecond
}

export const formatRate = (rate: number): string => {
  return (rate * 100).toFixed(1) + '%'
}

export const formatAmount = (amount: number): string => {
  return '¥' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const getActualDealAmount = (record: ConsultationRecord): number => {
  const projectIds = record.interestedProjects
  const projects = getProjectsByIds(projectIds)
  const paidProjects = projects.filter(p => !p.isGift)
  return paidProjects.reduce((sum, p) => sum + p.price, 0)
}

export const recalculateCommissionAfterRefund = (
  originalCommission: number,
  refundData: RefundRecord[] | number,
  influencerId: string,
  visitType?: 'first' | 'second' | 'followup'
): number => {
  let totalRefundCommission = 0
  if (typeof refundData === 'number') {
    const rate = influencerId ? (getInfluencerById(influencerId)?.commissionRateSecond || 0.1) : 0.1
    totalRefundCommission = refundData * rate
  } else if (Array.isArray(refundData) && refundData.length > 0 && visitType) {
    totalRefundCommission = refundData.reduce((sum, ref) => {
      return sum + calculateCommissionAmount(ref.refundAmount, influencerId, visitType)
    }, 0)
  }
  return Math.round(Math.max(0, originalCommission - totalRefundCommission) * 100) / 100
}

export const getVisitTypeName = (visitType: string): string => {
  const map: Record<string, string> = {
    first: '首诊',
    second: '二次到院',
    followup: '后续到院'
  }
  return map[visitType] || visitType
}

export const getDealStatusName = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待确认',
    dealed: '已成交',
    not_dealed: '未成交',
    partly_paid: '分期中'
  }
  return map[status] || status
}

export const getCommissionStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    pending: '#FF7D00',
    confirmed: '#165DFF',
    paid: '#27AE60',
    refunded: '#EB5757',
    adjusted: '#9B51E0'
  }
  return map[status] || '#86909C'
}

export const getCommissionStatusBgColor = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'rgba(255, 125, 0, 0.1)',
    confirmed: 'rgba(22, 93, 255, 0.1)',
    paid: 'rgba(39, 174, 96, 0.1)',
    refunded: 'rgba(235, 87, 87, 0.1)',
    adjusted: 'rgba(155, 81, 224, 0.1)'
  }
  return map[status] || 'rgba(134, 144, 156, 0.1)'
}

export const getSourceChannelName = (source: string): string => {
  const map: Record<string, string> = {
    influencer: '达人探店',
    feed: '信息流广告',
    walkin: '自然到院'
  }
  return map[source] || source
}

export const generateCommissionRecord = (
  consultation: ConsultationRecord
): CommissionRecord | null => {
  if (!consultation.influencerId || consultation.paidAmount <= 0) {
    return null
  }
  const rate = getCommissionRate(consultation.influencerId, consultation.visitType)
  const commission = calculateCommissionAmount(consultation.paidAmount, consultation.influencerId, consultation.visitType)
  const hasRefund = consultation.refundRecords && consultation.refundRecords.length > 0
  let finalCommission = commission
  let refundAdjust = 0
  if (hasRefund) {
    const refundCommission = recalculateCommissionAfterRefund(
      commission,
      consultation.refundRecords,
      consultation.influencerId,
      consultation.visitType
    )
    refundAdjust = commission - refundCommission
    finalCommission = refundCommission
  }
  return {
    id: 'com_' + Date.now(),
    consultationId: consultation.id,
    customerId: consultation.customerId,
    customerName: consultation.customerName,
    influencerId: consultation.influencerId,
    influencerName: consultation.influencerName || '',
    visitType: consultation.visitType,
    visitTypeName: getVisitTypeName(consultation.visitType),
    dealDate: consultation.date,
    dealAmount: consultation.paidAmount,
    commissionRate: rate,
    commissionAmount: commission,
    status: consultation.dealStatus === 'dealed' ? 'confirmed' : 'pending',
    statusName: consultation.dealStatus === 'dealed' ? '已确认' : '待确认',
    isGift: consultation.hasGift,
    hasRefund,
    refundAdjustAmount: refundAdjust,
    finalCommission,
    notes: consultation.notes || ''
  }
}
