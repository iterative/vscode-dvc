import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider, useDispatch } from 'react-redux'
import type { StoryFn, Meta } from '@storybook/react'
import { userEvent, within, fireEvent } from '@storybook/testing-library'
import {
  PlotsData,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_NB_ITEMS_PER_ROW
} from 'dvc/src/plots/webview/contract'
import { MessageToWebviewType } from 'dvc/src/webview/contract'
import customPlotsFixture from 'dvc/src/test/fixtures/expShow/base/customPlots'
import templatePlotsFixture from 'dvc/src/test/fixtures/plotsDiff/template'
import manyTemplatePlots from 'dvc/src/test/fixtures/plotsDiff/template/virtualization'
import comparisonPlotsFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import plotsRevisionsFixture from 'dvc/src/test/fixtures/plotsDiff/revisions'
import { getBoundingBoxColor } from 'dvc/src/common/colors'
import {
  CHROMATIC_VIEWPORTS_WITH_DELAY,
  DISABLE_CHROMATIC_SNAPSHOTS
} from './util'
import { Plots } from '../plots/components/Plots'

import { feedStore } from '../plots/components/App'
import { plotsReducers } from '../plots/store'

const smallCustomPlotsFixture = {
  ...customPlotsFixture,
  nbItemsPerRow: 3
}

const manyCustomPlots = (length: number) =>
  Array.from({ length }, () => customPlotsFixture.plots[1]).map((plot, i) => {
    const id = plot.id + i.toString()
    return {
      ...plot,
      id
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

const defaultPlotsData = {
  cliError: null,
  comparison: {
    ...comparisonPlotsFixture,
    plots: comparisonPlotsFixture.plots.map(plot => {
      const classDetailsArr = Object.entries(plot.classDetails)

      if (classDetailsArr.length === 0) {
        return plot
      }

      classDetailsArr.unshift([
        'tree',
        { color: getBoundingBoxColor(classDetailsArr.length), selected: false }
      ])

      return { ...plot, classDetails: Object.fromEntries(classDetailsArr) }
    })
  },
  custom: customPlotsFixture,
  hasPlots: true,
  hasUnselectedPlots: false,
  plotErrors: [],
  sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
  selectedRevisions: plotsRevisionsFixture,
  template: templatePlotsFixture
}

export default {
  args: {
    data: defaultPlotsData
  },
  component: Plots,
  title: 'Plots'
} as Meta

const Template: StoryFn<{
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
WithData.parameters = CHROMATIC_VIEWPORTS_WITH_DELAY

export const WithPlotsErrors = Template.bind({})
const errorMsg = 'Could not find provided field'
WithPlotsErrors.args = {
  data: {
    ...defaultPlotsData,
    plotErrors: [
      {
        path: 'dvc.yaml:Loss',
        revs: [{ msg: errorMsg, rev: 'main' }]
      }
    ],
    selectedRevisions: plotsRevisionsFixture.map(rev => {
      if (rev.id === 'main') {
        return {
          ...rev,
          errors: [errorMsg]
        }
      }
      return rev
    })
  }
}

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
      nbItemsPerRow: DEFAULT_NB_ITEMS_PER_ROW
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

export const WithCliError = Template.bind({})
WithCliError.args = {
  data: {
    cliError: 'some big bad error'
  }
}

export const WithCliErrorAndCustomPlots = Template.bind({})
WithCliErrorAndCustomPlots.args = {
  data: {
    cliError: 'some big bad error',
    custom: customPlotsFixture
  }
}
WithCliErrorAndCustomPlots.parameters = DISABLE_CHROMATIC_SNAPSHOTS

export const WithCustomWithoutPlotsSelected = Template.bind({})
WithCustomWithoutPlotsSelected.args = {
  data: {
    custom: customPlotsFixture,
    hasPlots: true,
    hasUnselectedPlots: false,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: []
  }
}
WithCustomWithoutPlotsSelected.parameters = DISABLE_CHROMATIC_SNAPSHOTS

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
      width: 1
    },
    custom: {
      ...customPlotsFixture,
      nbItemsPerRow: 1
    },
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture,
    template: {
      ...templatePlotsFixture,
      nbItemsPerRow: 1
    }
  }
}
AllLarge.parameters = CHROMATIC_VIEWPORTS_WITH_DELAY

export const AllSmall = Template.bind({})
AllSmall.args = {
  data: {
    comparison: {
      ...comparisonPlotsFixture,
      width: 3
    },
    custom: smallCustomPlotsFixture,
    sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
    selectedRevisions: plotsRevisionsFixture,
    template: {
      ...templatePlotsFixture,
      nbItemsPerRow: 3
    }
  }
}
AllSmall.parameters = CHROMATIC_VIEWPORTS_WITH_DELAY

export const WithMixedMultiImgHeight = Template.bind({})
WithMixedMultiImgHeight.args = {
  data: {
    comparison: {
      ...comparisonPlotsFixture,
      plots: comparisonPlotsFixture.plots.filter(({ path }) =>
        path.includes('image')
      )
    }
  }
}
WithMixedMultiImgHeight.play = async ({ canvasElement }) => {
  const plotSizeSliders =
    await within(canvasElement).findByTestId('size-sliders')

  const sizeSlider = within(plotSizeSliders).getByRole('slider')

  fireEvent.change(sizeSlider, { target: { value: -5 } })

  const multiImgCells =
    await within(canvasElement).findAllByTestId('multi-image-cell')

  const multiImgSlider = within(multiImgCells[1]).getByRole('slider')
  fireEvent.change(multiImgSlider, { target: { value: 7 } })
}
WithMixedMultiImgHeight.parameters = { chromatic: { delay: 2000 } }

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
VirtualizedPlots.parameters = CHROMATIC_VIEWPORTS_WITH_DELAY

export const ZoomedInPlot = Template.bind({})
ZoomedInPlot.play = async ({ canvasElement }) => {
  const plots = await within(canvasElement).findAllByTestId(/^plot_/)
  const plot = await within(plots[0]).findByLabelText('Open Plot in Popup')

  return userEvent.click(plot)
}

export const MultiviewZoomedInPlot = Template.bind({})
MultiviewZoomedInPlot.play = async ({ canvasElement }) => {
  const plot = await within(canvasElement).findByTestId(
    'plots-section_template-multi_1'
  )
  await within(plot).findByRole('graphics-document')
  const plotButton = await within(plot).findByLabelText('Open Plot in Popup')

  return userEvent.click(plotButton)
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
