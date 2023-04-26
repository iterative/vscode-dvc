import { Story, Meta } from '@storybook/react/types-6-0'
import React from 'react'
import { MessageToWebviewType } from 'dvc/src/webview/contract'
import { SetupData, SetupSection } from 'dvc/src/setup/webview/contract'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'
import { App } from '../setup/components/App'

const DEFAULT_DATA: SetupData = {
  canGitInitialize: false,
  cliCompatible: true,
  dvcCliDetails: {
    exampleCommand: 'path/to/python -m dvc',
    version: '1.0.0'
  },
  hasData: false,
  isPythonExtensionInstalled: true,
  isStudioConnected: true,
  needsGitCommit: false,
  needsGitInitialized: false,
  projectInitialized: true,
  pythonBinPath: 'python',
  sectionCollapsed: {
    [SetupSection.EXPERIMENTS]: false,
    [SetupSection.STUDIO]: true,
    [SetupSection.DVC]: false
  },
  shareLiveToStudio: false
}

const getUpdatedArgs = (data: Partial<SetupData>): { data: SetupData } => ({
  data: {
    ...DEFAULT_DATA,
    ...data
  }
})

export default {
  args: {},
  component: App,
  parameters: DISABLE_CHROMATIC_SNAPSHOTS,
  title: 'Setup'
} as Meta

const Template: Story = ({ data }) => {
  const app = <App />
  window.postMessage(
    {
      data,
      type: MessageToWebviewType.SET_DATA
    },
    '*'
  )

  return app
}

export const NoData = Template.bind({})
NoData.args = getUpdatedArgs({})

export const NoDataNotConnected = Template.bind({})
NoDataNotConnected.parameters = {}
NoDataNotConnected.args = getUpdatedArgs({
  isStudioConnected: false,
  sectionCollapsed: undefined
})

export const CompletedConnected = Template.bind({})

CompletedConnected.args = getUpdatedArgs({
  hasData: true,
  isStudioConnected: true,
  sectionCollapsed: undefined,
  shareLiveToStudio: true
})

export const NoCLIPythonNotFound = Template.bind({})
NoCLIPythonNotFound.args = getUpdatedArgs({
  cliCompatible: undefined,
  dvcCliDetails: {
    exampleCommand: 'dvc',
    version: undefined
  },
  isPythonExtensionInstalled: false,
  pythonBinPath: undefined
})

export const NoCLIPythonExtensionUsed = Template.bind({})
NoCLIPythonExtensionUsed.args = getUpdatedArgs({
  cliCompatible: undefined,
  dvcCliDetails: {
    exampleCommand: '/opt/homebrew/Caskroom/miniforge/base/bin/python -m dvc',
    version: undefined
  },
  isPythonExtensionInstalled: true,
  pythonBinPath: '/opt/homebrew/Caskroom/miniforge/base/bin/python'
})

export const NoCLIPythonExtensionNotUsed = Template.bind({})
NoCLIPythonExtensionNotUsed.args = getUpdatedArgs({
  cliCompatible: undefined,
  dvcCliDetails: {
    exampleCommand: '.env/bin/python -m dvc',
    version: undefined
  },
  isPythonExtensionInstalled: false,
  pythonBinPath: '.env/bin/python'
})

export const CliFoundButNotCompatible = Template.bind({})
CliFoundButNotCompatible.args = getUpdatedArgs({
  cliCompatible: false
})

export const CannotInitializeGit = Template.bind({})
CannotInitializeGit.args = getUpdatedArgs({
  canGitInitialize: false,
  needsGitInitialized: true,
  projectInitialized: false
})

export const CanInitializeGit = Template.bind({})
CanInitializeGit.args = getUpdatedArgs({
  canGitInitialize: true,
  needsGitInitialized: true,
  projectInitialized: false
})

export const DvcUninitialized = Template.bind({})
DvcUninitialized.args = getUpdatedArgs({
  canGitInitialize: undefined,
  needsGitInitialized: undefined,
  projectInitialized: false
})
