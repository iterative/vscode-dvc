import type { StoryFn, Meta } from '@storybook/react'
import React from 'react'
import { Provider, useDispatch } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MessageToWebviewType } from 'dvc/src/webview/contract'
import { SetupData, SetupSection } from 'dvc/src/setup/webview/contract'
import { DISABLE_CHROMATIC_SNAPSHOTS } from './util'
import { App, feedStore } from '../setup/components/App'
import { setupReducers } from '../setup/store'

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
  remoteList: undefined,
  sectionCollapsed: {
    [SetupSection.DVC]: false,
    [SetupSection.EXPERIMENTS]: false,
    [SetupSection.REMOTES]: false,
    [SetupSection.STUDIO]: true
  },
  shareLiveToStudio: false
}

const getUpdatedArgs = (data: Partial<SetupData>): { data: SetupData } => ({
  data: {
    ...DEFAULT_DATA,
    ...data
  }
})

const MockedState: React.FC<{ data: SetupData; children: React.ReactNode }> = ({
  children,
  data
}) => {
  const dispatch = useDispatch()
  const message = { data, type: MessageToWebviewType.SET_DATA }
  feedStore(message, dispatch)

  return <>{children}</>
}

export default {
  args: {},
  component: App,
  parameters: DISABLE_CHROMATIC_SNAPSHOTS,
  title: 'Setup'
} as Meta

const Template: StoryFn = ({ data }) => {
  const app = (
    <Provider store={configureStore({ reducer: setupReducers })}>
      <MockedState data={data}>
        <App />
      </MockedState>
    </Provider>
  )
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
  remoteList: { demo: undefined },
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

export const CliAboveLatestTested = Template.bind({})
CliAboveLatestTested.args = getUpdatedArgs({
  isAboveLatestTestedVersion: true
})

export const NoRemoteSetup = Template.bind({})
NoRemoteSetup.args = getUpdatedArgs({
  remoteList: {
    '/Users/thatguy/projects/vscode-dvc/rootB': undefined
  },
  sectionCollapsed: {
    [SetupSection.DVC]: true,
    [SetupSection.EXPERIMENTS]: true,
    [SetupSection.REMOTES]: false,
    [SetupSection.STUDIO]: true
  }
})

export const ProjectRemoteSetup = Template.bind({})
ProjectRemoteSetup.args = getUpdatedArgs({
  remoteList: {
    '/Users/thatguy/projects/vscode-dvc/rootB': {
      backup: 's3://dvc-public/remote/mnist-vscode',
      storage:
        'https://drive.google.com/drive/folders/1qAhh2GVwOe9luC7TxB63yLv73fjKN66W'
    }
  },
  sectionCollapsed: {
    [SetupSection.DVC]: true,
    [SetupSection.EXPERIMENTS]: true,
    [SetupSection.REMOTES]: false,
    [SetupSection.STUDIO]: true
  }
})

export const MultiProjectRemoteSetup = Template.bind({})
MultiProjectRemoteSetup.args = getUpdatedArgs({
  remoteList: {
    '/Users/thatguy/projects/vscode-dvc/rootA': undefined,
    '/Users/thatguy/projects/vscode-dvc/rootB': {
      backup: 's3://dvc-public/remote/mnist-vscode',
      storage: 'gdrive://appDataFolder'
    },
    '/Users/thatguy/projects/vscode-dvc/rootC': {
      storage: 'gdrive://appDataFolder'
    }
  },
  sectionCollapsed: {
    [SetupSection.DVC]: true,
    [SetupSection.EXPERIMENTS]: true,
    [SetupSection.REMOTES]: false,
    [SetupSection.STUDIO]: true
  }
})
