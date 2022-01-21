import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import { getImageData } from 'dvc/src/test/fixtures/plotsDiff'
import { PlotsComparisonData } from 'dvc/src/plots/webview/contract'
import { ComparisonTable } from '../plots/components/ComparisonTable/ComparisonTable'

export default {
  args: {
    colors: {
      '1ba7bcd': '#000000',
      '42b8736': '#3794ff',
      '4fb124a': '#ffffff',
      main: '#f14c4c'
    },
    plots: getImageData('.')
  },
  component: ComparisonTable,
  title: 'Comparison Table'
} as Meta

const Template: Story<PlotsComparisonData> = ({ plots, colors }) => (
  <ComparisonTable plots={plots} colors={colors} />
)

export const Basic = Template.bind({})
