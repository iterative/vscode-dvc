import { Meta, Story } from '@storybook/react/types-6-0'
import { fireEvent, within } from '@testing-library/react'
import React from 'react'
import { ComparisonRevisionData } from 'dvc/src/plots/webview/contract'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import {
  ComparisonTable,
  ComparisonTableProps
} from '../plots/components/comparisonTable/ComparisonTable'
import { WebviewWrapper } from '../shared/components/webviewWrapper/WebviewWrapper'
import { DragDropProvider } from '../shared/components/dragDrop/DragDropContext'

export default {
  args: comparisonTableFixture,
  component: ComparisonTable,
  title: 'Comparison Table'
} as Meta

const Template: Story<ComparisonTableProps> = ({ plots, revisions }) => {
  return (
    <WebviewWrapper>
      <DragDropProvider>
        <ComparisonTable plots={plots} revisions={revisions} />
      </DragDropProvider>
    </WebviewWrapper>
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

  fireEvent.click(pin)
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
