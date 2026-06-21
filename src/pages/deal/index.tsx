import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, ScrollView, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classNames from 'classnames'
import { useStore } from '@/store/useStore'
import { ConsultationRecord, Project } from '@/types'
import { formatAmount, formatRate, getVisitTypeName, getCommissionRate, getSourceChannelName } from '@/utils/commission'
import { projects, getProjectsByIds } from '@/data/projects'
import { getInfluencerById } from '@/data/influencers'
import styles from './index.module.scss'

type TabType = 'pending' | 'verified'

const DealPage: React.FC = () => {
  const {
    consultations,
    customers,
    pendingDealConsultationId,
    setPendingDealConsultationId,
    updateConsultation,
    addInstallment,
    confirmDeal,
    toggleGift
  } = useStore()

  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ConsultationRecord | null>(null)

  const [editProjects, setEditProjects] = useState<string[]>([])
  const [editTotalAmount, setEditTotalAmount] = useState('')
  const [editPaidAmount, setEditPaidAmount] = useState('')
  const [editPayMethod, setEditPayMethod] = useState('微信支付')
  const [editIsGift, setEditIsGift] = useState(false)
  const [editGiftProjects, setEditGiftProjects] = useState<string[]>([])

  const { pendingList, verifiedList, stats } = useMemo(() => {
    const pending: ConsultationRecord[] = []
    const verified: ConsultationRecord[] = []
    consultations.forEach(c => {
      if (c.dealStatus === 'pending' || c.dealStatus === 'not_dealed') {
        pending.push(c)
      } else {
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
        setTimeout(() => openEditPanel(target), 300)
      }
    }
  }, [pendingDealConsultationId, consultations])

  const openEditPanel = (record: ConsultationRecord) => {
    setEditingRecord(record)
    setEditProjects([...record.interestedProjects])
    setEditTotalAmount(String(record.totalAmount || 0))
    setEditPaidAmount('')
    setEditPayMethod('微信支付')
    setEditIsGift(record.hasGift || false)
    setEditGiftProjects([...record.giftProjectNames])
    setShowEditPanel(true)
  }

  const closeEditPanel = () => {
    setShowEditPanel(false)
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
    const customer = customers.find(c => c.id === customerId)
    return customer
  }

  const handleSave = () => {
    if (!editingRecord) return
    const newTotal = parseFloat(editTotalAmount) || 0
    const newPaid = parseFloat(editPaidAmount) || 0
    const projectNames = getProjectsByIds(editProjects).map(p => p.name)
    const influencer = getInfluencerById(editingRecord.influencerId || '')
    const rate = influencer
      ? (editingRecord.visitType === 'first' ? influencer.commissionRateFirst : influencer.commissionRateSecond)
      : 0

    updateConsultation(editingRecord.id, {
      interestedProjects: editProjects,
      interestedProjectNames: projectNames,
      totalAmount: newTotal
    })

    if (newPaid > 0) {
      addInstallment(editingRecord.id, newPaid, editPayMethod)
    }

    toggleGift(editingRecord.id, editIsGift, editGiftProjects)

    Taro.showToast({ title: '信息已更新', icon: 'success' })
    closeEditPanel()
  }

  const handleVerifyAndSave = () => {
    if (!editingRecord) return
    handleSave()
    setTimeout(() => {
      confirmDeal(editingRecord.id, true)
      Taro.showToast({ title: '成交确认成功', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/commission/index' })
      }, 800)
    }, 400)
  }

  const listData = activeTab === 'pending' ? pendingList : verifiedList

  const renderDealCard = (record: ConsultationRecord) => {
    const isVerified = record.dealStatus !== 'pending' && record.dealStatus !== 'not_dealed'
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
              <Text style={{ fontSize: '22rpx', color: '#86909C', marginLeft: '12rpx', fontWeight: 'normal' }}>
                {record.phoneLast4 && `****${record.phoneLast4}`}
              </Text>
            </View>
            <View className={styles.meta}>
              {getVisitTypeName(record.visitType)} · {record.date} {record.time} · {record.consultantName}
            </View>
          </View>
          <View className={classNames(styles.statusBadge, { [styles.statusBadgeVerified]: isVerified })}>
            {isVerified ? '✅ 已确认' : '⏰ 待核对'}
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
                onClick={() => openEditPanel(record)}
              >
                👁️ 查看详情
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
          <View className={styles.label}>总数</View>
        </View>
        <View className={classNames(styles.statCard, styles.statCardThird)}>
          <View className={styles.num}>{stats.pending}</View>
          <View className={styles.label}>待确认</View>
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
          ⏰ 待确认
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
            <View>{activeTab === 'pending' ? '暂无待确认的成交，做得很好！' : '还没有已确认的成交'}</View>
          </View>
        ) : (
          listData.map(renderDealCard)
        )}
      </ScrollView>

      {showEditPanel && editingRecord && (
        <>
          <View className={styles.mask} onClick={closeEditPanel} />
          <View className={styles.editPanel}>
            <View className={styles.editPanelHeader}>
              <View className={styles.title}>
                {activeTab === 'pending' ? '✅ 成交核对确认' : '✏️ 编辑成交信息'}
              </View>
              <View className={styles.close} onClick={closeEditPanel}>✕</View>
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
                      <Text style={{ fontSize: '20rpx', opacity: 0.7, marginLeft: '6rpx' }}>
                        {formatAmount(p.price)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.formGroup}>
                <View className={styles.formLabel}>🎁 赠送项目设置</View>
                <View style={{ marginBottom: '16rpx' }}>
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
                    <View className={styles.inputLabel}>本次收款金额（元）</View>
                    <Input
                      className={styles.input}
                      type='digit'
                      value={editPaidAmount}
                      onInput={(e) => setEditPaidAmount(e.detail.value)}
                      placeholder='0表示不追加'
                    />
                  </View>
                </View>
              </View>

              {parseFloat(editPaidAmount || '0') > 0 && (
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

              <View className={styles.formGroup}>
                <View className={styles.formLabel}>📊 佣金预估预览</View>
                <View style={{ padding: '24rpx', background: 'rgba(39, 174, 96, 0.08)', borderRadius: '16rpx' }}>
                  <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12rpx' }}>
                    <Text style={{ fontSize: '24rpx', color: '#4E5969' }}>
                      佣金基数：已付 {formatAmount(parseFloat(editPaidAmount || '0') + editingRecord.paidAmount)}
                    </Text>
                    <Text style={{ fontSize: '24rpx', color: '#4E5969' }}>
                      比例 {formatRate(getCommissionRate(editingRecord.influencerId || '', editingRecord.visitType))}
                    </Text>
                  </View>
                  <View style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#27AE60' }}>
                    预估佣金 = {formatAmount(
                      (parseFloat(editPaidAmount || '0') + editingRecord.paidAmount) *
                      getCommissionRate(editingRecord.influencerId || '', editingRecord.visitType)
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className={styles.editPanelFooter}>
              <View className={classNames(styles.panelBtn, styles.panelBtnSecondary)} onClick={closeEditPanel}>
                取消
              </View>
              <View className={classNames(styles.panelBtn, styles.panelBtnPrimary)} onClick={handleSave}>
                💾 保存修改
              </View>
              {activeTab === 'pending' && (
                <View className={classNames(styles.panelBtn, styles.panelBtnPrimary)}
                  style={{ background: 'linear-gradient(135deg, #27AE60 0%, #2ECC71 100%)' }}
                  onClick={handleVerifyAndSave}
                >
                  ✅ 确认成交
                </View>
              )}
            </View>
          </View>
        </>
      )}
    </View>
  )
}

export default DealPage
