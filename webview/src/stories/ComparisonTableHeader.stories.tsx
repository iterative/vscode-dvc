import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import { ComparisonTableHeader } from '../plots/components/ComparisonTable1/ComparisonTableHeader'
import { Theme } from '../shared/components/theme1/Theme'

const basicArgs = {
  displayColor: '#945DD6',
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
  displayColor: string
  name: string
  onClicked: () => void
  index: number
  isPinned: boolean
}> = ({ name, displayColor, onClicked, isPinned }) => (
  <Theme>
    <ComparisonTableHeader
      displayColor={displayColor}
      onClicked={onClicked}
      isPinned={isPinned}
    >
      {name}
    </ComparisonTableHeader>
  </Theme>
)

export const Basic = Template.bind({})

export const OtherColor = Template.bind({})
OtherColor.args = {
  ...basicArgs,
  displayColor: '#13ADC7'
}

export const Pinned = Template.bind({})
Pinned.args = {
  ...basicArgs,
  isPinned: true
}
