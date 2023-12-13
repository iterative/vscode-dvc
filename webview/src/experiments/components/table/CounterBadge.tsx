import React from 'react'
import styles from './styles.module.scss'

export type CounterBadgeProps = {
  count?: number
}

export const CounterBadge: React.FC<CounterBadgeProps> = ({ count }) => {
  return count ? (
    <span
      className={styles.indicatorCount}
      role="marquee"
      aria-label={String(count)}
    >
      {count}
    </span>
  ) : null
}
