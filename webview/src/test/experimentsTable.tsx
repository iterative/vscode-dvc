import { configureStore } from '@reduxjs/toolkit'
import {
  act,
  fireEvent,
  render,
  within,
  screen,
  queries
} from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import deeplyNestedTableDataFixture from 'dvc/src/test/fixtures/expShow/deeplyNested/tableData'
import tableDataFixture from 'dvc/src/test/fixtures/expShow/base/tableData'
import { MessageToWebviewType } from 'dvc/src/webview/contract'
import { ExecutorStatus } from 'dvc/src/cli/dvc/contract'
import { tableData as sortingTableDataFixture } from './sort'
import { customQueries, getRow } from './queries'
import { App } from '../experiments/components/App'
import { experimentsReducers } from '../experiments/store'

export const setTableData = (data = tableDataFixture) => {
  fireEvent(
    window,
    new MessageEvent('message', {
      data: {
        data,
        type: MessageToWebviewType.SET_DATA
      }
    })
  )
}

export const renderTable = (data = tableDataFixture, noData?: boolean) => {
  const renderedTable = render(
    <Provider store={configureStore({ reducer: experimentsReducers })}>
      <App />
    </Provider>,
    {
      queries: { ...queries, ...customQueries }
    }
  )

  !noData && setTableData(data)
  return renderedTable
}

export const renderTableWithPlaceholder = () => {
  renderTable(deeplyNestedTableDataFixture)
}

export const renderTableWithNoColumns = () => {
  renderTable({ ...tableDataFixture, columns: [] })
}

export const renderTableWithSortingData = () => {
  return renderTable(sortingTableDataFixture)
}

export const renderTableWithFilters = () => {
  return renderTable({
    ...tableDataFixture,
    filters: ['params:params.yaml:learning_rate']
  })
}

export const renderTableWithoutRunningExperiments = () => {
  renderTable({
    ...tableDataFixture,
    hasRunningWorkspaceExperiment: false,
    rows: tableDataFixture.rows.map(row => ({
      ...row,
      executorStatus: ExecutorStatus.SUCCESS,
      subRows: row.subRows?.map(subRow => ({
        ...subRow,
        executorStatus: ExecutorStatus.SUCCESS
      }))
    }))
  })
}

export const getCountIndicators = (element: HTMLElement) => {
  return within(element).queryAllByRole('marquee')
}

export const getCountIndicatorById = (
  row: HTMLElement,
  rowActionId: string
) => {
  const rowAction = within(row).getByTestId(rowActionId)

  return within(rowAction).queryByRole('marquee')
}

export const getCheckboxCountIndicator = (row: HTMLElement) => {
  return getCountIndicatorById(row, 'row-action-checkbox')
}

export const clickRowCheckbox = (label: string, multiSelection?: boolean) => {
  const checkbox = within(getRow(label)).getByRole('checkbox')

  fireEvent.click(checkbox, {
    shiftKey: multiSelection
  })
}

const toggleExpansion = (label: string, btnTitle: string) => {
  const button = within(getRow(label)).getByTitle(`${btnTitle} Row`)
  fireEvent.click(button)
}

export const contractRow = (label: string) => {
  toggleExpansion(label, 'Contract')
}

export const expandRow = (label: string) => {
  toggleExpansion(label, 'Expand')
}

export const selectedRows = () =>
  screen.queryAllByRole('row', { selected: true })

export const advanceTimersByTime = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms)
  })
