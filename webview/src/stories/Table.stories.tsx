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
  rows: rowsFixture.map(row => ({
    ...row,
    subRows: row.subRows?.map(experiment => ({
      ...experiment,
      selected: experiment.displayId !== '42b8736',
      subRows: experiment.subRows?.map(checkpoint => ({
        ...checkpoint,
        running: checkpoint.running || checkpoint.displayId === '23250b3',
        selected: experiment.displayId !== '42b8736'
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
  title: 'Table'
} as Meta

const Template: Story<{ tableData: TableData }> = ({ tableData }) => {
  return <Experiments tableData={tableData} />
}

export const WithData = Template.bind({})

export const WithDeeplyNestedData = Template.bind({})
WithDeeplyNestedData.args = { tableData: deeplyNestedTableData }

export const WithoutData = Template.bind({})
WithoutData.args = { tableData: undefined }
