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
      revision === 'workspace'
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
    if (revision.id === 'workspace') {
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
      if (revision.id === 'workspace') {
        return { ...revision, fetched: false }
      }
    })
    .filter(Boolean)
}
