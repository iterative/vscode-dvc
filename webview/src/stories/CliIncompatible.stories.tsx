import { Story, Meta } from '@storybook/react/types-6-0'
import React from 'react'
import { CliIncompatible } from '../setup/components/CliIncompatible'

import './test-vscode-styles.scss'
import '../shared/style.scss'

export default {
  args: {
    data: {}
  },
  component: CliIncompatible,
  title: 'Setup'
} as Meta

const Template: Story = () => {
  return <CliIncompatible />
}

export const CliFoundButNotCompatible = Template.bind({})
