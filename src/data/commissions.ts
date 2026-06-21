import { ConsultationRecord, CommissionRecord, DailyReport } from '@/types'
import { getInfluencerById } from './influencers'

export const consultationRecords: ConsultationRecord[] = [
  {
    id: 'cons001',
    customerId: 'c001',
    customerName: '王女士',
    phoneLast4: '6821',
    visitType: 'second',
    consultantId: 'doc001',
    consultantName: '李咨询师',
    date: '2026-06-22',
    time: '10:30',
    interestedProjects: ['p002', 'p003'],
    interestedProjectNames: ['热玛吉第五代', '超声炮'],
    dealStatus: 'partly_paid',
    totalAmount: 46600,
    paidAmount: 20000,
    remainingAmount: 26600,
    installments: [
      { id: 'ins001', date: '2026-06-22', amount: 20000, method: '微信支付', operator: '收银小陈' }
    ],
    refundRecords: [],
    hasGift: true,
    giftProjectNames: ['免费皮肤检测', '免费补水面膜'],
    notes: '顾客对热玛吉很感兴趣，预算有限先付定金',
    influencerId: 'inf003',
    influencerName: '变美专家老王',
    commissionFirst: 0,
    commissionSecond: 2000,
    commissionFinal: 2000
  },
  {
    id: 'cons002',
    customerId: 'c002',
    customerName: '李小姐',
    phoneLast4: '2345',
    visitType: 'second',
    consultantId: 'doc002',
    consultantName: '张咨询师',
    date: '2026-06-22',
    time: '11:00',
    interestedProjects: ['p005', 'p008'],
    interestedProjectNames: ['瘦脸针（保妥适）', '水光针'],
    dealStatus: 'dealed',
    totalAmount: 5080,
    paidAmount: 5080,
    remainingAmount: 0,
    installments: [
      { id: 'ins002', date: '2026-06-22', amount: 5080, method: '支付宝', operator: '收银小陈' }
    ],
    refundRecords: [],
    hasGift: true,
    giftProjectNames: ['免费皮肤检测'],
    notes: '老顾客，对效果很满意',
    influencerId: 'inf002',
    influencerName: '医美测评Lily',
    commissionFirst: 0,
    commissionSecond: 406.4,
    commissionFinal: 406.4
  },
  {
    id: 'cons003',
    customerId: 'c003',
    customerName: '张女士',
    phoneLast4: '9876',
    visitType: 'first',
    consultantId: 'doc001',
    consultantName: '李咨询师',
    date: '2026-06-22',
    time: '14:00',
    interestedProjects: ['p001', 'p010'],
    interestedProjectNames: ['光子嫩肤', '超皮秒祛斑'],
    dealStatus: 'dealed',
    totalAmount: 5660,
    paidAmount: 5660,
    remainingAmount: 0,
    installments: [
      { id: 'ins003', date: '2026-06-22', amount: 5660, method: '银行卡', operator: '收银小王' }
    ],
    refundRecords: [
      {
        id: 'ref001',
        date: '2026-06-22',
        originalProject: '超皮秒祛斑',
        newProject: '光子嫩肤',
        amount: 3680,
        refundAmount: 1700,
        reason: '祛斑改为2次光子嫩肤套餐',
        operator: '收银小王'
      }
    ],
    hasGift: false,
    giftProjectNames: [],
    notes: '祛斑改为光子嫩肤套餐，已退款差价',
    influencerId: 'inf001',
    influencerName: '美丽日记小美',
    commissionFirst: 1415,
    commissionSecond: 0,
    commissionFinal: 1415
  },
  {
    id: 'cons004',
    customerId: 'c004',
    customerName: '陈女士',
    phoneLast4: '5566',
    visitType: 'first',
    consultantId: 'doc003',
    consultantName: '王咨询师',
    date: '2026-06-22',
    time: '15:30',
    interestedProjects: ['p007'],
    interestedProjectNames: ['鼻综合整形'],
    dealStatus: 'pending',
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    installments: [],
    refundRecords: [],
    hasGift: true,
    giftProjectNames: ['免费皮肤检测'],
    notes: '还在考虑中，明天给答复',
    influencerId: 'inf006',
    influencerName: '整形医生张博士',
    commissionFirst: 0,
    commissionSecond: 0,
    commissionFinal: 0
  },
  {
    id: 'cons005',
    customerId: 'c005',
    customerName: '刘女士',
    phoneLast4: '7788',
    visitType: 'followup',
    consultantId: 'doc001',
    consultantName: '李咨询师',
    date: '2026-06-22',
    time: '16:00',
    interestedProjects: ['p008'],
    interestedProjectNames: ['水光针'],
    dealStatus: 'dealed',
    totalAmount: 1280,
    paidAmount: 1280,
    remainingAmount: 0,
    installments: [
      { id: 'ins005', date: '2026-06-22', amount: 1280, method: '微信支付', operator: '收银小陈' }
    ],
    refundRecords: [],
    hasGift: false,
    giftProjectNames: [],
    notes: '三次水光针第二次',
    influencerId: 'inf001',
    influencerName: '美丽日记小美',
    commissionFirst: 0,
    commissionSecond: 128,
    commissionFinal: 128
  },
  {
    id: 'cons006',
    customerId: 'c007',
    customerName: '周女士',
    phoneLast4: '1234',
    visitType: 'first',
    consultantId: 'doc002',
    consultantName: '张咨询师',
    date: '2026-06-22',
    time: '09:30',
    interestedProjects: ['p001', 'p005'],
    interestedProjectNames: ['光子嫩肤', '瘦脸针（保妥适）'],
    dealStatus: 'not_dealed',
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    installments: [],
    refundRecords: [],
    hasGift: true,
    giftProjectNames: ['免费皮肤检测'],
    notes: '敏感肌，暂时不考虑注射项目',
    influencerId: 'inf004',
    influencerName: '精致女孩Sara',
    commissionFirst: 0,
    commissionSecond: 0,
    commissionFinal: 0
  },
  {
    id: 'cons007',
    customerId: 'c008',
    customerName: '吴女士',
    phoneLast4: '8888',
    visitType: 'second',
    consultantId: 'doc003',
    consultantName: '王咨询师',
    date: '2026-06-22',
    time: '14:30',
    interestedProjects: ['p006', 'p015'],
    interestedProjectNames: ['双眼皮手术', '线雕提升'],
    dealStatus: 'dealed',
    totalAmount: 21600,
    paidAmount: 21600,
    remainingAmount: 0,
    installments: [
      { id: 'ins007', date: '2026-06-22', amount: 21600, method: '银行卡', operator: '收银小王' }
    ],
    refundRecords: [],
    hasGift: true,
    giftProjectNames: ['免费补水面膜'],
    notes: '老客户推荐朋友一起来',
    influencerId: 'inf003',
    influencerName: '变美专家老王',
    commissionFirst: 0,
    commissionSecond: 2592,
    commissionFinal: 2592
  },
  {
    id: 'cons008',
    customerId: 'c010',
    customerName: '郑小姐',
    phoneLast4: '9999',
    visitType: 'second',
    consultantId: 'doc002',
    consultantName: '张咨询师',
    date: '2026-06-21',
    time: '16:30',
    interestedProjects: ['p001', 'p009'],
    interestedProjectNames: ['光子嫩肤', '果酸换肤'],
    dealStatus: 'dealed',
    totalAmount: 2660,
    paidAmount: 2660,
    remainingAmount: 0,
    installments: [
      { id: 'ins008', date: '2026-06-21', amount: 2660, method: '微信支付', operator: '收银小王' }
    ],
    refundRecords: [],
    hasGift: false,
    giftProjectNames: [],
    notes: '月度护理套餐',
    influencerId: 'inf002',
    influencerName: '医美测评Lily',
    commissionFirst: 0,
    commissionSecond: 212.8,
    commissionFinal: 212.8
  }
]

export const commissionRecords: CommissionRecord[] = [
  {
    id: 'com001',
    consultationId: 'cons001',
    customerId: 'c001',
    customerName: '王女士',
    influencerId: 'inf003',
    influencerName: '变美专家老王',
    visitType: 'second',
    visitTypeName: '二次到院',
    dealDate: '2026-06-22',
    dealAmount: 20000,
    commissionRate: 0.10,
    commissionAmount: 2000,
    status: 'pending',
    statusName: '待确认',
    isGift: false,
    hasRefund: false,
    refundAdjustAmount: 0,
    finalCommission: 2000,
    notes: '分期付款首期，按实付计算'
  },
  {
    id: 'com002',
    consultationId: 'cons002',
    customerId: 'c002',
    customerName: '李小姐',
    influencerId: 'inf002',
    influencerName: '医美测评Lily',
    visitType: 'second',
    visitTypeName: '二次到院',
    dealDate: '2026-06-22',
    dealAmount: 5080,
    commissionRate: 0.08,
    commissionAmount: 406.4,
    status: 'confirmed',
    statusName: '已确认',
    isGift: true,
    hasRefund: false,
    refundAdjustAmount: 0,
    finalCommission: 406.4,
    notes: '赠送皮肤检测不计入佣金'
  },
  {
    id: 'com003',
    consultationId: 'cons003',
    customerId: 'c003',
    customerName: '张女士',
    influencerId: 'inf001',
    influencerName: '美丽日记小美',
    visitType: 'first',
    visitTypeName: '首诊成交',
    dealDate: '2026-06-22',
    dealAmount: 5660,
    commissionRate: 0.25,
    commissionAmount: 1415,
    status: 'adjusted',
    statusName: '已调整',
    isGift: false,
    hasRefund: true,
    refundAdjustAmount: 425,
    finalCommission: 1415,
    notes: '改项目退款后重新计算，原佣金1840，调整为1415'
  },
  {
    id: 'com004',
    consultationId: 'cons005',
    customerId: 'c005',
    customerName: '刘女士',
    influencerId: 'inf001',
    influencerName: '美丽日记小美',
    visitType: 'followup',
    visitTypeName: '后续到院',
    dealDate: '2026-06-22',
    dealAmount: 1280,
    commissionRate: 0.10,
    commissionAmount: 128,
    status: 'confirmed',
    statusName: '已确认',
    isGift: false,
    hasRefund: false,
    refundAdjustAmount: 0,
    finalCommission: 128,
    notes: '归因选择：达人渠道'
  },
  {
    id: 'com005',
    consultationId: 'cons007',
    customerId: 'c008',
    customerName: '吴女士',
    influencerId: 'inf003',
    influencerName: '变美专家老王',
    visitType: 'second',
    visitTypeName: '二次到院',
    dealDate: '2026-06-22',
    dealAmount: 21600,
    commissionRate: 0.12,
    commissionAmount: 2592,
    status: 'confirmed',
    statusName: '已确认',
    isGift: true,
    hasRefund: false,
    refundAdjustAmount: 0,
    finalCommission: 2592,
    notes: '赠送面膜不计入佣金'
  },
  {
    id: 'com006',
    consultationId: 'cons008',
    customerId: 'c010',
    customerName: '郑小姐',
    influencerId: 'inf002',
    influencerName: '医美测评Lily',
    visitType: 'second',
    visitTypeName: '二次到院',
    dealDate: '2026-06-21',
    dealAmount: 2660,
    commissionRate: 0.08,
    commissionAmount: 212.8,
    status: 'paid',
    statusName: '已结算',
    isGift: false,
    hasRefund: false,
    refundAdjustAmount: 0,
    finalCommission: 212.8,
    notes: ''
  }
]

export const todayReport: DailyReport = {
  date: '2026-06-22',
  storeName: '北京朝阳旗舰店',
  totalArrivals: 42,
  influencerArrivals: 28,
  firstVisits: 18,
  secondVisits: 24,
  totalDeals: 21,
  firstVisitDeals: 8,
  secondVisitDeals: 13,
  firstVisitDealRate: '44.4%',
  secondVisitDealRate: '54.2%',
  totalDealAmount: 268560,
  totalCommissionEstimate: 26853.4,
  commissionFirstVisit: 18200,
  commissionSecondVisit: 8653.4,
  pendingVerifications: 3,
  pendingVerificationList: ['139****1111', '186****2222', '150****3333'],
  topInfluencers: [
    {
      id: 'inf003',
      name: '变美专家老王',
      arrivals: 12,
      deals: 6,
      commission: 4592
    },
    {
      id: 'inf001',
      name: '美丽日记小美',
      arrivals: 8,
      deals: 5,
      commission: 1543
    },
    {
      id: 'inf002',
      name: '医美测评Lily',
      arrivals: 5,
      deals: 4,
      commission: 406.4
    }
  ]
}

export const getPendingConsultations = (): ConsultationRecord[] => {
  return consultationRecords.filter(c => c.dealStatus === 'pending')
}

export const getTodayConsultations = (): ConsultationRecord[] => {
  const today = '2026-06-22'
  return consultationRecords.filter(c => c.date === today)
}

export const getConsultationById = (id: string): ConsultationRecord | undefined => {
  return consultationRecords.find(c => c.id === id)
}

export const getConsultationsByCustomer = (customerId: string): ConsultationRecord[] => {
  return consultationRecords.filter(c => c.customerId === customerId)
}

export const getTodayCommissions = (): CommissionRecord[] => {
  const today = '2026-06-22'
  return commissionRecords.filter(c => c.dealDate === today)
}

export const getCommissionsByInfluencer = (influencerId: string): CommissionRecord[] => {
  return commissionRecords.filter(c => c.influencerId === influencerId)
}

export const calculateCommission = (
  amount: number,
  influencerId: string,
  visitType: 'first' | 'second' | 'followup'
): number => {
  const influencer = getInfluencerById(influencerId)
  if (!influencer) return 0
  const rate = visitType === 'first' ? influencer.commissionRateFirst : influencer.commissionRateSecond
  return Math.round(amount * rate * 100) / 100
}
