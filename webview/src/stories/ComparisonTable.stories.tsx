import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import { getImageData } from 'dvc/src/test/fixtures/plotsShow'
import { LivePlotsColors, PlotsOutput } from 'dvc/src/plots/webview/contract'
import { ComparisonTable } from '../plots/components/ComparisonTable/ComparisonTable'

export default {
  args: {
    colors: {
      domain: ['6220556', 'a9eb4fd', '7ee8096', 'e36f8a9'],
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
