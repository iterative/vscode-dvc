import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { PlotsData } from 'dvc/src/plots/webview/contract'
import livePlotsFixture from 'dvc/src/test/fixtures/expShow/livePlots'
import staticPlotsFixture from 'dvc/src/test/fixtures/plotsShow/staticPlots/storybook'
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
      live: livePlotsFixture,
      static: staticPlotsFixture
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
    static: undefined
  }
}

export const WithStaticOnly = Template.bind({})
WithStaticOnly.args = {
  data: {
    live: undefined,
    static: staticPlotsFixture
  }
}

export const WithoutPlots = Template.bind({})
WithoutPlots.args = {
  data: {
    live: undefined,
    static: undefined
  }
}

export const WithoutData = Template.bind({})
WithoutData.args = {
  data: undefined
}
