import { Story, Meta } from '@storybook/react/types-6-0'
import React from 'react'
import {
  ProjectUninitialized,
  ProjectUninitializedProps
} from '../setup/components/ProjectUninitialized'

import './test-vscode-styles.scss'
import '../shared/style.scss'

export default {
  args: {
    data: {}
  },
  component: ProjectUninitialized,
  parameters: { chromatic: { disableSnapshot: true } },
  title: 'Setup'
} as Meta

const Template: Story<ProjectUninitializedProps> = ({
  canGitInitialize,
  needsGitInitialized
}) => {
  return (
    <ProjectUninitialized
      canGitInitialize={canGitInitialize}
      initializeDvc={() => undefined}
      initializeGit={() => undefined}
      needsGitInitialized={needsGitInitialized}
    />
  )
}

export const CannotInitializeGit = Template.bind({})
CannotInitializeGit.args = {
  canGitInitialize: false,
  needsGitInitialized: true
}

export const CanInitializeGit = Template.bind({})
CanInitializeGit.args = {
  canGitInitialize: true,
  needsGitInitialized: true
}

export const DvcUninitialized = Template.bind({})
DvcUninitialized.args = {
  canGitInitialize: undefined,
  needsGitInitialized: undefined
}
