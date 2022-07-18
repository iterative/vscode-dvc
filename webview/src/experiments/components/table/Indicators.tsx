import React, { MouseEventHandler, ReactNode } from 'react'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import cx from 'classnames'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { FilteredCounts } from 'dvc/src/experiments/model/filterBy/collect'
import { TippyProps } from '@tippyjs/react'
import styles from './styles.module.scss'
import { Icon } from '../../../shared/components/Icon'
import SvgSortPrecedence from '../../../shared/components/icons/SortPrecedence'
import SvgFilter from '../../../shared/components/icons/Filter'
import { sendMessage } from '../../../shared/vscode'
import Tooltip from '../../../shared/components/tooltip/Tooltip'
import tooltipStyles from '../../../shared/components/tooltip/styles.module.scss'
import { pluralize } from '../../../util/strings'

export type IndicatorTooltipProps = Pick<TippyProps, 'children'> & {
  tooltipContent: ReactNode
}

export const IndicatorTooltip: React.FC<IndicatorTooltipProps> = ({
  children,
  tooltipContent
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  return (
    <Tooltip
      placement="bottom-start"
      disabled={!tooltipContent}
      content={tooltipContent}
      className={tooltipStyles.padded}
      ref={wrapperRef}
    >
      {children}
    </Tooltip>
  )
}

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
}: IndicatorTooltipProps &
  CounterBadgeProps & {
    'aria-label'?: string
    onClick?: MouseEventHandler
  }) => (
  <IndicatorTooltip tooltipContent={tooltipContent}>
    <button
      className={cx(styles.indicatorIcon, count && styles.indicatorWithCount)}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
      <CounterBadge count={count} />
    </button>
  </IndicatorTooltip>
)

export const IndicatorWithJustTheCounter = ({
  count,
  'aria-label': ariaLabel,
  tooltipContent
}: CounterBadgeProps &
  IndicatorTooltipProps & {
    'aria-label'?: string
  }) => (
  <IndicatorTooltip tooltipContent={tooltipContent}>
    <span aria-label={ariaLabel}>
      <CounterBadge count={count} />
    </span>
  </IndicatorTooltip>
)

const focusFiltersTree = () =>
  sendMessage({ type: MessageFromWebviewType.FOCUS_FILTERS_TREE })
const focusSortsTree = () =>
  sendMessage({ type: MessageFromWebviewType.FOCUS_SORTS_TREE })

const formatCountMessage = (item: string, count: number | undefined) =>
  `${count || 'No'} ${pluralize(item, count)} Applied`

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
  sorts,
  filters,
  filteredCounts
}: {
  sorts?: SortDefinition[]
  filters?: string[]
  filteredCounts: FilteredCounts
}) => {
  const sortsCount = sorts?.length
  const filtersCount = filters?.length
  return (
    <div className={styles.tableIndicators}>
      <Indicator
        count={sorts?.length}
        aria-label="sorts"
        onClick={focusSortsTree}
        tooltipContent={formatCountMessage('Sort', sortsCount)}
      >
        <Icon width={16} height={16} icon={SvgSortPrecedence} />
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
        <Icon width={16} height={16} icon={SvgFilter} />
      </Indicator>
    </div>
  )
}
