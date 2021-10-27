/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom/extend-expect'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
import { Table } from '.'
import styles from './Table/styles.module.scss'
import * as Messaging from '../../util/useMessaging'
import { ExperimentsTable } from '../Experiments'

describe('Table', () => {
  const getProps = (props: React.ReactPropTypes) => ({ ...props })
  const headerGroupBasicProps = {
    getHeaderGroupProps: getProps
  }
  const headerBasicProps = {
    getHeaderProps: getProps
  }
  const basicCellProps = {
    getCellProps: getProps,
    row: {
      id: 'workspace'
    }
  }
  const instance = {
    getTableBodyProps: getProps,
    getTableProps: getProps,
    headerGroups: [
      {
        ...headerGroupBasicProps,
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
    setColumnOrder: jest.fn
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
        columnsOrder={[]}
      />
    )

  beforeAll(() => {
    jest.spyOn(Messaging, 'useMessaging').mockImplementation(() => () => {})
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
          ...headerGroupBasicProps,
          headers: [placeHolderHeaderExp, placeholderHeaderTimestamp]
        } as unknown as HeaderGroup<Experiment>,
        ...newInstance.headerGroups
      ]

      renderTable([{ descending, path: 'timestamp' }], newInstance)
    }

    it('should not have any sorting classes if the sorts property is empty', async () => {
      renderTable()
      const column = await waitFor(
        () => screen.getByText('Timestamp')?.parentElement
      )

      expect(column?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        false
      )
      expect(column?.className.includes(styles.sortingHeaderCellAsc)).toBe(
        false
      )
    })

    it('should apply the sortingHeaderCellAsc on the timestamp column if it is not descending in the sorts property', async () => {
      renderTable([{ descending: false, path: 'timestamp' }])

      const column = await waitFor(
        () => screen.getByText('Timestamp')?.parentElement
      )

      expect(column?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        false
      )
      expect(column?.className.includes(styles.sortingHeaderCellAsc)).toBe(true)
    })

    it('should apply the sortingHeaderCellDesc on the timestamp column if it is descending in the sorts property', async () => {
      renderTable([{ descending: true, path: 'timestamp' }])

      const column = await waitFor(
        () => screen.getByText('Timestamp')?.parentElement
      )

      expect(column?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        true
      )
      expect(column?.className.includes(styles.sortingHeaderCellAsc)).toBe(
        false
      )
    })

    it('should apply the sorting class if the cell is a placeholder above the column header when the sort is ascending', async () => {
      renderTableWithPlaceholder(false)

      const header = await waitFor(() =>
        screen.getByTestId(`header-${placeholderId}`)
      )

      expect(header?.className.includes(styles.sortingHeaderCellAsc)).toBe(true)
    })

    it('should not apply the sorting class if there is a placeholder above the column header when the sort is ascending', async () => {
      renderTableWithPlaceholder(false)

      const column = await waitFor(
        () => screen.getByText('Timestamp')?.parentElement
      )

      expect(column?.className.includes(styles.sortingHeaderCellAsc)).toBe(
        false
      )
    })

    it('should not apply the sorting class if the cell is a placeholder above the column header when the sort is descending', async () => {
      renderTableWithPlaceholder(true)

      const header = await waitFor(() =>
        screen.getByTestId(`header-${placeholderId}`)
      )

      expect(header?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        false
      )
    })

    it('should apply the sorting class if there is a placeholder above the column header when the sort is descending', async () => {
      renderTableWithPlaceholder(true)

      const column = await waitFor(
        () => screen.getByText('Timestamp')?.parentElement
      )

      expect(column?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        true
      )
    })
  })

  describe('Changes', () => {
    it('should not have the workspaceWithChanges class on a row if there are no workspace changes', async () => {
      renderTable()

      const row = await waitFor(() => screen.getByTestId('workspace-row'))

      expect(row?.className.includes(styles.workspaceWithChanges)).toBe(false)
    })

    it('should have the workspaceWithChanges class on a row if there are workspace changes', async () => {
      renderTable(undefined, undefined, ['something_changed'])

      const row = await waitFor(() => screen.getByTestId('workspace-row'))

      expect(row?.className.includes(styles.workspaceWithChanges)).toBe(true)
    })

    it('should not have the workspaceChange class on a cell if there are no changes', async () => {
      renderTable()

      const row = await waitFor(() =>
        screen.getByTestId('timestamp___workspace')
      )

      expect(row?.className.includes(styles.workspaceChange)).toBe(false)
    })

    it('should not have the workspaceChange class on a cell if there are changes to other columns but not this one', async () => {
      renderTable(undefined, undefined, ['a_change'])

      const row = await waitFor(() =>
        screen.getByTestId('timestamp___workspace')
      )

      expect(row?.className.includes(styles.workspaceChange)).toBe(false)
    })

    it('should have the workspaceChange class on a cell if there are changes matching the column id', async () => {
      renderTable(undefined, undefined, ['timestamp'])

      const row = await waitFor(() =>
        screen.getByTestId('timestamp___workspace')
      )

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
      columns,
      columnsOrder: [],
      rows: [],
      sorts: []
    }

    const renderExperimentsTable = (data: TableData = tableData) => {
      const table = render(<ExperimentsTable tableData={data} />)

      mockDndElSpacing(table)

      const makeGetDragEl = (text: string) => () =>
        table.getByText(text).closest(DND_DRAGGABLE_DATA_ATTR)

      return { makeGetDragEl, ...table }
    }

    const defaultCols = ['Experiment', 'Timestamp']

    beforeEach(() => {
      mockGetComputedSpacing()
    })

    it('should move a column from its current position to its new position', async () => {
      const { getByText, makeGetDragEl } = renderExperimentsTable()

      let headers = await waitFor(() =>
        screen.getAllByTestId('rendered-header').map(header => header.innerHTML)
      )

      expect(headers).toEqual([...defaultCols, 'A', 'B', 'C'])

      await makeDnd({
        direction: DND_DIRECTION_LEFT,
        getByText,
        getDragEl: makeGetDragEl('C'),
        positions: 1
      })

      headers = await waitFor(() =>
        screen.getAllByTestId('rendered-header').map(header => header.innerHTML)
      )
      expect(headers).toEqual([...defaultCols, 'A', 'C', 'B'])

      await makeDnd({
        direction: DND_DIRECTION_RIGHT,
        getByText,
        getDragEl: makeGetDragEl('A'),
        positions: 2
      })

      headers = await waitFor(() =>
        screen.getAllByTestId('rendered-header').map(header => header.innerHTML)
      )
      expect(headers).toEqual([...defaultCols, 'C', 'B', 'A'])
    })

    it('should not move a column before the dafault columns', async () => {
      const { getByText, makeGetDragEl } = renderExperimentsTable()

      const headers = await waitFor(() =>
        screen.getAllByTestId('rendered-header').map(header => header.innerHTML)
      )

      await makeDnd({
        direction: DND_DIRECTION_LEFT,
        getByText,
        getDragEl: makeGetDragEl('B'),
        positions: 3
      })

      expect(headers).toEqual([...defaultCols, 'A', 'B', 'C'])
    })

    it('should order the columns with the columnsOrder from the data', async () => {
      const columnsOrder = [
        'id',
        'timestamp',
        'params:C',
        'params:B',
        'params:A'
      ]
      const tableDataWithCustomColOrder = {
        ...tableData,
        columnsOrder
      }
      renderExperimentsTable(tableDataWithCustomColOrder)

      const headers = await waitFor(() =>
        screen.getAllByTestId('rendered-header').map(header => header.innerHTML)
      )

      expect(headers).toEqual([...defaultCols, 'C', 'B', 'A'])
    })
  })
})
