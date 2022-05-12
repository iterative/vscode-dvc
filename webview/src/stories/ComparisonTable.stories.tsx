import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import { ComparisonRevisionData } from 'dvc/src/plots/webview/contract'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import {
  ComparisonTable,
  ComparisonTableProps
} from '../plots/components/comparisonTable/ComparisonTable'
import { Theme } from '../shared/components/theme/Theme'

export default {
  args: comparisonTableFixture,
  component: ComparisonTable,
  title: 'Comparison Table'
} as Meta

const Template: Story<ComparisonTableProps> = ({
  plots,
  revisions,
  currentPinnedColumn
}) => (
  <Theme>
    <ComparisonTable
      plots={plots}
      revisions={revisions}
      currentPinnedColumn={currentPinnedColumn}
    />
  </Theme>
)

export const Basic = Template.bind({})

export const WithPinnedColumn = Template.bind({})
WithPinnedColumn.args = {
  ...comparisonTableFixture,
  currentPinnedColumn: 'main'
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
