import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { TableData } from 'dvc/src/experiments/webview/contract'
import complexTableData from './complex-table-data'
import Plots from '../plots/components/Plots'
import parseTableData from '../plots/parse-table-data'

import './test-vscode-styles.scss'

export default {
  args: {
    tableData: complexTableData
  },
  component: Plots,
  title: 'Plots'
} as Meta

export const WithData: Story<{ tableData: TableData }> = ({ tableData }) => {
  const plotsData = parseTableData(tableData)
  return <Plots plotsData={plotsData} />
}

export const WithoutData: Story = () => {
  return <Plots plotsData={undefined} />
}
