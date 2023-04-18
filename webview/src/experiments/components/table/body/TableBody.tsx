import React from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import { ExperimentGroup } from './ExperimentGroup'
import { BatchSelectionProp, RowContent } from './Row'
import { WorkspaceRowGroup } from './WorkspaceRowGroup'
import styles from '../styles.module.scss'
import { InstanceProp, RowProp } from '../../../util/interfaces'
import { ExperimentsState } from '../../../store'

export const TableBody: React.FC<
  RowProp &
    InstanceProp &
    BatchSelectionProp & {
      root: HTMLElement | null
      tableHeaderHeight: number
    }
> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection,
  root,
  tableHeaderHeight
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
      {row.index === 2 && row.depth === 0 && (
        <tbody>
          <tr className={styles.previousCommitsRow}>
            <td className={styles.previousCommitsText}>
              {isBranchesView ? 'Other Branches' : 'Previous Commits'}
            </td>
            <td
              className={styles.previousCommitsText}
              colSpan={row.getAllCells().length - 1}
            ></td>
          </tr>
        </tbody>
      )}
      <tbody
        className={cx(styles.rowGroup, {
          [styles.experimentGroup]: row.depth > 0
        })}
      >
        {content}
      </tbody>
    </>
  )
}
