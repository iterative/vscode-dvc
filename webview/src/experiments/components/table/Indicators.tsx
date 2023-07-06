import React, { MouseEventHandler, ReactElement } from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { CellHintTooltip } from './body/CellHintTooltip'
import {
  focusFiltersTree,
  focusSortsTree,
  openPlotsWebview,
  selectBranches
} from '../../util/messages'
import { Icon } from '../../../shared/components/Icon'
import {
  Filter,
  GitMerge,
  GraphScatter,
  SortPrecedence
} from '../../../shared/components/icons'
import { ExperimentsState } from '../../store'

type CounterBadgeProps = {
  count?: number
}

const CounterBadge: React.FC<CounterBadgeProps> = ({ count }) => {
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

export const Indicators = () => {
  const filters = useSelector(
    (state: ExperimentsState) => state.tableData.filters
  )
  const sorts = useSelector((state: ExperimentsState) => state.tableData.sorts)
  const selectedForPlotsCount = useSelector(
    (state: ExperimentsState) => state.tableData.selectedForPlotsCount
  )
  const branchesSelected = useSelector(
    (state: ExperimentsState) =>
      Math.max(state.tableData.branches.filter(Boolean).length - 1, 0) // We always have one branch by default (the current one which is not selected) and undefined for the workspace
  )

  const { hasBranchesToSelect } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  const sortsCount = sorts?.length
  const filtersCount = filters?.length

  return (
    <div className={styles.tableIndicators}>
      <Indicator
        count={selectedForPlotsCount}
        aria-label="selected for plots"
        onClick={openPlotsWebview}
        tooltipContent="Show Plots"
      >
        <Icon width={16} height={16} icon={GraphScatter} />
      </Indicator>
      <Indicator
        count={sortsCount}
        aria-label="sorts"
        onClick={focusSortsTree}
        tooltipContent="Show Sorts"
      >
        <Icon width={16} height={16} icon={SortPrecedence} />
      </Indicator>
      <Indicator
        count={filtersCount}
        aria-label="filters"
        onClick={focusFiltersTree}
        tooltipContent="Show Filters"
      >
        <Icon width={16} height={16} icon={Filter} />
      </Indicator>
      <Indicator
        count={branchesSelected}
        aria-label="branches"
        onClick={selectBranches}
        tooltipContent="Select Branches"
        disabled={!hasBranchesToSelect}
      >
        <Icon width={16} height={16} icon={GitMerge} />
      </Indicator>
    </div>
  )
}
