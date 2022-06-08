import { screen } from '@testing-library/react'
import { ColumnType, TableData } from 'dvc/src/experiments/webview/contract'

export const defaultColumns = ['Experiment', 'Timestamp']

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
  filters: [],
  hasCheckpoints: false,
  hasColumns: true,
  hasRunningExperiment: false,
  rows: [
    {
      id: 'workspace',
      label: 'workspace'
    },
    {
      id: 'main',
      label: 'main'
    }
  ],
  sorts: []
}

export const getHeaders = async () => {
  const renderedHeader = await screen.findAllByTestId('rendered-header')
  return renderedHeader.map(header => header.textContent)
}

export const expectHeaders = async (expectedHeaderNames: string[]) => {
  expect(await getHeaders()).toStrictEqual([
    ...defaultColumns,
    ...expectedHeaderNames
  ])
}
