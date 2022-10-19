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
  PlotSizeNumber
} from 'dvc/src/plots/webview/contract'
import { MessageToWebviewType } from 'dvc/src/webview/contract'
import checkpointPlotsFixture from 'dvc/src/test/fixtures/expShow/checkpointPlots'
import templatePlotsFixture from 'dvc/src/test/fixtures/plotsDiff/template'
import manyTemplatePlots from 'dvc/src/test/fixtures/plotsDiff/template/virtualization'
import comparisonPlotsFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import plotsRevisionsFixture from 'dvc/src/test/fixtures/plotsDiff/revisions'
import smoothTemplatePlotContent from 'dvc/src/test/fixtures/plotsDiff/template/smoothTemplatePlot'
import { truncateVerticalTitle } from 'dvc/src/plots/vega/util'
import { chromaticParameters } from './util'
import { Plots } from '../plots/components/Plots'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import '../plots/components/styles.module.scss'
import { feedStore } from '../plots/components/App'
import { plotsReducers } from '../plots/store'

const smallCheckpointPlotsFixture = {
  ...checkpointPlotsFixture,
  plots: checkpointPlotsFixture.plots.map(plot => ({
    ...plot,
    title: truncateVerticalTitle(plot.title, PlotSizeNumber.SMALL) as string
  })),
  size: PlotSizeNumber.SMALL
}

const manyCheckpointPlots = (length: number, size = PlotSizeNumber.REGULAR) =>
  Array.from({ length }, () => checkpointPlotsFixture.plots[0]).map(
    (plot, i) => {
      const id = plot.id + i.toString()
      return {
        ...plot,
        id,
        title: truncateVerticalTitle(id, size) as string
      }
    }
  )

const manyCheckpointPlotsFixture = manyCheckpointPlots(15)

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
      checkpoint: checkpointPlotsFixture,
      comparison: comparisonPlotsFixture,
      hasPlots: true,
      hasSelectedPlots: false,
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
WithData.parameters = chromaticParameters

export const WithEmptyCheckpoints = Template.bind({})
WithEmptyCheckpoints.args = {
  data: {
    checkpoint: { ...checkpointPlotsFixture, selectedMetrics: [] },
    comparison: comparisonPlotsFixture,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture,
    template: templatePlotsFixture
  }
}

export const WithCheckpointOnly = Template.bind({})
WithCheckpointOnly.args = {
  data: {
    checkpoint: checkpointPlotsFixture,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture
  }
}

export const WithTemplateOnly = Template.bind({})
WithTemplateOnly.args = {
  data: {
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture,
    template: { ...templatePlotsFixture, size: PlotSizeNumber.REGULAR }
  }
}

export const WithComparisonOnly = Template.bind({})
WithComparisonOnly.args = {
  data: {
    comparison: comparisonPlotsFixture,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture
  }
}

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
    hasSelectedPlots: false,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture
  }
}

export const WithoutExperimentsSelected = Template.bind({})
WithoutExperimentsSelected.args = {
  data: {
    hasPlots: true,
    hasSelectedPlots: true,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: []
  }
}

export const WithoutAnySelected = Template.bind({})
WithoutAnySelected.args = {
  data: {
    hasPlots: true,
    hasSelectedPlots: false,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: undefined
  }
}

export const WithoutData = Template.bind({})
WithoutData.args = {
  data: undefined
}

export const AllLarge = Template.bind({})
AllLarge.args = {
  data: {
    checkpoint: { ...checkpointPlotsFixture, size: PlotSizeNumber.LARGE },
    comparison: { ...comparisonPlotsFixture, size: PlotSizeNumber.LARGE },
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture,
    template: { ...templatePlotsFixture, size: PlotSizeNumber.LARGE }
  }
}
AllLarge.parameters = chromaticParameters

export const AllSmall = Template.bind({})
AllSmall.args = {
  data: {
    checkpoint: smallCheckpointPlotsFixture,
    comparison: { ...comparisonPlotsFixture, size: PlotSizeNumber.SMALL },
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture,
    template: { ...templatePlotsFixture, size: PlotSizeNumber.SMALL }
  }
}
AllSmall.parameters = chromaticParameters

export const VirtualizedPlots = Template.bind({})
VirtualizedPlots.args = {
  data: {
    checkpoint: {
      ...checkpointPlotsFixture,
      plots: manyCheckpointPlotsFixture,
      selectedMetrics: manyCheckpointPlotsFixture.map(plot => plot.id)
    },
    comparison: undefined,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture,
    template: manyTemplatePlots(125)
  }
}
VirtualizedPlots.parameters = chromaticParameters

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
          entries: [
            ...templatePlotsFixture.plots[0].entries.map(plot => ({
              ...plot,
              content: { ...smoothTemplatePlotContent }
            }))
          ],
          group: TemplatePlotGroup.SINGLE_VIEW
        } as unknown as TemplatePlotSection
      ]
    }
  }
}
SmoothTemplate.parameters = chromaticParameters
