import React from 'react'
import cx from 'classnames'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import { NestedRow } from './NestedRow'
import { TableRow } from './Row'
import { WorkspaceRowGroup } from './WorkspaceRowGroup'
import styles from '../styles.module.scss'
import { RowProp } from '../../../util/interfaces'

interface TableBodyProps extends RowProp {
  root: HTMLElement | null
  tableHeaderHeight: number
  isLast?: boolean
}

export const TableBody: React.FC<TableBodyProps> = ({
  row,
  root,
  tableHeaderHeight,
  isLast
}) => {
  const contentProps = {
    isExpanded: row.getIsExpanded(),
    key: row.id,
    row
  }
  const content =
    row.depth > 0 ? (
      <NestedRow {...contentProps} />
    ) : (
      <TableRow {...contentProps} />
    )

  return row.original.id === EXPERIMENT_WORKSPACE_ID ? (
    <WorkspaceRowGroup tableHeaderHeight={tableHeaderHeight} root={root}>
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
