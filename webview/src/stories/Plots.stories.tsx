import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import complexRowData from 'dvc/src/test/fixtures/complex-row-example'
import complexColumnData from 'dvc/src/test/fixtures/complex-column-example'
import Plots from '../plots/components/Plots'

import './test-vscode-styles.scss'

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
  return <Plots tableData={tableData} />
}

export const WithoutData: Story = () => {
  return <Plots tableData={undefined} />
}
