import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import {
  PlotsData,
  defaultCollapsedSections
} from 'dvc/src/plots/webview/contract'
import livePlotsFixture from 'dvc/src/test/fixtures/expShow/livePlots'
import staticPlotsFixture from 'dvc/src/test/fixtures/plotsShow/staticPlots/storybook'
import Plots from '../plots/components/Plots'
import { useAppReducer } from '../plots/hooks/useAppReducer'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import '../plots/components/styles.module.scss'

export default {
  args: {
    data: {
      collapsedSections: defaultCollapsedSections,
      live: livePlotsFixture,
      static: staticPlotsFixture
    }
  },
  component: Plots,
  title: 'Plots'
} as Meta

const Template: Story<{
  data?: PlotsData
}> = ({ data }) => {
  const [state, dispatch] = useAppReducer({ data })
  return <Plots state={state} dispatch={dispatch} sendMessage={() => {}} />
}

export const WithData = Template.bind({})

export const WithLiveOnly = Template.bind({})
WithLiveOnly.args = {
  data: {
    live: livePlotsFixture,
    static: null
  }
}

export const WithStaticOnly = Template.bind({})
WithStaticOnly.args = {
  data: {
    live: null,
    static: staticPlotsFixture
  }
}

export const WithoutPlots = Template.bind({})
WithoutPlots.args = {
  data: {
    live: null,
    static: null
  }
}

export const WithoutData = Template.bind({})
WithoutData.args = {
  data: undefined
}
