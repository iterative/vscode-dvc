import { Meta, Story } from '@storybook/react/types-6-0'
import { configureStore } from '@reduxjs/toolkit'
import { within } from '@testing-library/react'
import React from 'react'
import { Provider, useDispatch } from 'react-redux'
import plotsRevisionsFixture from 'dvc/src/test/fixtures/plotsDiff/revisions'
import {
  ComparisonRevisionData,
  Revision,
  PlotsComparisonData,
  PlotSize
} from 'dvc/src/plots/webview/contract'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import { ComparisonTable } from '../plots/components/comparisonTable/ComparisonTable'
import { WebviewWrapper } from '../shared/components/webviewWrapper/WebviewWrapper'
import { update } from '../plots/components/comparisonTable/comparisonTableSlice'
import { updateSelectedRevisions } from '../plots/components/webviewSlice'
import { storeReducers } from '../plots/store'

const MockedState: React.FC<{
  data: PlotsComparisonData
  selectedRevisions: Revision[]
  children: React.ReactNode
}> = ({ children, data, selectedRevisions }) => {
  const dispatch = useDispatch()
  dispatch(update(data))
  dispatch(updateSelectedRevisions(selectedRevisions))

  return <>{children}</>
}

export default {
  args: { ...comparisonTableFixture, revisions: plotsRevisionsFixture },
  component: ComparisonTable,
  title: 'Comparison Table'
} as Meta

const Template: Story = ({ plots, revisions }) => {
  const store = configureStore({
    reducer: storeReducers
  })
  return (
    <Provider store={store}>
      <MockedState
        data={{
          plots,
          size: PlotSize.REGULAR
        }}
        selectedRevisions={revisions}
      >
        <WebviewWrapper>
          <ComparisonTable />
        </WebviewWrapper>
      </MockedState>
    </Provider>
  )
}

export const Basic = Template.bind({})

export const WithPinnedColumn = Template.bind({})
WithPinnedColumn.parameters = {
  chromatic: { delay: 300 }
}
WithPinnedColumn.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const mainHeader = await canvas.findByTestId('main-header')
  const pin = within(mainHeader).getByRole('button')

  pin.click()
}

const removeSingleImage = (
  path: string,
  revisionsData: ComparisonRevisionData
): ComparisonRevisionData => {
  const filteredRevisionData: ComparisonRevisionData = {}
  for (const [revision, data] of Object.entries(revisionsData)) {
    if (path !== comparisonTableFixture.plots[0].path || revision !== 'main') {
      filteredRevisionData[revision] = data
    }
  }
  return filteredRevisionData
}

export const WithMissingData = Template.bind({})
WithMissingData.args = {
  ...comparisonTableFixture,
  plots: comparisonTableFixture.plots.map(({ path, revisions }) => ({
    path,
    revisions: removeSingleImage(path, revisions)
  }))
}
