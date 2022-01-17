import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import { getImageData } from 'dvc/src/test/fixtures/plotsDiff'
import { PlotsComparisonData } from 'dvc/src/plots/webview/contract'
import { ComparisonTable } from '../plots/components/ComparisonTable/ComparisonTable'

export default {
  args: {
    colors: {
      '6220556': '#f14c4c',
      '7ee8096': '#cca700',
      a9eb4fd: '#3794ff',
      e36f8a9: '#d18616'
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
