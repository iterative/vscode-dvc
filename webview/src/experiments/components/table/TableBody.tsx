import React from 'react'
import cx from 'classnames'
import { useInView } from 'react-intersection-observer'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import styles from './styles.module.scss'
import { BatchSelectionProp, RowContent } from './Row'
import { InstanceProp, RowProp } from './interfaces'
import { ExperimentGroup } from './ExperimentGroup'

const WorkspaceRowGroupWrapper: React.FC<
  {
    children: React.ReactNode
    root: HTMLElement | null
    tableHeaderHeight: number
  } & InstanceProp
> = ({ children, root, tableHeaderHeight }) => {
  const [ref, needsShadow] = useInView({
    root,
    rootMargin: `-${tableHeaderHeight + 15}px 0px 0px 0px`,
    threshold: 1
  })

  return (
    <tbody
      ref={ref}
      className={cx(styles.workspaceRowGroup, needsShadow && styles.withShadow)}
    >
      {children}
    </tbody>
  )
}
export const TableBody: React.FC<
  RowProp &
    InstanceProp &
    BatchSelectionProp & { root: HTMLElement | null; tableHeaderHeight: number }
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
  const content =
    row.depth > 0 ? (
      <ExperimentGroup
        row={row}
        key={row.id}
        contextMenuDisabled={contextMenuDisabled}
        projectHasCheckpoints={projectHasCheckpoints}
        hasRunningExperiment={hasRunningExperiment}
        batchRowSelection={batchRowSelection}
      />
    ) : (
      <RowContent
        row={row}
        projectHasCheckpoints={projectHasCheckpoints}
        hasRunningExperiment={hasRunningExperiment}
        contextMenuDisabled={contextMenuDisabled}
        batchRowSelection={batchRowSelection}
      />
    )

  return row.original.id === EXPERIMENT_WORKSPACE_ID ? (
    <WorkspaceRowGroupWrapper
      tableHeaderHeight={tableHeaderHeight}
      root={root}
      instance={instance}
    >
      {content}
    </WorkspaceRowGroupWrapper>
  ) : (
    <>
      {row.index === 2 && row.depth === 0 && (
        <tr className={cx(styles.tr, styles.previousCommitsRow)}>
          <td className={styles.th}>Previous Commits</td>
          <td colSpan={row.getAllCells().length - 1}></td>
        </tr>
      )}
      <tbody
        className={cx(styles.rowGroup, styles.tbody, styles.normalRowGroup, {
          [styles.experimentGroup]: row.depth > 0,
          [styles.expandedGroup]: row.getIsExpanded() && row.subRows.length > 0
        })}
      >
        {content}
      </tbody>
    </>
  )
}
