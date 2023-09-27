import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React, { createRef } from 'react'
import { Table, Row } from '@tanstack/react-table'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import tableData from 'dvc/src/test/fixtures/expShow/base/tableData'
import { TableContent } from './TableContent'
import { mockRowModel } from '../../../../test/mockRowModel'
import { experimentsReducers } from '../../../store'
import {
  TableDataState,
  collectColumnData
} from '../../../state/tableDataSlice'

const tableStateData = {
  ...tableData,
  columnData: collectColumnData(tableData.columns)
}

jest.mock('../../../../shared/api')
jest.mock('./NestedRow')
jest.mock('./Row')

const getMockFlattenedRowModel = () => {
  const flatRows: Row<Experiment>[] = []
  const rows: Row<Experiment>[] = []

  for (const flatRow of mockRowModel.flatRows) {
    const { subRows } = flatRow

    flatRows.push(
      {
        ...flatRow,
        originalSubRows: undefined,
        subRows: []
      } as unknown as Row<Experiment>,
      ...(subRows as unknown as Row<Experiment>[])
    )
  }

  for (const row of mockRowModel.rows) {
    const { subRows } = row

    rows.push(
      {
        ...row,
        originalSubRows: undefined,
        subRows: []
      } as unknown as Row<Experiment>,
      ...(subRows as unknown as Row<Experiment>[])
    )
  }

  return { flatRows, rows }
}

describe('TableContent', () => {
  const instance = {
    getRowModel: () => ({
      ...mockRowModel
    })
  } as unknown as Table<Experiment>

  const renderTableContent = (
    rowsInstance = instance,
    tableData: TableDataState = tableStateData
  ) => {
    const { rows, flatRows } = rowsInstance.getRowModel()

    return render(
      <Provider
        store={configureStore({
          preloadedState: {
            rowSelection: {
              lastSelectedRowId: undefined,
              rowOrder: flatRows.map(
                ({
                  depth,
                  original: { branch, id, executorStatus, starred }
                }) => ({
                  branch,
                  depth,
                  executorStatus,
                  id,
                  starred
                })
              ),
              selectedRows: {}
            },
            tableData
          },
          reducer: experimentsReducers
        })}
      >
        <table>
          <TableContent
            rows={rows}
            tableHeadHeight={50}
            tableRef={createRef()}
          />
        </table>
      </Provider>
    )
  }

  it('should display the branches names before its rows', () => {
    const instanceRows = instance.getRowModel()
    const multipleBranchesInstance = {
      ...instance,
      getRowModel: () => ({
        flatRows: instanceRows.flatRows,
        rows: [
          ...instanceRows.rows,
          ...instanceRows.rows.map(row => ({
            ...row,
            id: `${row.id}-new-branch`,
            original: { ...row.original, branch: 'new-branch' }
          }))
        ]
      })
    } as unknown as Table<Experiment>
    renderTableContent(multipleBranchesInstance)

    expect(screen.getAllByTestId('branch-name').length).toBe(2)
    expect(screen.getByText('main')).toBeInTheDocument()
    expect(screen.getByText('new-branch')).toBeInTheDocument()
  })

  it('should not add branch rows when the table is sorted', () => {
    const multipleBranchesInstance = {
      ...instance,
      getRowModel: getMockFlattenedRowModel
    } as unknown as Table<Experiment>
    renderTableContent(multipleBranchesInstance, {
      ...tableStateData,
      sorts: [{ descending: true, path: 'path' }]
    })

    expect(screen.queryByTestId('branch-name')).not.toBeInTheDocument()
  })
})
