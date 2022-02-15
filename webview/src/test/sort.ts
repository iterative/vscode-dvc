import { screen } from '@testing-library/react'
import { DND_DRAGGABLE_DATA_ATTR } from 'react-beautiful-dnd-test-utils'

export const defaultColumns = ['Experiment', 'Timestamp']

export const commonColumnFields = {
  group: 'params',
  hasChildren: false,
  parentPath: 'params'
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
  rows: [],
  sorts: []
}

export const makeGetDragEl = (text: string) => () =>
  // eslint-disable-next-line testing-library/no-node-access
  screen.getByText(text).closest(DND_DRAGGABLE_DATA_ATTR)

export const getHeaders = async () =>
  (await screen.findAllByTestId('rendered-header')).map(
    header => header.textContent
  )

export const expectHeaders = async (expectedHeaderNames: string[]) => {
  expect(await getHeaders()).toEqual([
    ...defaultColumns,
    ...expectedHeaderNames
  ])
}
