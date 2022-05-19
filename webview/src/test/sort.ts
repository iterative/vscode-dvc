import { screen } from '@testing-library/react'
import { ColumnType, TableData } from 'dvc/src/experiments/webview/contract'
import { DND_DRAGGABLE_DATA_ATTR } from 'react-beautiful-dnd-test-utils'

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
    name: 'A',
    path: 'params:A'
  },
  {
    ...commonColumnFields,
    id: 'B',
    name: 'B',
    path: 'params:B'
  },
  {
    ...commonColumnFields,
    id: 'C',
    name: 'C',
    path: 'params:C'
  }
]

export const tableData: TableData = {
  changes: [],
  columnOrder: [],
  columnWidths: {},
  columns,
  hasCheckpoints: false,
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

export const makeGetDragEl = (text: string) => () =>
  // eslint-disable-next-line testing-library/no-node-access
  screen.getByText(text).closest(DND_DRAGGABLE_DATA_ATTR)

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
