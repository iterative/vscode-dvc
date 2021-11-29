import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import livePlotsFixture from 'dvc/src/test/fixtures/expShow/livePlots'
import plotsShowFixture from 'dvc/src/test/fixtures/plotsShow/output'
import { ParamOrMetric } from 'dvc/src/experiments/webview/contract'
import Plots from '../plots/components/Plots'
import {
  useAppReducer,
  defaultCollapsibleSectionsState,
  CollapsibleSectionsState
} from '../plots/hooks/useAppReducer'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import '../plots/components/styles.module.scss'

const metrics = [
  {
    group: 'metrics',
    name: 'loss',
    path: 'metrics:summary.json:loss'
  } as unknown as ParamOrMetric,
  {
    group: 'metrics',
    name: 'accuracy',
    path: 'metrics:summary.json:accuracy'
  } as unknown as ParamOrMetric,
  {
    group: 'metrics',
    name: 'val_loss',
    path: 'metrics:summary.json:val_loss'
  } as unknown as ParamOrMetric,
  {
    group: 'metrics',
    name: 'val_accuracy',
    path: 'metrics:summary.json:val_accuracy'
  } as unknown as ParamOrMetric
]

export default {
  args: {
    collapsedSections: defaultCollapsibleSectionsState,
    data: {
      live: livePlotsFixture,
      metrics,
      static: plotsShowFixture
    }
  },
  component: Plots,
  title: 'Plots'
} as Meta

const Template: Story<{
  collapsedSections: CollapsibleSectionsState
  data?: PlotsData
}> = ({ collapsedSections, data }) => {
  const [state, dispatch] = useAppReducer({ collapsedSections, data })
  return <Plots state={state} dispatch={dispatch} />
}

export const WithData = Template.bind({})

export const WithLiveOnly = Template.bind({})
WithLiveOnly.args = {
  data: {
    live: livePlotsFixture,
    metrics,
    static: undefined
  }
}

export const WithStaticOnly = Template.bind({})
WithStaticOnly.args = {
  data: {
    live: undefined,
    metrics: undefined,
    static: plotsShowFixture
  }
}

export const WithoutPlots = Template.bind({})
WithoutPlots.args = {
  data: {
    live: undefined,
    metrics: undefined,
    static: undefined
  }
}

export const WithoutData = Template.bind({})
WithoutData.args = {
  data: undefined
}
