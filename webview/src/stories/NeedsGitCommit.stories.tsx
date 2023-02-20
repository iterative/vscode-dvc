import { Story, Meta } from '@storybook/react/types-6-0'
import React from 'react'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'
import { NeedsGitCommit as SetupNeedsGitCommit } from '../setup/components/NeedsGitCommit'

import './test-vscode-styles.scss'
import '../shared/style.scss'

export default {
  args: {
    data: {}
  },
  component: SetupNeedsGitCommit,
  parameters: DISABLE_CHROMATIC_SNAPSHOTS,
  title: 'Setup'
} as Meta

const Template: Story = () => {
  return <SetupNeedsGitCommit showScmPanel={() => undefined} />
}

export const NeedsGitCommit = Template.bind({})
