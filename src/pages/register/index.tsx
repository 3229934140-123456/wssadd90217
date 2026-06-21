import React, { useState } from 'react'
import { View, Text, Input, Button, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import PageCard from '@/components/PageCard'
import Tag from '@/components/Tag'
import Empty from '@/components/Empty'
import AttributionModal from '@/components/AttributionModal'
import { useStore } from '@/store/useStore'
import { SourceCode, Customer, AttributionResult } from '@/types'
import { getSourceChannelName } from '@/utils/commission'
import { formatRate, formatAmount } from '@/utils/commission'
import { getInfluencerById, formatFollowers } from '@/data/influencers'

type SearchType = 'phone' | 'code'

const RegisterPage: React.FC = () => {
  const {
    searchByPhone,
    searchByCode,
    getPendingConflicts,
    showAttributionModal,
    hideAttributionModal,
    confirmAttribution,
    attributionModalVisible,
    conflictingCustomer,
    customers
  } = useStore()

  const [searchType, setSearchType] = useState<SearchType>('phone')
  const [phoneInput, setPhoneInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [searchResult, setSearchResult] = useState<{
    customers?: Customer[]
    code?: SourceCode
    searched: boolean
  }>({ searched: false })

  const quickCodes = ['LZW666', 'MLRM88', 'LILY2026', 'ZHANG99']

  const handleSearch = () => {
    if (searchType === 'phone') {
      if (!phoneInput || phoneInput.length !== 4) {
        Taro.showToast({ title: '请输入手机号后4位', icon: 'none' })
        return
      }
      const results = searchByPhone(phoneInput)
      setSearchResult({ customers: results, searched: true })
    } else {
      if (!codeInput.trim()) {
        Taro.showToast({ title: '请输入口令或达人昵称', icon: 'none' })
        return
      }
      const code = searchByCode(codeInput.trim())
      setSearchResult({ code, searched: true })
      if (!code) {
        Taro.showToast({ title: '未找到对应口令，请确认后重试', icon: 'none' })
      }
    }
  }

  const handleQuickCode = (code: string) => {
    setCodeInput(code)
    const found = searchByCode(code)
    setSearchResult({ code: found, searched: true })
  }

  const handleScanCode = () => {
    Taro.showToast({ title: '扫码功能演示中...', icon: 'none' })
    setTimeout(() => {
      setCodeInput('LZW666')
      const found = searchByCode('LZW666')
      setSearchResult({ code: found, searched: true })
    }, 800)
  }

  const handleCheckIn = () => {
    Taro.showToast({ title: '登记核销成功！', icon: 'success' })
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/consultation/index' })
    }, 1500)
  }

  const handleConflictingCustomer = (customer: Customer) => {
    showAttributionModal(customer)
  }

  const handleAttributionConfirm = (result: AttributionResult, reason: string) => {
    if (conflictingCustomer) {
      confirmAttribution(conflictingCustomer.id, result, reason)
      Taro.showToast({ title: '归因确认成功', icon: 'success' })
    }
  }

  const pendingConflicts = getPendingConflicts()

  return (
    <View className={styles.page}>
      <ScrollView scrollY style={{ height: '100vh' }}>
        <View className={styles.headerStats}>
          <View className={styles.statCard}>
            <Text className={styles.num}>{customers.length}</Text>
            <Text className={styles.label}>今日登记</Text>
          </View>
          <View className={classnames(styles.statCard, styles.statCardAccent)}>
            <Text className={styles.num}>{pendingConflicts.length}</Text>
            <Text className={styles.label}>待处理归因</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.num}>28</Text>
            <Text className={styles.label}>达人到院</Text>
          </View>
        </View>

        <View className={styles.searchSection}>
          <View className={styles.searchCard}>
            <View className={styles.tabs}>
              <View
                className={classnames(styles.tabItem, searchType === 'phone' && styles.tabItemActive)}
                onClick={() => setSearchType('phone')}
              >
                📱 手机号后四位
              </View>
              <View
                className={classnames(styles.tabItem, searchType === 'code' && styles.tabItemActive)}
                onClick={() => setSearchType('code')}
              >
                🎫 口令/扫码
              </View>
            </View>

            {searchType === 'phone' ? (
              <>
                <View className={styles.inputGroup}>
                  <Text className={styles.inputLabel}>顾客手机号后四位</Text>
                  <View className={styles.inputWrapper}>
                    <Text className={styles.prefix}>****</Text>
                    <Input
                      className={styles.input}
                      type="number"
                      maxlength={4}
                      placeholder="请输入4位数字"
                      value={phoneInput}
                      onInput={(e) => setPhoneInput(e.detail.value)}
                      onConfirm={handleSearch}
                    />
                  </View>
                </View>
              </>
            ) : (
              <>
                <View className={styles.inputGroup}>
                  <Text className={styles.inputLabel}>达人口令 / 达人昵称</Text>
                  <View className={styles.inputWrapper}>
                    <Input
                      className={styles.input}
                      placeholder="如：LZW666 或 变美专家老王"
                      value={codeInput}
                      onInput={(e) => setCodeInput(e.detail.value)}
                      onConfirm={handleSearch}
                    />
                    <Button className={styles.scanBtn} onClick={handleScanCode}>
                      扫码
                    </Button>
                  </View>
                </View>
                <View className={styles.quickCodes}>
                  <Text style={{ fontSize: 24, color: '#86909C', width: '100%', marginBottom: 8 }}>
                    快速查询今日热门口令：
                  </Text>
                  {quickCodes.map(code => (
                    <View key={code} className={styles.quickCodeTag} onClick={() => handleQuickCode(code)}>
                      {code}
                    </View>
                  ))}
                </View>
              </>
            )}

            <Button className={styles.searchBtn} onClick={handleSearch}>
              🔍 查询核销
            </Button>
          </View>
        </View>

        <View className={styles.resultSection}>
          {pendingConflicts.length > 0 && (
            <PageCard
              title="⚠️ 待处理归因冲突"
              extra={<Tag type="error">{pendingConflicts.length}位顾客</Tag>}
            >
              {pendingConflicts.map(customer => (
                <View
                  key={customer.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    marginBottom: 12,
                    background: 'rgba(235, 87, 87, 0.05)',
                    borderRadius: 12
                  }}
                  onClick={() => handleConflictingCustomer(customer)}
                >
                  <View>
                    <Text style={{ fontSize: 28, fontWeight: 600, color: '#1D2129', display: 'block' }}>
                      {customer.name}
                    </Text>
                    <Text style={{ fontSize: 24, color: '#86909C', marginTop: 4 }}>
                      {customer.fullPhone} · 登记来源：{getSourceChannelName(customer.source)}
                    </Text>
                  </View>
                  <Tag type="error">去处理</Tag>
                </View>
              ))}
            </PageCard>
          )}

          {searchResult.searched && searchResult.customers && (
            <PageCard title="🔍 查询结果" extra={<Tag type="primary">{searchResult.customers.length}条记录</Tag>}>
              {searchResult.customers.length === 0 ? (
                <Empty
                  icon="❓"
                  title="未找到该手机号"
                  text="是否为新顾客？可先进行登记操作"
                />
              ) : (
                searchResult.customers.map(customer => {
                  const influencer = customer.influencerId ? getInfluencerById(customer.influencerId) : null
                  return (
                    <View key={customer.id} style={{ marginBottom: 24 }}>
                      <View className={styles.customerCard}>
                        <View className={styles.customerCardHeader}>
                          <View className={styles.avatar}>👩</View>
                          <View className={styles.customerInfo}>
                            <Text className={styles.name}>{customer.name}</Text>
                            <Text className={styles.phone}>{customer.fullPhone}</Text>
                          </View>
                          <View className={styles.tagGroup}>
                            {customer.firstVisitDate === '2026-06-22' ? (
                              <Tag type="primary">新客</Tag>
                            ) : (
                              <Tag type="success">复诊</Tag>
                            )}
                            {customer.hasAttributionConflict && (
                              <Tag type="warning">归因待确认</Tag>
                            )}
                          </View>
                        </View>
                        <View className={styles.customerCardBody}>
                          <View className={styles.infoRow}>
                            <Text className={styles.label}>来源渠道</Text>
                            <Text className={styles.value}>
                              {getSourceChannelName(customer.source)}
                              {customer.influencerName && `：${customer.influencerName}`}
                            </Text>
                          </View>
                          <View className={styles.infoRow}>
                            <Text className={styles.label}>首次到院</Text>
                            <Text className={styles.value}>{customer.firstVisitDate}</Text>
                          </View>
                          <View className={styles.infoRow}>
                            <Text className={styles.label}>最近到院</Text>
                            <Text className={styles.value}>{customer.lastVisitDate}</Text>
                          </View>
                        </View>
                        <View className={styles.customerCardFooter}>
                          <Button
                            className={classnames(styles.actionBtns_secondaryBtn, {
                              [styles.actionBtns_primaryBtn]: false
                            })}
                            onClick={() => handleCheckIn()}
                            style={{
                              flex: 1,
                              height: 72,
                              borderRadius: 36,
                              background: '#FFFFFF',
                              border: '1px solid #E5E6EB',
                              color: '#4E5969',
                              fontSize: 26,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 12
                            }}
                          >
                            查看历史
                          </Button>
                          <Button
                            style={{
                              flex: 2,
                              height: 72,
                              borderRadius: 36,
                              background: 'linear-gradient(135deg, #9B51E0 0%, #BB6BD9 100%)',
                              color: '#FFFFFF',
                              fontSize: 28,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: 'none'
                            }}
                            onClick={() => {
                              if (customer.hasAttributionConflict) {
                                handleConflictingCustomer(customer)
                              } else {
                                handleCheckIn()
                              }
                            }}
                          >
                            {customer.hasAttributionConflict ? '先处理归因' : '确认核销登记'}
                          </Button>
                        </View>
                      </View>

                      {influencer && (
                        <View className={styles.influencerCard}>
                          <View className={styles.influencerHeader}>
                            <Image
                              className={styles.influencerAvatar}
                              src={influencer.avatar}
                              mode="aspectFill"
                            />
                            <View className={styles.influencerInfo}>
                              <Text className={styles.name}>{influencer.name}</Text>
                              <Text className={styles.platform}>
                                {influencer.platform} · {formatFollowers(influencer.followers)}粉丝
                              </Text>
                            </View>
                            <Tag type="primary">合作中</Tag>
                          </View>

                          <Text className={styles.sectionTitle}>合作项目范围</Text>
                          <View className={styles.projectsList}>
                            {influencer.cooperativeProjects.slice(0, 5).map((pid, idx) => {
                              const projName = ['光子嫩肤', '热玛吉', '超声炮', '玻尿酸', '瘦脸针', '双眼皮', '鼻综合'][idx] || pid
                              return <Tag key={pid} type="outline">{projName}</Tag>
                            })}
                            {influencer.cooperativeProjects.length > 5 && (
                              <Tag type="default">+{influencer.cooperativeProjects.length - 5}项</Tag>
                            )}
                          </View>

                          <View className={styles.validInfo}>
                            <View className={styles.row}>
                              <Text className={styles.label}>口令有效期</Text>
                              <Text className={styles.value}>{influencer.validFrom} 至 {influencer.validTo}</Text>
                            </View>
                            <View className={styles.row}>
                              <Text className={styles.label}>适用门店</Text>
                              <Text className={styles.value}>
                                {influencer.storeLimit.length >= 3 ? '全部门店' : `指定${influencer.storeLimit.length}家门店`}
                              </Text>
                            </View>
                          </View>

                          <View className={styles.commissionInfo}>
                            <View className={styles.commissionRow}>
                              <Text className={styles.label}>首诊佣金比例</Text>
                              <Text className={styles.value}>{formatRate(influencer.commissionRateFirst)}</Text>
                            </View>
                            <View className={styles.commissionRow}>
                              <Text className={styles.label}>二诊/复诊佣金比例</Text>
                              <Text className={styles.value}>{formatRate(influencer.commissionRateSecond)}</Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  )
                })
              )}
            </PageCard>
          )}

          {searchResult.searched && searchResult.code && (
            <View>
              <PageCard title="🎫 口令信息" extra={<Tag type="success">{searchResult.code.code}</Tag>}>
                <View style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                  <Image
                    src={searchResult.code.influencerAvatar}
                    style={{ width: 88, height: 88, borderRadius: 44, marginRight: 20, border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    mode="aspectFill"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 30, fontWeight: 600, color: '#1D2129', display: 'block' }}>
                      {searchResult.code.influencerName}
                    </Text>
                    <Text style={{ fontSize: 24, color: '#86909C', marginTop: 6 }}>
                      口令有效期：{searchResult.code.validFrom} ~ {searchResult.code.validTo}
                    </Text>
                  </View>
                  <Tag type="primary">{searchResult.code.status === 'active' ? '有效' : '已过期'}</Tag>
                </View>
                <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <View>
                    <Text style={{ fontSize: 24, color: '#86909C', display: 'block' }}>今日使用</Text>
                    <Text style={{ fontSize: 32, fontWeight: 700, color: '#9B51E0', display: 'block' }}>{searchResult.code.todayUsage}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 24, color: '#86909C', display: 'block' }}>累计使用</Text>
                    <Text style={{ fontSize: 32, fontWeight: 700, color: '#4E5969', display: 'block' }}>{searchResult.code.totalUsage}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 24, color: '#86909C', display: 'block' }}>限制门店</Text>
                    <Text style={{ fontSize: 32, fontWeight: 700, color: '#27AE60', display: 'block' }}>{searchResult.code.storeLimit.length}家</Text>
                  </View>
                </View>
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 26, color: '#4E5969', fontWeight: 500, display: 'block', marginBottom: 12 }}>
                    适用项目：
                  </Text>
                  <View style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {searchResult.code.projectNames.map(name => (
                      <Tag key={name} type="outline">{name}</Tag>
                    ))}
                  </View>
                </View>
              </PageCard>
            </View>
          )}
        </View>

        {searchResult.searched && (searchResult.customers?.length || searchResult.code) && (
          <View className={styles.actionBtns}>
            <Button className={styles.primaryBtn} onClick={handleCheckIn}>
              ✅ 确认核销并分配咨询师
            </Button>
          </View>
        )}
      </ScrollView>

      <AttributionModal
        visible={attributionModalVisible}
        customer={conflictingCustomer}
        onCancel={hideAttributionModal}
        onConfirm={handleAttributionConfirm}
      />
    </View>
  )
}

export default RegisterPage
