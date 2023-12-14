import React from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import styles from './styles.module.scss'
import { CellHintTooltip } from './body/CellHintTooltip'
import { Indicator } from './Indicator'
import {
  focusFiltersTree,
  focusSortsTree,
  openPlotsWebview,
  selectBranches,
  selectColumns,
  toggleShowOnlyChanged
} from '../../util/messages'
import { Icon } from '../../../shared/components/Icon'
import {
  Filter,
  GitMerge,
  GraphScatter,
  ListFilter,
  SortPrecedence,
  Table
} from '../../../shared/components/icons'
import { ExperimentsState } from '../../store'

export const Indicators = () => {
  const filters = useSelector(
    (state: ExperimentsState) => state.tableData.filters
  )
  const filtersCount = filters?.length

  const sorts = useSelector((state: ExperimentsState) => state.tableData.sorts)
  const sortsCount = sorts?.length

  const selectedForPlotsCount = useSelector(
    (state: ExperimentsState) => state.tableData.selectedForPlotsCount
  )

  const branchesSelected = useSelector((state: ExperimentsState) =>
    Math.max(state.tableData.selectedBranches.length, 0)
  )
  const { hasBranchesToSelect } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  const columnsSelected = useSelector(
    (state: ExperimentsState) =>
      state.tableData.columns.filter(({ hasChildren }) => !hasChildren).length
  )

  const showOnlyChanged = useSelector(
    (state: ExperimentsState) => state.tableData.showOnlyChanged
  )

  return (
    <div className={styles.tableIndicators}>
      <CellHintTooltip
        tooltipContent="Toggle Show Only Changed Columns"
        delay={[1000, 0]}
      >
        <button
          className={cx(
            styles.indicatorIcon,
            showOnlyChanged && styles.onlyChanged
          )}
          aria-label="show only changed columns"
          onClick={toggleShowOnlyChanged}
        >
          <Icon width={16} height={16} icon={Table} />
        </button>
      </CellHintTooltip>
      <Indicator
        count={columnsSelected}
        aria-label="columns"
        onClick={selectColumns}
        tooltipContent="Select Columns"
      >
        <Icon width={16} height={16} icon={ListFilter} />
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
      <Indicator
        count={filtersCount}
        aria-label="filters"
        onClick={focusFiltersTree}
        tooltipContent="Show Filters"
      >
        <Icon width={16} height={16} icon={Filter} />
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
        count={selectedForPlotsCount}
        aria-label="selected for plots"
        onClick={openPlotsWebview}
        tooltipContent="Show Plots"
      >
        <Icon width={16} height={16} icon={GraphScatter} />
      </Indicator>
    </div>
  )
}
