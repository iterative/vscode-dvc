import { fireEvent, render, screen } from '@testing-library/react'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import '@testing-library/jest-dom/extend-expect'
import React from 'react'
import { App } from './App'
import { vsCodeApi } from '../../shared/api'

jest.mock('../../shared/api')
jest.mock('../../shared/components/codeSlider/CodeSlider')

const { postMessage } = vsCodeApi
const mockPostMessage = jest.mocked(postMessage)

const setData = ({
  canGitInitialize,
  cliCompatible,
  hasData,
  isPythonExtensionInstalled,
  needsGitInitialized,
  projectInitialized,
  pythonBinPath
}: {
  canGitInitialize: boolean | undefined
  cliCompatible: boolean | undefined
  hasData: boolean | undefined
  isPythonExtensionInstalled: boolean
  needsGitInitialized: boolean | undefined
  projectInitialized: boolean
  pythonBinPath: string | undefined
}) => {
  fireEvent(
    window,
    new MessageEvent('message', {
      data: {
        data: {
          canGitInitialize,
          cliCompatible,
          hasData,
          isPythonExtensionInstalled,
          needsGitInitialized,
          projectInitialized,
          pythonBinPath
        },
        type: MessageToWebviewType.SET_DATA
      }
    })
  )
}

describe('App', () => {
  it('should send the initialized message on first render', () => {
    render(<App />)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.INITIALIZED
    })
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
  })

  it('should show a screen saying that DVC is incompatible if the cli version is unexpected', () => {
    render(<App />)
    setData({
      canGitInitialize: undefined,
      cliCompatible: false,
      hasData: false,
      isPythonExtensionInstalled: false,
      needsGitInitialized: undefined,
      projectInitialized: false,
      pythonBinPath: undefined
    })

    expect(screen.getByText('DVC is incompatible')).toBeInTheDocument()
  })

  it('should show a screen saying that DVC is not installed if the cli is unavailable', () => {
    render(<App />)
    setData({
      canGitInitialize: undefined,
      cliCompatible: undefined,
      hasData: false,
      isPythonExtensionInstalled: false,
      needsGitInitialized: undefined,
      projectInitialized: false,
      pythonBinPath: undefined
    })

    expect(screen.getByText('DVC is currently unavailable')).toBeInTheDocument()
  })

  it('should tell the user they cannot install DVC without a Python interpreter', () => {
    render(<App />)
    setData({
      canGitInitialize: undefined,
      cliCompatible: undefined,
      hasData: false,
      isPythonExtensionInstalled: false,
      needsGitInitialized: undefined,
      projectInitialized: false,
      pythonBinPath: undefined
    })

    expect(
      screen.getByText(
        'DVC & DVCLive cannot be auto-installed as Python was not located.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('Install')).not.toBeInTheDocument()
  })

  it('should tell the user they can auto-install DVC with a Python interpreter', () => {
    render(<App />)
    const defaultInterpreter = 'python'
    setData({
      canGitInitialize: undefined,
      cliCompatible: undefined,
      hasData: false,
      isPythonExtensionInstalled: false,
      needsGitInitialized: undefined,
      projectInitialized: false,
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
    render(<App />)
    setData({
      canGitInitialize: undefined,
      cliCompatible: undefined,
      hasData: false,
      isPythonExtensionInstalled: false,
      needsGitInitialized: undefined,
      projectInitialized: false,
      pythonBinPath: 'python'
    })

    const button = screen.getByText('Setup The Workspace')
    fireEvent.click(button)

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.SETUP_WORKSPACE
    })
  })

  it('should let the user find another Python interpreter to install DVC when the Python extension is installed', () => {
    render(<App />)
    setData({
      canGitInitialize: undefined,
      cliCompatible: undefined,
      hasData: false,
      isPythonExtensionInstalled: true,
      needsGitInitialized: undefined,
      projectInitialized: false,
      pythonBinPath: 'python'
    })

    const button = screen.getByText('Select Python Interpreter')
    fireEvent.click(button)

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.SELECT_PYTHON_INTERPRETER
    })
  })

  it('should let the user auto-install DVC under the right conditions', () => {
    render(<App />)
    setData({
      canGitInitialize: undefined,
      cliCompatible: undefined,
      hasData: false,
      isPythonExtensionInstalled: true,
      needsGitInitialized: undefined,
      projectInitialized: false,
      pythonBinPath: 'python'
    })

    const button = screen.getByText('Install')
    fireEvent.click(button)

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.INSTALL_DVC
    })
  })

  it('should not show a screen saying that DVC is not installed if the cli is available', () => {
    render(<App />)
    setData({
      canGitInitialize: undefined,
      cliCompatible: true,
      hasData: false,
      isPythonExtensionInstalled: false,
      needsGitInitialized: undefined,
      projectInitialized: false,
      pythonBinPath: undefined
    })

    expect(
      screen.queryByText('DVC is currently unavailable')
    ).not.toBeInTheDocument()
  })

  it('should not show a screen saying that DVC is not initialized if the project is not initialized and git is uninitialized', () => {
    render(<App />)
    setData({
      canGitInitialize: undefined,
      cliCompatible: true,
      hasData: false,
      isPythonExtensionInstalled: false,
      needsGitInitialized: true,
      projectInitialized: false,
      pythonBinPath: undefined
    })

    expect(screen.getByText('DVC is not initialized')).toBeInTheDocument()
  })

  it('should offer to initialize Git if it is possible', () => {
    render(<App />)
    setData({
      canGitInitialize: true,
      cliCompatible: true,
      hasData: false,
      isPythonExtensionInstalled: false,
      needsGitInitialized: true,
      projectInitialized: false,
      pythonBinPath: undefined
    })

    const initializeButton = screen.getByText('Initialize Git')
    expect(initializeButton).toBeInTheDocument()
    fireEvent.click(initializeButton)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.INITIALIZE_GIT
    })

    setData({
      canGitInitialize: false,
      cliCompatible: true,
      hasData: false,
      isPythonExtensionInstalled: false,
      needsGitInitialized: true,
      projectInitialized: false,
      pythonBinPath: undefined
    })

    expect(screen.queryByText('Initialize Git')).not.toBeInTheDocument()
  })

  it('should show a screen saying that DVC is not initialized if the project is not initialized and dvc is installed', () => {
    render(<App />)
    setData({
      canGitInitialize: undefined,
      cliCompatible: true,
      hasData: false,
      isPythonExtensionInstalled: false,
      needsGitInitialized: undefined,
      projectInitialized: false,
      pythonBinPath: undefined
    })

    expect(screen.getByText('DVC is not initialized')).toBeInTheDocument()
  })

  it('should not show a screen saying that DVC is not initialized if the project is initialized and dvc is installed', () => {
    render(<App />)
    setData({
      canGitInitialize: undefined,
      cliCompatible: true,
      hasData: false,
      isPythonExtensionInstalled: false,
      needsGitInitialized: undefined,
      projectInitialized: true,
      pythonBinPath: undefined
    })

    expect(screen.queryByText('DVC is not initialized')).not.toBeInTheDocument()
  })

  it('should send a message to initialize the project when clicking the Initialize Project buttons when the project is not initialized', () => {
    render(<App />)
    setData({
      canGitInitialize: undefined,
      cliCompatible: true,
      hasData: false,
      isPythonExtensionInstalled: false,
      needsGitInitialized: undefined,
      projectInitialized: false,
      pythonBinPath: undefined
    })

    const initializeButton = screen.getByText('Initialize Project')
    fireEvent.click(initializeButton)

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.INITIALIZE_DVC
    })
  })

  it('should show a screen saying that the project contains no data if dvc is installed, the project is initialized but has no data', () => {
    render(<App />)
    setData({
      canGitInitialize: undefined,
      cliCompatible: true,
      hasData: false,
      isPythonExtensionInstalled: false,
      needsGitInitialized: undefined,
      projectInitialized: true,
      pythonBinPath: undefined
    })

    expect(
      screen.getByText('Your project contains no data')
    ).toBeInTheDocument()
  })

  it('should not show a screen saying that the project contains no data if dvc is installed, the project is initialized and has data', () => {
    render(<App />)
    setData({
      canGitInitialize: undefined,
      cliCompatible: true,
      hasData: true,
      isPythonExtensionInstalled: false,
      needsGitInitialized: undefined,
      projectInitialized: true,
      pythonBinPath: undefined
    })

    expect(
      screen.queryByText('Your project contains no data')
    ).not.toBeInTheDocument()
  })
})
