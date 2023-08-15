import React from 'react'
import cx from 'classnames'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import { ExperimentGroup } from './ExperimentGroup'
import { RowContent } from './Row'
import { WorkspaceRowGroup } from './WorkspaceRowGroup'
import styles from '../styles.module.scss'
import { InstanceProp, RowProp } from '../../../util/interfaces'

interface TableBodyProps extends RowProp, InstanceProp {
  root: HTMLElement | null
  tableHeaderHeight: number
  isLast?: boolean
}

export const TableBody: React.FC<TableBodyProps> = ({
  row,
  instance,
  root,
  tableHeaderHeight,
  isLast
}) => {
  const contentProps = {
    key: row.id,
    row
  }
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
          [styles.expandedGroup]: row.getIsExpanded() && row.subRows.length > 0,
          [styles.lastRowGroup]: isLast
        })}
      >
        {content}
      </tbody>
    </>
  )
}
