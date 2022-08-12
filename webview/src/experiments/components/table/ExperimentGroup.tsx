import React from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { BatchSelectionProp } from './Row'
import { InstanceProp, RowProp } from './interfaces'
import { NestedRow } from './NestedRow'

export const ExperimentGroup: React.FC<
  RowProp & InstanceProp & BatchSelectionProp
> = ({
  row,
  instance,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection
}) => {
  instance.prepareRow(row)
  return (
    <div
      className={cx(
        styles.experimentGroup,
        row.isExpanded && row.subRows.length > 0 && styles.expandedGroup
      )}
    >
      <NestedRow
        row={row}
        instance={instance}
        contextMenuDisabled={contextMenuDisabled}
        projectHasCheckpoints={projectHasCheckpoints}
        hasRunningExperiment={hasRunningExperiment}
        batchRowSelection={batchRowSelection}
      />
      {row.isExpanded &&
        row.subRows.map(row => (
          <NestedRow
            row={row}
            instance={instance}
            key={row.id}
            contextMenuDisabled={contextMenuDisabled}
            projectHasCheckpoints={projectHasCheckpoints}
            hasRunningExperiment={hasRunningExperiment}
            batchRowSelection={batchRowSelection}
          />
        ))}
    </div>
  )
}
