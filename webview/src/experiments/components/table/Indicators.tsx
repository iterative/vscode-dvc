import React, { MouseEventHandler, ReactNode } from 'react'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import cx from 'classnames'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import styles from './styles.module.scss'
import { Icon } from '../../../shared/components/Icon'
import SvgSortPrecedence from '../../../shared/components/icons/SortPrecedence'
import SvgFilter from '../../../shared/components/icons/Filter'
import { sendMessage } from '../../../shared/vscode'
import Tooltip from '../../../shared/components/tooltip/Tooltip'
import tooltipStyles from '../../../shared/components/tooltip/styles.module.scss'

const Indicator = ({
  children,
  count,
  'aria-label': ariaLabel,
  tooltipContent,
  onClick
}: {
  children: ReactNode
  count?: number
  'aria-label'?: string
  onClick?: MouseEventHandler
  tooltipContent: ReactNode
}) => (
  <Tooltip
    placement="bottom-start"
    content={tooltipContent}
    className={tooltipStyles.padded}
  >
    <button
      className={cx(styles.indicatorIcon, count && styles.indicatorWithCount)}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
      {count ? <span className={styles.indicatorCount}>{count}</span> : null}
    </button>
  </Tooltip>
)

const focusFiltersTree = () =>
  sendMessage({ type: MessageFromWebviewType.FOCUS_FILTERS_TREE })
const focusSortsTree = () =>
  sendMessage({ type: MessageFromWebviewType.FOCUS_SORTS_TREE })

const formatCountMessage = (item: string, count: number | undefined) =>
  `${count || 'No'} ${item}${count === 1 ? '' : 's'} applied`

export const Indicators = ({
  sorts,
  filters
}: {
  sorts?: SortDefinition[]
  filters?: string[]
}) => {
  const sortsCount = sorts?.length
  const filtersCount = filters?.length
  return (
    <div className={styles.tableIndicators}>
      <Indicator
        count={sorts?.length}
        aria-label="sorts"
        onClick={focusSortsTree}
        tooltipContent={formatCountMessage('sort', sortsCount)}
      >
        <Icon width={16} height={16} icon={SvgSortPrecedence} />
      </Indicator>
      <Indicator
        count={filters?.length}
        aria-label="filters"
        onClick={focusFiltersTree}
        tooltipContent={formatCountMessage('filter', filtersCount)}
      >
        <Icon width={16} height={16} icon={SvgFilter} />
      </Indicator>
    </div>
  )
}
