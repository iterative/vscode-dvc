import { fireEvent, render, screen } from '@testing-library/react'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import '@testing-library/jest-dom/extend-expect'
import React from 'react'
import { SetupData } from 'dvc/src/setup/webview/contract'
import { App } from './App'
import { vsCodeApi } from '../../shared/api'

jest.mock('../../shared/api')
jest.mock('../../shared/components/codeSlider/CodeSlider')

const { postMessage } = vsCodeApi
const mockPostMessage = jest.mocked(postMessage)

const renderApp = ({
  canGitInitialize,
  cliCompatible,
  hasData,
  isPythonExtensionInstalled,
  isStudioConnected,
  needsGitInitialized,
  projectInitialized,
  pythonBinPath,
  shareLiveToStudio
}: SetupData) => {
  render(<App />)
  fireEvent(
    window,
    new MessageEvent('message', {
      data: {
        data: {
          canGitInitialize,
          cliCompatible,
          hasData,
          isPythonExtensionInstalled,
          isStudioConnected,
          needsGitInitialized,
          projectInitialized,
          pythonBinPath,
          shareLiveToStudio
        },
        type: MessageToWebviewType.SET_DATA
      }
    })
  )
}

describe('App', () => {
  describe('Experiments', () => {
    it('should send the initialized message on first render', () => {
      render(<App />)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.INITIALIZED
      })
      expect(mockPostMessage).toHaveBeenCalledTimes(1)
    })

    it('should show a screen saying that DVC is incompatible if the cli version is unexpected', () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: false,
        hasData: false,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: undefined,
        projectInitialized: false,
        pythonBinPath: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
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
        canGitInitialize: false,
        cliCompatible: undefined,
        hasData: false,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: undefined,
        projectInitialized: false,
        pythonBinPath: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      expect(
        screen.getByText('DVC is currently unavailable')
      ).toBeInTheDocument()
    })

    it('should tell the user they cannot install DVC without a Python interpreter', () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: undefined,
        hasData: false,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: undefined,
        projectInitialized: false,
        pythonBinPath: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
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
        canGitInitialize: false,
        cliCompatible: undefined,
        hasData: false,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: undefined,
        projectInitialized: false,
        pythonBinPath: defaultInterpreter,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
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
        canGitInitialize: false,
        cliCompatible: undefined,
        hasData: false,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: undefined,
        projectInitialized: false,
        pythonBinPath: 'python',
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      const button = screen.getByText('Setup The Workspace')
      fireEvent.click(button)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SETUP_WORKSPACE
      })
    })

    it('should let the user find another Python interpreter to install DVC when the Python extension is installed', () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: undefined,
        hasData: false,
        isPythonExtensionInstalled: true,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: undefined,
        projectInitialized: false,
        pythonBinPath: 'python',
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      const button = screen.getByText('Select Python Interpreter')
      fireEvent.click(button)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SELECT_PYTHON_INTERPRETER
      })
    })

    it('should let the user auto-install DVC under the right conditions', () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: undefined,
        hasData: false,
        isPythonExtensionInstalled: true,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: undefined,
        projectInitialized: false,
        pythonBinPath: 'python',
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      const button = screen.getByText('Install')
      fireEvent.click(button)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.INSTALL_DVC
      })
    })

    it('should not show a screen saying that DVC is not installed if the cli is available', () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: undefined,
        projectInitialized: false,
        pythonBinPath: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      expect(
        screen.queryByText('DVC is currently unavailable')
      ).not.toBeInTheDocument()
    })

    it('should not show a screen saying that DVC is not initialized if the project is not initialized and git is uninitialized', () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: true,
        projectInitialized: false,
        pythonBinPath: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      expect(screen.getByText('DVC is not initialized')).toBeInTheDocument()
    })

    it('should offer to initialize Git if it is possible', () => {
      renderApp({
        canGitInitialize: true,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: true,
        projectInitialized: false,
        pythonBinPath: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      const initializeButton = screen.getByText('Initialize Git')
      expect(initializeButton).toBeInTheDocument()
      fireEvent.click(initializeButton)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.INITIALIZE_GIT
      })

      renderApp({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: true,
        projectInitialized: false,
        pythonBinPath: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      expect(screen.queryByText('Initialize Git')).not.toBeInTheDocument()
    })

    it('should show a screen saying that DVC is not initialized if the project is not initialized and dvc is installed', () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: undefined,
        projectInitialized: false,
        pythonBinPath: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      expect(screen.getByText('DVC is not initialized')).toBeInTheDocument()
    })

    it('should not show a screen saying that DVC is not initialized if the project is initialized and dvc is installed', () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: undefined,
        projectInitialized: true,
        pythonBinPath: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      expect(
        screen.queryByText('DVC is not initialized')
      ).not.toBeInTheDocument()
    })

    it('should send a message to initialize the project when clicking the Initialize Project buttons when the project is not initialized', () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: undefined,
        projectInitialized: false,
        pythonBinPath: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      const initializeButton = screen.getByText('Initialize Project')
      fireEvent.click(initializeButton)

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.INITIALIZE_DVC
      })
    })

    it('should show a screen saying that the project contains no data if dvc is installed, the project is initialized but has no data', () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: undefined,
        projectInitialized: true,
        pythonBinPath: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      expect(
        screen.getByText('Your project contains no data')
      ).toBeInTheDocument()
    })

    it('should not show a screen saying that the project contains no data if dvc is installed, the project is initialized and has data', () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: true,
        isPythonExtensionInstalled: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: undefined,
        projectInitialized: true,
        pythonBinPath: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      expect(
        screen.queryByText('Your project contains no data')
      ).not.toBeInTheDocument()
    })
  })

  describe('Studio not connected', () => {
    it('should show three buttons which walk the user through saving a token', async () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: true,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: false,
        projectInitialized: true,
        pythonBinPath: 'python',
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })
      const buttons = await screen.findAllByRole('button')
      expect(buttons).toHaveLength(3)
    })

    it('should show a button which opens Studio', () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: true,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: false,
        projectInitialized: true,
        pythonBinPath: 'python',
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      mockPostMessage.mockClear()
      const button = screen.getByText('Sign In')
      fireEvent.click(button)
      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.OPEN_STUDIO
      })
    })

    it("should show a button which opens the user's Studio profile", () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: true,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: false,
        projectInitialized: true,
        pythonBinPath: 'python',
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      mockPostMessage.mockClear()
      const button = screen.getByText('Get Token')
      fireEvent.click(button)
      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.OPEN_STUDIO_PROFILE
      })
    })

    it("should show a button which allows the user's to save their Studio access token", () => {
      renderApp({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: true,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: false,
        projectInitialized: true,
        pythonBinPath: 'python',
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })

      mockPostMessage.mockClear()
      const button = screen.getByText('Save')
      fireEvent.click(button)
      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SAVE_STUDIO_TOKEN
      })
    })
  })

  describe('Studio connected', () => {
    it('should render a checkbox which can be used to update dvc.studio.shareExperimentsLive', () => {
      const shareExperimentsLive = false
      renderApp({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: true,
        isStudioConnected: true,
        needsGitCommit: false,
        needsGitInitialized: false,
        projectInitialized: true,
        pythonBinPath: 'python',
        sectionCollapsed: undefined,
        shareLiveToStudio: shareExperimentsLive
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
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: true,
        isStudioConnected: true,
        needsGitCommit: false,
        needsGitInitialized: false,
        projectInitialized: true,
        pythonBinPath: 'python',
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })
      mockPostMessage.mockClear()
      const button = screen.getByText('Update Token')
      fireEvent.click(button)
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: MessageFromWebviewType.SAVE_STUDIO_TOKEN
      })
    })
  })
})
