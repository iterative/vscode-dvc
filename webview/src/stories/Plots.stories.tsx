import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import {
  PlotsData,
  defaultSectionCollapsed
} from 'dvc/src/plots/webview/contract'
import livePlotsFixture from 'dvc/src/test/fixtures/expShow/livePlots'
import staticPlotsFixture from 'dvc/src/test/fixtures/plotsDiff/static'
import comparisonPlotsFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import Plots from '../plots/components/Plots'
import { useAppReducer } from '../plots/hooks/useAppReducer'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import '../plots/components/styles.module.scss'

export default {
  args: {
    data: {
      comparison: comparisonPlotsFixture,
      live: livePlotsFixture,
      sectionCollapsed: defaultSectionCollapsed,
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
  return <Plots state={state} dispatch={dispatch} />
}

export const WithData = Template.bind({})

export const WithLiveOnly = Template.bind({})
WithLiveOnly.args = {
  data: {
    live: livePlotsFixture,
    sectionCollapsed: defaultSectionCollapsed
  }
}

export const WithStaticOnly = Template.bind({})
WithStaticOnly.args = {
  data: {
    sectionCollapsed: defaultSectionCollapsed,
    static: staticPlotsFixture
  }
}

export const WithComparisonOnly = Template.bind({})
WithComparisonOnly.args = {
  data: {
    comparison: comparisonPlotsFixture,
    sectionCollapsed: defaultSectionCollapsed
  }
}

export const WithoutPlots = Template.bind({})
WithoutPlots.args = {
  data: {
    sectionCollapsed: defaultSectionCollapsed
  }
}

export const WithoutData = Template.bind({})
WithoutData.args = {
  data: undefined
}
