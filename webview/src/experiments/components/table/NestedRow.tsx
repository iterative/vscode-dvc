import React from 'react'
import styles from './styles.module.scss'
import { BatchSelectionProp, RowContent } from './Row'
import { RowProp } from './interfaces'

export const NestedRow: React.FC<RowProp & BatchSelectionProp> = ({
  row,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection
}) => {
  return (
    <RowContent
      row={row}
      className={styles.nestedRow}
      contextMenuDisabled={contextMenuDisabled}
      projectHasCheckpoints={projectHasCheckpoints}
      hasRunningExperiment={hasRunningExperiment}
      batchRowSelection={batchRowSelection}
    />
  )
}
