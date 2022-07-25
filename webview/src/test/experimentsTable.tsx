import {
  fireEvent,
  render,
  within,
  screen,
  queries
} from '@testing-library/react'
import React from 'react'
import deeplyNestedTableDataFixture from 'dvc/src/test/fixtures/expShow/deeplyNested'
import tableDataFixture from 'dvc/src/test/fixtures/expShow/tableData'
import { MessageToWebviewType } from 'dvc/src/webview/contract'
import { tableData as sortingTableDataFixture } from './sort'
import { customQueries, getRow } from './queries'
import { App } from '../experiments/components/App'

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

export const renderTable = (data = tableDataFixture) => {
  const renderedTable = render(<App />, {
    queries: { ...queries, ...customQueries }
  })
  setTableData(data)
  return renderedTable
}

export const renderTableWithPlaceholder = () => {
  renderTable(deeplyNestedTableDataFixture)
}

export const renderTableWithNoColumns = () => {
  renderTable({ ...tableDataFixture, columns: [] })
}

export const renderTableWithWorkspaceRowOnly = () => {
  renderTable({ ...tableDataFixture, rows: [tableDataFixture.rows[0]] })
}

export const renderTableWithSortingData = () => {
  return renderTable(sortingTableDataFixture)
}

export const renderTableWithoutRunningExperiments = () => {
  renderTable({
    ...tableDataFixture,
    hasRunningExperiment: false
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

export const toggleExpansion = (label: string, btnTitle: string) => {
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
