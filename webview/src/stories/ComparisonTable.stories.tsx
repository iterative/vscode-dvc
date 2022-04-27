import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
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
