import React from 'react'
import styles from '../styles.module.scss'

interface TimestampHeaderProps {
  isPlaceholder: boolean
}

export const TimestampHeader: React.FC<TimestampHeaderProps> = ({
  isPlaceholder
}) =>
  isPlaceholder ? <></> : <div className={styles.timestampHeader}>Created</div>
