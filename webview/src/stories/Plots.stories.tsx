import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import livePlotsFixture from 'dvc/src/test/fixtures/expShow/livePlots'
import plotsShowFixture from 'dvc/src/test/fixtures/plotsShow/output'
import Plots from '../plots/components/Plots'
import './test-vscode-styles.scss'

export default {
  args: {
    plotsData: { live: livePlotsFixture, static: plotsShowFixture }
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
