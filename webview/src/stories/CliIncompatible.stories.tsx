import { Story, Meta } from '@storybook/react/types-6-0'
import React from 'react'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'
import { CliIncompatible } from '../setup/components/CliIncompatible'

import './test-vscode-styles.scss'
import '../shared/style.scss'

export default {
  args: {
    data: {}
  },
  component: CliIncompatible,
  parameters: DISABLE_CHROMATIC_SNAPSHOTS,
  title: 'Setup'
} as Meta

const Template: Story = () => {
  return <CliIncompatible checkCompatibility={() => undefined} />
}

export const CliFoundButNotCompatible = Template.bind({})
