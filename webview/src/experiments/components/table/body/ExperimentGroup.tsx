import React from 'react'
import { NestedRow } from './NestedRow'
import { RowProp } from '../../../util/interfaces'

export const ExperimentGroup: React.FC<RowProp> = ({ row }) => (
  <NestedRow row={row} />
)
