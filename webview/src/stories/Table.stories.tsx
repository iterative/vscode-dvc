import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'
import type { StoryFn, Meta } from '@storybook/react'
import { rowsFixtureWithBranches } from 'dvc/src/test/fixtures/expShow/base/rows'
import columnsFixture from 'dvc/src/test/fixtures/expShow/base/columns'
import workspaceChangesFixture from 'dvc/src/test/fixtures/expShow/base/workspaceChanges'
import deeplyNestedTableData from 'dvc/src/test/fixtures/expShow/deeplyNested/tableData'
import dataTypesTableFixture from 'dvc/src/test/fixtures/expShow/dataTypes/tableData'
import survivalTableData from 'dvc/src/test/fixtures/expShow/survival/tableData'
import { timestampColumn } from 'dvc/src/experiments/columns/constants'
import { delay } from 'dvc/src/util/time'
import {
  ExperimentStatus,
  isRunning
} from 'dvc/src/experiments/webview/contract'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import {
  within,
  userEvent,
  findByText,
  getAllByRole
} from '@storybook/testing-library'
import { addCommitDataToMainBranch } from './util'
import Experiments from '../experiments/components/Experiments'
import { experimentsReducers } from '../experiments/store'
import { TableDataState } from '../experiments/state/tableDataSlice'
import { NORMAL_TOOLTIP_DELAY } from '../shared/components/tooltip/Tooltip'
import {
  setExperimentsAsSelected,
  setExperimentsAsStarred
} from '../test/tableDataFixture'
import { featureFlag } from '../util/flags'

const tableData: TableDataState = {
  branches: ['current'],
  changes: workspaceChangesFixture,
  columnOrder: [],
  columnWidths: {
    'params:params.yaml:dvc_logs_dir': 300
  },
  columns: columnsFixture,
  filteredCount: 0,
  filters: ['params:params.yaml:lr'],
  hasBranchesToSelect: true,
  hasCheckpoints: true,
  hasColumns: true,
  hasConfig: true,
  hasData: true,
  hasMoreCommits: true,
  hasRunningWorkspaceExperiment: true,
  hasValidDvcYaml: true,
  isBranchesView: false,
  isShowingMoreCommits: true,
  rows: addCommitDataToMainBranch(rowsFixtureWithBranches).map(row => ({
    ...row,
    branch: 'current',
    subRows: row.subRows?.map(experiment => ({
      ...experiment,
      branch: 'current',
      starred: experiment.starred || experiment.label === '42b8736'
    }))
  })),
  selectedForPlotsCount: 2,
  sorts: [
    { descending: true, path: 'params:params.yaml:epochs' },
    { descending: false, path: 'params:params.yaml:log_file' }
  ]
}

const noRunningExperiments = {
  ...tableData,
  hasRunningWorkspaceExperiment: false,
  rows: addCommitDataToMainBranch(rowsFixtureWithBranches).map(row => ({
    ...row,
    status: ExperimentStatus.SUCCESS,
    subRows: row.subRows?.map(experiment => ({
      ...experiment,
      status: isRunning(experiment.status)
        ? ExperimentStatus.SUCCESS
        : experiment.status
    }))
  }))
}

const noRunningExperimentsNoCheckpoints = {
  ...noRunningExperiments,
  hasCheckpoints: false,
  rows: addCommitDataToMainBranch(rowsFixtureWithBranches).map(row => ({
    ...row,
    status: ExperimentStatus.SUCCESS,
    subRows: row.subRows?.map(experiment => ({
      ...experiment,
      status: isRunning(experiment.status)
        ? ExperimentStatus.SUCCESS
        : experiment.status,
      subRows: []
    }))
  }))
}

export default {
  args: {
    tableData
  },
  component: Experiments,
  title: 'Table'
} as Meta

const Template: StoryFn<{ tableData: TableDataState }> = ({ tableData }) => {
  return (
    <Provider
      store={configureStore({
        preloadedState: { tableData },
        reducer: experimentsReducers
      })}
    >
      <div style={{ height: '900px', overflow: 'auto' }}>
        <Experiments />
      </div>
    </Provider>
  )
}

export const WithData = Template.bind({})

export const WithSurvivalData = Template.bind({})
WithSurvivalData.args = {
  tableData: {
    ...survivalTableData,
    branches: ['current'],
    hasData: true,
    rows: addCommitDataToMainBranch(survivalTableData.rows)
  }
}

export const WithMiddleStates = Template.bind({})
const tableDataWithSomeSelectedExperiments = setExperimentsAsSelected(
  tableData,
  ['4fb124a', '42b8736', '1ba7bcd']
)
WithMiddleStates.args = {
  tableData: {
    ...setExperimentsAsStarred(tableDataWithSomeSelectedExperiments, [
      '1ba7bcd'
    ]),
    branches: ['current']
  }
}
WithMiddleStates.play = async ({ canvasElement }) => {
  await within(canvasElement).findByText('4fb124a')
  const checkboxes = await within(canvasElement).findAllByRole('checkbox')
  userEvent.click(checkboxes[1], { bubbles: true })
  await delay(0)
  userEvent.click(checkboxes[7], { bubbles: true, shiftKey: true })

  const collapseButton = within(canvasElement).getByTitle('Contract Row')
  userEvent.click(collapseButton)
}
WithMiddleStates.parameters = { chromatic: { delay: 2000 } }

export const WithNoRunningExperiments = Template.bind({})
WithNoRunningExperiments.args = {
  tableData: noRunningExperiments
}

const contextMenuPlay = async ({
  canvasElement
}: {
  canvasElement: HTMLElement
}) => {
  const experiment = await within(canvasElement).findByText('[exp-e7a67]')
  const clientRect = experiment.getBoundingClientRect()
  userEvent.click(experiment, {
    bubbles: true,
    button: 2,
    clientX: clientRect.left,
    clientY: clientRect.top
  })
}

export const WithContextMenu = Template.bind({})
WithContextMenu.args = {
  tableData: noRunningExperiments
}
WithContextMenu.play = contextMenuPlay

export const WithContextMenuNoCheckpoints = Template.bind({})
WithContextMenuNoCheckpoints.args = {
  tableData: noRunningExperimentsNoCheckpoints
}
WithContextMenuNoCheckpoints.play = contextMenuPlay

export const WithAllDataTypes = Template.bind({})
WithAllDataTypes.args = {
  tableData: {
    ...dataTypesTableFixture,
    branches: ['current'],
    hasData: true,
    rows: addCommitDataToMainBranch(dataTypesTableFixture.rows)
  }
}
WithAllDataTypes.play = async ({ canvasElement }) => {
  const falseCell = await within(canvasElement).findByText('false')
  userEvent.hover(falseCell, { bubbles: true })
}
WithAllDataTypes.parameters = {
  chromatic: { delay: NORMAL_TOOLTIP_DELAY[0] }
}

export const WithDeeplyNestedHeaders = Template.bind({})
WithDeeplyNestedHeaders.args = {
  tableData: {
    ...deeplyNestedTableData,
    branches: ['current'],
    hasData: true,
    rows: addCommitDataToMainBranch(deeplyNestedTableData.rows)
  }
}

export const LoadingData = Template.bind({})
LoadingData.args = { tableData: undefined }

export const WithNoExperiments = Template.bind({})
WithNoExperiments.args = {
  tableData: { ...tableData, rows: [rowsFixtureWithBranches[0]] }
}

export const WithNoColumns = Template.bind({})
WithNoColumns.args = {
  tableData: { ...tableData, columns: [] }
}

export const WithOnlyTimestamp = Template.bind({})
WithOnlyTimestamp.args = {
  tableData: { ...tableData, columns: [timestampColumn] }
}

export const WithNoSortsOrFilters = Template.bind({})
WithNoSortsOrFilters.args = {
  tableData: {
    ...tableData,
    filters: [],
    sorts: []
  }
}

export const Scrolled: StoryFn<{ tableData: TableDataState }> = ({
  tableData
}) => {
  return (
    <Provider
      store={configureStore({
        preloadedState: { tableData },
        reducer: experimentsReducers
      })}
    >
      <div style={{ height: '400px', overflow: 'auto', width: '600px' }}>
        <Experiments />
      </div>
    </Provider>
  )
}
Scrolled.play = async ({ canvasElement }) => {
  await findByText(canvasElement, '90aea7f')
  const rows = getAllByRole(canvasElement, 'row')
  const lastRow = rows[rows.length - 2]
  const lastRowCells = within(lastRow).getAllByRole('cell')
  const lastCell = lastRowCells[lastRowCells.length - 1]
  lastCell.scrollIntoView()
}
Scrolled.parameters = {
  chromatic: {
    viewports: [400]
  },
  viewport: {
    defaultViewport: 'scrollable',
    viewports: {
      scrollable: {
        name: 'Scrollable',
        styles: {
          height: '400px',
          width: '600px'
        },
        type: 'desktop'
      }
    }
  }
}

export const WithMultipleBranches = Template.bind({})
const rowsWithoutWorkspace = survivalTableData.rows.filter(
  row => row.id !== EXPERIMENT_WORKSPACE_ID
)
Object.assign(featureFlag, { ADD_REMOVE_BRANCHES: true })
const branches = ['current', 'other-branch', 'branch-14786']

WithMultipleBranches.args = {
  tableData: {
    ...tableData,
    branches,
    rows: [
      ...survivalTableData.rows.map(row => ({
        ...row,
        branch: branches[0],
        subRows: row.subRows?.map(subRow => ({
          ...subRow,
          branch: branches[0]
        }))
      })),
      ...rowsWithoutWorkspace.map(row => ({
        ...row,
        branch: branches[1],
        subRows: row.subRows?.map(subRow => ({
          ...subRow,
          branch: branches[1]
        }))
      })),
      ...rowsWithoutWorkspace.map(row => ({
        ...row,
        branch: branches[2],
        subRows: row.subRows?.map(subRow => ({
          ...subRow,
          branch: branches[2]
        }))
      }))
    ]
  }
}
