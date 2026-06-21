import React, { ReactNode } from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'

interface PageCardProps {
  title?: string
  extra?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  style?: React.CSSProperties
}

const PageCard: React.FC<PageCardProps> = ({ title, extra, children, footer, className, style }) => {
  return (
    <View className={classnames(styles.pageCard, className)} style={style}>
      {(title || extra) && (
        <View className={styles.pageCardHeader}>
          {title && <Text className={styles.title}>{title}</Text>}
          {extra && <View className={styles.extra}>{extra}</View>}
        </View>
      )}
      <View className={styles.pageCardBody}>{children}</View>
      {footer && <View className={styles.pageCardFooter}>{footer}</View>}
    </View>
  )
}

export default PageCard
