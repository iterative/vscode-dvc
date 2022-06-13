import React, { ReactNode } from 'react'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import cx from 'classnames'
import styles from './styles.module.scss'
import SvgSortPrecedence from '../../../shared/components/icons/SortPrecedence'
import SvgFilter from '../../../shared/components/icons/Filter'

const Indicator = ({
  children,
  count,
  'aria-label': ariaLabel
}: {
  children: ReactNode
  count?: number
  'aria-label'?: string
}) => (
  <span
    className={cx(styles.indicatorIcon, count && styles.indicatorWithCount)}
    role="status"
    aria-label={ariaLabel}
  >
    {children}
    {count ? <span className={styles.indicatorCount}>{count}</span> : null}
  </span>
)

export const Indicators = ({
  sorts,
  filters
}: {
  sorts?: SortDefinition[]
  filters?: string[]
}) => {
  return (
    <div className={styles.tableIndicators}>
      <Indicator count={sorts?.length} aria-label="sorts">
        <SvgSortPrecedence />
      </Indicator>
      <Indicator count={filters?.length} aria-label="filters">
        <SvgFilter />
      </Indicator>
    </div>
  )
}
