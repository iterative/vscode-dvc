/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom/extend-expect'
import { cleanup, render, screen } from '@testing-library/react'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { HeaderGroup, TableInstance } from 'react-table'
import { Table } from '.'
import styles from './Table/styles.module.scss'
import * as Messaging from '../../util/useMessaging'

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
    jest.spyOn(Messaging, 'useMessaging').mockImplementation()
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

    it('should not have any sorting classes if the sorts property is empty', () => {
      renderTable()
      const column = screen.getByText('Timestamp')?.parentElement

      expect(column?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        false
      )
      expect(column?.className.includes(styles.sortingHeaderCellAsc)).toBe(
        false
      )
    })

    it('should apply the sortingHeaderCellAsc on the timestamp column if it is not descending in the sorts property', () => {
      renderTable([{ descending: false, path: 'timestamp' }])

      const column = screen.getByText('Timestamp')?.parentElement

      expect(column?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        false
      )
      expect(column?.className.includes(styles.sortingHeaderCellAsc)).toBe(true)
    })

    it('should apply the sortingHeaderCellDesc on the timestamp column if it is descending in the sorts property', () => {
      renderTable([{ descending: true, path: 'timestamp' }])

      const column = screen.getByText('Timestamp')?.parentElement

      expect(column?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        true
      )
      expect(column?.className.includes(styles.sortingHeaderCellAsc)).toBe(
        false
      )
    })

    it('should apply the sorting class if the cell is a placeholder above the column header when the sort is ascending', () => {
      renderTableWithPlaceholder(false)

      const header = screen.getByTestId(`header-${placeholderId}`)

      expect(header?.className.includes(styles.sortingHeaderCellAsc)).toBe(true)
    })

    it('should not apply the sorting class if there is a placeholder above the column header when the sort is ascending', () => {
      renderTableWithPlaceholder(false)

      const column = screen.getByText('Timestamp')?.parentElement

      expect(column?.className.includes(styles.sortingHeaderCellAsc)).toBe(
        false
      )
    })

    it('should not apply the sorting class if the cell is a placeholder above the column header when the sort is descending', () => {
      renderTableWithPlaceholder(true)

      const header = screen.getByTestId(`header-${placeholderId}`)

      expect(header?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        false
      )
    })

    it('should apply the sorting class if there is a placeholder above the column header when the sort is descending', () => {
      renderTableWithPlaceholder(true)

      const column = screen.getByText('Timestamp')?.parentElement

      expect(column?.className.includes(styles.sortingHeaderCellDesc)).toBe(
        true
      )
    })
  })

  describe('Changes', () => {
    it('should not have the workspaceWithChanges class on a row if there are no workspace changes', () => {
      renderTable()

      const row = screen.getByTestId('workspace-row')

      expect(row?.className.includes(styles.workspaceWithChanges)).toBe(false)
    })

    it('should have the workspaceWithChanges class on a row if there are no workspace changes', () => {
      renderTable(undefined, undefined, ['something_changed'])

      const row = screen.getByTestId('workspace-row')

      expect(row?.className.includes(styles.workspaceWithChanges)).toBe(true)
    })

    it('should not have the workspaceChange class on a cell if there are no changes', () => {
      renderTable()

      const row = screen.getByTestId('timestamp___workspace')

      expect(row?.className.includes(styles.workspaceChange)).toBe(false)
    })

    it('should not have the workspaceChange class on a cell if there are changes to other columns but not this one', () => {
      renderTable(undefined, undefined, ['a_change'])

      const row = screen.getByTestId('timestamp___workspace')

      expect(row?.className.includes(styles.workspaceChange)).toBe(false)
    })

    it('should have the workspaceChange class on a cell if there are changes matching the header of this column', () => {
      renderTable(undefined, undefined, ['Timestamp'])

      const row = screen.getByTestId('timestamp___workspace')

      expect(row?.className.includes(styles.workspaceChange)).toBe(true)
    })
  })
})
