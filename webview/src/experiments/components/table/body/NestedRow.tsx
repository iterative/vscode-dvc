import React from 'react'
import { BatchSelectionProp, RowContent } from './Row'
import styles from '../styles.module.scss'
import { RowProp } from '../../../util/interfaces'

export const NestedRow: React.FC<RowProp & BatchSelectionProp> = ({
  row,
  projectHasCheckpoints,
  hasRunningWorkspaceExperiment,
  batchRowSelection
}) => {
  return (
    <RowContent
      row={row}
      className={styles.nestedRow}
      projectHasCheckpoints={projectHasCheckpoints}
      hasRunningWorkspaceExperiment={hasRunningWorkspaceExperiment}
      batchRowSelection={batchRowSelection}
    />
  )
}
