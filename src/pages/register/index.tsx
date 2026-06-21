import React, { useState, useEffect } from 'react'
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
import { getInfluencerById, formatFollowers, influencers } from '@/data/influencers'

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
    exactCode?: SourceCode
    influencerCodes?: SourceCode[]
    searched: boolean
    searchKeyword?: string
  }>({ searched: false })

  const quickCodes = ['LZW666', 'MLRM88', 'LILY2026', 'ZHANG99']
  const quickInfluencers = ['变美专家老王', '美丽日记小美', '医美测评Lily']

  const handleSearch = () => {
    if (searchType === 'phone') {
      if (!phoneInput || phoneInput.length !== 4) {
        Taro.showToast({ title: '请输入手机号后4位', icon: 'none' })
        return
      }
      const results = searchByPhone(phoneInput)
      setSearchResult({ customers: results, searched: true })
    } else {
      const keyword = codeInput.trim()
      if (!keyword) {
        Taro.showToast({ title: '请输入口令或达人昵称', icon: 'none' })
        return
      }
      const result = searchByCode(keyword)
      setSearchResult({
        exactCode: result.exactMatch,
        influencerCodes: result.influencerMatches,
        searched: true,
        searchKeyword: keyword
      })
      if (!result.exactMatch && result.influencerMatches.length === 0) {
        Taro.showToast({ title: '未找到匹配结果，试试输入完整口令或达人名字', icon: 'none', duration: 2000 })
      } else if (result.influencerMatches.length > 0 && !result.exactMatch) {
        Taro.showToast({ title: `找到${result.influencerMatches.length}个该达人的口令`, icon: 'none' })
      }
    }
  }

  const handleQuickCode = (code: string) => {
    setCodeInput(code)
    const result = searchByCode(code)
    setSearchResult({ exactCode: result.exactMatch, influencerCodes: result.influencerMatches, searched: true })
  }

  const handleQuickInfluencer = (name: string) => {
    setCodeInput(name)
    const result = searchByCode(name)
    setSearchResult({ exactCode: result.exactMatch, influencerCodes: result.influencerMatches, searched: true, searchKeyword: name })
    if (result.influencerMatches.length > 0) {
      Taro.showToast({ title: `列出${name}的${result.influencerMatches.length}个口令`, icon: 'none' })
    }
  }

  const handleScanCode = () => {
    Taro.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        console.log('扫码结果:', res)
        const rawResult = res.result || ''
        let parsedCode = rawResult
        try {
          if (rawResult.includes('=')) {
            const params = new URLSearchParams(rawResult.split('?')[1] || rawResult)
            parsedCode = params.get('code') || params.get('voucher') || params.get('ticket') || rawResult
          } else if (rawResult.length > 16) {
            const matchCode = rawResult.match(/[A-Z0-9]{6,12}/)
            if (matchCode) parsedCode = matchCode[0]
          }
        } catch (e) {
          parsedCode = rawResult
        }
        const keyword = parsedCode.trim().toUpperCase()
        if (!keyword) {
          Taro.showToast({ title: '未识别到有效内容', icon: 'none' })
          return
        }
        setCodeInput(keyword)
        const result = searchByCode(keyword)
        if (result.exactMatch || result.influencerMatches.length > 0) {
          setSearchResult({ exactCode: result.exactMatch, influencerCodes: result.influencerMatches, searched: true, searchKeyword: keyword })
          Taro.showToast({ title: '核销码识别成功！', icon: 'success' })
        } else {
          Taro.showModal({
            title: '扫码结果提示',
            content: `识别到内容：${parsedCode.slice(0, 30)}${parsedCode.length > 30 ? '...' : ''}\n\n未匹配到系统中的口令或达人。是否为新顾客走自然到院渠道？`,
            confirmText: '标记自然到院',
            cancelText: '重新扫码',
            success: (r) => {
              if (r.confirm) {
                Taro.showToast({ title: '已按自然到院处理', icon: 'success' })
              }
            }
          })
        }
      },
      fail: (err) => {
        console.log('扫码失败或取消:', err)
        if (err && String(err.errMsg || '').includes('cancel')) {
          Taro.showToast({ title: '已取消扫码', icon: 'none' })
        } else {
          Taro.showToast({ title: '扫码失败，请重试', icon: 'none' })
        }
      }
    })
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
      Taro.showToast({ title: '归因确认成功，列表已更新', icon: 'success' })
    }
  }

  const [pendingConflicts, setPendingConflicts] = useState<Customer[]>([])
  useEffect(() => {
    setPendingConflicts(getPendingConflicts())
  }, [customers, getPendingConflicts])

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
                    🔥 今日热门口令（点击直接查询）
                  </Text>
                  {quickCodes.map(code => (
                    <View key={code} className={styles.quickCodeTag} onClick={() => handleQuickCode(code)}>
                      {code}
                    </View>
                  ))}
                </View>
                <View className={styles.quickCodes} style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 24, color: '#86909C', width: '100%', marginBottom: 8 }}>
                    👤 按达人名字查询（点击列出所有口令）
                  </Text>
                  {quickInfluencers.map(name => (
                    <View
                      key={name}
                      className={styles.quickCodeTag}
                      style={{ background: 'rgba(155,81,224,0.1)', color: '#9B51E0', border: '1px solid rgba(155,81,224,0.25)' }}
                      onClick={() => handleQuickInfluencer(name)}
                    >
                      🎬 {name}
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
                              {getSourceChannelName(customer.attribution?.channel || customer.source)}
                              {(customer.attribution?.influencerName || customer.influencerName) &&
                                `：${customer.attribution?.influencerName || customer.influencerName}`}
                            </Text>
                          </View>
                          {customer.attributionReason && (
                            <View className={styles.infoRow}>
                              <Text className={styles.label}>归因说明</Text>
                              <Text className={styles.value} style={{ color: '#9B51E0', fontSize: 24, lineHeight: 1.5 }}>
                                📝 {customer.attributionReason}
                              </Text>
                            </View>
                          )}
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

          {searchResult.searched && searchResult.searchKeyword && (
            <View>
              {searchResult.influencerCodes && searchResult.influencerCodes.length > 0 && (
                <PageCard
                  title={`👤 "${searchResult.searchKeyword}" 相关达人有效口令（${searchResult.influencerCodes.length}个）`}
                  extra={<Tag type="primary">点击选择</Tag>}
                  style={{ marginBottom: 20 }}
                >
                  {searchResult.influencerCodes.map((c, idx) => (
                    <View
                      key={c.id}
                      style={{
                        padding: 20,
                        marginBottom: idx < searchResult.influencerCodes!.length - 1 ? 16 : 0,
                        background: c.status === 'active'
                          ? 'linear-gradient(135deg, rgba(155,81,224,0.06), rgba(155,81,224,0.02))'
                          : 'rgba(235,87,87,0.04)',
                        borderRadius: 16,
                        border: c.status === 'active' ? '1px solid rgba(155,81,224,0.15)' : '1px solid rgba(235,87,87,0.15)'
                      }}
                      onClick={() => c.status === 'active' && setSearchResult({ ...searchResult, exactCode: c })}
                    >
                      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <Image
                            src={c.influencerAvatar}
                            style={{ width: 64, height: 64, borderRadius: 32, marginRight: 16 }}
                            mode="aspectFill"
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 28, fontWeight: 600, color: '#1D2129', display: 'flex', alignItems: 'center', gap: 8 }}>
                              🎫 {c.code}
                              <Tag type={c.status === 'active' ? 'success' : 'error'} style={{ marginLeft: 12 }}>
                                {c.status === 'active' ? '有效中' : c.status === 'expired' ? '已过期' : '未启用'}
                              </Tag>
                            </Text>
                            <Text style={{ fontSize: 24, color: '#86909C', marginTop: 6, display: 'block' }}>
                              {c.influencerName} · 今日已用{c.todayUsage}次
                            </Text>
                          </View>
                        </View>
                        {c.status === 'active' && (
                          <Tag type="primary">选这个 →</Tag>
                        )}
                      </View>
                      <View style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(0,0,0,0.06)' }}>
                        <Text style={{ fontSize: 22, color: '#86909C', display: 'block', marginBottom: 8 }}>
                          合作项目（{c.projectNames.length}项）· 有效期至{c.validTo}
                        </Text>
                        <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {c.projectNames.slice(0, 4).map(n => (
                            <Tag key={n} type="outline">{n}</Tag>
                          ))}
                          {c.projectNames.length > 4 && (
                            <Tag type="default">+{c.projectNames.length - 4}</Tag>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </PageCard>
              )}

              {searchResult.exactCode && (
                <PageCard title="✅ 已选口令详情" extra={<Tag type="success">{searchResult.exactCode.code}</Tag>}>
                  <View style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                    <Image
                      src={searchResult.exactCode.influencerAvatar}
                      style={{ width: 88, height: 88, borderRadius: 44, marginRight: 20, border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      mode="aspectFill"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 30, fontWeight: 600, color: '#1D2129', display: 'block' }}>
                        {searchResult.exactCode.influencerName}
                      </Text>
                      <Text style={{ fontSize: 24, color: '#86909C', marginTop: 6 }}>
                        口令有效期：{searchResult.exactCode.validFrom} ~ {searchResult.exactCode.validTo}
                      </Text>
                    </View>
                    <Tag type="primary">{searchResult.exactCode.status === 'active' ? '✓ 可核销' : '已过期'}</Tag>
                  </View>
                  <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View>
                      <Text style={{ fontSize: 24, color: '#86909C', display: 'block' }}>今日使用</Text>
                      <Text style={{ fontSize: 32, fontWeight: 700, color: '#9B51E0', display: 'block' }}>{searchResult.exactCode.todayUsage}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 24, color: '#86909C', display: 'block' }}>累计使用</Text>
                      <Text style={{ fontSize: 32, fontWeight: 700, color: '#4E5969', display: 'block' }}>{searchResult.exactCode.totalUsage}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 24, color: '#86909C', display: 'block' }}>限制门店</Text>
                      <Text style={{ fontSize: 32, fontWeight: 700, color: '#27AE60', display: 'block' }}>{searchResult.exactCode.storeLimit.length}家</Text>
                    </View>
                  </View>
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ fontSize: 26, color: '#4E5969', fontWeight: 500, display: 'block', marginBottom: 12 }}>
                      适用合作项目：
                    </Text>
                    <View style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {searchResult.exactCode.projectNames.map(name => (
                        <Tag key={name} type="outline">{name}</Tag>
                      ))}
                    </View>
                  </View>
                </PageCard>
              )}
            </View>
          )}
        </View>

        {searchResult.searched && (searchResult.customers?.length || searchResult.exactCode) && (
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
