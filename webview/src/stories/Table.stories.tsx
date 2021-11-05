import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { action } from '@storybook/addon-actions'
import rowsFixture from 'dvc/src/test/fixtures/expShow/rows'
import columnsFixture from 'dvc/src/test/fixtures/expShow/columns'
import workspaceChangesFixture from 'dvc/src/test/fixtures/expShow/workspaceChanges'
import Experiments from '../experiments/components/Experiments'

import './test-vscode-styles.scss'
import '../experiments/style.scss'

const dummyVsCodeApi = {
  postMessage: action('postMessage')
}

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
    },
    vsCodeApi: dummyVsCodeApi
  },
  component: Experiments,
  title: 'Table'
} as Meta

export const WithData: Story = ({ tableData }) => {
  return <Experiments tableData={tableData} />
}

export const WithoutData: Story = () => {
  return <Experiments tableData={undefined} />
}
