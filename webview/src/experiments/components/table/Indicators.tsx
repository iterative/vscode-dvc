import React from 'react'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import cx from 'classnames'
import styles from './styles.module.scss'
import SvgSortPrecedence from '../../../shared/components/icons/SortPrecedence'
import SvgFilter from '../../../shared/components/icons/Filter'

const Indicator = ({
  icon: Icon,
  count
}: {
  icon: React.FC
  count?: number
}) => (
  <span
    className={cx(styles.indicatorIcon, count && styles.indicatorWithCount)}
  >
    <Icon />
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
      <Indicator icon={SvgSortPrecedence} count={sorts?.length} />
      <Indicator icon={SvgFilter} count={filters?.length} />
    </div>
  )
}
