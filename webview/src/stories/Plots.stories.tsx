import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import livePlotsFixture from 'dvc/src/test/fixtures/expShow/livePlots'
import plotsShowFixture from 'dvc/src/test/fixtures/plotsShow/output'
import Plots from '../plots/components/Plots'
import {
  useAppReducer,
  defaultCollapsibleSectionsState,
  CollapsibleSectionsState
} from '../plots/hooks/useAppReducer'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import '../plots/components/styles.module.scss'

export default {
  args: {
    collapsedSections: defaultCollapsibleSectionsState,
    data: {
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

export const WithStaticOnly = Template.bind({})
WithStaticOnly.args = {
  data: { live: { plots: [] }, static: plotsShowFixture }
}

export const WithoutPlots = Template.bind({})
WithoutPlots.args = { data: { live: { plots: [] }, static: {} } }

export const WithoutData = Template.bind({})
WithoutData.args = {
  data: undefined
}
