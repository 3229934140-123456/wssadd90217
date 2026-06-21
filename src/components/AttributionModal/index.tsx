import React, { useState } from 'react'
import { View, Text, Textarea, Button, Image } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'
import Tag from '@/components/Tag'
import { Customer, AttributionResult } from '@/types'
import { getActiveInfluencers } from '@/data/influencers'
import { formatFollowers } from '@/data/influencers'

interface AttributionModalProps {
  visible: boolean
  customer: Customer | null
  onCancel: () => void
  onConfirm: (result: AttributionResult, reason: string) => void
}

const AttributionModal: React.FC<AttributionModalProps> = ({ visible, customer, onCancel, onConfirm }) => {
  const [selectedChannel, setSelectedChannel] = useState<'influencer' | 'feed' | 'walkin'>('influencer')
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string>('')
  const [reason, setReason] = useState('')
  const influencers = getActiveInfluencers()

  if (!visible || !customer) return null

  const handleConfirm = () => {
    if (!reason.trim()) {
      return
    }
    const influencer = influencers.find(i => i.id === selectedInfluencerId)
    const result: AttributionResult = {
      channel: selectedChannel,
      influencerId: selectedChannel === 'influencer' ? selectedInfluencerId : undefined,
      influencerName: selectedChannel === 'influencer' ? influencer?.name : undefined,
      confirmDate: new Date().toISOString().split('T')[0],
      operator: '当前用户'
    }
    onConfirm(result, reason)
    setSelectedChannel('influencer')
    setSelectedInfluencerId('')
    setReason('')
  }

  const canConfirm = reason.trim().length > 0 && (selectedChannel !== 'influencer' || selectedInfluencerId)

  return (
    <View className={styles.modalMask}>
      <View className={styles.modal}>
        <View className={styles.modalHeader}>
          <Text className={styles.title}>⚠️ 归因冲突确认</Text>
          <Text className={styles.subtitle}>检测到该顾客可能存在多个来源渠道，请确认最终归因</Text>
        </View>

        <View className={styles.modalBody}>
          <View className={styles.customerInfo}>
            <View className={styles.row}>
              <Text className={styles.label}>顾客姓名</Text>
              <Text className={styles.value}>{customer.name}</Text>
            </View>
            <View className={styles.row}>
              <Text className={styles.label}>联系电话</Text>
              <Text className={styles.value}>{customer.fullPhone}</Text>
            </View>
            <View className={styles.row}>
              <Text className={styles.label}>登记来源</Text>
              <Text className={styles.value}>
                <Tag type="warning">信息流广告</Tag>
              </Text>
            </View>
          </View>

          <View className={classnames(styles.optionCard, selectedChannel === 'influencer' && styles.optionCardActive)}
            onClick={() => setSelectedChannel('influencer')}>
            <View className={styles.optionHeader}>
              <Text className={styles.optionTitle}>归因到达人</Text>
              <View className={classnames(styles.checkIcon, selectedChannel === 'influencer' && styles.checked)}>
                {selectedChannel === 'influencer' && '✓'}
              </View>
            </View>
            <Text className={styles.optionDesc}>顾客通过达人视频/直播/口令到店，佣金归达人所有</Text>
            {selectedChannel === 'influencer' && (
              <View className={styles.optionDetails}>
                <Text style={{ display: 'block', marginBottom: 16, fontSize: 26, color: '#4E5969' }}>请选择对应达人：</Text>
                {influencers.slice(0, 4).map(inf => (
                  <View
                    key={inf.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 12,
                      background: selectedInfluencerId === inf.id ? '#FFFFFF' : 'transparent',
                      border: selectedInfluencerId === inf.id ? '2px solid #9B51E0' : '1px solid #E5E6EB'
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedInfluencerId(inf.id) }}
                  >
                    <Image
                      src={inf.avatar}
                      style={{ width: 64, height: 64, borderRadius: 32, marginRight: 16 }}
                      mode="aspectFill"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 28, fontWeight: 600, color: '#1D2129', display: 'block' }}>{inf.name}</Text>
                      <Text style={{ fontSize: 22, color: '#86909C', display: 'block', marginTop: 4 }}>
                        {inf.platform} · {formatFollowers(inf.followers)}粉丝
                      </Text>
                    </View>
                    <View className={classnames(styles.checkIcon, selectedInfluencerId === inf.id && styles.checked)}
                      onClick={(e) => { e.stopPropagation(); setSelectedInfluencerId(inf.id) }}>
                      {selectedInfluencerId === inf.id && '✓'}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className={classnames(styles.optionCard, selectedChannel === 'feed' && styles.optionCardActive)}
            onClick={() => setSelectedChannel('feed')}>
            <View className={styles.optionHeader}>
              <Text className={styles.optionTitle}>归因到信息流</Text>
              <View className={classnames(styles.checkIcon, selectedChannel === 'feed' && styles.checked)}>
                {selectedChannel === 'feed' && '✓'}
              </View>
            </View>
            <Text className={styles.optionDesc}>顾客通过信息流广告点击到店，不计入达人佣金</Text>
          </View>

          <View className={classnames(styles.optionCard, selectedChannel === 'walkin' && styles.optionCardActive)}
            onClick={() => setSelectedChannel('walkin')}>
            <View className={styles.optionHeader}>
              <Text className={styles.optionTitle}>归因到自然到院</Text>
              <View className={classnames(styles.checkIcon, selectedChannel === 'walkin' && styles.checked)}>
                {selectedChannel === 'walkin' && '✓'}
              </View>
            </View>
            <Text className={styles.optionDesc}>顾客自行到院或老客转介绍，不计入任何渠道佣金</Text>
          </View>

          <View className={styles.reasonSection}>
            <Text className={styles.label}>
              归因理由<Text className={styles.required}>*</Text>
            </Text>
            <Textarea
              className={styles.textarea}
              placeholder="请填写确认归因的理由，例如：顾客出示了达人探店券二维码、顾客提及通过达人视频了解等..."
              value={reason}
              onInput={(e) => setReason(e.detail.value)}
              maxlength={200}
            />
            <Text className={styles.hint}>填写理由用于月底财务对账，必填项</Text>
          </View>
        </View>

        <View className={styles.modalFooter}>
          <Button
            className={classnames(styles.btn, styles.btnCancel)}
            onClick={() => {
              setSelectedChannel('influencer')
              setSelectedInfluencerId('')
              setReason('')
              onCancel()
            }}
          >
            取消
          </Button>
          <Button
            className={classnames(styles.btn, styles.btnConfirm)}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            确认归因
          </Button>
        </View>
      </View>
    </View>
  )
}

export default AttributionModal
