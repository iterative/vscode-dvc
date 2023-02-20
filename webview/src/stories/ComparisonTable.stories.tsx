/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Meta, Story } from '@storybook/react/types-6-0'
import { configureStore } from '@reduxjs/toolkit'
import { userEvent, within } from '@storybook/testing-library'
import React, { DetailedHTMLProps, HTMLAttributes } from 'react'
import { Provider, useDispatch } from 'react-redux'
import {
  ComparisonRevisionData,
  PlotsComparisonData,
  PlotSizeNumber
} from 'dvc/src/plots/webview/contract'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'
import { ComparisonTable } from '../plots/components/comparisonTable/ComparisonTable'
import { WebviewWrapper } from '../shared/components/webviewWrapper/WebviewWrapper'
import { update } from '../plots/components/comparisonTable/comparisonTableSlice'
import { update as ribbonUpdate } from '../plots/components/ribbon/ribbonSlice'
import { plotsReducers } from '../plots/store'

const MockedState: React.FC<{
  data: PlotsComparisonData
  children: React.ReactNode
}> = ({ children, data }) => {
  const dispatch = useDispatch()
  dispatch(update(data))
  dispatch(ribbonUpdate(0))

  return <>{children}</>
}

export default {
  args: comparisonTableFixture,
  component: ComparisonTable,
  title: 'Comparison Table'
} as Meta

const Template: Story = ({ plots, revisions }) => {
  const store = configureStore({
    reducer: plotsReducers
  })
  return (
    <Provider store={store}>
      <MockedState
        data={{
          plots,
          revisions,
          size: PlotSizeNumber.REGULAR
        }}
      >
        <WebviewWrapper>
          <div
            style={
              { '--size': `${PlotSizeNumber.REGULAR}px` } as DetailedHTMLProps<
                HTMLAttributes<HTMLDivElement>,
                HTMLDivElement
              >
            }
          >
            <ComparisonTable />
          </div>
        </WebviewWrapper>
      </MockedState>
    </Provider>
  )
}

export const Basic = Template.bind({})

Basic.parameters = DISABLE_CHROMATIC_SNAPSHOTS

export const WithPinnedColumn = Template.bind({})
WithPinnedColumn.play = async ({ canvasElement }) => {
  const mainHeader = await within(canvasElement).findByTestId('main-header')
  const pin = within(mainHeader).getByRole('button')

  userEvent.click(pin)
}

const removeImages = (
  path: string,
  revisionsData: ComparisonRevisionData
): ComparisonRevisionData => {
  const filteredRevisionData: ComparisonRevisionData = {}
  for (const [revision, data] of Object.entries(revisionsData)) {
    if (
      (path === comparisonTableFixture.plots[0].path && revision === 'main') ||
      revision === EXPERIMENT_WORKSPACE_ID
    ) {
      continue
    }
    filteredRevisionData[revision] = data
  }
  return filteredRevisionData
}

export const WithMissingData = Template.bind({})
WithMissingData.args = {
  plots: comparisonTableFixture.plots.map(({ path, revisions }) => ({
    path,
    revisions: removeImages(path, revisions)
  })),
  revisions: comparisonTableFixture.revisions.map(revision => {
    if (revision.id === EXPERIMENT_WORKSPACE_ID) {
      return { ...revision, fetched: false }
    }
    return revision
  })
}

export const WithOnlyMissingData = Template.bind({})
WithOnlyMissingData.args = {
  plots: comparisonTableFixture.plots.map(({ path, revisions }) => ({
    path,
    revisions: removeImages(path, revisions)
  })),
  revisions: comparisonTableFixture.revisions
    .map(revision => {
      if (revision.id === EXPERIMENT_WORKSPACE_ID) {
        return { ...revision, fetched: false }
      }
    })
    .filter(Boolean)
}
