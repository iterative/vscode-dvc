import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider, useDispatch } from 'react-redux'
import { Story, Meta } from '@storybook/react/types-6-0'
import { userEvent, within } from '@storybook/testing-library'
import {
  PlotsData,
  DEFAULT_SECTION_COLLAPSED,
  TemplatePlotGroup,
  TemplatePlotSection,
  PlotNumberOfItemsPerRow
} from 'dvc/src/plots/webview/contract'
import { MessageToWebviewType } from 'dvc/src/webview/contract'
import customPlotsFixture from 'dvc/src/test/fixtures/expShow/base/customPlots'
import templatePlotsFixture from 'dvc/src/test/fixtures/plotsDiff/template'
import manyTemplatePlots from 'dvc/src/test/fixtures/plotsDiff/template/virtualization'
import comparisonPlotsFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import plotsRevisionsFixture from 'dvc/src/test/fixtures/plotsDiff/revisions'
import smoothTemplatePlotContent from 'dvc/src/test/fixtures/plotsDiff/template/smoothTemplatePlot'
import { truncateVerticalTitle } from 'dvc/src/plots/vega/util'
import { CHROMATIC_VIEWPORTS, DISABLE_CHROMATIC_SNAPSHOTS } from './util'
import { Plots } from '../plots/components/Plots'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import '../plots/components/styles.module.scss'
import { feedStore } from '../plots/components/App'
import { plotsReducers } from '../plots/store'
// TBD review storybooks, making sure they all make sense
const manyCustomPlots = (length: number, size = PlotNumberOfItemsPerRow.TWO) =>
  Array.from({ length }, () => customPlotsFixture.plots[2]).map((plot, i) => {
    const id = plot.id + i.toString()
    return {
      ...plot,
      id,
      yTitle: truncateVerticalTitle(id, size) as string
    }
  })

const manyCustomPlotsFixture = manyCustomPlots(15)

const MockedState: React.FC<{ data: PlotsData; children: React.ReactNode }> = ({
  children,
  data
}) => {
  const dispatch = useDispatch()
  const message = { data, type: MessageToWebviewType.SET_DATA }
  feedStore(message, dispatch)

  return <>{children}</>
}

export default {
  args: {
    data: {
      comparison: comparisonPlotsFixture,
      custom: customPlotsFixture,
      hasPlots: true,
      hasUnselectedPlots: false,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
      selectedRevisions: plotsRevisionsFixture,
      template: templatePlotsFixture
    }
  },
  component: Plots,
  title: 'Plots'
} as Meta

const Template: Story<{
  data?: PlotsData
}> = ({ data }) => {
  const store = configureStore({ reducer: plotsReducers })
  return (
    <Provider store={store}>
      <MockedState data={data}>
        <Plots />
      </MockedState>
    </Provider>
  )
}

export const WithData = Template.bind({})
WithData.parameters = CHROMATIC_VIEWPORTS

export const WithEmptyCheckpoints = Template.bind({})
WithEmptyCheckpoints.args = {
  data: {
    comparison: comparisonPlotsFixture,
    custom: { ...customPlotsFixture },
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture,
    template: templatePlotsFixture
  }
}
WithEmptyCheckpoints.parameters = DISABLE_CHROMATIC_SNAPSHOTS

export const WithCheckpointOnly = Template.bind({})
WithCheckpointOnly.args = {
  data: {
    custom: customPlotsFixture,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture
  }
}
WithCheckpointOnly.parameters = DISABLE_CHROMATIC_SNAPSHOTS

export const WithCustomOnly = Template.bind({})
WithCustomOnly.args = {
  data: {
    custom: customPlotsFixture,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture
  }
}
WithCustomOnly.parameters = DISABLE_CHROMATIC_SNAPSHOTS

export const WithTemplateOnly = Template.bind({})
WithTemplateOnly.args = {
  data: {
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture,
    template: {
      ...templatePlotsFixture,
      nbItemsPerRow: PlotNumberOfItemsPerRow.TWO
    }
  }
}
WithTemplateOnly.parameters = DISABLE_CHROMATIC_SNAPSHOTS

export const WithComparisonOnly = Template.bind({})
WithComparisonOnly.args = {
  data: {
    comparison: comparisonPlotsFixture,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture
  }
}
WithComparisonOnly.parameters = DISABLE_CHROMATIC_SNAPSHOTS

export const WithoutPlots = Template.bind({})
WithoutPlots.args = {
  data: {
    hasPlots: false,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture
  }
}

export const WithoutPlotsSelected = Template.bind({})
WithoutPlotsSelected.args = {
  data: {
    hasPlots: true,
    hasUnselectedPlots: true,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture
  }
}

export const WithoutExperimentsSelected = Template.bind({})
WithoutExperimentsSelected.args = {
  data: {
    hasPlots: true,
    hasUnselectedPlots: false,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: []
  }
}

export const WithoutData = Template.bind({})
WithoutData.args = {
  data: undefined
}

export const AllLarge = Template.bind({})
AllLarge.args = {
  data: {
    comparison: {
      ...comparisonPlotsFixture,
      nbItemsPerRow: PlotNumberOfItemsPerRow.ONE
    },
    custom: {
      ...customPlotsFixture,
      nbItemsPerRow: PlotNumberOfItemsPerRow.ONE
    },
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture,
    template: {
      ...templatePlotsFixture,
      nbItemsPerRow: PlotNumberOfItemsPerRow.ONE
    }
  }
}
AllLarge.parameters = CHROMATIC_VIEWPORTS

export const AllSmall = Template.bind({})
AllSmall.args = {
  data: {
    comparison: {
      ...comparisonPlotsFixture,
      nbItemsPerRow: PlotNumberOfItemsPerRow.THREE
    },
    custom: {
      ...customPlotsFixture,
      nbItemsPerRow: PlotNumberOfItemsPerRow.THREE
    },
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture,
    template: {
      ...templatePlotsFixture,
      nbItemsPerRow: PlotNumberOfItemsPerRow.THREE
    }
  }
}
AllSmall.parameters = CHROMATIC_VIEWPORTS

export const VirtualizedPlots = Template.bind({})
VirtualizedPlots.args = {
  data: {
    comparison: undefined,
    custom: {
      ...customPlotsFixture,
      plots: manyCustomPlotsFixture
    },
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture,
    template: manyTemplatePlots(125)
  }
}
VirtualizedPlots.parameters = CHROMATIC_VIEWPORTS

export const ZoomedInPlot = Template.bind({})
ZoomedInPlot.play = async ({ canvasElement }) => {
  const plots = await within(canvasElement).findAllByTestId(/^plot_/)
  const plot = await within(plots[0]).findByRole('button')

  userEvent.click(plot)
}

export const MultiviewZoomedInPlot = Template.bind({})
MultiviewZoomedInPlot.play = async ({ canvasElement }) => {
  const plot = await within(canvasElement).findByTestId(
    'plots-section_template-multi_1'
  )
  await within(plot).findByRole('graphics-document')
  const plotButton = await within(plot).findByRole('button')

  userEvent.click(plotButton)
}

export const SmoothTemplate = Template.bind({})
SmoothTemplate.args = {
  data: {
    template: {
      ...templatePlotsFixture,
      plots: [
        {
          entries: templatePlotsFixture.plots[0].entries.map(plot => ({
            ...plot,
            content: { ...smoothTemplatePlotContent }
          })),
          group: TemplatePlotGroup.SINGLE_VIEW
        } as unknown as TemplatePlotSection
      ]
    }
  }
}
SmoothTemplate.parameters = {
  chromatic: { ...CHROMATIC_VIEWPORTS.chromatic, disableSnapshot: true }
}

export const ScrolledHeaders = Template.bind({})
ScrolledHeaders.play = async ({ canvasElement }) => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  const comparisonTableHead = await within(canvasElement).findByTestId(
    'comparison-table-head'
  )

  window.scrollTo({
    top: comparisonTableHead.getBoundingClientRect().top + 30
  })
}
ScrolledHeaders.parameters = {
  chromatic: { delay: 2500 }
}

export const ScrolledWithManyRevisions = Template.bind({})
ScrolledWithManyRevisions.args = {
  data: {
    comparison: comparisonPlotsFixture,
    custom: customPlotsFixture,
    hasPlots: true,
    hasUnselectedPlots: false,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: [
      ...plotsRevisionsFixture,
      ...plotsRevisionsFixture,
      ...plotsRevisionsFixture
    ],
    template: templatePlotsFixture
  }
}
ScrolledWithManyRevisions.play = async ({ canvasElement }) => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  const comparisonTableHead = await within(canvasElement).findByTestId(
    'comparison-table-head'
  )

  window.scrollTo({
    top: comparisonTableHead.getBoundingClientRect().top + 30
  })
}
ScrolledWithManyRevisions.parameters = {
  chromatic: { delay: 2500 }
}
