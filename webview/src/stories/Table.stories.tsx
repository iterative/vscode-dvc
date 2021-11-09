import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import rowsFixture from 'dvc/src/test/fixtures/expShow/rows'
import columnsFixture from 'dvc/src/test/fixtures/expShow/columns'
import { TableData } from 'dvc/src/experiments/webview/contract'
import workspaceChangesFixture from 'dvc/src/test/fixtures/expShow/workspaceChanges'
import Experiments from '../experiments/components/Experiments'

import './test-vscode-styles.scss'
import '../shared/style.scss'

export default {
  args: {
    tableData: {
      changes: workspaceChangesFixture,
      columns: columnsFixture,
      columnsOrder: [],
      rows: rowsFixture,
      sorts: [
        { descending: true, path: 'params:params.yaml:epochs' },
        { descending: false, path: 'params:params.yaml:log_file' }
      ]
    }
  },
  component: Experiments,
  title: 'Table'
} as Meta

const Template: Story<{ tableData: TableData }> = ({ tableData }) => {
  return <Experiments tableData={tableData} />
}

export const WithData = Template.bind({})

export const WithoutData = Template.bind({})
WithoutData.args = { tableData: undefined }
