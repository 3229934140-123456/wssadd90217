import { useState, useMemo } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classNames from 'classnames'
import { todayReport } from '@/data/commissions'
import { influencers } from '@/data/influencers'
import styles from './index.module.scss'

const hourData = [
  { hour: '9时', arrival: 6, deal: 3 },
  { hour: '10时', arrival: 8, deal: 5 },
  { hour: '11时', arrival: 5, deal: 3 },
  { hour: '13时', arrival: 4, deal: 2 },
  { hour: '14时', arrival: 7, deal: 4 },
  { hour: '15时', arrival: 5, deal: 2 },
  { hour: '16时', arrival: 4, deal: 1 },
  { hour: '17时', arrival: 3, deal: 1 }
]

export default function ReportPage() {
  const [selectedDate, setSelectedDate] = useState('2026-06-22')

  const report = todayReport

  const maxHourValue = useMemo(() => {
    return Math.max(...hourData.map(h => Math.max(h.arrival, h.deal)), 1)
  }, [])

  const firstCommissionPercent = useMemo(() => {
    const total = report.commissionFirstVisit + report.commissionSecondVisit
    return total > 0 ? Math.round((report.commissionFirstVisit / total) * 100) : 0
  }, [report])

  const secondCommissionPercent = 100 - firstCommissionPercent

  const handleDateChange = () => {
    Taro.showActionSheet({
      itemList: ['今天 (6月22日)', '昨天 (6月21日)', '前天 (6月20日)', '自定义日期'],
      success: (res) => {
        const dates = ['2026-06-22', '2026-06-21', '2026-06-20', '2026-06-15']
        setSelectedDate(dates[res.tapIndex])
        Taro.showToast({ title: '日期已切换', icon: 'none' })
      }
    })
  }

  const handleHandlePending = (phone: string) => {
    Taro.showModal({
      title: '核销确认',
      content: `确定要处理顾客 ${phone} 的到院核销吗？`,
      confirmText: '立即核销',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '核销成功', icon: 'success' })
        }
      }
    })
  }

  const handleExportDaily = () => {
    Taro.showLoading({ title: '正在生成日报...' })
    setTimeout(() => {
      Taro.hideLoading()
      Taro.showActionSheet({
        itemList: ['发送给店长确认', '分享到工作群', '保存为PDF', '打印纸质版'],
        success: () => {
          Taro.showToast({ title: '日报已生成', icon: 'success' })
        }
      })
    }, 800)
  }

  const handleExportMonthly = () => {
    Taro.showModal({
      title: '月底财务导出',
      content: '将导出6月1日-6月22日完整佣金数据，包含每笔佣金的计算明细、达人信息、顾客信息。生成后将发送至总部财务邮箱。',
      confirmText: '确认导出',
      confirmColor: '#9B51E0',
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '正在导出...' })
          setTimeout(() => {
            Taro.hideLoading()
            Taro.showToast({ title: '已发送至财务', icon: 'success' })
          }, 1200)
        }
      }
    })
  }

  const handleSignConfirm = () => {
    Taro.showModal({
      title: '店长签字确认',
      content: '请确认今日数据无误，确认后数据将锁定并上报总部。\n\n确认日期：2026-06-22\n应计佣金：¥26,853.40',
      confirmText: '确认签字',
      confirmColor: '#27AE60',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '签字确认成功', icon: 'success' })
        }
      }
    })
  }

  const getRankAvatar = (influencerId: string) => {
    const inf = influencers.find(i => i.id === influencerId)
    return inf?.avatar || 'https://picsum.photos/200/200'
  }

  return (
    <View className={styles.page}>
      <View className={styles.headerSection}>
        <View className={styles.topBar}>
          <View className={styles.storeInfo}>
            <View className={styles.storeName}>
              🏥 {report.storeName}
            </View>
            <View className={styles.dateText}>📅 营业日报 · 周一</View>
          </View>
          <View className={styles.datePicker} onClick={handleDateChange}>
            📆 {selectedDate.slice(5)} ▾
          </View>
        </View>

        <View className={styles.heroAmount}>
          <View className={styles.label}>💰 今日总营业额</View>
          <View className={styles.amount}>¥{report.totalDealAmount.toLocaleString()}</View>
          <View className={styles.subText}>较昨日 ↑ 12.5% · 本月累计 ¥4,856,200</View>
        </View>

        <View className={styles.heroStats}>
          <View className={styles.heroStat}>
            <View className={styles.num}>{report.totalArrivals}</View>
            <View className={styles.name}>总到院</View>
          </View>
          <View className={styles.heroStat}>
            <View className={styles.num}>{report.influencerArrivals}</View>
            <View className={styles.name}>达人到院</View>
          </View>
          <View className={styles.heroStat}>
            <View className={styles.num}>{report.totalDeals}</View>
            <View className={styles.name}>成交数</View>
          </View>
          <View className={styles.heroStat}>
            <View className={styles.num}>{Math.round(report.totalDeals / report.totalArrivals * 100)}%</View>
            <View className={styles.name}>成交率</View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <View className={styles.title}>📊 首诊/二诊转化率</View>
          <View className={styles.action}>查看详情 →</View>
        </View>
        <View className={styles.rateCards}>
          <View className={styles.rateCard}>
            <View className={styles.header}>
              <View className={styles.label}>🌱 首诊成交率</View>
              <View className={styles.trend}>↑ 3.2%</View>
            </View>
            <View className={styles.rate}>{report.firstVisitDealRate}</View>
            <View className={styles.detail}>
              <strong>{report.firstVisitDeals}</strong> 成交 / {report.firstVisits} 到院
            </View>
          </View>
          <View className={classNames(styles.rateCard, styles.rateCardSecond)}>
            <View className={styles.header}>
              <View className={styles.label}>🔄 二诊成交率</View>
              <View className={classNames(styles.trend, styles.trendDown)}>↓ 1.5%</View>
            </View>
            <View className={styles.rate}>{report.secondVisitDealRate}</View>
            <View className={styles.detail}>
              <strong>{report.secondVisitDeals}</strong> 成交 / {report.secondVisits} 到院
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <View className={styles.title}>💸 今日佣金构成</View>
          <View className={styles.action}>导出明细 →</View>
        </View>
        <View className={styles.commissionCards}>
          <View className={styles.commissionCard}>
            <View className={styles.label}>🌱 首诊佣金</View>
            <View className={styles.amount}>¥{report.commissionFirstVisit.toLocaleString()}</View>
            <View className={styles.percent}>占比 {firstCommissionPercent}%</View>
            <View className={styles.percentBar}>
              <View className={styles.fill} style={{ width: `${firstCommissionPercent}%` }} />
            </View>
          </View>
          <View className={styles.commissionCard}>
            <View className={styles.label}>🔄 二诊佣金</View>
            <View className={styles.amount}>¥{report.commissionSecondVisit.toLocaleString()}</View>
            <View className={styles.percent}>占比 {secondCommissionPercent}%</View>
            <View className={styles.percentBar}>
              <View className={styles.fill} style={{ width: `${secondCommissionPercent}%` }} />
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <View className={styles.title}>🏆 达人佣金排行 Top3</View>
          <View className={styles.action}>完整榜单 →</View>
        </View>
        <View className={styles.rankCard}>
          {report.topInfluencers.map((inf, idx) => (
            <View key={inf.id} className={styles.rankItem}>
              <View className={classNames(styles.rankNum, idx === 0 ? styles.rank1 : idx === 1 ? styles.rank2 : styles.rank3)}>
                {idx + 1}
              </View>
              <Image className={styles.avatar} src={getRankAvatar(inf.id)} mode='aspectFill' />
              <View className={styles.info}>
                <View className={styles.name}>
                  {inf.name}
                  {idx === 0 && <Text style={{ fontSize: '22rpx' }}>👑</Text>}
                </View>
                <View className={styles.meta}>
                  <Text>👥 到院 {inf.arrivals}</Text>
                  <Text>✅ 成交 {inf.deals}</Text>
                </View>
              </View>
              <View className={styles.commission}>
                <View className={styles.amount}>¥{inf.commission.toLocaleString()}</View>
                <View className={styles.label}>佣金</View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {report.pendingVerifications > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.title}>⚠️ 未核销到院提醒</View>
          </View>
          <View className={styles.alertCard}>
            <View className={styles.alertHeader}>
              <View className={styles.title}>
                🔔 有 {report.pendingVerifications} 位顾客到院未核销
              </View>
              <View className={styles.count}>待处理</View>
            </View>
            <View className={styles.alertList}>
              {report.pendingVerificationList.map((phone, idx) => (
                <View key={idx} className={styles.alertItem}>
                  <View>
                    <View className={styles.phone}>📱 {phone}</View>
                    <View className={styles.time}>到院时间：{10 + idx}:{30 + idx * 5} · 待核销 {20 + idx} 分钟</View>
                  </View>
                  <View className={styles.handleBtn} onClick={() => handleHandlePending(phone)}>
                    立即核销
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <View className={styles.title}>⏰ 时段到院/成交分布</View>
        </View>
        <View className={styles.hourlyCard}>
          <View className={styles.chartArea}>
            {hourData.map(h => (
              <View key={h.hour} className={styles.barGroup}>
                <View className={styles.bars}>
                  <View
                    className={classNames(styles.bar, styles.barArrival)}
                    style={{ height: `${(h.arrival / maxHourValue) * 100}%` }}
                  />
                  <View
                    className={classNames(styles.bar, styles.barDeal)}
                    style={{ height: `${(h.deal / maxHourValue) * 100}%` }}
                  />
                </View>
                <View className={styles.hourLabel}>{h.hour}</View>
              </View>
            ))}
          </View>
          <View className={styles.legend}>
            <View className={styles.legendItem}>
              <View className={classNames(styles.dot, styles.dotArrival)} />
              <Text>到院人数</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={classNames(styles.dot, styles.dotDeal)} />
              <Text>成交人数</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={classNames(styles.btn, styles.btnSecondary)} onClick={handleExportDaily}>
          📄 今日日报
        </View>
        <View className={classNames(styles.btn, styles.btnPrimary)} onClick={handleExportMonthly}>
          📊 月底导出
        </View>
        <View className={classNames(styles.btn, styles.btnSuccess)} onClick={handleSignConfirm}>
          ✍️ 签字确认
        </View>
      </View>
    </View>
  )
}
