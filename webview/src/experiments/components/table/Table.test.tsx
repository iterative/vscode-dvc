/**
 * @jest-environment jsdom
 */
/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectHeaders"] }] */
import '@testing-library/jest-dom/extend-expect'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Experiment, TableData } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { TableInstance } from 'react-table'
import {
  mockGetComputedSpacing,
  mockDndElSpacing,
  makeDnd,
  DND_DIRECTION_LEFT,
  DND_DIRECTION_RIGHT
} from 'react-beautiful-dnd-test-utils'
import { Table } from './Table'
import styles from './styles.module.scss'
import { ExperimentsTable } from '../Experiments'
import * as ColumnOrder from '../../hooks/useColumnOrder'

import { vsCodeApi } from '../../../shared/api'
import {
  expectHeaders,
  makeGetDragEl,
  tableData as sortingTableDataFixture
} from '../../../test/sort'

jest.mock('../../../shared/api')
const { postMessage } = vsCodeApi
const mockedPostMessage = jest.mocked(postMessage)

const queryClosest = (textElement: Element, matcher: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  textElement.closest(`.${matcher}`)

describe('Table', () => {
  const getProps = (props: React.ReactPropTypes) => ({ ...props })
  const getHeaderGroupProps = (key: string) => () => ({ key })
  const headerBasicProps = {
    getHeaderProps: getProps
  }
  const basicCellProps = {
    getCellProps: getProps,
    row: {
      id: 'workspace',
      original: {
        queued: false,
        running: false
      }
    }
  }
  const instance = {
    getTableBodyProps: getProps,
    getTableProps: getProps,
    headerGroups: [
      {
        getHeaderGroupProps: getHeaderGroupProps('headerGroup_1'),
        headers: [
          {
            ...headerBasicProps,
            id: 'experiment',
            render: () => 'Experiment'
          },
          {
            ...headerBasicProps,
            id: 'timestamp',
            render: () => 'Timestamp'
          }
        ]
      }
    ],
    prepareRow: () => {},
    rows: [
      {
        cells: [
          {
            ...basicCellProps,
            column: {
              id: 'experiment'
            },
            render: () => 'workspace'
          },
          {
            ...basicCellProps,
            column: {
              Header: 'Timestamp',
              id: 'timestamp'
            },
            render: () => new Date('2021-09-09').toString()
          }
        ],
        getRowProps: getProps,
        id: 'workspace',
        label: 'workspace',
        original: {
          queued: false,
          running: false
        },
        values: {
          id: 'workspace'
        }
      } as unknown as Experiment
    ],
    setColumnOrder: jest.fn,
    state: {
      columnOrder: []
    }
  } as unknown as TableInstance<Experiment>
  const dummyTableData: TableData = {
    changes: [],
    columnOrder: [],
    columnWidths: {},
    columns: [],
    rows: [],
    sorts: []
  }
  const renderTable = (testData = {}, tableInstance = instance) => {
    const tableData = { ...dummyTableData, ...testData }
    return render(<Table instance={tableInstance} tableData={tableData} />)
  }

  beforeAll(() => {
    jest.spyOn(ColumnOrder, 'useColumnOrder').mockImplementation(() => [])
  })

  afterEach(() => {
    cleanup()
  })

  describe('Sorting', () => {
    it('should not have any sorting classes if the sorts property is empty', async () => {
      renderTable()
      const column = await screen.findByText('Timestamp')

      expect(queryClosest(column, styles.sortingHeaderCellDesc)).toBeNull()
      expect(queryClosest(column, styles.sortingHeaderCellAsc)).toBeNull()
    })

    it('should apply the sortingHeaderCellAsc class on the timestamp column if its column has an ascending sort', async () => {
      renderTable({
        sorts: [{ descending: false, path: 'timestamp' }]
      })

      const column = await screen.findByText('Timestamp')

      expect(queryClosest(column, styles.sortingHeaderCellDesc)).toBeNull()
      expect(queryClosest(column, styles.sortingHeaderCellAsc)).toBeTruthy()
    })

    it('should apply the sortingHeaderCellDesc class on the timestamp column if its column has a descending sort', async () => {
      renderTable({
        sorts: [{ descending: true, path: 'timestamp' }]
      })

      const column = await screen.findByText('Timestamp')

      expect(queryClosest(column, styles.sortingHeaderCellDesc)).toBeTruthy()
      expect(queryClosest(column, styles.sortingHeaderCellAsc)).toBeNull()
    })
  })

  describe('Changes', () => {
    it('should not have the workspaceWithChanges class on a row if there are no workspace changes', async () => {
      renderTable()

      const row = await screen.findByTestId('workspace-row')

      expect(row?.className.includes(styles.workspaceWithChanges)).toBe(false)
    })

    it('should have the workspaceWithChanges class on a row if there are workspace changes', async () => {
      renderTable({ changes: ['something_changed'] })

      const row = await screen.findByTestId('workspace-row')

      expect(row?.className.includes(styles.workspaceWithChanges)).toBe(true)
    })

    it('should not have the workspaceChange class on a cell if there are no changes', async () => {
      renderTable()

      const row = await screen.findByTestId('timestamp___workspace')

      expect(row?.className.includes(styles.workspaceChange)).toBe(false)
    })

    it('should not have the workspaceChange class on a cell if there are changes to other columns but not this one', async () => {
      renderTable({ changes: ['a_change'] })

      const row = await screen.findByTestId('timestamp___workspace')

      expect(row?.className.includes(styles.workspaceChange)).toBe(false)
    })

    it('should have the workspaceChange class on a cell if there are changes matching the column id', async () => {
      renderTable({ changes: ['timestamp'] })

      const row = await screen.findByTestId('timestamp___workspace')

      expect(row?.className.includes(styles.workspaceChange)).toBe(true)
    })
  })

  describe('Columns order', () => {
    const renderExperimentsTable = (
      data: TableData = sortingTableDataFixture
    ) => {
      const view = render(<ExperimentsTable tableData={data} />)

      mockDndElSpacing(view)

      return view
    }

    beforeEach(() => {
      mockGetComputedSpacing()
    })

    it('should move a column from its current position to its new position', async () => {
      const { getByText } = renderExperimentsTable()

      await expectHeaders(['A', 'B', 'C'])

      await makeDnd({
        direction: DND_DIRECTION_LEFT,
        getByText,
        getDragEl: makeGetDragEl('C'),
        positions: 1
      })

      await expectHeaders(['A', 'C', 'B'])

      await makeDnd({
        direction: DND_DIRECTION_RIGHT,
        getByText,
        getDragEl: makeGetDragEl('A'),
        positions: 2
      })

      await expectHeaders(['C', 'B', 'A'])
    })

    it('should not move a column before the default columns', async () => {
      const { getByText } = renderExperimentsTable()

      await makeDnd({
        direction: DND_DIRECTION_LEFT,
        getByText,
        getDragEl: makeGetDragEl('B'),
        positions: 3
      })

      await expectHeaders(['B', 'A', 'C'])
    })

    it('should order the columns with the columnOrder from the data', async () => {
      const columnOrder = [
        'id',
        'timestamp',
        'params:C',
        'params:B',
        'params:A'
      ]
      const tableDataWithCustomColOrder = {
        ...sortingTableDataFixture,
        columnOrder
      }
      renderExperimentsTable(tableDataWithCustomColOrder)

      await expectHeaders(['C', 'B', 'A'])
    })

    it('should resize columns and persist new state when a separator is clicked and dragged', async () => {
      const tableDataWithColumnSetting: TableData = {
        ...sortingTableDataFixture,
        columnWidths: {
          id: 333
        }
      }
      render(<ExperimentsTable tableData={tableDataWithColumnSetting} />)
      const [experimentColumnResizeHandle] = await screen.findAllByRole(
        'separator'
      )

      fireEvent.mouseDown(experimentColumnResizeHandle, {
        bubbles: true,
        clientX: 0
      })
      fireEvent.mouseMove(document, {
        bubbles: true,
        clientX: 20
      })
      fireEvent.mouseUp(experimentColumnResizeHandle)

      expect(mockedPostMessage).toBeCalledWith({
        payload: { id: 'id', width: 353 },
        type: 'column-resized'
      })
    })
  })
})
