import React from 'react'
import { BatchSelectionProp } from './Row'
import { NestedRow } from './NestedRow'
import { RowProp } from '../../../util/interfaces'

export const ExperimentGroup: React.FC<RowProp & BatchSelectionProp> = ({
  row,
  projectHasCheckpoints,
  hasRunningExperiment,
  batchRowSelection
}) => (
  <NestedRow
    row={row}
    projectHasCheckpoints={projectHasCheckpoints}
    hasRunningExperiment={hasRunningExperiment}
    batchRowSelection={batchRowSelection}
  />
)
