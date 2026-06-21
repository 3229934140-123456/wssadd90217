import React, { useState, useMemo } from 'react'
import { View, Text, Button, Input, Textarea, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import PageCard from '@/components/PageCard'
import Tag from '@/components/Tag'
import Empty from '@/components/Empty'
import { useStore } from '@/store/useStore'
import { ConsultationRecord } from '@/types'
import {
  formatAmount,
  formatRate,
  getVisitTypeName,
  getDealStatusName,
  getCommissionRate,
  calculateCommissionAmount
} from '@/utils/commission'
import { projects, getPaidProjects } from '@/data/projects'

type TabType = 'all' | 'pending' | 'dealed' | 'partly'

const ConsultationPage: React.FC = () => {
  const { consultations, updateConsultation, addInstallment, setPendingDealConsultationId, recalculateConsultationCommission, markToVerify } = useStore()

  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [editingRecord, setEditingRecord] = useState<ConsultationRecord | null>(null)
  const [showModal, setShowModal] = useState(false)

  const [editProjects, setEditProjects] = useState<string[]>([])
  const [editStatus, setEditStatus] = useState<string>('pending')
  const [editTotalAmount, setEditTotalAmount] = useState('0')
  const [editPaidAmount, setEditPaidAmount] = useState('0')
  const [editAddInstallment, setEditAddInstallment] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const tabs = [
    { key: 'all', label: '全部', count: consultations.length },
    { key: 'pending', label: '待确认', count: consultations.filter(c => c.dealStatus === 'pending').length },
    { key: 'dealed', label: '已成交', count: consultations.filter(c => c.dealStatus === 'dealed').length },
    { key: 'partly', label: '分期中', count: consultations.filter(c => c.dealStatus === 'partly_paid').length }
  ]

  const filteredList = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return consultations.filter(c => c.dealStatus === 'pending')
      case 'dealed':
        return consultations.filter(c => c.dealStatus === 'dealed')
      case 'partly':
        return consultations.filter(c => c.dealStatus === 'partly_paid')
      default:
        return consultations
    }
  }, [activeTab, consultations])

  const pendingNum = consultations.filter(c => c.dealStatus === 'pending').length
  const dealedNum = consultations.filter(c => c.dealStatus === 'dealed').length
  const partlyNum = consultations.filter(c => c.dealStatus === 'partly_paid').length
  const totalCommission = consultations.reduce((sum, c) => sum + (c.commissionFinal || 0), 0)

  const paidProjects = getPaidProjects()

  const handleEdit = (record: ConsultationRecord) => {
    setEditingRecord(record)
    setEditProjects(record.interestedProjects)
    setEditStatus(record.dealStatus)
    setEditTotalAmount(record.totalAmount.toString())
    setEditPaidAmount(record.paidAmount.toString())
    setEditAddInstallment('')
    setEditNotes(record.notes)
    setShowModal(true)
  }

  const handleSaveEdit = () => {
    if (!editingRecord) return

    const total = parseFloat(editTotalAmount) || 0
    const addInst = parseFloat(editAddInstallment) || 0
    const newStatus = editStatus as ConsultationRecord['dealStatus']

    const selectedProjects = paidProjects.filter(p => editProjects.includes(p.id))
    const projectNames = selectedProjects.map(p => p.name)

    updateConsultation(editingRecord.id, {
      interestedProjects: editProjects,
      interestedProjectNames: projectNames,
      totalAmount: total,
      notes: editNotes
    })

    if (addInst > 0) {
      addInstallment(editingRecord.id, addInst, '咨询师录入')
    }

    const isMarkingDeal = (newStatus === 'dealed' || newStatus === 'partly_paid') &&
      (editingRecord.dealStatus === 'pending' || editingRecord.dealStatus === 'to_verify' || editingRecord.dealStatus === 'not_dealed')

    if (isMarkingDeal) {
      markToVerify(editingRecord.id)
      Taro.showToast({ title: '请前往成交确认核对', icon: 'none', duration: 1500 })
      setTimeout(() => {
        setShowModal(false)
        setEditingRecord(null)
        Taro.switchTab({ url: '/pages/deal/index' })
      }, 1000)
    } else {
      recalculateConsultationCommission(editingRecord.id)
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setShowModal(false)
      setEditingRecord(null)
    }
  }

  const toggleProject = (projectId: string) => {
    setEditProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const estimateFirstCommission = (() => {
    const paid = parseFloat(editPaidAmount) || 0
    const add = parseFloat(editAddInstallment) || 0
    const totalPaid = paid + add
    if (!editingRecord || !editingRecord.influencerId) return 0
    return calculateCommissionAmount(totalPaid, editingRecord.influencerId, 'first')
  })()

  const estimateSecondCommission = (() => {
    const paid = parseFloat(editPaidAmount) || 0
    const add = parseFloat(editAddInstallment) || 0
    const totalPaid = paid + add
    if (!editingRecord || !editingRecord.influencerId) return 0
    const vt = editingRecord.visitType === 'first' ? 'second' : editingRecord.visitType
    return calculateCommissionAmount(totalPaid, editingRecord.influencerId, vt)
  })()

  return (
    <View className={styles.page}>
      <View className={styles.tabs}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tab, activeTab === tab.key && styles.tabActive)}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            {tab.label}
            {tab.count > 0 && <View className={styles.badge}>{tab.count}</View>}
          </View>
        ))}
      </View>

      <View className={styles.quickActions} style={{ marginTop: 16 }}>
        <View className={styles.quickAction}>
          <Text className={styles.num}>{pendingNum}</Text>
          <Text className={styles.label}>待确认面诊</Text>
        </View>
        <View className={classnames(styles.quickAction, styles.quickActionSuccess)}>
          <Text className={styles.num}>{dealedNum}</Text>
          <Text className={styles.label}>今日成交</Text>
        </View>
        <View className={classnames(styles.quickAction, styles.quickActionInfo)}>
          <Text className={styles.num}>{partlyNum}</Text>
          <Text className={styles.label}>分期追款</Text>
        </View>
        <View className={styles.quickAction}>
          <Text className={styles.num} style={{ color: '#9B51E0', fontSize: 32 }}>
            {formatAmount(totalCommission)}
          </Text>
          <Text className={styles.label}>预估佣金</Text>
        </View>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 380rpx)' }}>
        <View className={styles.listContainer}>
          {filteredList.length === 0 ? (
            <Empty icon="💆" title="暂无面诊记录" text="当前筛选条件下没有记录" />
          ) : (
            filteredList.map(record => {
              const statusClass = {
                pending: styles.consultCardStatusPending,
                dealed: styles.consultCardStatusDealed,
                not_dealed: styles.consultCardStatusNotDealed,
                partly_paid: styles.consultCardStatusPartly
              }[record.dealStatus]

              const rate = record.influencerId
                ? getCommissionRate(record.influencerId, record.visitType)
                : 0
              const commission = calculateCommissionAmount(
                record.paidAmount,
                record.influencerId || '',
                record.visitType
              )

              return (
                <View key={record.id} className={classnames(styles.consultCard, statusClass)}>
                  <View className={styles.consultCardHeader}>
                    <View className={styles.customerInfo}>
                      <View className={styles.avatar}>👩</View>
                      <View className={styles.info}>
                        <View className={styles.nameRow}>
                          <Text className={styles.name}>{record.customerName}</Text>
                          <Tag type="info">{record.phoneLast4}</Tag>
                        </View>
                        <Text className={styles.meta}>
                          {record.date} {record.time} · {record.consultantName}
                        </Text>
                      </View>
                    </View>
                    <View className={styles.tags}>
                      <Tag type={record.visitType === 'first' ? 'primary' : 'success'}>
                        {getVisitTypeName(record.visitType)}
                      </Tag>
                      <Tag
                        type={{
                          pending: 'warning',
                          dealed: 'success',
                          not_dealed: 'default',
                          partly_paid: 'info'
                        }[record.dealStatus]}
                      >
                        {getDealStatusName(record.dealStatus)}
                      </Tag>
                    </View>
                  </View>

                  <View className={styles.consultCardBody}>
                    <View className={styles.infoGrid}>
                      <View className={styles.gridItem}>
                        <Text className={styles.label}>达人名</Text>
                        <Text className={styles.value}>{record.influencerName || '-'}</Text>
                      </View>
                      <View className={styles.gridItem}>
                        <Text className={styles.label}>佣金比例</Text>
                        <Text className={styles.value} style={{ color: '#9B51E0' }}>
                          {formatRate(rate)}
                        </Text>
                      </View>
                    </View>
                    <Text className={styles.sectionLabel}>感兴趣项目：</Text>
                    <View className={styles.projectTags}>
                      {record.interestedProjectNames.map(name => (
                        <Tag key={name} type="outline">{name}</Tag>
                      ))}
                      {record.hasGift && record.giftProjectNames.map(name => (
                        <Tag key={'gift' + name} type="success">赠：{name}</Tag>
                      ))}
                    </View>
                  </View>

                  {record.totalAmount > 0 && (
                    <View className={styles.amountSection}>
                      <View className={styles.amountItem}>
                        <Text className={styles.amountLabel}>总金额</Text>
                        <Text className={classnames(styles.amountValue, styles.amountValueBig)}>
                          {formatAmount(record.totalAmount)}
                        </Text>
                      </View>
                      <View className={styles.amountDivider} />
                      <View className={styles.amountItem}>
                        <Text className={styles.amountLabel}>已付</Text>
                        <Text className={styles.amountValue}>
                          {formatAmount(record.paidAmount)}
                        </Text>
                      </View>
                      <View className={styles.amountDivider} />
                      <View className={styles.amountItem}>
                        <Text className={styles.amountLabel}>待付</Text>
                        <Text className={styles.amountValue} style={{ color: '#FF7D00' }}>
                          {formatAmount(record.remainingAmount)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {record.influencerId && commission > 0 && (
                    <View className={styles.commissionHint}>
                      <View className={styles.commissionRow}>
                        <Text className={styles.label}>
                          {record.visitType === 'first' ? '首诊佣金预估' : `${getVisitTypeName(record.visitType)}佣金预估`}
                        </Text>
                        <Text className={styles.value}>{formatAmount(commission)}</Text>
                      </View>
                      {record.refundRecords && record.refundRecords.length > 0 && (
                        <View className={styles.commissionRow}>
                          <Text className={styles.label} style={{ color: '#EB5757' }}>
                            退款调整佣金
                          </Text>
                          <Text className={styles.value} style={{ color: '#EB5757' }}>
                            -{formatAmount(record.refundRecords.reduce((s, r) => s + r.refundAmount * rate, 0))}
                          </Text>
                        </View>
                      )}
                      <View className={classnames(styles.commissionRow, styles.commissionRowTotal)}>
                        <Text className={styles.label}>最终佣金</Text>
                        <Text className={styles.value}>
                          {formatAmount(record.commissionFinal || 0)}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className={styles.consultCardFooter}>
                    <Button
                      className={classnames(styles.btn, styles.btnSecondary)}
                      onClick={() => Taro.showToast({ title: '查看详情', icon: 'none' })}
                    >
                      查看详情
                    </Button>
                    {(record.dealStatus === 'partly_paid' || record.remainingAmount > 0) && (
                      <Button
                        className={classnames(styles.btn, styles.btnSuccess)}
                        onClick={() => handleEdit(record)}
                      >
                        追加收款
                      </Button>
                    )}
                    <Button
                      className={classnames(styles.btn, styles.btnPrimary)}
                      onClick={() => handleEdit(record)}
                    >
                      {record.dealStatus === 'pending' ? '确认成交' : '编辑'}
                    </Button>
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>

      {showModal && editingRecord && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'flex-end'
          }}
          onClick={() => setShowModal(false)}
        >
          <View
            style={{
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '32rpx 32rpx 0 0',
              padding: 32,
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <View className={styles.modal}>
              <Text className={styles.modalTitle}>
                {editingRecord.dealStatus === 'pending' ? '确认面诊结果' : '编辑面诊记录'}
              </Text>

              <View className={styles.section}>
                <Text className={styles.sectionTitle}>选择感兴趣项目</Text>
                <View className={styles.projectOptions}>
                  {paidProjects.slice(0, 10).map(p => (
                    <View
                      key={p.id}
                      className={classnames(
                        styles.projectOption,
                        editProjects.includes(p.id) && styles.projectOptionActive
                      )}
                      onClick={() => toggleProject(p.id)}
                    >
                      {p.name}
                      <Text style={{ marginLeft: 8, fontSize: 22, color: editProjects.includes(p.id) ? '#9B51E0' : '#86909C' }}>
                        ¥{p.price}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.section}>
                <Text className={styles.sectionTitle}>成交状态</Text>
                <View className={styles.statusOptions}>
                  {[
                    { key: 'pending', text: '待定', desc: '顾客还在考虑' },
                    { key: 'dealed', text: '已成交', desc: '款项已结清' },
                    { key: 'not_dealed', text: '未成交', desc: '不打算做' }
                  ].map(s => (
                    <View
                      key={s.key}
                      className={classnames(
                        styles.statusOption,
                        editStatus === s.key && styles.statusOptionActive
                      )}
                      onClick={() => setEditStatus(s.key)}
                    >
                      <Text
                        className={classnames(
                          styles.statusText,
                          editStatus === s.key && styles.statusTextActive
                        )}
                      >
                        {s.text}
                      </Text>
                      <Text className={styles.statusDesc}>{s.desc}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {editStatus !== 'not_dealed' && (
                <>
                  <View className={styles.section}>
                    <Text className={styles.sectionTitle}>金额录入</Text>
                    <View className={styles.amountInputs}>
                      <View className={styles.amountInputWrapper}>
                        <Text className={styles.label}>总金额</Text>
                        <View className={styles.inputWrapper}>
                          <Text className={styles.prefix}>¥</Text>
                          <Input
                            className={styles.input}
                            type="digit"
                            value={editTotalAmount}
                            onInput={e => setEditTotalAmount(e.detail.value)}
                            placeholder="0.00"
                          />
                        </View>
                      </View>
                      <View className={styles.amountInputWrapper}>
                        <Text className={styles.label}>已收金额</Text>
                        <View className={styles.inputWrapper}>
                          <Text className={styles.prefix}>¥</Text>
                          <Input
                            className={styles.input}
                            type="digit"
                            value={editPaidAmount}
                            onInput={e => setEditPaidAmount(e.detail.value)}
                            placeholder="0.00"
                          />
                        </View>
                      </View>
                    </View>

                    {(editingRecord.dealStatus === 'partly_paid' || editingRecord.remainingAmount > 0) && (
                      <View className={styles.amountInputWrapper}>
                        <Text className={styles.label}>本次追加收款</Text>
                        <View className={styles.inputWrapper}>
                          <Text className={styles.prefix}>¥</Text>
                          <Input
                            className={styles.input}
                            type="digit"
                            value={editAddInstallment}
                            onInput={e => setEditAddInstallment(e.detail.value)}
                            placeholder="输入本次收款金额"
                          />
                        </View>
                      </View>
                    )}
                  </View>

                  <View className={styles.section}>
                    <View className={styles.installmentSection}>
                      <View className={styles.installmentHeader}>
                        <Text className={styles.title}>收款记录</Text>
                      </View>
                      <View className={styles.installmentList}>
                        {editingRecord.installments && editingRecord.installments.length > 0 ? (
                          editingRecord.installments.map(ins => (
                            <View key={ins.id} className={styles.installmentItem}>
                              <Text className={styles.amount}>{formatAmount(ins.amount)}</Text>
                              <Text className={styles.info}>
                                {ins.date} · {ins.method} · {ins.operator}
                              </Text>
                            </View>
                          ))
                        ) : (
                          <Text style={{ fontSize: 24, color: '#86909C' }}>暂无收款记录</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {editingRecord.influencerId && (
                    <View className={styles.section}>
                      <View className={styles.commissionHint}>
                        <View className={styles.commissionRow}>
                          <Text className={styles.label}>佣金比例</Text>
                          <Text className={styles.value}>
                            {formatRate(getCommissionRate(editingRecord.influencerId, editingRecord.visitType))}
                          </Text>
                        </View>
                        <View className={styles.commissionRow}>
                          <Text className={styles.label}>佣金预估（本次后）</Text>
                          <Text className={styles.value}>
                            {formatAmount(
                              editingRecord.visitType === 'first'
                                ? estimateFirstCommission
                                : estimateSecondCommission
                            )}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </>
              )}

              <View className={styles.section}>
                <Text className={styles.sectionTitle}>备注说明</Text>
                <Textarea
                  className={styles.notesInput}
                  placeholder="记录面诊情况、顾客偏好、特殊需求等..."
                  value={editNotes}
                  onInput={e => setEditNotes(e.detail.value)}
                  maxlength={500}
                />
              </View>

              <View className={styles.modalBtns}>
                <Button
                  className={classnames(styles.modalBtn, styles.modalBtnCancel)}
                  onClick={() => setShowModal(false)}
                >
                  取消
                </Button>
                <Button
                  className={classnames(styles.modalBtn, styles.modalBtnConfirm)}
                  onClick={handleSaveEdit}
                >
                  保存
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default ConsultationPage
