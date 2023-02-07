import { Story, Meta } from '@storybook/react/types-6-0'
import React from 'react'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import { Studio } from '../connect/components/Studio'

export default {
  args: {
    data: {}
  },
  component: Studio,
  title: 'Setup'
} as Meta

const Template: Story = () => {
  return <Studio />
}

export const ConnectToStudio = Template.bind({})
