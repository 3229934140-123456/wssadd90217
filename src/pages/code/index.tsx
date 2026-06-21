import { useState, useMemo } from 'react'
import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classNames from 'classnames'
import { sourceCodes, getActiveCodes, getTodayCodes } from '@/data/codes'
import { influencers, getInfluencerById, formatFollowers } from '@/data/influencers'
import { SourceCode } from '@/types'
import styles from './index.module.scss'

type TabType = 'all' | 'active' | 'expired' | 'unused'

const storeNames: Record<string, string> = {
  store001: '北京朝阳旗舰店',
  store002: '上海静安店',
  store003: '广州天河店'
}

const getStoreNames = (ids: string[]): string[] => {
  return ids.map(id => storeNames[id] || id)
}

const getDaysRemaining = (validTo: string): number => {
  const today = new Date('2026-06-22')
  const end = new Date(validTo)
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function CodePage() {
  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('all')

  const stats = useMemo(() => {
    const active = getActiveCodes()
    const today = getTodayCodes()
    const todayUsage = today.reduce((sum, c) => sum + c.todayUsage, 0)
    const totalUsage = sourceCodes.reduce((sum, c) => sum + c.totalUsage, 0)
    return { activeCount: active.length, todayUsage, totalUsage }
  }, [])

  const tabCounts = useMemo(() => ({
    all: sourceCodes.length,
    active: sourceCodes.filter(c => c.status === 'active').length,
    expired: sourceCodes.filter(c => c.status === 'expired').length,
    unused: sourceCodes.filter(c => c.status === 'unused').length
  }), [])

  const filteredCodes = useMemo(() => {
    let list = sourceCodes
    if (activeTab !== 'all') {
      list = list.filter(c => c.status === activeTab)
    }
    if (searchText.trim()) {
      const keyword = searchText.toLowerCase().trim()
      list = list.filter(c =>
        c.code.toLowerCase().includes(keyword) ||
        c.influencerName.toLowerCase().includes(keyword)
      )
    }
    return list
  }, [activeTab, searchText])

  const handleCopyCode = (code: string) => {
    Taro.setClipboardData({
      data: code,
      success: () => {
        Taro.showToast({ title: '口令已复制', icon: 'success' })
      }
    })
  }

  const handleViewRecords = (code: SourceCode) => {
    Taro.showToast({ title: `查看「${code.code}」核销记录`, icon: 'none' })
  }

  const handleShareCode = (code: SourceCode) => {
    Taro.showActionSheet({
      itemList: ['生成二维码图片', '复制口令+链接', '发送给达人'],
      success: (res) => {
        const actions = ['二维码已生成', '口令链接已复制', '已发送给达人']
        Taro.showToast({ title: actions[res.tapIndex], icon: 'success' })
      }
    })
  }

  const getStatusBadge = (status: SourceCode['status']) => {
    const map = {
      active: { text: '有效中', cls: styles.statusBadgeActive },
      expired: { text: '已过期', cls: styles.statusBadgeExpired },
      unused: { text: '未启用', cls: styles.statusBadgeUnused }
    }
    const s = map[status]
    return <Text className={classNames(styles.statusBadge, s.cls)}>{s.text}</Text>
  }

  const getValidityDisplay = (code: SourceCode) => {
    if (code.status === 'expired') {
      return { text: `已于 ${code.validTo} 过期`, cls: styles.valueError }
    }
    if (code.status === 'unused') {
      return { text: `${code.validFrom} 起生效`, cls: styles.valueWarn }
    }
    const days = getDaysRemaining(code.validTo)
    if (days <= 7) {
      return { text: `剩余 ${days} 天（${code.validTo}）`, cls: styles.valueWarn }
    }
    return { text: `${code.validFrom} ~ ${code.validTo}`, cls: styles.valueSuccess }
  }

  const getPlatformBadge = (influencerId: string) => {
    const inf = getInfluencerById(influencerId)
    if (!inf) return null
    const platformEmoji: Record<string, string> = {
      '抖音': '🎵',
      '小红书': '📕',
      '视频号': '🎬'
    }
    return (
      <View className={styles.influencerInfo}>
        <View className={styles.name}>
          {inf.name}
          <Text style={{ fontSize: '22rpx', color: '#9B51E0', background: 'rgba(155,81,224,0.1)', padding: '4rpx 12rpx', borderRadius: '8rpx' }}>
            {platformEmoji[inf.platform] || '📱'} {inf.platform}
          </Text>
        </View>
        <View className={styles.platform}>
          👥 粉丝 {formatFollowers(inf.followers)} · 首诊 {Math.round(inf.commissionRateFirst * 100)}% / 二诊 {Math.round(inf.commissionRateSecond * 100)}%
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.input}
          placeholder='输入口令或达人昵称搜索'
          placeholderClass='input-placeholder'
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
          confirmType='search'
        />
        <View className={styles.searchBtn}>搜索</View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <View className={styles.num}>{stats.activeCount}</View>
          <View className={styles.label}>有效口令</View>
        </View>
        <View className={classNames(styles.statCard, styles.statCardSecond)}>
          <View className={styles.num}>{stats.todayUsage}</View>
          <View className={styles.label}>今日核销</View>
        </View>
        <View className={classNames(styles.statCard, styles.statCardThird)}>
          <View className={styles.num}>{stats.totalUsage.toLocaleString()}</View>
          <View className={styles.label}>累计使用</View>
        </View>
      </View>

      <ScrollView className={styles.tabs} scrollX>
        {([
          { key: 'all', label: '全部' },
          { key: 'active', label: '有效中' },
          { key: 'expired', label: '已过期' },
          { key: 'unused', label: '未启用' }
        ] as { key: TabType; label: string }[]).map(tab => (
          <View
            key={tab.key}
            className={classNames(styles.tab, { [styles.tabActive]: activeTab === tab.key })}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tabCounts[tab.key] > 0 && <View className={styles.badge}>{tabCounts[tab.key]}</View>}
          </View>
        ))}
      </ScrollView>

      <ScrollView className={styles.listContainer} scrollY>
        {filteredCodes.length === 0 ? (
          <View style={{ padding: '120rpx 0', textAlign: 'center', color: '#86909C', fontSize: '28rpx' }}>
            <View style={{ fontSize: '80rpx', marginBottom: '24rpx' }}>🔐</View>
            <View>暂无匹配的口令</View>
          </View>
        ) : (
          filteredCodes.map(code => {
            const validity = getValidityDisplay(code)
            return (
              <View key={code.id} className={styles.codeCard}>
                <View className={styles.codeCardHeader}>
                  <Image className={styles.avatar} src={code.influencerAvatar} mode='aspectFill' />
                  {getPlatformBadge(code.influencerId)}
                  {getStatusBadge(code.status)}
                </View>

                <View className={styles.codeCardBody}>
                  <View className={styles.codeBox} onClick={() => handleCopyCode(code.code)}>
                    <View className={styles.label}>🎫 达人专属核销口令</View>
                    <View className={styles.codeText}>{code.code}</View>
                    <View className={styles.copyHint}>👆 点击口令可直接复制</View>
                  </View>

                  <View className={styles.infoGrid}>
                    <View className={styles.infoItem}>
                      <View className={styles.label}>有效期</View>
                      <View className={classNames(styles.value, validity.cls)}>{validity.text}</View>
                    </View>
                    <View className={styles.infoItem}>
                      <View className={styles.label}>合作项目数</View>
                      <View className={styles.value}>{code.projectNames.length} 个项目</View>
                    </View>
                    <View className={styles.infoItem}>
                      <View className={styles.label}>今日核销</View>
                      <View className={classNames(styles.value, styles.valueSuccess)}>{code.todayUsage} 人</View>
                    </View>
                    <View className={styles.infoItem}>
                      <View className={styles.label}>累计核销</View>
                      <View className={styles.value}>{code.totalUsage} 人</View>
                    </View>
                  </View>

                  <View className={styles.projectsSection}>
                    <View className={styles.sectionLabel}>💼 合作项目清单（{code.projectNames.length}项）</View>
                    <View className={styles.projectTags}>
                      {code.projectNames.map((name, idx) => (
                        <View key={idx} className={styles.projectTag}>{name}</View>
                      ))}
                    </View>
                  </View>

                  <View className={styles.storeSection}>
                    <View className={styles.storeLabel}>
                      🏪 门店限制（{code.storeLimit.length}家）
                      {code.storeLimit.length >= 3 && <Text style={{ color: '#EB5757', fontSize: '20rpx' }}>· 全门店通用</Text>}
                    </View>
                    <View className={styles.storeText}>
                      {getStoreNames(code.storeLimit).join(' / ')}
                    </View>
                  </View>

                  <View className={styles.usageBar}>
                    <View className={styles.usageItem}>
                      <View className={styles.num}>{code.todayUsage}</View>
                      <View className={styles.label}>今日使用</View>
                    </View>
                    <View className={styles.divider} />
                    <View className={styles.usageItem}>
                      <View className={styles.num}>{Math.round(code.todayUsage > 0 ? (code.totalUsage / (code.todayUsage * 30)) * 100 : 0)}%</View>
                      <View className={styles.label}>月均活跃度</View>
                    </View>
                    <View className={styles.divider} />
                    <View className={styles.usageItem}>
                      <View className={styles.num}>{code.totalUsage}</View>
                      <View className={styles.label}>累计使用</View>
                    </View>
                  </View>
                </View>

                <View className={styles.codeCardFooter}>
                  <View className={classNames(styles.btn, styles.btnSecondary)} onClick={() => handleViewRecords(code)}>
                    📋 核销记录
                  </View>
                  <View className={classNames(styles.btn, styles.btnOutline)} onClick={() => handleCopyCode(code.code)}>
                    📋 复制口令
                  </View>
                  <View className={classNames(styles.btn, styles.btnPrimary)} onClick={() => handleShareCode(code)}>
                    📤 分享
                  </View>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}
