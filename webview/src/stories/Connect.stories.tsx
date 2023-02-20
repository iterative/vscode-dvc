import { Story, Meta } from '@storybook/react/types-6-0'
import React from 'react'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import { App } from '../connect/components/App'

export default {
  args: {
    data: {}
  },
  component: App,
  parameters: DISABLE_CHROMATIC_SNAPSHOTS,
  title: 'Connect'
} as Meta

const Template: Story = () => {
  return <App />
}

export const Studio = Template.bind({})
