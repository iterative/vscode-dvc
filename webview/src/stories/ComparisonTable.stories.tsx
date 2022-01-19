import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import { getImageData } from 'dvc/src/test/fixtures/plotsDiff'
import { LivePlotsColors, PlotsOutput } from 'dvc/src/plots/webview/contract'
import { ComparisonTable } from '../plots/components/ComparisonTable/ComparisonTable'

export default {
  args: {
    colors: {
      domain: ['master', '42b8736', '1ba7bcd', '4fb124a'],
      range: ['#f14c4c', '#3794ff', '#cca700', '#d18616']
    },
    plots: getImageData('.')
  },
  component: ComparisonTable,
  title: 'Comparison Table'
} as Meta

const Template: Story<{
  plots: PlotsOutput
  colors: LivePlotsColors
}> = ({ plots, colors }) => <ComparisonTable plots={plots} colors={colors} />

export const Basic = Template.bind({})
