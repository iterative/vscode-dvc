import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { action } from '@storybook/addon-actions'
import complexRowData from 'dvc/src/test/fixtures/complex-row-example'
import complexColumnData from 'dvc/src/test/fixtures/complex-column-example'
import complexChangesData from 'dvc/src/test/fixtures/complex-changes-example'
import Experiments from '../experiments/components/Experiments'

import './test-vscode-styles.scss'
import '../experiments/style.scss'
import { Model } from '../experiments/model'

declare global {
  interface Window {
    webviewData: unknown
  }
}

window.webviewData = { theme: 'dark' }

const dummyVsCodeApi = {
  postMessage: action('postMessage')
}
const tableData = {
  changes: complexChangesData,
  columns: complexColumnData,
  columnsOrder: [],
  rows: complexRowData,
  sorts: [
    { descending: true, path: 'params:params.yaml:epochs' },
    { descending: false, path: 'params:params.yaml:log_file' }
  ]
}

export default {
  argTypes: {
    vsCodeApi: {
      table: {
        disable: true
      }
    }
  },
  args: {
    tableData,
    vsCodeApi: dummyVsCodeApi
  },
  component: Experiments,
  title: 'Table'
} as Meta

Model.getInstance().data = tableData

export const WithData: Story = ({ tableData, vsCodeApi }) => {
  return <Experiments tableData={tableData} vsCodeApi={vsCodeApi} />
}

export const WithoutData: Story = ({ vsCodeApi }) => {
  return <Experiments tableData={undefined} vsCodeApi={vsCodeApi} />
}
