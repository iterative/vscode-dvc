import React from 'react'
import { Cell } from 'react-table'
import { Experiment } from 'dvc/src/experiments/webview/contract'

const groupLabels: Record<string, string> = {
  metrics: 'Metric',
  params: 'Parameter'
}

export const CellTooltip: React.FC<{
  cell: Cell<Experiment, string | number>
}> = ({ cell }) => {
  const {
    column: { group },
    value
  } = cell
  return (
    <>
      {groupLabels[group as string]}: {value}
    </>
  )
}
