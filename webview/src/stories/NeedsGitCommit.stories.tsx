import { Story, Meta } from '@storybook/react/types-6-0'
import React from 'react'
import { NeedsGitCommit as SetupNeedsGitCommit } from '../setup/components/NeedsGitCommit'

import './test-vscode-styles.scss'
import '../shared/style.scss'

export default {
  args: {
    data: {}
  },
  component: SetupNeedsGitCommit,
  parameters: { chromatic: { disableSnapshot: true } },
  title: 'Setup'
} as Meta

const Template: Story = () => {
  return <SetupNeedsGitCommit showScmPanel={() => undefined} />
}

export const NeedsGitCommit = Template.bind({})
