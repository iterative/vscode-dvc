import { Meta, Story } from '@storybook/react/types-6-0'
import { configureStore } from '@reduxjs/toolkit'
import { userEvent, within } from '@storybook/testing-library'
import React, { DetailedHTMLProps, HTMLAttributes } from 'react'
import { Provider, useDispatch } from 'react-redux'
import plotsRevisionsFixture from 'dvc/src/test/fixtures/plotsDiff/revisions'
import {
  ComparisonRevisionData,
  PlotsComparisonData,
  PlotSizeNumber
} from 'dvc/src/plots/webview/contract'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import { ComparisonTable } from '../plots/components/comparisonTable/ComparisonTable'
import { WebviewWrapper } from '../shared/components/webviewWrapper/WebviewWrapper'
import { update } from '../plots/components/comparisonTable/comparisonTableSlice'
import { plotsReducers } from '../plots/store'

const MockedState: React.FC<{
  data: PlotsComparisonData
  children: React.ReactNode
}> = ({ children, data }) => {
  const dispatch = useDispatch()
  dispatch(update(data))

  return <>{children}</>
}

export default {
  args: comparisonTableFixture,
  component: ComparisonTable,
  title: 'Comparison Table'
} as Meta

const Template: Story = ({ plots }) => {
  const store = configureStore({
    reducer: plotsReducers
  })
  return (
    <Provider store={store}>
      <MockedState
        data={{
          plots,
          revisions: plotsRevisionsFixture,
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

export const WithPinnedColumn = Template.bind({})
WithPinnedColumn.play = async ({ canvasElement }) => {
  const mainHeader = await within(canvasElement).findByTestId('main-header')
  const pin = within(mainHeader).getByRole('button')

  userEvent.click(pin)
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
