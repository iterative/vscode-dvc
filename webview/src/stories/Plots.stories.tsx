import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import {
  PlotsData,
  DEFAULT_SECTION_COLLAPSED,
  PlotSize
} from 'dvc/src/plots/webview/contract'
import checkpointPlotsFixture, {
  manyCheckpointPlots
} from 'dvc/src/test/fixtures/expShow/checkpointPlots'
import templatePlotsFixture, {
  manyTemplatePlots
} from 'dvc/src/test/fixtures/plotsDiff/template'
import comparisonPlotsFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import { chromaticParameters } from './util'
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
  const [state] = useAppReducer({ data })
  return <Plots state={state} />
}

export const WithData = Template.bind({})
WithData.parameters = chromaticParameters

export const WithEmptyCheckpoints = Template.bind({})
WithEmptyCheckpoints.args = {
  data: {
    checkpoint: { ...checkpointPlotsFixture, selectedMetrics: [] },
    comparison: comparisonPlotsFixture,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    template: templatePlotsFixture
  }
}

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

export const AllLarge = Template.bind({})
AllLarge.args = {
  data: {
    checkpoint: { ...checkpointPlotsFixture, size: PlotSize.LARGE },
    comparison: { ...comparisonPlotsFixture, size: PlotSize.LARGE },
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    template: { ...templatePlotsFixture, size: PlotSize.LARGE }
  }
}
AllLarge.parameters = chromaticParameters

export const AllSmall = Template.bind({})
AllSmall.args = {
  data: {
    checkpoint: { ...checkpointPlotsFixture, size: PlotSize.SMALL },
    comparison: { ...comparisonPlotsFixture, size: PlotSize.SMALL },
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    template: { ...templatePlotsFixture, size: PlotSize.SMALL }
  }
}
AllSmall.parameters = chromaticParameters

const moreCheckpointPlots = manyCheckpointPlots(10)

export const VirtualizedPlots = Template.bind({})
VirtualizedPlots.args = {
  data: {
    checkpoint: {
      ...checkpointPlotsFixture,
      plots: moreCheckpointPlots,
      selectedMetrics: moreCheckpointPlots.map(plot => plot.title)
    },
    comparison: undefined,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    template: manyTemplatePlots(10)
  }
}
VirtualizedPlots.parameters = chromaticParameters
