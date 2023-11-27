import { fireEvent, render, screen, within } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import {
  LATEST_TESTED_CLI_VERSION,
  MIN_CLI_VERSION
} from 'dvc/src/cli/dvc/contract'
import '@testing-library/jest-dom'
import React from 'react'
import { SetupSection, SetupData } from 'dvc/src/setup/webview/contract'
import { App } from './App'
import { vsCodeApi } from '../../shared/api'
import { TooltipIconType } from '../../shared/components/sectionContainer/InfoTooltip'
import { setupReducers } from '../store'

jest.mock('../../shared/api')

const { postMessage } = vsCodeApi
const mockPostMessage = jest.mocked(postMessage)

const DEFAULT_DATA = {
  canGitInitialize: true,
  cliCompatible: true,
  dvcCliDetails: {
    command: 'python -m dvc',
    version: '1.0.0'
  },
  hasData: false,
  isAboveLatestTestedVersion: false,
  isPythonEnvironmentGlobal: false,
  isPythonExtensionInstalled: false,
  isPythonExtensionUsed: false,
  isStudioConnected: false,
  needsGitCommit: false,
  needsGitInitialized: false,
  projectInitialized: true,
  pythonBinPath: undefined,
  remoteList: undefined,
  sectionCollapsed: undefined,
  shareLiveToStudio: false
}

const renderApp = (overrideData: Partial<SetupData> = {}) => {
  render(
    <Provider store={configureStore({ reducer: setupReducers })}>
      <App />
    </Provider>
  )
  fireEvent(
    window,
    new MessageEvent('message', {
      data: {
        data: {
          ...DEFAULT_DATA,
          ...overrideData
        },
        type: MessageToWebviewType.SET_DATA
      }
    })
  )
}

const sendSetDataMessage = (data: SetupData) => {
  const message = new MessageEvent('message', {
    data: {
      data,
      type: MessageToWebviewType.SET_DATA
    }
  })
  fireEvent(window, message)
}

describe('App', () => {
  it('should send the initialized message on first render', () => {
    render(
      <Provider store={configureStore({ reducer: setupReducers })}>
        <App />
      </Provider>
    )
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.INITIALIZED
    })
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
  })

  describe('DVC', () => {
    it('should show a screen saying that DVC is incompatible if the cli version is unexpected', () => {
      renderApp({
        cliCompatible: false,
        dvcCliDetails: {
          command: 'dvc',
          version: '1.0.0'
        }
      })

      expect(screen.getByText('DVC is incompatible')).toBeInTheDocument()
      expect(
        screen.getByText('Please update your install and try again.')
      ).toBeInTheDocument()

      const button = screen.getByText('Check Compatibility')
      expect(button).toBeInTheDocument()

      fireEvent.click(button)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.CHECK_CLI_COMPATIBLE
      })
    })

    it('should tell the user than they can auto upgrade DVC if DVC is incompatible and python is available', () => {
      renderApp({
        cliCompatible: false,
        dvcCliDetails: {
          command: 'dvc',
          version: '1.0.0'
        },
        pythonBinPath: 'python'
      })

      expect(screen.getByText('DVC is incompatible')).toBeInTheDocument()

      const compatibityButton = screen.getByText('Check Compatibility')
      expect(compatibityButton).toBeInTheDocument()
      const upgradeButton = screen.getByText('Upgrade (pip)')
      expect(upgradeButton).toBeInTheDocument()

      fireEvent.click(upgradeButton)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.UPGRADE_DVC
      })
    })

    it('should tell the user they cannot install DVC without a Python interpreter', () => {
      renderApp({
        cliCompatible: undefined,
        dvcCliDetails: {
          command: 'dvc',
          version: undefined
        }
      })

      expect(
        screen.getByText(
          /DVC & DVCLive cannot be auto-installed as Python was not located./
        )
      ).toBeInTheDocument()
    })

    it('should tell the user they can auto-install DVC with a Python interpreter', () => {
      const defaultInterpreter = 'python'
      renderApp({
        cliCompatible: undefined,
        dvcCliDetails: {
          command: `${defaultInterpreter} -m dvc`,
          version: undefined
        },
        pythonBinPath: defaultInterpreter
      })

      const sentenceReg = new RegExp(
        `Auto-install \\(pip\\) DVC & DVCLive with ${defaultInterpreter}`
      )

      expect(screen.getByText(sentenceReg)).toBeInTheDocument()
      expect(screen.getByText('Install (pip)')).toBeInTheDocument()
    })

    it('should let the user locate DVC when the Python extension is not installed', () => {
      renderApp({
        cliCompatible: undefined,
        dvcCliDetails: {
          command: 'python -m dvc',
          version: undefined
        },
        pythonBinPath: 'python'
      })

      const button = screen.getByText('Locate DVC')
      fireEvent.click(button)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SETUP_WORKSPACE
      })
    })

    it('should show python extension info when dvc is unavailable and Python extension is not installed', () => {
      renderApp({
        cliCompatible: undefined,
        dvcCliDetails: {
          command: 'python -m dvc',
          version: undefined
        }
      })

      const infoText = screen.getByText(/detect or create python environments/)

      expect(infoText).toBeInTheDocument()

      sendSetDataMessage({ ...DEFAULT_DATA, isPythonExtensionUsed: true })

      expect(infoText).not.toBeInTheDocument()
    })

    it('should let the user find or create another Python interpreter to install DVC when the Python extension is installed', () => {
      renderApp({
        cliCompatible: undefined,
        dvcCliDetails: {
          command: 'python -m dvc',
          version: undefined
        },
        isPythonExtensionUsed: true,
        pythonBinPath: 'python'
      })

      const button = screen.getByText('Set Env')
      fireEvent.click(button)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.UPDATE_PYTHON_ENVIRONMENT
      })
    })

    it('should let the user auto-install DVC under the right conditions', () => {
      renderApp({
        cliCompatible: undefined,
        dvcCliDetails: {
          command: 'python -m dvc',
          version: undefined
        },
        pythonBinPath: 'python'
      })

      const button = screen.getByText('Install (pip)')
      fireEvent.click(button)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.INSTALL_DVC
      })
    })

    it('should let the user auto-install DVC but warn the user that their selected env is global when the Python extension is installed', () => {
      const defaultInterpreter = 'python'
      renderApp({
        cliCompatible: undefined,
        dvcCliDetails: {
          command: 'python -m dvc',
          version: undefined
        },
        isPythonEnvironmentGlobal: true,
        isPythonExtensionUsed: true,
        pythonBinPath: defaultInterpreter
      })

      const button = screen.getByText('Set Env')

      expect(button).toBeInTheDocument()
      expect(screen.getByText('Not a virtual environment)')).toBeInTheDocument()
    })

    it('should not show a screen saying that DVC is not installed if the cli is available', () => {
      renderApp()

      expect(
        screen.queryByText('DVC is currently unavailable')
      ).not.toBeInTheDocument()
    })

    it('should show a screen saying that DVC is not initialized if the project is not initialized and git is uninitialized', () => {
      renderApp({ needsGitInitialized: true, projectInitialized: false })

      const uninitializedText = screen.getAllByText('DVC is not initialized')

      expect(uninitializedText).toHaveLength(2)
      for (const text of uninitializedText) {
        expect(text).toBeInTheDocument()
      }
    })

    it('should offer to initialize Git if it is possible', () => {
      renderApp({
        canGitInitialize: true,
        needsGitInitialized: true,
        projectInitialized: false
      })

      const initializeButton = screen.getByText('Initialize Git')
      expect(initializeButton).toBeInTheDocument()
      fireEvent.click(initializeButton)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.INITIALIZE_GIT
      })

      renderApp({
        canGitInitialize: false,
        needsGitInitialized: true,
        projectInitialized: false
      })

      const uninitialized = screen.getAllByText('DVC is not initialized')

      expect(uninitialized).toHaveLength(4)
    })

    it('should not show a screen saying that DVC is not initialized if the project is initialized and dvc is installed', () => {
      renderApp({ remoteList: { mocRoot: undefined } })

      expect(
        screen.queryByText('DVC is not initialized')
      ).not.toBeInTheDocument()
    })

    it('should send a message to initialize the project when clicking the Initialize Project button when the project is not initialized', () => {
      renderApp({
        projectInitialized: false
      })

      const initializeButton = screen.getByText('Initialize Project')
      fireEvent.click(initializeButton)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.INITIALIZE_DVC
      })
    })

    it('should autoclose and open other sections when user finishes setup', () => {
      const dvcNotSetup = {
        projectInitialized: false,
        sectionCollapsed: {
          [SetupSection.DVC]: false,
          [SetupSection.EXPERIMENTS]: true,
          [SetupSection.REMOTES]: true,
          [SetupSection.STUDIO]: true
        }
      }

      renderApp(dvcNotSetup)

      const dvcDetails = screen.getByTestId('dvc-section-details')
      const experimentsDetails = screen.getByTestId(
        'experiments-section-details'
      )
      const studioDetails = screen.getByTestId('studio-section-details')

      expect(dvcDetails).toHaveAttribute('open')
      expect(experimentsDetails).not.toHaveAttribute('open')
      expect(studioDetails).not.toHaveAttribute('open')

      sendSetDataMessage(DEFAULT_DATA)

      expect(dvcDetails).not.toHaveAttribute('open')
      expect(experimentsDetails).toHaveAttribute('open')
      expect(studioDetails).toHaveAttribute('open')
    })

    it('should show the user the version, min version, and latest tested version if dvc is installed', () => {
      renderApp()

      const envDetails = screen.getByTestId('dvc-env-details')
      const firstVersionLine = `1.0.0 (required ${MIN_CLI_VERSION} and above, tested with ${LATEST_TESTED_CLI_VERSION})`

      expect(within(envDetails).getByText('Version:')).toBeInTheDocument()
      expect(within(envDetails).getByText(firstVersionLine)).toBeInTheDocument()
    })

    it('should tell the user that the version is not found if dvc is not installed', () => {
      renderApp({
        cliCompatible: false,
        dvcCliDetails: {
          command: 'dvc',
          version: undefined
        }
      })
      const envDetails = screen.getByTestId('dvc-env-details')
      const version = `Not found (required ${MIN_CLI_VERSION} and above, tested with ${LATEST_TESTED_CLI_VERSION})`

      expect(within(envDetails).getByText('Version:')).toBeInTheDocument()
      expect(within(envDetails).getByText(version)).toBeInTheDocument()
    })

    it('should show the user the command used to run DVC if dvc is installed', () => {
      const command = 'python -m dvc'
      renderApp()

      const envDetails = screen.getByTestId('dvc-env-details')

      expect(within(envDetails).getByText('Command:')).toBeInTheDocument()
      expect(within(envDetails).getByText(command)).toBeInTheDocument()
    })

    it('should show the user the command used to run DVC with a "Locate DVC" button if dvc is installed without the python extension', () => {
      renderApp()

      const envDetails = screen.getByTestId('dvc-env-details')

      expect(within(envDetails).getByText('Command:')).toBeInTheDocument()

      const configureButton = within(envDetails).getByText('Locate DVC')
      const selectButton = within(envDetails).queryByText(
        'Select Python Interpreter'
      )

      expect(configureButton).toBeInTheDocument()
      expect(selectButton).not.toBeInTheDocument()

      fireEvent.click(configureButton)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SETUP_WORKSPACE
      })
    })

    it('should show the user the command used to run DVC with "Locate DVC" and "Set Env" buttons if dvc is installed with the python extension', () => {
      renderApp({
        isPythonExtensionUsed: true
      })

      const envDetails = screen.getByTestId('dvc-env-details')

      expect(within(envDetails).getByText('Command:')).toBeInTheDocument()

      const configureButton = within(envDetails).getByText('Locate DVC')
      const selectButton = within(envDetails).getByText('Set Env')

      expect(configureButton).toBeInTheDocument()
      expect(selectButton).toBeInTheDocument()

      mockPostMessage.mockClear()

      fireEvent.click(selectButton)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.UPDATE_PYTHON_ENVIRONMENT
      })
    })

    it('should show a "Show Walkthrough" button if dvc is installed and a project is initalized', () => {
      renderApp()

      const walkthroughButton = within(
        screen.getByTestId('dvc-section-details')
      ).getByText('Show Walkthrough')

      expect(walkthroughButton).toBeInTheDocument()

      fireEvent.click(walkthroughButton)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SHOW_WALKTHROUGH
      })
    })

    it('should show an error icon if DVC is not initialized', () => {
      renderApp({
        projectInitialized: false
      })

      const iconWrapper = within(
        screen.getByTestId('dvc-section-details')
      ).getByTestId('info-tooltip-toggle')

      expect(
        within(iconWrapper).getByTestId(TooltipIconType.ERROR)
      ).toBeInTheDocument()
    })

    it('should show a passed icon if DVC CLI is compatible and project is initialized', () => {
      renderApp({ remoteList: { mockRoot: undefined } })
      expect(screen.queryByText('DVC is not setup')).not.toBeInTheDocument()

      const iconWrapper = within(
        screen.getByTestId('dvc-section-details')
      ).getByTestId('info-tooltip-toggle')

      expect(
        within(iconWrapper).getByTestId(TooltipIconType.PASSED)
      ).toBeInTheDocument()
    })

    it('should add a warning icon and message if version is above the latest tested version', () => {
      renderApp({
        isAboveLatestTestedVersion: true
      })

      const iconWrapper = within(
        screen.getByTestId('dvc-section-details')
      ).getByTestId('info-tooltip-toggle')

      expect(
        within(iconWrapper).getByTestId(TooltipIconType.WARNING)
      ).toBeInTheDocument()

      fireEvent.mouseEnter(iconWrapper)

      expect(
        screen.getByText(
          'The located version has not been tested against the extension. If you are experiencing unexpected behaviour, first try to update the extension. If there are no updates available, please downgrade DVC to the same minor version as displayed and reload the window.'
        )
      ).toBeInTheDocument()
    })
  })

  describe('Experiments', () => {
    it('should show a screen saying that dvc is not setup if the project is not initialized', () => {
      renderApp({
        projectInitialized: false
      })

      const details = screen.getByTestId('experiments-section-details')

      expect(within(details).getByText('DVC is not setup')).toBeInTheDocument()
    })

    it('should open the dvc section when clicking the Setup DVC button on the dvc is not setup screen', () => {
      renderApp({
        projectInitialized: false,
        remoteList: { mockRoot: undefined }
      })

      const details = screen.getByTestId('experiments-section-details')
      const experimentsText = within(details).getByText('DVC is not setup')
      expect(experimentsText).toBeInTheDocument()

      mockPostMessage.mockClear()
      const button = within(details).getByText('Setup DVC')
      fireEvent.click(button)
      expect(screen.getByText('DVC is not initialized')).toBeVisible()
      expect(experimentsText).not.toBeVisible()
    })

    it('should show a screen saying that dvc is not setup if the project is initialized but dvc is not found', () => {
      renderApp({
        cliCompatible: false,
        dvcCliDetails: {
          command: 'dvc',
          version: undefined
        }
      })

      const details = screen.getByTestId('experiments-section-details')
      expect(within(details).getByText('DVC is not setup')).toBeInTheDocument()
    })

    it('should not show a screen saying that the project contains no data if dvc is installed, the project is initialized and has data', () => {
      renderApp({
        hasData: true
      })

      expect(
        screen.queryByText('Your project contains no data')
      ).not.toBeInTheDocument()
    })

    it('should show a screen saying there needs to be a git commit if the project is initialized, dvc is installed, but has not git commit', () => {
      renderApp({
        needsGitCommit: true
      })

      expect(screen.getByText('No Git commits detected')).toBeInTheDocument()
    })

    it('should show a loading screen if the project is loading in data', () => {
      renderApp({
        hasData: undefined
      })

      expect(screen.getByText('Loading Project...')).toBeInTheDocument()
    })

    it('should show a screen saying that the project contains no data if dvc is installed, the project is initialized but has no data', () => {
      renderApp()

      expect(
        screen.getByText('Your project contains no data')
      ).toBeInTheDocument()
    })

    it('should enable the user to open the experiments webview when they have completed onboarding', () => {
      renderApp({
        hasData: true
      })
      mockPostMessage.mockClear()
      fireEvent.click(screen.getByText('Show Experiments'))
      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.OPEN_EXPERIMENTS_WEBVIEW
      })
    })

    it('should show an error icon if experiments are not setup', () => {
      renderApp()

      const iconWrapper = within(
        screen.getByTestId('experiments-section-details')
      ).getByTestId('info-tooltip-toggle')

      expect(
        within(iconWrapper).getByTestId(TooltipIconType.ERROR)
      ).toBeInTheDocument()
    })

    it('should show an error icon if dvc is not setup', () => {
      renderApp({
        cliCompatible: false
      })

      const iconWrapper = within(
        screen.getByTestId('experiments-section-details')
      ).getByTestId('info-tooltip-toggle')

      expect(
        within(iconWrapper).getByTestId(TooltipIconType.ERROR)
      ).toBeInTheDocument()
    })

    it('should show a passed icon if experiments are setup', () => {
      renderApp({
        hasData: true
      })

      const iconWrapper = within(
        screen.getByTestId('experiments-section-details')
      ).getByTestId('info-tooltip-toggle')

      expect(
        within(iconWrapper).getByTestId(TooltipIconType.PASSED)
      ).toBeInTheDocument()
    })
  })

  describe('Studio not connected', () => {
    it('should show buttons which request a token from Studio or add an already created one', () => {
      renderApp()
      mockPostMessage.mockClear()
      const getTokenButton = screen.getByText('Get Token')
      fireEvent.click(getTokenButton)
      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.REQUEST_STUDIO_TOKEN
      })

      mockPostMessage.mockClear()
      const saveCreatedButton = screen.getByText('Save Created Token')
      fireEvent.click(saveCreatedButton)
      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SAVE_STUDIO_TOKEN
      })
    })

    it('should show an error icon if dvc is not compatible', () => {
      renderApp({
        cliCompatible: false
      })

      const iconWrapper = within(
        screen.getByTestId('studio-section-details')
      ).getByTestId('info-tooltip-toggle')

      expect(
        within(iconWrapper).getByTestId(TooltipIconType.ERROR)
      ).toBeInTheDocument()
    })

    it('should show an warning icon if dvc is compatible but studio is not connected', () => {
      renderApp()

      const iconWrapper = within(
        screen.getByTestId('studio-section-details')
      ).getByTestId('info-tooltip-toggle')

      expect(
        within(iconWrapper).getByTestId(TooltipIconType.WARNING)
      ).toBeInTheDocument()
    })
  })

  describe('Studio connected', () => {
    it('should render a checkbox which can be used to update studio.offline in the global DVC config', () => {
      const shareExperimentsLive = false
      renderApp({
        isStudioConnected: true
      })

      mockPostMessage.mockClear()
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: !shareExperimentsLive,
        type: MessageFromWebviewType.SET_STUDIO_SHARE_EXPERIMENTS_LIVE
      })
    })

    it('should enable the user to update their studio token', () => {
      renderApp({
        isStudioConnected: true
      })
      mockPostMessage.mockClear()
      const button = screen.getByText('Update Token')
      fireEvent.click(button)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SAVE_STUDIO_TOKEN
      })
    })

    it('should show a passed icon if connected', () => {
      renderApp({
        isStudioConnected: true
      })

      const iconWrapper = within(
        screen.getByTestId('studio-section-details')
      ).getByTestId('info-tooltip-toggle')

      expect(
        within(iconWrapper).getByTestId(TooltipIconType.PASSED)
      ).toBeInTheDocument()
    })
  })

  describe('focused section', () => {
    const experimentsText = 'Your project contains no data'
    const studioButtonText = 'Update Token'
    const dvcText = 'Setup Complete'

    it('should render the app with other sections collapsed if the DVC section is focused', () => {
      renderApp({
        isStudioConnected: true,
        sectionCollapsed: {
          [SetupSection.DVC]: false,
          [SetupSection.EXPERIMENTS]: true,
          [SetupSection.REMOTES]: true,
          [SetupSection.STUDIO]: true
        }
      })
      mockPostMessage.mockClear()
      const dvc = screen.getByText('DVC')
      expect(dvc).toBeInTheDocument()
      expect(screen.getByText(dvcText)).toBeInTheDocument()
      const experiments = screen.getByText('Experiments')
      expect(experiments).toBeInTheDocument()
      expect(screen.queryByText(experimentsText)).not.toBeInTheDocument()
      const studio = screen.getByText('Studio')
      expect(studio).toBeInTheDocument()
      expect(screen.queryByText(studioButtonText)).not.toBeInTheDocument()
    })

    it('should render the app with other sections collapsed if the Experiments section is focused', () => {
      renderApp({
        isStudioConnected: true,
        sectionCollapsed: {
          [SetupSection.DVC]: true,
          [SetupSection.EXPERIMENTS]: false,
          [SetupSection.REMOTES]: true,
          [SetupSection.STUDIO]: true
        }
      })
      mockPostMessage.mockClear()
      const studio = screen.getByText('Studio')
      expect(studio).toBeInTheDocument()
      expect(screen.queryByText(studioButtonText)).not.toBeInTheDocument()
      const dvc = screen.getByText('DVC')
      expect(dvc).toBeInTheDocument()
      expect(screen.queryByText(dvcText)).not.toBeInTheDocument()
      const experiments = screen.getByText('Experiments')
      expect(experiments).toBeInTheDocument()
      expect(screen.getByText(experimentsText)).toBeInTheDocument()
    })

    it('should render the app with other sections collapsed if the Studio section is focused', () => {
      renderApp({
        isStudioConnected: true,
        sectionCollapsed: {
          [SetupSection.DVC]: true,
          [SetupSection.EXPERIMENTS]: true,
          [SetupSection.REMOTES]: true,
          [SetupSection.STUDIO]: false
        }
      })
      mockPostMessage.mockClear()
      const studio = screen.getByText('Studio')
      expect(studio).toBeInTheDocument()
      expect(screen.getByText(studioButtonText)).toBeInTheDocument()
      const dvc = screen.getByText('DVC')
      expect(dvc).toBeInTheDocument()
      expect(screen.queryByText(dvcText)).not.toBeInTheDocument()
      const experiments = screen.getByText('Experiments')
      expect(experiments).toBeInTheDocument()
      expect(screen.queryByText(experimentsText)).not.toBeInTheDocument()
    })
  })

  describe('Remotes', () => {
    it('should show the setup DVC button if the remoteList is undefined (no projects)', () => {
      renderApp({
        remoteList: undefined,
        sectionCollapsed: {
          [SetupSection.DVC]: true,
          [SetupSection.EXPERIMENTS]: true,
          [SetupSection.REMOTES]: false,
          [SetupSection.STUDIO]: true
        }
      })

      const setupDVCButton = screen.getByText('Setup DVC')

      expect(setupDVCButton).toBeInTheDocument()
      expect(setupDVCButton).toBeVisible()
    })

    it('should show the connect to remote storage screen if no remotes are connected', () => {
      renderApp({
        remoteList: { demo: undefined, 'example-get-started': undefined },
        sectionCollapsed: {
          [SetupSection.DVC]: true,
          [SetupSection.EXPERIMENTS]: true,
          [SetupSection.REMOTES]: false,
          [SetupSection.STUDIO]: true
        }
      })

      const title = screen.getByText('Connect to Remote Storage')

      expect(title).toBeInTheDocument()
      expect(title).toBeVisible()
    })

    it('should allow the user to connect a remote if they do not already have one', () => {
      renderApp({
        remoteList: { demo: undefined, 'example-get-started': undefined },
        sectionCollapsed: {
          [SetupSection.DVC]: true,
          [SetupSection.EXPERIMENTS]: true,
          [SetupSection.REMOTES]: false,
          [SetupSection.STUDIO]: true
        }
      })
      mockPostMessage.mockReset()
      const startButton = screen.getByText('Add Remote')

      expect(startButton).toBeInTheDocument()
      expect(startButton).toBeVisible()
      fireEvent.click(startButton)
      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.REMOTE_ADD
      })
    })

    it('should show the list of remotes if there is only one project in the workspace', () => {
      renderApp({
        remoteList: {
          'example-get-started': { drive: 'gdrive://appDataFolder' }
        },
        sectionCollapsed: {
          [SetupSection.DVC]: true,
          [SetupSection.EXPERIMENTS]: true,
          [SetupSection.REMOTES]: false,
          [SetupSection.STUDIO]: true
        }
      })

      const setupDVCButton = screen.getByText('Remote Storage Connected')

      expect(setupDVCButton).toBeInTheDocument()
      expect(setupDVCButton).toBeVisible()

      expect(screen.getByText('drive')).toBeInTheDocument()
      expect(screen.getByText('gdrive://appDataFolder')).toBeInTheDocument()
      expect(screen.queryByText('example-get-started')).not.toBeInTheDocument()
    })

    it('should show the list of remotes by project if there are multiple projects and one has remote(s) connected', () => {
      renderApp({
        remoteList: {
          demo: undefined,
          'example-get-started': {
            drive: 'gdrive://appDataFolder',
            storage: 's3://some-bucket'
          }
        },
        sectionCollapsed: {
          [SetupSection.DVC]: true,
          [SetupSection.EXPERIMENTS]: true,
          [SetupSection.REMOTES]: false,
          [SetupSection.STUDIO]: true
        }
      })

      const setupDVCButton = screen.getByText('Remote Storage Connected')

      expect(setupDVCButton).toBeInTheDocument()
      expect(setupDVCButton).toBeVisible()

      const remotesSection = screen.getByTestId('remotes-section-details')

      expect(within(remotesSection).getByText('demo')).toBeInTheDocument()
      expect(within(remotesSection).getAllByText('-')).toHaveLength(2)
      expect(
        within(remotesSection).getByText('example-get-started')
      ).toBeInTheDocument()
      expect(within(remotesSection).getByText('drive')).toBeInTheDocument()
      expect(
        within(remotesSection).getByText('gdrive://appDataFolder')
      ).toBeInTheDocument()
      expect(within(remotesSection).getByText('storage')).toBeInTheDocument()
      expect(
        within(remotesSection).getByText('s3://some-bucket')
      ).toBeInTheDocument()
    })
  })
})
