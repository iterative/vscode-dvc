import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { action } from '@storybook/addon-actions'
import complexRowData from 'dvc/src/test/fixtures/complex-row-example'
import complexColumnData from 'dvc/src/test/fixtures/complex-column-example'
import complexChangesData from 'dvc/src/test/fixtures/complex-changes-example'
import Experiments from '../experiments/components/Experiments'

import './test-vscode-styles.scss'
import '../experiments/style.scss'

const dummyVsCodeApi = {
  postMessage: action('postMessage')
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
    tableData: {
      changes: complexChangesData,
      columns: complexColumnData,
      columnsOrder: [],
      rows: complexRowData,
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

export const WithData: Story = ({ tableData, vsCodeApi }) => {
  return <Experiments tableData={tableData} vsCodeApi={vsCodeApi} />
}

export const WithoutData: Story = ({ vsCodeApi }) => {
  return <Experiments tableData={undefined} vsCodeApi={vsCodeApi} />
}
