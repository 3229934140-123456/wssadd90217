import React from 'react'
import { Text } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'

type TagType = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default' | 'outline'

interface TagProps {
  type?: TagType
  children: React.ReactNode
  style?: React.CSSProperties
}

const Tag: React.FC<TagProps> = ({ type = 'default', children, style }) => {
  const typeClass = {
    primary: styles.tagPrimary,
    success: styles.tagSuccess,
    warning: styles.tagWarning,
    error: styles.tagError,
    info: styles.tagInfo,
    default: styles.tagDefault,
    outline: styles.tagOutline
  }[type]

  return (
    <Text className={classnames(styles.tag, typeClass)} style={style}>
      {children}
    </Text>
  )
}

export default Tag
