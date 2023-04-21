import React, { MouseEventHandler, ReactElement, ReactNode } from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { CellHintTooltip } from './body/CellHintTooltip'
import {
  focusFiltersTree,
  focusSortsTree,
  openPlotsWebview
} from '../../util/messages'
import { Icon } from '../../../shared/components/Icon'
import {
  Filter,
  GraphScatter,
  SortPrecedence
} from '../../../shared/components/icons'
import { pluralize } from '../../../util/strings'
import { ExperimentsState } from '../../store'

export type CounterBadgeProps = {
  count?: number
}

export const CounterBadge: React.FC<CounterBadgeProps> = ({ count }) => {
  return count ? (
    <span
      className={styles.indicatorCount}
      role="marquee"
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
      className={styles.indicatorIcon}
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

const formatCountMessage = (
  item: string,
  count: number | undefined,
  descriptor = 'Applied'
) => `${count || 'No'} ${pluralize(item, count)} ${descriptor}`

export const Indicators = () => {
  const filters = useSelector(
    (state: ExperimentsState) => state.tableData.filters
  )
  const sorts = useSelector((state: ExperimentsState) => state.tableData.sorts)
  const filteredCount = useSelector(
    (state: ExperimentsState) => state.tableData.filteredCount
  )
  const selectedForPlotsCount = useSelector(
    (state: ExperimentsState) => state.tableData.selectedForPlotsCount
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
              <div>
                {formatCountMessage('Experiment', filteredCount, 'Filtered')}
              </div>
            ) : null}
          </>
        }
      >
        <Icon width={16} height={16} icon={Filter} />
      </Indicator>
    </div>
  )
}
