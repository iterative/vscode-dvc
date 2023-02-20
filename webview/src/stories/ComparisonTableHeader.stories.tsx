import { Meta, Story } from '@storybook/react/types-6-0'
import React from 'react'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'
import { ComparisonTableHeader } from '../plots/components/comparisonTable/ComparisonTableHeader'
import { WebviewWrapper } from '../shared/components/webviewWrapper/WebviewWrapper'

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
  parameters: DISABLE_CHROMATIC_SNAPSHOTS,
  title: 'Comparison Table Header'
} as Meta

const Template: Story<{
  displayColor: string
  name: string
  onClicked: () => void
  index: number
  isPinned: boolean
}> = ({ name, displayColor, onClicked, isPinned }) => (
  <WebviewWrapper>
    <ComparisonTableHeader
      displayColor={displayColor}
      onClicked={onClicked}
      isPinned={isPinned}
    >
      {name}
    </ComparisonTableHeader>
  </WebviewWrapper>
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
