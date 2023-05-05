import React from 'react'
import { BatchSelectionProp } from './Row'
import { NestedRow } from './NestedRow'
import { RowProp } from '../../../util/interfaces'

export const ExperimentGroup: React.FC<RowProp & BatchSelectionProp> = ({
  row,
  batchRowSelection
}) => <NestedRow row={row} batchRowSelection={batchRowSelection} />
