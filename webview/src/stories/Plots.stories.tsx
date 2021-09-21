import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import complexRowData from 'dvc/src/test/fixtures/complex-row-example'
import complexColumnData from 'dvc/src/test/fixtures/complex-column-example'
import Plots from '../plots/components/Plots'

import './test-vscode-styles.scss'
import { parseTableData } from '../plots/components/App'

export default {
  argTypes: {
    vsCodeApi: {
      table: {
        disable: true
      }
    }
  },
  args: {
    tableData: { columns: complexColumnData, rows: complexRowData }
  },
  component: Plots,
  title: 'Plots'
} as Meta

export const WithData: Story = ({ tableData }) => {
  return <Plots plotsData={parseTableData(tableData)} />
}

export const WithoutData: Story = () => {
  return <Plots plotsData={undefined} />
}
