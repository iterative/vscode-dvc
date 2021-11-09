import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import livePlotsFixture from 'dvc/src/test/fixtures/expShow/livePlots'
import plotsShowFixture from 'dvc/src/test/fixtures/plotsShow/output'
import Plots from '../plots/components/Plots'

import './test-vscode-styles.scss'
import '../shared/style.scss'

export default {
  args: {
    plotsData: {
      live: {
        colors: {
          domain: ['exp-83425', 'test-branch', 'exp-e7a67'],
          range: ['#CCA700', '#3794FF', '#F14C4C']
        },
        plots: livePlotsFixture
      },
      static: plotsShowFixture
    }
  },
  component: Plots,
  title: 'Plots'
} as Meta

const PlotsStoryTemplate: Story<{ plotsData?: PlotsData }> = ({
  plotsData
}) => {
  return <Plots plotsData={plotsData} />
}

export const WithData = PlotsStoryTemplate.bind({})

export const WithLiveOnly = PlotsStoryTemplate.bind({})
WithLiveOnly.args = {
  plotsData: {
    live: {
      colors: {
        domain: ['exp-83425', 'test-branch', 'exp-e7a67'],
        range: ['#CCA700', '#3794FF', '#F14C4C']
      },
      plots: livePlotsFixture
    },
    static: {}
  }
}

export const WithStaticOnly = PlotsStoryTemplate.bind({})
WithStaticOnly.args = {
  plotsData: { live: { plots: [] }, static: plotsShowFixture }
}

export const WithoutPlots = PlotsStoryTemplate.bind({})
WithoutPlots.args = { plotsData: { live: { plots: [] }, static: {} } }

export const WithoutData = PlotsStoryTemplate.bind({})
WithoutData.args = {
  plotsData: undefined
}
