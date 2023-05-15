import type { StoryFn, Meta } from '@storybook/react'
import React from 'react'
import { MessageToWebviewType } from 'dvc/src/webview/contract'
import { SetupData, SetupSection } from 'dvc/src/setup/webview/contract'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'
import { App } from '../setup/components/App'

const DEFAULT_DATA: SetupData = {
  canGitInitialize: false,
  cliCompatible: true,
  dvcCliDetails: {
    command: 'path/to/python -m dvc',
    version: '1.0.0'
  },
  hasData: false,
  isAboveLatestTestedVersion: false,
  isPythonExtensionUsed: true,
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

const Template: StoryFn = ({ data }) => {
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
  cliCompatible: true,
  hasData: true,
  isStudioConnected: true,
  sectionCollapsed: undefined,
  shareLiveToStudio: true
})

export const NoCLIPythonNotFound = Template.bind({})
NoCLIPythonNotFound.args = getUpdatedArgs({
  cliCompatible: undefined,
  dvcCliDetails: {
    command: 'dvc',
    version: undefined
  },
  isPythonExtensionUsed: false,
  pythonBinPath: undefined
})

export const NoCLIPythonFound = Template.bind({})
NoCLIPythonFound.args = getUpdatedArgs({
  cliCompatible: undefined,
  dvcCliDetails: {
    command: '/opt/homebrew/Caskroom/miniforge/base/bin/python -m dvc',
    version: undefined
  },
  pythonBinPath: '/opt/homebrew/Caskroom/miniforge/base/bin/python'
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

export const CliFoundManually = Template.bind({})
CliFoundManually.args = getUpdatedArgs({
  isPythonExtensionUsed: false
})
