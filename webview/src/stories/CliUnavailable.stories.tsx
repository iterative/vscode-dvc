import { Story, Meta } from '@storybook/react/types-6-0'
import React from 'react'
import { CliUnavailable } from '../getStarted/components/CliUnavailable'

import './test-vscode-styles.scss'
import '../shared/style.scss'

export default {
  args: {
    data: {}
  },
  component: CliUnavailable,
  title: 'Cli Unavailable'
} as Meta

const Template: Story<{}> = () => {
  return <CliUnavailable />
}

export const NotFound = Template.bind({})
