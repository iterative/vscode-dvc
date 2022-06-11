import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import rowsFixture from 'dvc/src/test/fixtures/expShow/rows'
import columnsFixture from 'dvc/src/test/fixtures/expShow/columns'
import { TableData } from 'dvc/src/experiments/webview/contract'
import workspaceChangesFixture from 'dvc/src/test/fixtures/expShow/workspaceChanges'
import deeplyNestedTableData from 'dvc/src/test/fixtures/expShow/deeplyNested'
import Experiments from '../experiments/components/Experiments'

import './test-vscode-styles.scss'
import '../shared/style.scss'

const tableData: TableData = {
  changes: workspaceChangesFixture,
  columnOrder: [],
  columnWidths: {
    'params:params.yaml:dvc_logs_dir': 300
  },
  columns: columnsFixture,
  filters: ['params:params.yaml:lr'],
  hasCheckpoints: true,
  hasColumns: true,
  hasRunningExperiment: true,
  rows: rowsFixture.map(row => ({
    ...row,
    subRows: row.subRows?.map(experiment => ({
      ...experiment,
      subRows: experiment.subRows?.map(checkpoint => ({
        ...checkpoint,
        running: checkpoint.running || checkpoint.label === '23250b3'
      }))
    }))
  })),
  sorts: [
    { descending: true, path: 'params:params.yaml:epochs' },
    { descending: false, path: 'params:params.yaml:log_file' }
  ]
}

export default {
  args: {
    tableData
  },
  component: Experiments,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/AuQXbrFj60xA2QXOjo9Z65/Experiments-Panel-%E2%80%A2-496'
    },
    layout: 'fullscreen'
  },
  title: 'Table'
} as Meta

const Template: Story<{ tableData: TableData }> = ({ tableData }) => {
  return <Experiments tableData={tableData} />
}

export const WithData = Template.bind({})

export const WithNoRunningExperiments = Template.bind({})
WithNoRunningExperiments.args = {
  tableData: {
    ...tableData,
    hasRunningExperiment: false,
    rows: rowsFixture.map(row => ({
      ...row,
      running: false,
      subRows: row.subRows?.map(experiment => ({
        ...experiment,
        running: false,
        subRows: experiment.subRows?.map(checkpoint => ({
          ...checkpoint,
          running: false
        }))
      }))
    }))
  }
}

export const WithDeeplyNestedHeaders = Template.bind({})
WithDeeplyNestedHeaders.args = { tableData: deeplyNestedTableData }

export const LoadingData = Template.bind({})
LoadingData.args = { tableData: undefined }

export const WithNoExperiments = Template.bind({})
WithNoExperiments.args = {
  tableData: { ...tableData, rows: [rowsFixture[0]] }
}

export const WithNoColumns = Template.bind({})
WithNoColumns.args = {
  tableData: { ...tableData, columns: [] }
}

export const WithNoSortsOrFilters = Template.bind({})
WithNoSortsOrFilters.args = {
  tableData: {
    ...tableData,
    filters: [],
    sorts: []
  }
}
