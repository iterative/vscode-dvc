import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import { PlotsComparisonData } from 'dvc/src/plots/webview/contract'
import { ComparisonTable } from '../plots/components/ComparisonTable'
import { Theme } from '../shared/components/Theme'

export default {
  args: comparisonTableFixture,
  component: ComparisonTable,
  title: 'Comparison Table'
} as Meta

const Template: Story<PlotsComparisonData> = ({ plots, revisions }) => (
  <Theme>
    <ComparisonTable plots={plots} revisions={revisions} />
  </Theme>
)

export const Basic = Template.bind({})
