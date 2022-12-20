import { Story, Meta } from '@storybook/react/types-6-0'
import React from 'react'
import { NoData as SetupNoData } from '../getStarted/components/NoData'

import './test-vscode-styles.scss'
import '../shared/style.scss'

export default {
  args: {
    data: {}
  },
  component: SetupNoData,
  title: 'Setup'
} as Meta

const Template: Story = () => {
  return <SetupNoData />
}

export const NoData = Template.bind({})
