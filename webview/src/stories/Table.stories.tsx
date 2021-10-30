import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { action } from '@storybook/addon-actions'
import complexTableData from './complex-table-data'
import Experiments from '../experiments/components/Experiments'

import './test-vscode-styles.scss'
import '../table/style.scss'

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
    tableData: complexTableData,
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
