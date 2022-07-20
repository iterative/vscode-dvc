import React, { MouseEventHandler, ReactNode } from 'react'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { Row } from 'react-table'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import cx from 'classnames'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { FilteredCounts } from 'dvc/src/experiments/model/filterBy/collect'
import { TippyProps } from '@tippyjs/react'
import styles from './styles.module.scss'
import { Icon } from '../../../shared/components/Icon'
import SvgSortPrecedence from '../../../shared/components/icons/SortPrecedence'
import SvgFilter from '../../../shared/components/icons/Filter'
import SvgGraphScatter from '../../../shared/components/icons/GraphScatter'
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

const addToSelected = (
  selectedForPlotsCount: number,
  row: Row<Experiment>
): number => selectedForPlotsCount + (row.original?.selected ? 1 : 0)

const getSelectedForPlotsCount = (rows: Row<Experiment>[] = []): number => {
  let selectedForPlotsCount = 0

  for (const row of rows) {
    selectedForPlotsCount = addToSelected(selectedForPlotsCount, row)

    selectedForPlotsCount =
      selectedForPlotsCount + getSelectedForPlotsCount(row.subRows)
  }

  return selectedForPlotsCount
}

export const Indicators = ({
  rows,
  sorts,
  filters,
  filteredCounts
}: {
  sorts?: SortDefinition[]
  filters?: string[]
  filteredCounts: FilteredCounts
  rows: Row<Experiment>[]
}) => {
  const sortsCount = sorts?.length
  const filtersCount = filters?.length

  const selectedForPlotsCount = getSelectedForPlotsCount(rows)

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
        <Icon width={16} height={16} icon={SvgGraphScatter} />
      </Indicator>
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
