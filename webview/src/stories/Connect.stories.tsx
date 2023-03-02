import { Story, Meta } from '@storybook/react/types-6-0'
import React, { useState } from 'react'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'

import './test-vscode-styles.scss'
import '../shared/style.scss'
import { Studio } from '../connect/components/Studio'

export default {
  args: {
    data: {}
  },
  component: Studio,
  parameters: DISABLE_CHROMATIC_SNAPSHOTS,
  title: 'Connect'
} as Meta

const Template: Story = ({
  isStudioConnected,
  shareLiveToStudio: initialShareLiveToStudio
}) => {
  const [shareLiveToStudio, setShareLiveToStudio] = useState<boolean>(
    !!initialShareLiveToStudio
  )
  return (
    <Studio
      isStudioConnected={isStudioConnected}
      shareLiveToStudio={shareLiveToStudio}
      setShareLiveToStudio={setShareLiveToStudio}
    />
  )
}

export const ConnectToStudio = Template.bind({})
ConnectToStudio.args = { isStudioConnected: false }

export const StudioSettings = Template.bind({})
StudioSettings.args = { isStudioConnected: true, shareLiveToStudio: true }
