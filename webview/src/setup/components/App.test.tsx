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
import '@testing-library/jest-dom/extend-expect'
import React from 'react'
import { SetupSection, SetupData } from 'dvc/src/setup/webview/contract'
import { App } from './App'
import { vsCodeApi } from '../../shared/api'
import { TooltipIconType } from '../../shared/components/sectionContainer/InfoTooltip'
import { setupReducers } from '../store'

jest.mock('../../shared/api')
jest.mock('../../shared/components/codeSlider/CodeSlider')

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

      const button = screen.getByText('Check Compatibility')
      expect(button).toBeInTheDocument()

      fireEvent.click(button)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.CHECK_CLI_COMPATIBLE
      })
    })

    it('should show a screen saying that DVC is not installed if the cli is unavailable', () => {
      renderApp({
        cliCompatible: undefined,
        dvcCliDetails: {
          command: 'dvc',
          version: undefined
        }
      })

      expect(screen.getAllByText('DVC is currently unavailable')).toHaveLength(
        3
      )
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
          'DVC & DVCLive cannot be auto-installed as Python was not located.'
        )
      ).toBeInTheDocument()
      expect(screen.queryByText('Install')).not.toBeInTheDocument()
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

      expect(
        screen.getByText(
          `DVC & DVCLive can be auto-installed as packages with ${defaultInterpreter}`
        )
      ).toBeInTheDocument()
      expect(screen.getByText('Install')).toBeInTheDocument()
    })

    it('should let the user find another Python interpreter to install DVC when the Python extension is not installed', () => {
      renderApp({
        cliCompatible: undefined,
        dvcCliDetails: {
          command: 'python -m dvc',
          version: undefined
        },
        pythonBinPath: 'python'
      })

      const button = screen.getByText('Configure')
      fireEvent.click(button)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SETUP_WORKSPACE
      })
    })

    it('should let the user find another Python interpreter to install DVC when the Python extension is installed', () => {
      renderApp({
        cliCompatible: undefined,
        dvcCliDetails: {
          command: 'python -m dvc',
          version: undefined
        },
        isPythonExtensionUsed: true,
        pythonBinPath: 'python'
      })

      const button = screen.getByText('Configure')
      fireEvent.click(button)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SETUP_WORKSPACE
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

      const button = screen.getByText('Install')
      fireEvent.click(button)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.INSTALL_DVC
      })
    })

    it('should not show a screen saying that DVC is not installed if the cli is available', () => {
      renderApp()

      expect(
        screen.queryByText('DVC is currently unavailable')
      ).not.toBeInTheDocument()
    })

    it('should show a screen saying that DVC is not initialized if the project is not initialized and git is uninitialized', () => {
      renderApp({ needsGitInitialized: true, projectInitialized: false })

      expect(screen.getByText('DVC is not initialized')).toBeInTheDocument()
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

      expect(screen.getByText('DVC is not initialized')).toBeInTheDocument()
    })

    it('should not show a screen saying that DVC is not initialized if the project is initialized and dvc is installed', () => {
      renderApp()

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
          [SetupSection.REMOTE]: true,
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

    it('should show the user the command used to run DVC with a "Configure" button if dvc is installed without the python extension', () => {
      renderApp()

      const envDetails = screen.getByTestId('dvc-env-details')

      expect(within(envDetails).getByText('Command:')).toBeInTheDocument()

      const configureButton = within(envDetails).getByText('Configure')
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

    it('should show the user the command used to run DVC with "Configure" and "Select Python Interpreter" buttons if dvc is installed with the python extension', () => {
      renderApp({
        isPythonExtensionUsed: true
      })

      const envDetails = screen.getByTestId('dvc-env-details')

      expect(within(envDetails).getByText('Command:')).toBeInTheDocument()

      const configureButton = within(envDetails).getByText('Configure')
      const selectButton = within(envDetails).getByText(
        'Select Python Interpreter'
      )

      expect(configureButton).toBeInTheDocument()
      expect(selectButton).toBeInTheDocument()

      mockPostMessage.mockClear()

      fireEvent.click(selectButton)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SELECT_PYTHON_INTERPRETER
      })
    })

    it('should show an error icon if DVC is not initialized', () => {
      renderApp({
        projectInitialized: false
      })

      const iconWrapper = screen.getAllByTestId('info-tooltip-toggle')[0]

      expect(
        within(iconWrapper).getByTestId(TooltipIconType.ERROR)
      ).toBeInTheDocument()
    })

    it('should show a passed icon if DVC CLI is compatible and project is initialized', () => {
      renderApp()
    })

    expect(screen.getByText('DVC is not setup')).toBeInTheDocument()
  })

  it('should open the dvc section when clicking the Setup DVC button on the dvc is not setup screen', () => {
    renderApp({
      projectInitialized: false
    })

    const experimentsText = screen.getByText('DVC is not setup')
    expect(experimentsText).toBeInTheDocument()

    mockPostMessage.mockClear()
    const button = screen.getByText('Setup DVC')
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

    expect(screen.getByText('DVC is not setup')).toBeInTheDocument()
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

    const iconWrapper = screen.getAllByTestId('info-tooltip-toggle')[1]

    expect(
      within(iconWrapper).getByTestId(TooltipIconType.ERROR)
    ).toBeInTheDocument()
  })

  it('should show an error icon if dvc is not setup', () => {
    renderApp({
      cliCompatible: false
    })

    const iconWrapper = screen.getAllByTestId('info-tooltip-toggle')[1]

    expect(
      within(iconWrapper).getByTestId(TooltipIconType.ERROR)
    ).toBeInTheDocument()
  })

  it('should show a passed icon if experiments are setup', () => {
    renderApp({
      hasData: true
    })

    const iconWrapper = screen.getAllByTestId('info-tooltip-toggle')[1]

    expect(
      within(iconWrapper).getByTestId(TooltipIconType.PASSED)
    ).toBeInTheDocument()
  })
})

describe('Studio not connected', () => {
  it('should show three buttons which walk the user through saving a token', async () => {
    renderApp()
    const buttons = await within(
      await screen.findByTestId('setup-studio-content')
    ).findAllByRole('button')
    expect(buttons).toHaveLength(3)
  })

  it('should show a button which opens Studio', () => {
    renderApp()

    mockPostMessage.mockClear()
    const button = screen.getByText('Get Token')
    fireEvent.click(button)
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.OPEN_STUDIO_PROFILE
    })
  })

  it("should show a button which allows the user's to save their Studio access token", () => {
    renderApp()

    mockPostMessage.mockClear()
    const button = screen.getByText('Save')
    fireEvent.click(button)
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.SAVE_STUDIO_TOKEN
    })
  })

  it('should show an error icon if dvc is not compatible', () => {
    renderApp({
      cliCompatible: false
    })

    const iconWrapper = screen.getAllByTestId('info-tooltip-toggle')[3]

    expect(
      within(iconWrapper).getByTestId(TooltipIconType.ERROR)
    ).toBeInTheDocument()
  })

  it('should show an info icon if dvc is compatible but studio is not connected', () => {
    renderApp()

    const iconWrapper = screen.getAllByTestId('info-tooltip-toggle')[3]

    expect(
      within(iconWrapper).getByTestId(TooltipIconType.INFO)
    ).toBeInTheDocument()
  })
})

describe('Studio connected', () => {
  it('should render a checkbox which can be used to update dvc.studio.shareExperimentsLive', () => {
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

    const iconWrapper = screen.getAllByTestId('info-tooltip-toggle')[3]

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
        [SetupSection.REMOTE]: true,
        [SetupSection.STUDIO]: true
      }
    })
    mockPostMessage.mockClear()
    const dvc = screen.getByText('DVC')
    expect(dvc).toBeVisible()
    expect(screen.queryByText(dvcText)).toBeVisible()
    const experiments = screen.getByText('Experiments')
    expect(experiments).toBeVisible()
    expect(screen.getByText(experimentsText)).not.toBeVisible()
    const studio = screen.getByText('Studio')
    expect(studio).toBeVisible()
    expect(screen.queryByText(studioButtonText)).not.toBeVisible()
  })

  it('should render the app with other sections collapsed if the Experiments section is focused', () => {
    renderApp({
      isStudioConnected: true,
      sectionCollapsed: {
        [SetupSection.DVC]: true,
        [SetupSection.EXPERIMENTS]: false,
        [SetupSection.REMOTE]: true,
        [SetupSection.STUDIO]: true
      }
    })
    mockPostMessage.mockClear()
    const studio = screen.getByText('Studio')
    expect(studio).toBeVisible()
    expect(screen.queryByText(studioButtonText)).not.toBeVisible()
    const dvc = screen.getByText('DVC')
    expect(dvc).toBeVisible()
    expect(screen.queryByText(dvcText)).not.toBeVisible()
    const experiments = screen.getByText('Experiments')
    expect(experiments).toBeVisible()
    expect(screen.getByText(experimentsText)).toBeVisible()
  })

  it('should render the app with other sections collapsed if the Studio section is focused', () => {
    renderApp({
      isStudioConnected: true,
      sectionCollapsed: {
        [SetupSection.DVC]: true,
        [SetupSection.EXPERIMENTS]: true,
        [SetupSection.REMOTE]: true,
        [SetupSection.STUDIO]: false
      }
    })
    mockPostMessage.mockClear()
    const studio = screen.getByText('Studio')
    expect(studio).toBeVisible()
    expect(screen.queryByText(studioButtonText)).toBeVisible()
    const dvc = screen.getByText('DVC')
    expect(dvc).toBeVisible()
    expect(screen.queryByText(dvcText)).not.toBeVisible()
    const experiments = screen.getByText('Experiments')
    expect(experiments).toBeVisible()
    expect(screen.getByText(experimentsText)).not.toBeVisible()
  })
})
