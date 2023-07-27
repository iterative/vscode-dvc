import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'
import type { StoryFn, Meta } from '@storybook/react'
import rowsFixture from 'dvc/src/test/fixtures/expShow/base/rows'
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
  fireEvent,
  findByText,
  getAllByRole
} from '@storybook/testing-library'
import Experiments from '../experiments/components/Experiments'
import { experimentsReducers } from '../experiments/store'
import { TableDataState } from '../experiments/state/tableDataSlice'
import { NORMAL_TOOLTIP_DELAY } from '../shared/components/tooltip/Tooltip'
import {
  setExperimentsAsSelected,
  setExperimentsAsStarred
} from '../test/tableDataFixture'

const tableData: TableDataState = {
  changes: workspaceChangesFixture,
  cliError: null,
  columnOrder: [],
  columnWidths: {
    'params:params.yaml:dvc_logs_dir': 300
  },
  columns: columnsFixture,
  filters: ['params:params.yaml:lr'],
  hasBranchesToSelect: true,
  hasCheckpoints: true,
  hasColumns: true,
  hasConfig: true,
  hasData: true,
  hasMoreCommits: { main: true },
  hasRunningWorkspaceExperiment: true,
  isShowingMoreCommits: { main: true },
  rows: rowsFixture,
  selectedBranches: [],
  selectedForPlotsCount: 2,
  sorts: [
    { descending: true, path: 'params:params.yaml:epochs' },
    { descending: false, path: 'params:params.yaml:log_file' }
  ]
}

const noRunningExperiments = {
  ...tableData,
  hasRunningWorkspaceExperiment: false,
  rows: rowsFixture.map(row => ({
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
  rows: rowsFixture.map(row => ({
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

export const WithCliError = Template.bind({})
WithCliError.args = {
  tableData: {
    ...tableData,
    cliError: `ERROR: unrecognized arguments: -----borked

usage: dvc plots diff [-h] [-q | -v] [--targets [<paths> ...]] [-t [<path>]]

                      [-x <field>] [-y <field>] [--no-header] [--title <text>]

                      [--x-label <text>] [--y-label <text>] [-o <path>]

                      [--show-vega] [--open] [--html-template <path>]

                      [revisions ...]



Show multiple versions of a plot by overlaying them in a single image.

Documentation: <https://man.dvc.org/plots/diff>



positional arguments:

  revisions             Git commits to plot from



options:

  -h, --help            show this help message and exit

  -q, --quiet           Be quiet.

  -v, --verbose         Be verbose.

  --targets [<paths> ...]

                        Specific plots to visualize. Accepts any file path or

                        plot name from \`dvc.yaml\` file. Shows all tracked

                        plots by default.

  -t [<path>], --template [<path>]

                        Special JSON or HTML schema file to inject with the

                        data. See <https://man.dvc.org/plots#plot-

                        templates>

  -x <field>            Field name for X axis.

  -y <field>            Field name for Y axis.

  --no-header           Provided CSV or TSV datafile does not have a header.

  --title <text>        Plot title.

  --x-label <text>      X axis label

  --y-label <text>      Y axis label

  -o <path>, --out <path>

                        Directory to save plots to.

  --show-vega           Show output in Vega format.

  --open                Open plot file directly in the browser.

  --html-template <path>

                        Custom HTML template for VEGA visualization.`
  }
}

export const WithSurvivalData = Template.bind({})
WithSurvivalData.args = {
  tableData: {
    ...survivalTableData,
    hasData: true
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
    ])
  }
}
WithMiddleStates.play = async ({ canvasElement }) => {
  await within(canvasElement).findByText('4fb124a')
  const checkboxes = await within(canvasElement).findAllByRole('checkbox')
  await userEvent.click(checkboxes[1])
  await delay(0)
  fireEvent(
    checkboxes[7],
    new MouseEvent('click', { bubbles: true, shiftKey: true })
  )

  const collapseButton = within(canvasElement).getByTitle('Contract Row')
  return userEvent.click(collapseButton)
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
  fireEvent(
    experiment,
    new MouseEvent('contextmenu', {
      bubbles: true,
      button: 2,
      clientX: clientRect.left,
      clientY: clientRect.top
    })
  )
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
    hasData: true
  }
}
WithAllDataTypes.play = async ({ canvasElement }) => {
  const falseCell = await within(canvasElement).findByText('false')
  return userEvent.hover(falseCell)
}
WithAllDataTypes.parameters = {
  chromatic: { delay: NORMAL_TOOLTIP_DELAY[0] }
}

export const WithDeeplyNestedHeaders = Template.bind({})
WithDeeplyNestedHeaders.args = {
  tableData: {
    ...deeplyNestedTableData,
    hasData: true,
    rows: deeplyNestedTableData.rows
  }
}

export const LoadingData = Template.bind({})
LoadingData.args = { tableData: undefined }

export const WithNoExperiments = Template.bind({})
WithNoExperiments.args = {
  tableData: { ...tableData, rows: [] }
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
const branches = ['main', 'other-branch', 'branch-14786']

WithMultipleBranches.args = {
  tableData: {
    ...survivalTableData,
    hasData: true,
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
    ],
    selectedBranches: branches.slice(1)
  }
}
