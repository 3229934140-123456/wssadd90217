import React, { useState, useMemo } from 'react'
import { View, Text, Button, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import Tag from '@/components/Tag'
import Empty from '@/components/Empty'
import { useStore } from '@/store/useStore'
import { CommissionRecord } from '@/types'
import {
  formatAmount,
  formatRate,
  getCommissionStatusColor,
  getCommissionStatusBgColor
} from '@/utils/commission'
import { getInfluencerById } from '@/data/influencers'

type TabType = 'all' | 'first' | 'second' | 'adjusted'

const CommissionPage: React.FC = () => {
  const { commissions } = useStore()

  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const tabs = [
    { key: 'all', label: '全部佣金', count: commissions.length },
    {
      key: 'first',
      label: '首诊成交',
      count: commissions.filter(c => c.visitType === 'first').length
    },
    {
      key: 'second',
      label: '二诊/复诊',
      count: commissions.filter(c => c.visitType !== 'first').length
    },
    {
      key: 'adjusted',
      label: '已调整(退款)',
      count: commissions.filter(c => c.hasRefund).length
    }
  ]

  const statusFilters = [
    { key: 'all', label: '全部状态' },
    { key: 'pending', label: '待确认' },
    { key: 'confirmed', label: '已确认' },
    { key: 'paid', label: '已结算' },
    { key: 'adjusted', label: '已调整' }
  ]

  const filteredList = useMemo(() => {
    let list = commissions
    if (activeTab === 'first') {
      list = list.filter(c => c.visitType === 'first')
    } else if (activeTab === 'second') {
      list = list.filter(c => c.visitType !== 'first')
    } else if (activeTab === 'adjusted') {
      list = list.filter(c => c.hasRefund)
    }
    if (activeFilter !== 'all') {
      list = list.filter(c => c.status === activeFilter)
    }
    return list
  }, [activeTab, activeFilter, commissions])

  const totalCommission = commissions.reduce((sum, c) => sum + c.finalCommission, 0)
  const firstCommission = commissions
    .filter(c => c.visitType === 'first')
    .reduce((sum, c) => sum + c.finalCommission, 0)
  const secondCommission = commissions
    .filter(c => c.visitType !== 'first')
    .reduce((sum, c) => sum + c.finalCommission, 0)
  const pendingCount = commissions.filter(c => c.status === 'pending').length
  const adjustedCount = commissions.filter(c => c.hasRefund).length

  const handleExport = () => {
    Taro.showModal({
      title: '导出确认',
      content: `确定要导出本月佣金明细吗？共${commissions.length}条记录，合计${formatAmount(totalCommission)}`,
      confirmColor: '#27AE60',
      success: res => {
        if (res.confirm) {
          Taro.showToast({ title: '已提交导出申请', icon: 'success' })
        }
      }
    })
  }

  const handleConfirm = (record: CommissionRecord) => {
    Taro.showToast({ title: '已确认佣金', icon: 'success' })
  }

  const handleDetail = (record: CommissionRecord) => {
    Taro.showToast({ title: '查看佣金明细', icon: 'none' })
  }

  return (
    <View className={styles.page}>
      <View className={styles.headerBanner}>
        <Text className={styles.label}>本月预估佣金总额</Text>
        <Text className={styles.amount}>{formatAmount(totalCommission)}</Text>
        <View className={styles.stats}>
          <View className={styles.stat}>
            <Text className={styles.num}>{commissions.length}</Text>
            <Text className={styles.name}>佣金笔数</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.num}>{pendingCount}</Text>
            <Text className={styles.name}>待确认</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.num}>{adjustedCount}</Text>
            <Text className={styles.name}>调整笔数</Text>
          </View>
        </View>
      </View>

      <View className={styles.summaryCards}>
        <View className={styles.summaryCard}>
          <Text className={styles.num}>{formatAmount(firstCommission)}</Text>
          <Text className={styles.label}>首诊成交佣金</Text>
        </View>
        <View className={classnames(styles.summaryCard, styles.summaryCardSecond)}>
          <Text className={styles.num}>{formatAmount(secondCommission)}</Text>
          <Text className={styles.label}>二诊/复诊佣金</Text>
        </View>
      </View>

      <View className={styles.tabs}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tab, activeTab === tab.key && styles.tabActive)}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            {tab.label} ({tab.count})
          </View>
        ))}
      </View>

      <View className={styles.filterBar}>
        {statusFilters.map(f => (
          <View
            key={f.key}
            className={classnames(styles.filterItem, activeFilter === f.key && styles.filterItemActive)}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </View>
        ))}
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 720rpx)', paddingBottom: 140 }}>
        <View className={styles.listContainer}>
          {filteredList.length === 0 ? (
            <Empty icon="💰" title="暂无佣金记录" text="当前筛选条件下没有佣金数据" />
          ) : (
            filteredList.map(record => {
              const influencer = getInfluencerById(record.influencerId)
              return (
                <View key={record.id} className={styles.commissionCard}>
                  <View className={styles.commissionCardHeader}>
                    <View className={styles.influencerInfo}>
                      <Image
                        className={styles.avatar}
                        src={influencer?.avatar || 'https://picsum.photos/id/64/200/200'}
                        mode="aspectFill"
                      />
                      <View className={styles.info}>
                        <Text className={styles.name}>
                          {record.influencerName}
                          {record.hasRefund && <Text className={styles.adjustTag}>含退款调整</Text>}
                        </Text>
                        <Text className={styles.customer}>
                          顾客：{record.customerName} · {record.visitTypeName}
                        </Text>
                      </View>
                    </View>
                    <View
                      className={styles.statusBadge}
                      style={{
                        background: getCommissionStatusBgColor(record.status),
                        color: getCommissionStatusColor(record.status)
                      }}
                    >
                      {record.statusName}
                    </View>
                  </View>

                  <View className={styles.commissionCardBody}>
                    <View className={styles.infoItem}>
                      <Text className={styles.label}>成交日期</Text>
                      <Text className={styles.value}>{record.dealDate}</Text>
                    </View>
                    <View className={styles.infoItem}>
                      <Text className={styles.label}>佣金比例</Text>
                      <Text className={styles.value} style={{ color: '#9B51E0' }}>
                        {formatRate(record.commissionRate)}
                      </Text>
                    </View>
                    <View className={styles.infoItem}>
                      <Text className={styles.label}>成交金额</Text>
                      <Text className={styles.value}>{formatAmount(record.dealAmount)}</Text>
                    </View>
                    <View className={styles.infoItem}>
                      <Text className={styles.label}>赠送项目</Text>
                      <Text className={styles.value}>
                        {record.isGift ? <Tag type="success">是</Tag> : '无'}
                      </Text>
                    </View>
                  </View>

                  <View className={styles.commissionCardCommission}>
                    <View className={styles.calcRow}>
                      <Text className={styles.label}>原始佣金</Text>
                      <Text className={styles.value}>{formatAmount(record.commissionAmount)}</Text>
                    </View>
                    {record.hasRefund && (
                      <View className={classnames(styles.calcRow, styles.calcRowRefund)}>
                        <Text className={styles.label}>
                          退款/改项目扣减（{record.refundAdjustAmount > 0 ? '原因：项目变更' : ''}）
                        </Text>
                        <Text className={styles.value}>-{formatAmount(record.refundAdjustAmount)}</Text>
                      </View>
                    )}
                    {record.isGift && (
                      <View className={styles.calcRow} style={{ opacity: 0.7 }}>
                        <Text className={styles.label}>赠送项目不计佣金</Text>
                        <Text className={styles.value}>已扣除</Text>
                      </View>
                    )}
                    <View className={classnames(styles.calcRow, styles.calcRowTotal)}>
                      <Text className={styles.label}>最终应计佣金</Text>
                      <Text className={styles.value}>{formatAmount(record.finalCommission)}</Text>
                    </View>
                  </View>

                  {record.notes && (
                    <View
                      style={{
                        background: '#FFF8E1',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 20,
                        fontSize: 24,
                        color: '#B7950B',
                        lineHeight: 1.6
                      }}
                    >
                      📝 {record.notes}
                    </View>
                  )}

                  <View className={styles.commissionCardFooter}>
                    <Button
                      className={classnames(styles.btn, styles.btnSecondary)}
                      onClick={() => handleDetail(record)}
                    >
                      查看明细
                    </Button>
                    {record.status === 'pending' && (
                      <Button
                        className={classnames(styles.btn, styles.btnPrimary)}
                        onClick={() => handleConfirm(record)}
                      >
                        确认佣金
                      </Button>
                    )}
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>

      <View className={styles.exportBar}>
        <Button
          className={classnames(styles.exportBar_btn, styles.exportBar_btnSecondary)}
          onClick={() => Taro.showToast({ title: '筛选功能开发中', icon: 'none' })}
        >
          📊 筛选条件
        </Button>
        <Button
          className={classnames(styles.exportBar_btn, styles.exportBar_btnPrimary)}
          onClick={handleExport}
        >
          📤 月底导出财务
        </Button>
      </View>
    </View>
  )
}

export default CommissionPage
