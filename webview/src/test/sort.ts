import { screen } from '@testing-library/react'
import { MetricOrParamType } from 'dvc/src/experiments/webview/contract'
import { DND_DRAGGABLE_DATA_ATTR } from 'react-beautiful-dnd-test-utils'

export const defaultColumns = ['Experiment', 'Timestamp']

export const commonColumnFields = {
  hasChildren: false,
  parentPath: MetricOrParamType.PARAMS,
  type: MetricOrParamType.PARAMS
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

export const tableData = {
  changes: [],
  columnOrder: [],
  columnWidths: {},
  columns,
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
