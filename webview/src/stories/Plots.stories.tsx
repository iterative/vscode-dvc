import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import {
  PlotsData,
  DEFAULT_SECTION_COLLAPSED
} from 'dvc/src/plots/webview/contract'
import checkpointPlotsFixture from 'dvc/src/test/fixtures/expShow/checkpointPlots'
import templatePlotsFixture from 'dvc/src/test/fixtures/plotsDiff/template'
import comparisonPlotsFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import { Plots } from '../plots/components/Plots'
import { useAppReducer } from '../plots/hooks/useAppReducer'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import '../plots/components/styles.module.scss'

export default {
  args: {
    data: {
      checkpoint: checkpointPlotsFixture,
      comparison: comparisonPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
      template: templatePlotsFixture
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

export const WithCheckpointOnly = Template.bind({})
WithCheckpointOnly.args = {
  data: {
    checkpoint: checkpointPlotsFixture,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED
  }
}

export const WithTemplateOnly = Template.bind({})
WithTemplateOnly.args = {
  data: {
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    template: templatePlotsFixture
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
