import React from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import { ExperimentGroup } from './ExperimentGroup'
import { BatchSelectionProp, RowContent } from './Row'
import { WorkspaceRowGroup } from './WorkspaceRowGroup'
import { PreviousCommitsRow } from './PreviousCommitsRow'
import styles from '../styles.module.scss'
import { InstanceProp, RowProp } from '../../../util/interfaces'
import { ExperimentsState } from '../../../store'

interface TableBodyProps extends RowProp, InstanceProp, BatchSelectionProp {
  root: HTMLElement | null
  tableHeaderHeight: number
  showPreviousRow?: boolean
}

export const TableBody: React.FC<TableBodyProps> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection,
  root,
  tableHeaderHeight,
  showPreviousRow
}) => {
  const contentProps = {
    batchRowSelection,
    contextMenuDisabled,
    hasRunningExperiment,
    key: row.id,
    projectHasCheckpoints,
    row
  }
  const isBranchesView = useSelector(
    (state: ExperimentsState) => state.tableData.isBranchesView
  )
  const content =
    row.depth > 0 ? (
      <ExperimentGroup {...contentProps} />
    ) : (
      <RowContent {...contentProps} />
    )

  return row.original.id === EXPERIMENT_WORKSPACE_ID ? (
    <WorkspaceRowGroup
      tableHeaderHeight={tableHeaderHeight}
      root={root}
      instance={instance}
    >
      {content}
    </WorkspaceRowGroup>
  ) : (
    <>
      <tbody
        className={cx(styles.rowGroup, {
          [styles.experimentGroup]: row.depth > 0,
          [styles.expandedGroup]: row.getIsExpanded() && row.subRows.length > 0
        })}
      >
        {content}
      </tbody>
      {showPreviousRow && row.depth === 0 && (
        <PreviousCommitsRow
          isBranchesView={isBranchesView}
          nbColumns={row.getAllCells().length}
        />
      )}
    </>
  )
}
