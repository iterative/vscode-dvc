import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import {
  CombinedPlotsData,
  DEFAULT_SECTION_COLLAPSED
} from 'dvc/src/plots/webview/contract'
import checkpointPlotsFixture from 'dvc/src/test/fixtures/expShow/checkpointPlots'
import plotsFixture from 'dvc/src/test/fixtures/plotsDiff/plots'
import comparisonPlotsFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import { Plots } from '../plots/components/Plots'
import { useAppReducer } from '../plots/hooks/useAppReducer'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import '../plots/components/styles.module.scss'

export default {
  args: {
    data: {
      checkpoints: checkpointPlotsFixture,
      comparison: comparisonPlotsFixture,
      plots: plotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    }
  },
  component: Plots,
  title: 'Plots'
} as Meta

const Template: Story<{
  data?: CombinedPlotsData
}> = ({ data }) => {
  const [state, dispatch] = useAppReducer({ data })
  return <Plots state={state} dispatch={dispatch} />
}

export const WithData = Template.bind({})

export const WithLiveOnly = Template.bind({})
WithLiveOnly.args = {
  data: {
    checkpoints: checkpointPlotsFixture,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED
  }
}

export const WithStaticOnly = Template.bind({})
WithStaticOnly.args = {
  data: {
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    plots: plotsFixture
  }
}

export const WithComparisonOnly = Template.bind({})
WithComparisonOnly.args = {
  data: {
    comparison: comparisonPlotsFixture,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED
  }
}

export const WithoutPlots = Template.bind({})
WithoutPlots.args = {
  data: {
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED
  }
}

export const WithoutData = Template.bind({})
WithoutData.args = {
  data: undefined
}
