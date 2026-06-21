import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'

interface EmptyProps {
  icon?: string
  title?: string
  text?: string
}

const Empty: React.FC<EmptyProps> = ({
  icon = '📋',
  title = '暂无数据',
  text = '当前列表还没有内容哦'
}) => {
  return (
    <View className={styles.empty}>
      <View className={styles.emptyIcon}>{icon}</View>
      <Text className={styles.emptyTitle}>{title}</Text>
      <Text className={styles.emptyText}>{text}</Text>
    </View>
  )
}

export default Empty
