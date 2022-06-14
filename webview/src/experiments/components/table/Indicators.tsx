import React, { MouseEventHandler, ReactNode } from 'react'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import cx from 'classnames'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import styles from './styles.module.scss'
import SvgSortPrecedence from '../../../shared/components/icons/SortPrecedence'
import SvgFilter from '../../../shared/components/icons/Filter'
import { sendMessage } from '../../../shared/vscode'

const Indicator = ({
  children,
  count,
  'aria-label': ariaLabel,
  onClick
}: {
  children: ReactNode
  count?: number
  'aria-label'?: string
  onClick?: MouseEventHandler
}) => (
  <button
    className={cx(styles.indicatorIcon, count && styles.indicatorWithCount)}
    aria-label={ariaLabel}
    onClick={onClick}
  >
    {children}
    {count ? <span className={styles.indicatorCount}>{count}</span> : null}
  </button>
)

const focusFiltersTree = () =>
  sendMessage({ type: MessageFromWebviewType.FOCUS_FILTERS_TREE })
const focusSortsTree = () =>
  sendMessage({ type: MessageFromWebviewType.FOCUS_SORTS_TREE })

export const Indicators = ({
  sorts,
  filters
}: {
  sorts?: SortDefinition[]
  filters?: string[]
}) => {
  return (
    <div className={styles.tableIndicators}>
      <Indicator
        count={sorts?.length}
        aria-label="sorts"
        onClick={focusSortsTree}
      >
        <SvgSortPrecedence />
      </Indicator>
      <Indicator
        count={filters?.length}
        aria-label="filters"
        onClick={focusFiltersTree}
      >
        <SvgFilter />
      </Indicator>
    </div>
  )
}
