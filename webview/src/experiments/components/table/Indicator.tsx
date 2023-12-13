import React, { MouseEventHandler, ReactElement } from 'react'
import { CounterBadge, CounterBadgeProps } from './CounterBadge'
import { CellHintTooltip } from './body/CellHintTooltip'
import styles from './styles.module.scss'

export const Indicator = ({
  children,
  count,
  'aria-label': ariaLabel,
  tooltipContent,
  onClick,
  disabled
}: CounterBadgeProps & {
  'aria-label'?: string
  onClick?: MouseEventHandler
  tooltipContent?: string
  children: ReactElement
  disabled?: boolean
}) => {
  const content = (
    <button
      className={styles.indicatorIcon}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
      <CounterBadge count={count} />
    </button>
  )

  return tooltipContent ? (
    <CellHintTooltip tooltipContent={tooltipContent} delay={[1000, 0]}>
      {content}
    </CellHintTooltip>
  ) : (
    content
  )
}
