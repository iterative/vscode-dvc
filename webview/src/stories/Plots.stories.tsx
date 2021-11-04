import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import complexPlotsData from 'dvc/src/test/fixtures/complex-live-plots-example'
import Plots from '../plots/components/Plots'
import './test-vscode-styles.scss'

export default {
  args: {
    plotsData: complexPlotsData
  },
  component: Plots,
  title: 'Plots'
} as Meta

export const WithData: Story<{ plotsData: PlotsData }> = ({ plotsData }) => {
  return <Plots plotsData={plotsData} />
}

export const WithoutData: Story = () => {
  return <Plots plotsData={undefined} />
}

export const WithoutExperiments: Story = () => {
  return <Plots plotsData={[]} />
}
