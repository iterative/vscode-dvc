import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { action } from '@storybook/addon-actions'
import complexRowData from 'dvc/src/test/fixtures/complex-row-example'
import complexColumnData from 'dvc/src/test/fixtures/complex-column-example'
import complexChangesData from 'dvc/src/test/fixtures/complex-changes-example'
import Experiments from '../components/Experiments'

import './test-vscode-styles.scss'
import '../style.scss'

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
      rows: complexRowData,
      sorts: [
        { descending: true, path: 'params:params.yaml:epochs' },
        { descending: false, path: 'params:params.yaml:log_file' }
      ]
    },
    vsCodeApi: dummyVsCodeApi
  },
  component: Experiments,
  title: 'Experiments/Table'
} as Meta

export const ComplexTable: Story = ({ tableData, vsCodeApi }) => {
  return <Experiments tableData={tableData} vsCodeApi={vsCodeApi} />
}
