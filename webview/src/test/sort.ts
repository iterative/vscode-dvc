import { screen } from '@testing-library/react'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import { ColumnType, TableData } from 'dvc/src/experiments/webview/contract'

export const defaultColumn = 'Experiment'

export const commonColumnFields = {
  hasChildren: false,
  parentPath: ColumnType.PARAMS,
  type: ColumnType.PARAMS
}

export const columns = [
  {
    ...commonColumnFields,
    id: 'A',
    label: 'A',
    path: 'params:A'
  },
  {
    ...commonColumnFields,
    id: 'B',
    label: 'B',
    path: 'params:B'
  },
  {
    ...commonColumnFields,
    id: 'C',
    label: 'C',
    path: 'params:C'
  }
]

export const tableData: TableData = {
  changes: [],
  columnOrder: [],
  columnWidths: {},
  columns,
  filteredCounts: { checkpoints: 0, experiments: 0 },
  filters: [],
  hasCheckpoints: false,
  hasColumns: true,
  hasRunningExperiment: false,
  rows: [
    {
      id: EXPERIMENT_WORKSPACE_ID,
      label: EXPERIMENT_WORKSPACE_ID
    },
    {
      id: 'main',
      label: 'main'
    }
  ],
  sorts: []
}

export const getHeaders = async () => {
  const renderedHeadersAndPlaceholders = await screen.findAllByTestId(
    'rendered-header'
  )
  return renderedHeadersAndPlaceholders
    .map(header => header.textContent?.trim())
    .filter(Boolean)
}

export const expectHeaders = async (expectedHeaderNames: string[]) => {
  expect(await getHeaders()).toStrictEqual([
    defaultColumn,
    ...expectedHeaderNames
  ])
}
