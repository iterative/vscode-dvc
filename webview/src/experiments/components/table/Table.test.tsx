/**
 * @jest-environment jsdom
 */
/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectHeaders"] }] */
import '@testing-library/jest-dom/extend-expect'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within
} from '@testing-library/react'
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
import { SortOrderLabel } from './SortPicker'
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
  const renderExperimentsTable = (
    data: TableData = sortingTableDataFixture
  ) => {
    const view = render(<ExperimentsTable tableData={data} />)

    mockDndElSpacing(view)

    return view
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

    const findSortableColumn = async (headerText = mockColumnName) =>
      await screen.findByText(headerText)

    const clickOnSortOption = async (optionLabel: SortOrderLabel) => {
      const column = await findSortableColumn()
      fireEvent.contextMenu(column, {
        bubbles: true
      })
      const columnMenu = await screen.findByRole('menu')

      const sortOption = await within(columnMenu).findByText(optionLabel)
      fireEvent.click(sortOption)
    }

    describe('Given no sorting is present yet', () => {
      it('should add an ascending sort to the column path when the user clicks on the Ascending option', async () => {
        renderExperimentsTable()
        await clickOnSortOption(SortOrderLabel.ASCENDING)
        expect(mockedPostMessage).toBeCalledWith({
          payload: {
            descending: false,
            path: mockColumnPath
          },
          type: 'column-sorted'
        })
      })

      it('should add a descending sort to the column path when the user clicks on the Descending option', async () => {
        renderExperimentsTable()
        await clickOnSortOption(SortOrderLabel.DESCENDING)
        expect(mockedPostMessage).toBeCalledWith({
          payload: {
            descending: true,
            path: mockColumnPath
          },
          type: 'column-sorted'
        })
      })

      it('should not do anything when the user clicks on the None option', async () => {
        renderExperimentsTable()
        await clickOnSortOption(SortOrderLabel.NONE)
        expect(mockedPostMessage).not.toHaveBeenCalled()
      })
    })

    describe('Given an initial ascending column sort', () => {
      it('should add a descending sort to the column path when the user clicks on the Descending option', async () => {
        renderExperimentsTable({
          ...sortingTableDataFixture,
          sorts: [
            {
              descending: false,
              path: mockColumnPath
            }
          ]
        })
        await clickOnSortOption(SortOrderLabel.DESCENDING)
        expect(mockedPostMessage).toBeCalledWith({
          payload: {
            descending: true,
            path: mockColumnPath
          },
          type: 'column-sorted'
        })
      })

      it('should not do anything when the user clicks on the Ascending option', async () => {
        renderExperimentsTable({
          ...sortingTableDataFixture,
          sorts: [
            {
              descending: false,
              path: mockColumnPath
            }
          ]
        })
        await clickOnSortOption(SortOrderLabel.ASCENDING)
        expect(mockedPostMessage).not.toHaveBeenCalled()
      })

      it('should remove the column sort when the user clicks on the None option', async () => {
        renderExperimentsTable({
          ...sortingTableDataFixture,
          sorts: [
            {
              descending: false,
              path: mockColumnPath
            }
          ]
        })
        await clickOnSortOption(SortOrderLabel.NONE)
        expect(mockedPostMessage).toBeCalledWith({
          payload: mockColumnPath,
          type: 'column-sort-removed'
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
