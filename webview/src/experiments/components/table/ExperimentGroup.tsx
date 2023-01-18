import React from 'react'
import { BatchSelectionProp } from './Row'
import { RowProp } from './interfaces'
import { NestedRow } from './NestedRow'

export const ExperimentGroup: React.FC<RowProp & BatchSelectionProp> = ({
  row,
  contextMenuDisabled,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection
}) => (
  <>
    <NestedRow
      row={row}
      contextMenuDisabled={contextMenuDisabled}
      projectHasCheckpoints={projectHasCheckpoints}
      hasRunningExperiment={hasRunningExperiment}
      batchRowSelection={batchRowSelection}
    />
  </>
)
