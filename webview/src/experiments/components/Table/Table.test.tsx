/**
 * @jest-environment jsdom
 */
/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectHeaders"] }] */
import '@testing-library/jest-dom/extend-expect'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Experiment, TableData } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { HeaderGroup, TableInstance } from 'react-table'
import {
  mockGetComputedSpacing,
  mockDndElSpacing,
  makeDnd,
  DND_DRAGGABLE_DATA_ATTR,
  DND_DIRECTION_LEFT,
  DND_DIRECTION_RIGHT
} from 'react-beautiful-dnd-test-utils'
import {
  ColumnSortType,
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { Table } from '.'
import styles from './Table/styles.module.scss'
import { ExperimentsTable } from '../Experiments'
import * as ColumnOrder from '../../hooks/useColumnOrder'

import { vsCodeApi } from '../../../shared/api'
import { App } from '../App'

jest.mock('../../../shared/api')
const { postMessage } = vsCodeApi
const mockedPostMessage = jest.mocked(postMessage)

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
        displayId: 'workspace',
        getRowProps: getProps,
        id: 'workspace',
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
    const placeholderId = 'placeholder_timestamp'
    const renderTableWithPlaceholder = (descending: boolean) => {
      const newInstance = { ...instance }

      const placeholderHeaderTimestamp = {
        ...headerBasicProps,
        id: placeholderId,
        placeholderOf: newInstance.headerGroups[0].headers[1],
        render: () => ''
      }
      const placeHolderHeaderExp = {
        ...headerBasicProps,
        id: 'exp_placeholder',
        placeholderOf: newInstance.headerGroups[0].headers[0],
        render: () => ''
      }
      newInstance.headerGroups = [
        {
          getHeaderGroupProps: getHeaderGroupProps('headerGroup_2'),
          headers: [placeHolderHeaderExp, placeholderHeaderTimestamp]
        } as unknown as HeaderGroup<Experiment>,
        ...newInstance.headerGroups
      ]

      renderTable({ sorts: [{ descending, path: 'timestamp' }] }, newInstance)
    }

    it('should not have any sorting classes if the sorts property is empty', async () => {
      renderTable()
      const column = await screen.findByTestId(
        'header-sort-indicator-experiment'
      )

      expect(column).not.toHaveClass(styles.sortAscending)
      expect(column).not.toHaveClass(styles.sortDescending)
    })

    it('should trigger to sort ascending if clicking on column on not sorted column', async () => {
      renderTable()
      const column = await screen.findByTestId('header-sort-experiment')

      fireEvent.click(column, {
        bubbles: true,
        cancelable: true
      })

      expect(mockedPostMessage).toBeCalledWith({
        payload: {
          columnId: 'experiment',
          columnSortType: ColumnSortType.ASCENDING
        },
        type: MessageFromWebviewType.COLUMN_SORTED
      })
    })

    it('should show sorting ascending on the experiment column if it is not descending in the sorts property', async () => {
      renderTable({
        sorts: [{ descending: false, path: 'experiment' }]
      })

      const column = await screen.findByTestId(
        'header-sort-indicator-experiment'
      )

      expect(column).toHaveClass(styles.sortAscending)
      expect(column).not.toHaveClass(styles.sortDescending)
    })

    it('should trigger to sort descending if clicking on sort icon on sorted ascending column', async () => {
      renderTable({
        sorts: [{ descending: false, path: 'experiment' }]
      })
      const column = await screen.findByTestId('header-sort-experiment')

      fireEvent.click(column, {
        bubbles: true,
        cancelable: true
      })

      expect(mockedPostMessage).toBeCalledWith({
        payload: {
          columnId: 'experiment',
          columnSortType: ColumnSortType.DESCENDING
        },
        type: MessageFromWebviewType.COLUMN_SORTED
      })
    })

    it('should show sorting descending on the experiment column if it is descending in the sorts property', async () => {
      renderTable({
        sorts: [{ descending: true, path: 'experiment' }]
      })

      const column = await screen.findByTestId(
        'header-sort-indicator-experiment'
      )

      expect(column).not.toHaveClass(styles.sortAscending)
      expect(column).toHaveClass(styles.sortDescending)
    })

    it('should trigger to remove sort if clicking on sort icon on sorted descending column', async () => {
      renderTable({
        sorts: [{ descending: true, path: 'experiment' }]
      })
      const column = await screen.findByTestId('header-sort-experiment')

      fireEvent.click(column, {
        bubbles: true,
        cancelable: true
      })

      expect(mockedPostMessage).toBeCalledWith({
        payload: {
          columnId: 'experiment',
          columnSortType: ColumnSortType.REMOVE
        },
        type: MessageFromWebviewType.COLUMN_SORTED
      })
    })

    it('should not show sorting on a placeholder above the column header when the sort is ascending', async () => {
      renderTableWithPlaceholder(false)

      const header = await screen.findByTestId(
        `header-sort-indicator-${placeholderId}`
      )

      expect(header).not.toHaveClass(styles.sortAscending)
      expect(header).not.toHaveClass(styles.sortDescending)
    })

    it('should not show sorting on a placeholder above the column header when the sort is descending', async () => {
      renderTableWithPlaceholder(true)

      const header = await screen.findByTestId(
        `header-sort-indicator-${placeholderId}`
      )

      expect(header).not.toHaveClass(styles.sortAscending)
      expect(header).not.toHaveClass(styles.sortDescending)
    })

    it('placeholder does not trigger sort', async () => {
      renderTableWithPlaceholder(false)

      const header = await screen.findByTestId(`header-sort-${placeholderId}`)

      mockedPostMessage.mockClear()

      fireEvent.click(header, {
        bubbles: true,
        cancelable: true
      })

      expect(mockedPostMessage).toHaveBeenCalledTimes(0)
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
    const basicProps = {
      group: 'params',
      hasChildren: false,
      parentPath: 'params'
    }
    const columns = [
      {
        ...basicProps,
        id: 'A',
        name: 'A',
        path: 'params:A'
      },
      {
        ...basicProps,
        id: 'B',
        name: 'B',
        path: 'params:B'
      },
      {
        ...basicProps,
        id: 'C',
        name: 'C',
        path: 'params:C'
      }
    ]
    const tableData = {
      changes: [],
      columnOrder: [],
      columnWidths: {},
      columns,
      rows: [],
      sorts: []
    }

    const makeGetDragEl = (text: string) => () =>
      // eslint-disable-next-line testing-library/no-node-access
      screen.getByText(text).closest(DND_DRAGGABLE_DATA_ATTR)

    const renderExperimentsTable = (data: TableData = tableData) => {
      const view = render(<ExperimentsTable tableData={data} />)

      mockDndElSpacing(view)

      return view
    }

    const defaultCols = ['Experiment', 'Timestamp']

    const expectHeaders = async (expectedHeaderNames: string[]) => {
      const headers = (await screen.findAllByTestId('rendered-header')).map(
        header => header.textContent
      )

      expect(headers).toEqual([...defaultCols, ...expectedHeaderNames])
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
        ...tableData,
        columnOrder
      }
      renderExperimentsTable(tableDataWithCustomColOrder)

      await expectHeaders(['C', 'B', 'A'])
    })

    it('should be able to order a column to the final space after a new column is added', async () => {
      const view = render(<App />)
      mockDndElSpacing(view)
      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: tableData,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      const changedData: TableData = {
        ...tableData,
        columns: [
          ...columns,
          {
            ...basicProps,
            id: 'D',
            name: 'D',
            path: 'params:D'
          }
        ]
      }

      fireEvent(
        window,
        new MessageEvent('message', {
          data: {
            data: changedData,
            type: MessageToWebviewType.SET_DATA
          }
        })
      )

      await makeDnd({
        direction: DND_DIRECTION_RIGHT,
        getByText: view.getByText,
        getDragEl: makeGetDragEl('B'),
        positions: 2
      })

      expect(
        (await screen.findAllByTestId('rendered-header')).map(
          header => header.textContent
        )
      ).toEqual([...defaultCols, 'A', 'C', 'D', 'B'])
    })

    it('should resize columns and persist new state when a separator is clicked and dragged', async () => {
      const tableDataWithColumnSetting: TableData = {
        ...tableData,
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
