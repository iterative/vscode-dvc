import React, { MouseEventHandler, ReactElement, ReactNode } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { FilteredCounts } from 'dvc/src/experiments/model/filterBy/collect'
import styles from './styles.module.scss'
import { CellHintTooltip } from './CellHintTooltip'
import { Icon } from '../../../shared/components/Icon'
import {
  Filter,
  GraphScatter,
  SortPrecedence
} from '../../../shared/components/icons'
import { sendMessage } from '../../../shared/vscode'
import { pluralize } from '../../../util/strings'
import { ExperimentsState } from '../../store'

export type CounterBadgeProps = {
  count?: number
}

export const CounterBadge: React.FC<CounterBadgeProps> = ({ count }) => {
  return count ? (
    <span
      className={styles.indicatorCount}
      role={'marquee'}
      aria-label={`${count}`}
    >
      {count}
    </span>
  ) : null
}

export const Indicator = ({
  children,
  count,
  'aria-label': ariaLabel,
  tooltipContent,
  onClick
}: CounterBadgeProps & {
  'aria-label'?: string
  onClick?: MouseEventHandler
  tooltipContent?: ReactNode
  children: ReactElement
}) => {
  const content = (
    <button
      className={cx(styles.indicatorIcon, count && styles.indicatorWithCount)}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
      <CounterBadge count={count} />
    </button>
  )

  return tooltipContent ? (
    <CellHintTooltip tooltipContent={tooltipContent} delay={[0, 0]}>
      {content}
    </CellHintTooltip>
  ) : (
    content
  )
}

export const IndicatorWithJustTheCounter = ({
  count,
  'aria-label': ariaLabel,
  children
}: CounterBadgeProps & {
  'aria-label'?: string
  children: React.ReactElement
}) => {
  return (
    <div aria-label={ariaLabel} className={styles.indicatorWithOnlyCount}>
      {children}
      <div className={styles.badge}>
        <CounterBadge count={count} />
      </div>
    </div>
  )
}

const focusFiltersTree = () =>
  sendMessage({ type: MessageFromWebviewType.FOCUS_FILTERS_TREE })
const focusSortsTree = () =>
  sendMessage({ type: MessageFromWebviewType.FOCUS_SORTS_TREE })
const openPlotsWebview = () =>
  sendMessage({ type: MessageFromWebviewType.OPEN_PLOTS_WEBVIEW })

const formatCountMessage = (
  item: string,
  count: number | undefined,
  descriptor = 'Applied'
) => `${count || 'No'} ${pluralize(item, count)} ${descriptor}`

const formatFilteredCount = (
  item: 'Experiment' | 'Checkpoint',
  filteredCount: number | undefined
) => {
  if (filteredCount === undefined) {
    return
  }
  return `${filteredCount} ${pluralize(item, filteredCount)}`
}

const formatFilteredCountMessage = (filteredCounts: FilteredCounts): string =>
  `${[
    formatFilteredCount('Experiment', filteredCounts.experiments),
    formatFilteredCount('Checkpoint', filteredCounts.checkpoints)
  ]
    .filter(Boolean)
    .join(', ')} Filtered`

export const Indicators = ({
  selectedForPlotsCount
}: {
  selectedForPlotsCount: number
}) => {
  const filters = useSelector(
    (state: ExperimentsState) => state.tableData.filters
  )
  const sorts = useSelector((state: ExperimentsState) => state.tableData.sorts)
  const filteredCounts = useSelector(
    (state: ExperimentsState) => state.tableData.filteredCounts
  )
  const sortsCount = sorts?.length
  const filtersCount = filters?.length

  return (
    <div className={styles.tableIndicators}>
      <Indicator
        count={selectedForPlotsCount}
        aria-label="selected for plots"
        onClick={openPlotsWebview}
        tooltipContent={formatCountMessage(
          'Experiment',
          selectedForPlotsCount,
          'Selected for Plotting (Max 7)'
        )}
      >
        <Icon width={16} height={16} icon={GraphScatter} />
      </Indicator>
      <Indicator
        count={sorts?.length}
        aria-label="sorts"
        onClick={focusSortsTree}
        tooltipContent={formatCountMessage('Sort', sortsCount)}
      >
        <Icon width={16} height={16} icon={SortPrecedence} />
      </Indicator>
      <Indicator
        count={filters?.length}
        aria-label="filters"
        onClick={focusFiltersTree}
        tooltipContent={
          <>
            <div>{formatCountMessage('Filter', filtersCount)}</div>
            {filtersCount ? (
              <div>{formatFilteredCountMessage(filteredCounts)}</div>
            ) : null}
          </>
        }
      >
        <Icon width={16} height={16} icon={Filter} />
      </Indicator>
    </div>
  )
}
