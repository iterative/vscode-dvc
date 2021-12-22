import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import { ComparisonTableHeader } from '../plots/components/ComparisonTable/ComparisonTableHeader'

const basicArgs = {
  color: '#945DD6',
  index: 1,
  name: 'exp-11caa2a'
}

export default {
  argTypes: {
    onClicked: { action: 'pinned' }
  },
  args: basicArgs,
  component: ComparisonTableHeader,
  title: 'Comparison Table Header'
} as Meta

const Template: Story<{
  color: string
  name: string
  onClicked: () => void
  index: number
  isPinned: boolean
}> = ({ name, color, onClicked, index, isPinned }) => (
  <ComparisonTableHeader
    color={color}
    onClicked={onClicked}
    index={index}
    isPinned={isPinned}
  >
    {name}
  </ComparisonTableHeader>
)

export const Basic = Template.bind({})

export const OtherColor = Template.bind({})
OtherColor.args = {
  ...basicArgs,
  color: '#13ADC7'
}

export const Pinned = Template.bind({})
Pinned.args = {
  ...basicArgs,
  isPinned: true
}
