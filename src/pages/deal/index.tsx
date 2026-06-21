import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, Input, Image, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classNames from 'classnames'
import { useStore } from '@/store/useStore'
import { ConsultationRecord, Project } from '@/types'
import { formatAmount, formatRate, getVisitTypeName, getCommissionRate, getSourceChannelName } from '@/utils/commission'
import { projects, getProjectsByIds } from '@/data/projects'
import { getInfluencerById } from '@/data/influencers'
import styles from './index.module.scss'

type TabType = 'pending' | 'verified'
type PanelType = 'edit' | 'refund' | null

const DealPage: React.FC = () => {
  const {
    consultations,
    customers,
    pendingDealConsultationId,
    updateConsultation,
    addInstallment,
    addRefund,
    confirmDeal,
    toggleGift,
    updateTotalAmount
  } = useStore()

  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [panelType, setPanelType] = useState<PanelType>(null)
  const [editingRecord, setEditingRecord] = useState<ConsultationRecord | null>(null)

  const [editProjects, setEditProjects] = useState<string[]>([])
  const [editTotalAmount, setEditTotalAmount] = useState('')
  const [editAddPayment, setEditAddPayment] = useState('')
  const [editPayMethod, setEditPayMethod] = useState('微信支付')
  const [editIsGift, setEditIsGift] = useState(false)
  const [editGiftProjects, setEditGiftProjects] = useState<string[]>([])

  const [refundProject, setRefundProject] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundOriginal, setRefundOriginal] = useState('')

  const { pendingList, verifiedList, stats } = useMemo(() => {
    const pending: ConsultationRecord[] = []
    const verified: ConsultationRecord[] = []
    consultations.forEach(c => {
      if (c.dealStatus === 'to_verify') {
        pending.push(c)
      } else if (c.dealStatus === 'dealed' || c.dealStatus === 'partly_paid') {
        verified.push(c)
      }
    })
    const totalCommission = verified.reduce((s, c) => s + (c.commissionFinal || 0), 0)
    return {
      pendingList: pending,
      verifiedList: verified,
      stats: {
        total: consultations.length,
        pending: pending.length,
        verified: verified.length,
        commission: totalCommission
      }
    }
  }, [consultations])

  useEffect(() => {
    if (pendingDealConsultationId) {
      const target = consultations.find(c => c.id === pendingDealConsultationId)
      if (target) {
        setActiveTab('pending')
        setTimeout(() => openEditPanel(target), 200)
      }
    }
  }, [pendingDealConsultationId, consultations])

  const openEditPanel = (record: ConsultationRecord) => {
    setEditingRecord(record)
    setEditProjects([...record.interestedProjects])
    setEditTotalAmount(String(record.totalAmount || 0))
    setEditAddPayment('')
    setEditPayMethod('微信支付')
    setEditIsGift(record.hasGift || false)
    setEditGiftProjects([...record.giftProjectNames])
    setPanelType('edit')
  }

  const openRefundPanel = (record: ConsultationRecord) => {
    setEditingRecord(record)
    setRefundProject(record.interestedProjectNames[0] || '')
    setRefundOriginal(record.interestedProjectNames[0] || '')
    setRefundAmount('')
    setRefundReason('')
    setPanelType('refund')
  }

  const closePanel = () => {
    setPanelType(null)
    setEditingRecord(null)
  }

  const toggleProject = (projectId: string) => {
    setEditProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(p => p !== projectId)
        : [...prev, projectId]
    )
  }

  const toggleGiftProject = (name: string) => {
    setEditGiftProjects(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    )
  }

  const getCustomerAttribution = (customerId: string) => {
    return customers.find(c => c.id === customerId)
  }

  const livePreview = useMemo(() => {
    if (!editingRecord) return null
    const total = parseFloat(editTotalAmount) || 0
    const addPay = parseFloat(editAddPayment) || 0
    const newPaid = editingRecord.paidAmount + addPay
    const newRemaining = Math.max(0, total - newPaid)
    const rate = getCommissionRate(editingRecord.influencerId || '', editingRecord.visitType)
    const commission = Math.round(newPaid * rate * 100) / 100
    return { total, addPay, newPaid, newRemaining, rate, commission }
  }, [editingRecord, editTotalAmount, editAddPayment])

  const handleSaveEdit = () => {
    if (!editingRecord) return
    const newTotal = parseFloat(editTotalAmount) || 0
    const addPay = parseFloat(editAddPayment) || 0
    const projectNames = getProjectsByIds(editProjects).map(p => p.name)

    updateConsultation(editingRecord.id, {
      interestedProjects: editProjects,
      interestedProjectNames: projectNames
    })

    updateTotalAmount(editingRecord.id, newTotal)

    if (addPay > 0) {
      addInstallment(editingRecord.id, addPay, editPayMethod)
    }

    toggleGift(editingRecord.id, editIsGift, editGiftProjects)

    Taro.showToast({ title: '修改已保存', icon: 'success' })
    closePanel()
  }

  const handleVerifyConfirm = () => {
    if (!editingRecord) return
    handleSaveEdit()
    setTimeout(() => {
      confirmDeal(editingRecord.id)
      Taro.showToast({ title: '成交确认成功', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/commission/index' })
      }, 800)
    }, 300)
  }

  const handleRefundSave = () => {
    if (!editingRecord) return
    const amount = parseFloat(refundAmount) || 0
    if (amount <= 0) {
      Taro.showToast({ title: '请输入退款金额', icon: 'none' })
      return
    }
    if (!refundReason.trim()) {
      Taro.showToast({ title: '请填写退款原因', icon: 'none' })
      return
    }
    if (amount > editingRecord.paidAmount) {
      Taro.showToast({ title: '退款金额不能大于已收款', icon: 'none' })
      return
    }
    addRefund(editingRecord.id, {
      originalProject: refundOriginal,
      newProject: refundProject !== refundOriginal ? refundProject : undefined,
      amount: 0,
      refundAmount: amount,
      reason: refundReason
    })
    Taro.showToast({ title: '退款已登记，佣金已重算', icon: 'success' })
    closePanel()
  }

  const listData = activeTab === 'pending' ? pendingList : verifiedList

  const renderDealCard = (record: ConsultationRecord) => {
    const isVerified = record.dealStatus !== 'to_verify'
    const customer = getCustomerAttribution(record.customerId)
    const influencer = getInfluencerById(record.influencerId || '')
    const rate = getCommissionRate(record.influencerId || '', record.visitType)

    return (
      <View
        key={record.id}
        className={classNames(styles.dealCard, { [styles.dealCardVerified]: isVerified })}
      >
        <View className={styles.dealCardHeader}>
          <View className={styles.customerInfo}>
            <View className={styles.name}>
              👤 {record.customerName}
              <Text style={{ fontSize: 24, color: '#86909C', marginLeft: 12, fontWeight: 'normal' }}>
                {record.phoneLast4 && `****${record.phoneLast4}`}
              </Text>
            </View>
            <View className={styles.meta}>
              {getVisitTypeName(record.visitType)} · {record.date} {record.time} · {record.consultantName}
            </View>
          </View>
          <View className={classNames(styles.statusBadge, { [styles.statusBadgeVerified]: isVerified })}>
            {record.dealStatus === 'to_verify' ? '⏰ 待核对' : record.dealStatus === 'partly_paid' ? '💳 分期中' : '✅ 已成交'}
          </View>
        </View>

        <View className={styles.dealCardBody}>
          <View className={styles.sectionBlock}>
            <View className={styles.sectionLabel}>💼 成交项目（{record.interestedProjectNames.length}项）</View>
            <View className={styles.projectList}>
              {record.interestedProjectNames.map((name, idx) => {
                const proj = record.interestedProjects[idx]
                  ? projects.find(p => p.id === record.interestedProjects[idx])
                  : null
                const isGift = record.hasGift && record.giftProjectNames.includes(name)
                return (
                  <View key={idx} className={styles.projectItem}>
                    <View className={styles.name}>
                      {name}
                      {isGift && <Text className={styles.gift}>🎁 赠送</Text>}
                    </View>
                    <View className={styles.price}>
                      {proj ? formatAmount(proj.price) : '-'}
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          <View className={styles.sectionBlock}>
            <View className={styles.sectionLabel}>💰 金额明细</View>
            <View className={styles.amountGrid}>
              <View className={styles.amountItem}>
                <View className={styles.label}>成交总金额</View>
                <View className={classNames(styles.value, styles.totalValue)}>
                  {formatAmount(record.totalAmount)}
                </View>
              </View>
              <View className={styles.amountItem}>
                <View className={styles.label}>已收金额</View>
                <View className={classNames(styles.value, styles.paidValue)}>
                  {formatAmount(record.paidAmount)}
                </View>
              </View>
              <View className={styles.amountItem}>
                <View className={styles.label}>待收金额</View>
                <View className={classNames(styles.value, styles.remainValue)}>
                  {formatAmount(record.remainingAmount)}
                </View>
              </View>
              <View className={styles.amountItem}>
                <View className={styles.label}>预估佣金（{formatRate(rate)}）</View>
                <View className={classNames(styles.value, styles.commissionValue)}>
                  {formatAmount(record.commissionFinal || 0)}
                </View>
              </View>
            </View>
          </View>

          {record.installments && record.installments.length > 0 && (
            <View className={styles.sectionBlock}>
              <View className={styles.sectionLabel}>💳 收款记录（{record.installments.length}笔）</View>
              <View className={styles.paymentList}>
                {record.installments.map(ins => (
                  <View key={ins.id} className={styles.paymentItem}>
                    <View>
                      <View className={styles.method}>{ins.method} · {ins.operator}</View>
                      <View className={styles.date}>{ins.date}</View>
                    </View>
                    <View className={styles.amount}>+{formatAmount(ins.amount)}</View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {record.refundRecords && record.refundRecords.length > 0 && (
            <View className={styles.sectionBlock}>
              <View className={styles.sectionLabel}>↩️ 退款记录（{record.refundRecords.length}笔）</View>
              <View className={styles.paymentList}>
                {record.refundRecords.map(ref => (
                  <View key={ref.id} className={styles.paymentItem}>
                    <View>
                      <View className={styles.method} style={{ color: '#EB5757' }}>{ref.originalProject} 退款</View>
                      <View className={styles.date}>{ref.date} · 原因：{ref.reason}</View>
                    </View>
                    <View className={styles.amount} style={{ color: '#EB5757' }}>-{formatAmount(ref.refundAmount)}</View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className={styles.sectionBlock}>
            <View className={styles.sectionLabel}>🎯 归因信息</View>
            <View className={styles.attributionBox}>
              <View className={styles.row}>
                <View className={styles.label}>获客渠道</View>
                <View className={styles.value}>
                  {customer?.attribution?.channel
                    ? getSourceChannelName(customer.attribution.channel)
                    : record.influencerName ? '达人探店' : '未设置'}
                </View>
              </View>
              <View className={styles.row}>
                <View className={styles.label}>关联达人</View>
                <View className={classNames(styles.value, styles.influencer)}>
                  {record.influencerName || influencer?.name || '未关联'}
                </View>
              </View>
              <View className={styles.row}>
                <View className={styles.label}>佣金比例</View>
                <View className={styles.value}>
                  {influencer
                    ? `首诊${formatRate(influencer.commissionRateFirst)} / 二诊${formatRate(influencer.commissionRateSecond)}`
                    : '-'}
                </View>
              </View>
              {customer?.attributionReason && (
                <View className={styles.reason}>
                  📝 归因说明：{customer.attributionReason}
                </View>
              )}
            </View>
          </View>
        </View>

        <View className={styles.dealCardFooter}>
          {!isVerified ? (
            <>
              <View
                className={classNames(styles.btn, styles.btnOutline)}
                onClick={() => openRefundPanel(record)}
              >
                ↩️ 退款
              </View>
              <View
                className={classNames(styles.btn, styles.btnOutline)}
                onClick={() => openEditPanel(record)}
              >
                ✏️ 修改信息
              </View>
              <View
                className={classNames(styles.btn, styles.btnSuccess)}
                onClick={() => {
                  openEditPanel(record)
                }}
              >
                ✅ 核对确认
              </View>
            </>
          ) : (
            <>
              <View
                className={classNames(styles.btn, styles.btnSecondary)}
                onClick={() => openRefundPanel(record)}
              >
                ↩️ 退款
              </View>
              <View
                className={classNames(styles.btn, styles.btnOutline)}
                onClick={() => openEditPanel(record)}
              >
                ✏️ 追加/修改
              </View>
              <View
                className={classNames(styles.btn, styles.btnPrimary)}
                onClick={() => Taro.switchTab({ url: '/pages/commission/index' })}
              >
                📊 查看佣金
              </View>
            </>
          )}
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <View className={styles.num}>{stats.total}</View>
          <View className={styles.label}>面诊总数</View>
        </View>
        <View className={classNames(styles.statCard, styles.statCardThird)}>
          <View className={styles.num}>{stats.pending}</View>
          <View className={styles.label}>待核对</View>
        </View>
        <View className={classNames(styles.statCard, styles.statCardSecond)}>
          <View className={styles.num}>{stats.verified}</View>
          <View className={styles.label}>已确认</View>
        </View>
        <View className={classNames(styles.statCard, styles.statCardFourth)}>
          <View className={styles.num}>{formatAmount(stats.commission).slice(0, 6)}</View>
          <View className={styles.label}>佣金(¥)</View>
        </View>
      </View>

      <View className={styles.tabs}>
        <View
          className={classNames(styles.tab, { [styles.tabActive]: activeTab === 'pending' })}
          onClick={() => setActiveTab('pending')}
        >
          ⏰ 待核对
          {pendingList.length > 0 && <View className={styles.badge}>{pendingList.length}</View>}
        </View>
        <View
          className={classNames(styles.tab, { [styles.tabActive]: activeTab === 'verified' })}
          onClick={() => setActiveTab('verified')}
        >
          ✅ 已确认
        </View>
      </View>

      <ScrollView className={styles.listContainer} scrollY>
        {listData.length === 0 ? (
          <View className={styles.emptyHint}>
            <View className={styles.emoji}>{activeTab === 'pending' ? '🎉' : '📝'}</View>
            <View>{activeTab === 'pending' ? '暂无待核对的成交，做得很好！' : '还没有已确认的成交记录'}</View>
          </View>
        ) : (
          listData.map(renderDealCard)
        )}
      </ScrollView>

      {panelType === 'edit' && editingRecord && (
        <>
          <View className={styles.mask} onClick={closePanel} />
          <View className={styles.editPanel}>
            <View className={styles.editPanelHeader}>
              <View className={styles.title}>
                ✏️ 核对成交信息
              </View>
              <View className={styles.close} onClick={closePanel}>✕</View>
            </View>

            <ScrollView className={styles.editPanelBody} scrollY>
              <View className={styles.formGroup}>
                <View className={classNames(styles.formLabel, styles.required)}>
                  💼 选择成交项目
                </View>
                <View className={styles.projectCheckList}>
                  {projects.slice(0, 12).map(p => (
                    <View
                      key={p.id}
                      className={classNames(styles.projectCheck, {
                        [styles.projectCheckChecked]: editProjects.includes(p.id)
                      })}
                      onClick={() => toggleProject(p.id)}
                    >
                      {editProjects.includes(p.id) && '✓ '}
                      {p.name}
                      <Text style={{ fontSize: 20, opacity: 0.7, marginLeft: 6 }}>
                        {formatAmount(p.price)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.formGroup}>
                <View className={styles.formLabel}>🎁 赠送项目设置</View>
                <View style={{ marginBottom: 16 }}>
                  <View
                    className={classNames(styles.projectCheck, {
                      [styles.projectCheckChecked]: editIsGift
                    })}
                    style={{ display: 'inline-block' }}
                    onClick={() => setEditIsGift(!editIsGift)}
                  >
                    {editIsGift ? '✓ ' : ''}
                    含赠送项目
                  </View>
                </View>
                {editIsGift && (
                  <View className={styles.projectCheckList}>
                    {['免费皮肤检测', '免费补水面膜', '免费术后护理', 'VIP会员升级'].map(name => (
                      <View
                        key={name}
                        className={classNames(styles.projectCheck, {
                          [styles.projectCheckChecked]: editGiftProjects.includes(name)
                        })}
                        onClick={() => toggleGiftProject(name)}
                      >
                        {editGiftProjects.includes(name) ? '✓ ' : ''}
                        {name}
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View className={styles.formGroup}>
                <View className={classNames(styles.formLabel, styles.required)}>💰 金额录入</View>
                <View className={styles.inputRow}>
                  <View className={styles.inputItem}>
                    <View className={styles.inputLabel}>成交总金额（元）</View>
                    <Input
                      className={styles.input}
                      type='digit'
                      value={editTotalAmount}
                      onInput={(e) => setEditTotalAmount(e.detail.value)}
                      placeholder='请输入总金额'
                    />
                  </View>
                  <View className={styles.inputItem}>
                    <View className={styles.inputLabel}>本次追加收款（元）</View>
                    <Input
                      className={styles.input}
                      type='digit'
                      value={editAddPayment}
                      onInput={(e) => setEditAddPayment(e.detail.value)}
                      placeholder='0表示不追加'
                    />
                  </View>
                </View>
              </View>

              {parseFloat(editAddPayment || '0') > 0 && (
                <View className={styles.formGroup}>
                  <View className={classNames(styles.formLabel, styles.required)}>💳 选择付款方式</View>
                  <View className={styles.methodList}>
                    {['微信支付', '支付宝', '银行卡', '现金', '医疗分期'].map(m => (
                      <View
                        key={m}
                        className={classNames(styles.methodOption, {
                          [styles.methodOptionChecked]: editPayMethod === m
                        })}
                        onClick={() => setEditPayMethod(m)}
                      >
                        {m}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {livePreview && (
                <View className={styles.formGroup}>
                  <View className={styles.formLabel}>📊 实时预览</View>
                  <View style={{ padding: 24, background: 'rgba(39, 174, 96, 0.08)', borderRadius: 16 }}>
                    <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <Text style={{ fontSize: 24, color: '#4E5969' }}>
                        总金额：{formatAmount(livePreview.total)}
                      </Text>
                      <Text style={{ fontSize: 24, color: '#4E5969' }}>
                        已付：{formatAmount(livePreview.newPaid)}
                      </Text>
                    </View>
                    <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <Text style={{ fontSize: 24, color: '#F2994A' }}>
                        待付：{formatAmount(livePreview.newRemaining)}
                      </Text>
                      <Text style={{ fontSize: 24, color: '#4E5969' }}>
                        比例：{formatRate(livePreview.rate)}
                      </Text>
                    </View>
                    <View style={{ fontSize: 36, fontWeight: 'bold', color: '#27AE60' }}>
                      预估佣金 = {formatAmount(livePreview.commission)}
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <View className={styles.editPanelFooter}>
              <View className={classNames(styles.panelBtn, styles.panelBtnSecondary)} onClick={closePanel}>
                取消
              </View>
              <View className={classNames(styles.panelBtn, styles.panelBtnPrimary)} onClick={handleSaveEdit}>
                💾 保存修改
              </View>
              <View
                className={classNames(styles.panelBtn, styles.panelBtnPrimary)}
                style={{ background: 'linear-gradient(135deg, #27AE60 0%, #2ECC71 100%)' }}
                onClick={handleVerifyConfirm}
              >
                ✅ 确认成交
              </View>
            </View>
          </View>
        </>
      )}

      {panelType === 'refund' && editingRecord && (
        <>
          <View className={styles.mask} onClick={closePanel} />
          <View className={styles.editPanel}>
            <View className={styles.editPanelHeader}>
              <View className={styles.title}>
                ↩️ 退款登记
              </View>
              <View className={styles.close} onClick={closePanel}>✕</View>
            </View>

            <ScrollView className={styles.editPanelBody} scrollY>
              <View className={styles.formGroup}>
                <View className={styles.formLabel}>👤 当前顾客</View>
                <View style={{ padding: 20, background: '#F7F8FA', borderRadius: 12 }}>
                  <Text style={{ fontSize: 28, fontWeight: 600, color: '#1D2129' }}>
                    {editingRecord.customerName} · ****{editingRecord.phoneLast4}
                  </Text>
                  <Text style={{ fontSize: 24, color: '#86909C', marginTop: 8, display: 'block' }}>
                    已收款 {formatAmount(editingRecord.paidAmount)} · 预估佣金 {formatAmount(editingRecord.commissionFinal || 0)}
                  </Text>
                </View>
              </View>

              <View className={styles.formGroup}>
                <View className={classNames(styles.formLabel, styles.required)}>💼 原项目</View>
                <View className={styles.projectCheckList}>
                  {editingRecord.interestedProjectNames.map(name => (
                    <View
                      key={name}
                      className={classNames(styles.projectCheck, {
                        [styles.projectCheckChecked]: refundOriginal === name
                      })}
                      onClick={() => { setRefundOriginal(name); setRefundProject(name) }}
                    >
                      {refundOriginal === name && '✓ '}
                      {name}
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.formGroup}>
                <View className={styles.formLabel}>🔄 改项目（可选，不改为空）</View>
                <View className={styles.projectCheckList}>
                  {editingRecord.interestedProjectNames
                    .filter(n => n !== refundOriginal)
                    .map(name => (
                    <View
                      key={name}
                      className={classNames(styles.projectCheck, {
                        [styles.projectCheckChecked]: refundProject === name && name !== refundOriginal
                      })}
                      onClick={() => setRefundProject(name)}
                    >
                      {refundProject === name && name !== refundOriginal && '✓ '}
                      {name}
                    </View>
                  ))}
                  <View
                    className={classNames(styles.projectCheck, {
                      [styles.projectCheckChecked]: refundProject === ''
                    })}
                    onClick={() => setRefundProject('')}
                  >
                    {refundProject === '' && '✓ '}
                    不更换
                  </View>
                </View>
              </View>

              <View className={styles.formGroup}>
                <View className={classNames(styles.formLabel, styles.required)}>💰 退款金额（元）</View>
                <Input
                  className={styles.input}
                  style={{ width: '100%', height: 88, background: '#F7F8FA', borderRadius: 12, padding: '0 20rpx', fontSize: 32, boxSizing: 'border-box' }}
                  type='digit'
                  value={refundAmount}
                  onInput={(e) => setRefundAmount(e.detail.value)}
                  placeholder='请输入退款金额'
                />
                <Text style={{ fontSize: 22, color: '#86909C', marginTop: 8, display: 'block' }}>
                  最多可退 {formatAmount(editingRecord.paidAmount)}，退款后佣金将自动重算
                </Text>
              </View>

              <View className={styles.formGroup}>
                <View className={classNames(styles.formLabel, styles.required)}>📝 退款原因</View>
                <Input
                  style={{ width: '100%', height: 88, background: '#F7F8FA', borderRadius: 12, padding: '0 20rpx', fontSize: 28, boxSizing: 'border-box' }}
                  value={refundReason}
                  onInput={(e) => setRefundReason(e.detail.value)}
                  placeholder='请填写退款原因（如：顾客不满意、改项目差价等）'
                />
              </View>
            </ScrollView>

            <View className={styles.editPanelFooter}>
              <View className={classNames(styles.panelBtn, styles.panelBtnSecondary)} onClick={closePanel}>
                取消
              </View>
              <View
                className={classNames(styles.panelBtn, styles.panelBtnPrimary)}
                style={{ background: 'linear-gradient(135deg, #EB5757 0%, #F2994A 100%)' }}
                onClick={handleRefundSave}
              >
                ↩️ 确认退款
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  )
}

export default DealPage
