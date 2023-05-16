import { screen } from '@testing-library/react'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import {
  Column,
  ColumnType,
  TableData
} from 'dvc/src/experiments/webview/contract'
import defaultTableData from 'dvc/src/test/fixtures/expShow/base/tableData'

const defaultColumn = ['Experiment', 'Created']

export const commonColumnFields = {
  hasChildren: false,
  parentPath: ColumnType.PARAMS,
  type: ColumnType.PARAMS
}

const columns = [
  {
    hasChildren: false,
    type: ColumnType.TIMESTAMP
  },
  {
    ...commonColumnFields,
    id: 'A',
    label: 'A',
    path: 'params:A'
  },
  {
    ...commonColumnFields,
    id: 'B',
    label: 'B',
    path: 'params:B'
  },
  {
    ...commonColumnFields,
    id: 'C',
    label: 'C',
    path: 'params:C'
  }
]

export const tableData: TableData = {
  ...defaultTableData,
  columns: columns as Column[],
  hasRunningWorkspaceExperiment: false,
  rows: [
    {
      branch: 'main',
      id: EXPERIMENT_WORKSPACE_ID,
      label: EXPERIMENT_WORKSPACE_ID
    },
    {
      branch: 'main',
      id: 'main',
      label: 'main'
    }
  ],
  selectedForPlotsCount: 0
}

export const getHeaders = async () => {
  const renderedHeadersAndPlaceholders = await screen.findAllByTestId(
    'rendered-header'
  )
  return renderedHeadersAndPlaceholders
    .map(header => header.textContent?.trim())
    .filter(Boolean)
}

export const expectHeaders = async (expectedHeaderNames: string[]) => {
  expect(await getHeaders()).toStrictEqual([
    ...defaultColumn,
    ...expectedHeaderNames
  ])
}
