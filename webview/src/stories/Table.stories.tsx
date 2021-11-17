import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import rowsFixture from 'dvc/src/test/fixtures/expShow/rows'
import columnsFixture from 'dvc/src/test/fixtures/expShow/columns'
import { TableData } from 'dvc/src/experiments/webview/contract'
import workspaceChangesFixture from 'dvc/src/test/fixtures/expShow/workspaceChanges'
import Experiments from '../experiments/components/Experiments'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import { Model } from '../experiments/model'

const tableData = {
  changes: workspaceChangesFixture,
  columns: columnsFixture,
  columnsOrder: [],
  rows: rowsFixture.map(row => ({
    ...row,
    subRows: row.subRows?.map(experiment => ({
      ...experiment,
      selected: experiment.displayName !== 'test-branch',
      subRows: experiment.subRows?.map(checkpoint => ({
        ...checkpoint,
        selected: experiment.displayName !== 'test-branch'
      }))
    }))
  })),
  sorts: [
    { descending: true, path: 'params:params.yaml:epochs' },
    { descending: false, path: 'params:params.yaml:log_file' }
  ]
}

const model = {} as Model

export default {
  args: {
    model,
    tableData
  },
  component: Experiments,
  title: 'Table'
} as Meta

const Template: Story<{ tableData: TableData; model: Model }> = ({
  tableData
}) => {
  return <Experiments tableData={tableData} model={model} />
}

export const WithData = Template.bind({})

export const WithoutData = Template.bind({})
WithoutData.args = { tableData: undefined }
