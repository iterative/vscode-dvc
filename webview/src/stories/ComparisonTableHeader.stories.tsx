import type { StoryFn, Meta } from '@storybook/react'
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

const Template: StoryFn<{
  displayColor: string
  name: string
  onClicked: () => void
  index: number
  pinnedColumn: string | undefined
}> = ({ name, displayColor, onClicked, pinnedColumn }) => (
  <WebviewWrapper>
    <ComparisonTableHeader
      displayColor={displayColor}
      onClicked={onClicked}
      id={name}
      order={[]}
      setOrder={() => {}}
      pinnedColumn={pinnedColumn}
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
  pinnedColumn: basicArgs.name
}
