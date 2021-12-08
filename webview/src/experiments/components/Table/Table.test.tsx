/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom/extend-expect'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
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
import { mocked } from 'ts-jest/utils'
import { Table } from '.'
import styles from './Table/styles.module.scss'
import { ExperimentsTable } from '../Experiments'
import * as ColumnOrder from '../../hooks/useColumnOrder'

import { vsCodeApi } from '../../../shared/api'

jest.mock('../../../shared/api')
const { postMessage } = vsCodeApi
const mockedPostMessage = mocked(postMessage)

describe('Table', () => {
  const getParentElement = async (text: string) =>
    // eslint-disable-next-line testing-library/no-node-access
    (await screen.findByText(text))?.parentElement

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
        displayName: 'workspace',
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
  const renderTable = (
    sorts: SortDefinition[] = [],
    tableInstance = instance,
    changes: string[] = []
  ) =>
    render(
      <Table
        instance={tableInstance}
        sorts={sorts}
        changes={changes}
        columns={[]}
      />
    )

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

      renderTable([{ descending, path: 'timestamp' }], newInstance)
    }

    it('should not have any sorting classes if the sorts property is empty', async () => {
      renderTable()
      const column = await getParentElement('Timestamp')

      expect(column?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        false
      )
      expect(column?.className.includes(styles.sortingHeaderCellAsc)).toBe(
        false
      )
    })

    it('should apply the sortingHeaderCellAsc on the timestamp column if it is not descending in the sorts property', async () => {
      renderTable([{ descending: false, path: 'timestamp' }])

      const column = await getParentElement('Timestamp')

      expect(column?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        false
      )
      expect(column?.className.includes(styles.sortingHeaderCellAsc)).toBe(true)
    })

    it('should apply the sortingHeaderCellDesc on the timestamp column if it is descending in the sorts property', async () => {
      renderTable([{ descending: true, path: 'timestamp' }])

      const column = await getParentElement('Timestamp')

      expect(column?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        true
      )
      expect(column?.className.includes(styles.sortingHeaderCellAsc)).toBe(
        false
      )
    })

    it('should apply the sorting class if the cell is a placeholder above the column header when the sort is ascending', async () => {
      renderTableWithPlaceholder(false)

      const header = await screen.findByTestId(`header-${placeholderId}`)

      expect(header?.className.includes(styles.sortingHeaderCellAsc)).toBe(true)
    })

    it('should not apply the sorting class if there is a placeholder above the column header when the sort is ascending', async () => {
      renderTableWithPlaceholder(false)

      const column = await getParentElement('Timestamp')

      expect(column?.className.includes(styles.sortingHeaderCellAsc)).toBe(
        false
      )
    })

    it('should not apply the sorting class if the cell is a placeholder above the column header when the sort is descending', async () => {
      renderTableWithPlaceholder(true)

      const header = await screen.findByTestId(`header-${placeholderId}`)

      expect(header?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        false
      )
    })

    it('should apply the sorting class if there is a placeholder above the column header when the sort is descending', async () => {
      renderTableWithPlaceholder(true)

      const column = await getParentElement('Timestamp')

      expect(column?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        true
      )
    })
  })

  describe('Changes', () => {
    it('should not have the workspaceWithChanges class on a row if there are no workspace changes', async () => {
      renderTable()

      const row = await screen.findByTestId('workspace-row')

      expect(row?.className.includes(styles.workspaceWithChanges)).toBe(false)
    })

    it('should have the workspaceWithChanges class on a row if there are workspace changes', async () => {
      renderTable(undefined, undefined, ['something_changed'])

      const row = await screen.findByTestId('workspace-row')

      expect(row?.className.includes(styles.workspaceWithChanges)).toBe(true)
    })

    it('should not have the workspaceChange class on a cell if there are no changes', async () => {
      renderTable()

      const row = await screen.findByTestId('timestamp___workspace')

      expect(row?.className.includes(styles.workspaceChange)).toBe(false)
    })

    it('should not have the workspaceChange class on a cell if there are changes to other columns but not this one', async () => {
      renderTable(undefined, undefined, ['a_change'])

      const row = await screen.findByTestId('timestamp___workspace')

      expect(row?.className.includes(styles.workspaceChange)).toBe(false)
    })

    it('should have the workspaceChange class on a cell if there are changes matching the column id', async () => {
      renderTable(undefined, undefined, ['timestamp'])

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

    const renderExperimentsTable = (data: TableData = tableData) => {
      const view = render(<ExperimentsTable tableData={data} />)

      mockDndElSpacing(view)

      const makeGetDragEl = (text: string) => () =>
        // eslint-disable-next-line testing-library/no-node-access
        screen.getByText(text).closest(DND_DRAGGABLE_DATA_ATTR)

      return { makeGetDragEl, ...view }
    }

    const defaultCols = ['Experiment', 'Timestamp']

    beforeEach(() => {
      mockGetComputedSpacing()
    })

    it('should move a column from its current position to its new position', async () => {
      const { getByText, makeGetDragEl } = renderExperimentsTable()

      let headers = (await screen.findAllByTestId('rendered-header')).map(
        header => header.innerHTML
      )

      expect(headers).toEqual([...defaultCols, 'A', 'B', 'C'])

      await makeDnd({
        direction: DND_DIRECTION_LEFT,
        getByText,
        getDragEl: makeGetDragEl('C'),
        positions: 1
      })

      headers = (await screen.findAllByTestId('rendered-header')).map(
        header => header.innerHTML
      )

      expect(headers).toEqual([...defaultCols, 'A', 'C', 'B'])

      await makeDnd({
        direction: DND_DIRECTION_RIGHT,
        getByText,
        getDragEl: makeGetDragEl('A'),
        positions: 2
      })

      headers = (await screen.findAllByTestId('rendered-header')).map(
        header => header.innerHTML
      )

      expect(headers).toEqual([...defaultCols, 'C', 'B', 'A'])
    })

    it('should not move a column before the default columns', async () => {
      const { getByText, makeGetDragEl } = renderExperimentsTable()

      const headers = (await screen.findAllByTestId('rendered-header')).map(
        header => header.innerHTML
      )

      await makeDnd({
        direction: DND_DIRECTION_LEFT,
        getByText,
        getDragEl: makeGetDragEl('B'),
        positions: 3
      })

      expect(headers).toEqual([...defaultCols, 'A', 'B', 'C'])
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

      const headers = (await screen.findAllByTestId('rendered-header')).map(
        header => header.innerHTML
      )

      expect(headers).toEqual([...defaultCols, 'C', 'B', 'A'])
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
