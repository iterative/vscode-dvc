/**
 * @jest-environment jsdom
 */
/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectHeaders"] }] */
import '@testing-library/jest-dom/extend-expect'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Experiment, TableData } from 'dvc/src/experiments/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React from 'react'
import { TableInstance } from 'react-table'
import tableDataFixture from 'dvc/src/test/fixtures/expShow/tableData'
import { SortOrder } from './TableHeader'
import { Table } from './Table'
import styles from './styles.module.scss'
import { ExperimentsTable } from '../Experiments'
import * as ColumnOrder from '../../hooks/useColumnOrder'

import { vsCodeApi } from '../../../shared/api'
import {
  expectHeaders,
  getHeaders,
  tableData as sortingTableDataFixture
} from '../../../test/sort'
import { dragAndDrop } from '../../../test/dragDrop'
import { DragEnterDirection } from '../../../shared/components/dragDrop/util'

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
    filters: [],
    hasCheckpoints: false,
    hasColumns: true,
    hasRunningExperiment: false,
    rows: [],
    sorts: []
  }
  const renderTable = (testData = {}, tableInstance = instance) => {
    const tableData = { ...dummyTableData, ...testData }
    return render(<Table instance={tableInstance} tableData={tableData} />)
  }
  const renderExperimentsTable = (
    data: TableData = sortingTableDataFixture
  ) => {
    return render(<ExperimentsTable tableData={data} />)
  }

  beforeAll(() => {
    jest.spyOn(ColumnOrder, 'useColumnOrder').mockImplementation(() => [])
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Sorting through the UI', () => {
    const mockColumnName = 'C'
    const mockColumnPath = 'params:C'

    const findSortableColumn = async () =>
      await screen.findByTestId(`header-${mockColumnPath}`)

    const clickOnSortOption = async (optionLabel: SortOrder) => {
      const column = await screen.findByText(mockColumnName)
      fireEvent.contextMenu(column, {
        bubbles: true
      })

      const sortOption = await screen.findByText(optionLabel)
      fireEvent.click(sortOption)
    }

    describe('Sortable column', () => {
      it('should not not have a sorting indicator if it is not sorted yet', () => {
        renderExperimentsTable()
        const sortIcons = screen.queryAllByTestId('sorting-indicator')

        expect(sortIcons.length).toBe(0)
      })

      it('should be able to add an ascending sort to the column, if it is not sorted yet', async () => {
        renderExperimentsTable()
        await clickOnSortOption(SortOrder.ASCENDING)

        expect(mockedPostMessage).toBeCalledWith({
          payload: {
            descending: false,
            path: mockColumnPath
          },
          type: MessageFromWebviewType.SORT_COLUMN
        })
      })

      it('should add a descending sort to the column, when clicking on the descending option', async () => {
        renderExperimentsTable({
          ...sortingTableDataFixture,
          sorts: [
            {
              descending: false,
              path: mockColumnPath
            }
          ]
        })

        const column = await findSortableColumn()
        expect(column).toHaveClass('sortingHeaderCellAsc')

        await clickOnSortOption(SortOrder.DESCENDING)

        expect(mockedPostMessage).toBeCalledWith({
          payload: {
            descending: true,
            path: mockColumnPath
          },
          type: MessageFromWebviewType.SORT_COLUMN
        })
      })

      it('should remove the column sort if the remove option is selected', async () => {
        renderExperimentsTable({
          ...sortingTableDataFixture,
          sorts: [
            {
              descending: true,
              path: mockColumnPath
            }
          ]
        })

        const column = await findSortableColumn()
        expect(column).toHaveClass('sortingHeaderCellDesc')

        await clickOnSortOption(SortOrder.NONE)

        expect(mockedPostMessage).toBeCalledWith({
          payload: mockColumnPath,
          type: MessageFromWebviewType.REMOVE_COLUMN_SORT
        })
      })
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
    it('should move a column from its current position to its new position', async () => {
      renderExperimentsTable()

      await expectHeaders(['A', 'B', 'C'])

      dragAndDrop(
        screen.getByText('B'),
        screen.getByText('C'),
        DragEnterDirection.AUTO
      )

      await expectHeaders(['A', 'C', 'B'])

      dragAndDrop(
        screen.getByText('A'),
        screen.getByText('B'),
        DragEnterDirection.AUTO
      )

      await expectHeaders(['C', 'B', 'A'])
    })

    it('should not move a column before the default columns', async () => {
      renderExperimentsTable()

      dragAndDrop(
        screen.getByText('B'),
        screen.getByText('Timestamp'),
        DragEnterDirection.AUTO
      )

      await expectHeaders(['A', 'B', 'C'])
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
        type: MessageFromWebviewType.RESIZE_COLUMN
      })
    })

    it('should move all the columns from a group from their current position to their new position', async () => {
      renderExperimentsTable({ ...tableDataFixture })

      let headers = await getHeaders()

      expect(headers.indexOf('threshold')).toBeGreaterThan(
        headers.indexOf('loss')
      )
      expect(headers.indexOf('test')).toBeGreaterThan(
        headers.indexOf('accuracy')
      )

      dragAndDrop(
        screen.getByText('process'),
        screen.getByText('loss'),
        DragEnterDirection.AUTO
      )

      headers = await getHeaders()

      expect(headers.indexOf('loss')).toBeGreaterThan(
        headers.indexOf('threshold')
      )

      dragAndDrop(
        screen.getByText('summary.json'),
        screen.getByText('test'),
        DragEnterDirection.AUTO
      )

      headers = await getHeaders()

      expect(headers.indexOf('accuracy')).toBeGreaterThan(
        headers.indexOf('test')
      )
    })
  })
})
