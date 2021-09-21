/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom/extend-expect'
import { cleanup, render, screen } from '@testing-library/react'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { TableInstance } from 'react-table'
import { Table } from '.'
import styles from './Table/styles.module.scss'

describe('Table', () => {
  const getProps = (props: React.ReactPropTypes) => ({ ...props })
  const instance = {
    getTableBodyProps: getProps,
    getTableProps: getProps,
    headerGroups: [
      {
        getHeaderGroupProps: getProps,
        headers: [
          {
            getHeaderProps: getProps,
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
            column: {
              id: 'timestamp'
            },
            getCellProps: getProps,
            render: () => new Date('2021-09-09').toString(),
            row: {}
          }
        ],
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
    ]
  } as unknown as TableInstance<Experiment>
  const renderTable = (sorts: SortDefinition[] = []) =>
    render(<Table instance={instance} sorts={sorts} />)

  afterEach(() => {
    cleanup()
  })

  describe('Sorting', () => {
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
  })
})
