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

const setData = (
  cliAccessible: boolean,
  projectInitialized: boolean,
  hasData: boolean
) => {
  fireEvent(
    window,
    new MessageEvent('message', {
      data: {
        data: {
          cliAccessible,
          hasData,
          projectInitialized
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

  it('should show a screen saying that DVC is not installed if the cli is unavailable', () => {
    render(<App />)
    setData(false, false, false)

    expect(screen.getByText('DVC is currently unavailable')).toBeInTheDocument()
  })

  it('should now show a screen saying that DVC is not installed if the cli is available', () => {
    render(<App />)
    setData(true, false, false)

    expect(screen.queryByText('DVC is currently unavailable')).toBeNull()
  })

  it('should show a screen saying that DVC is not initialized if the project is not initialized and dvc is installed', () => {
    render(<App />)
    setData(true, false, false)

    expect(screen.getByText('DVC is not initialized')).toBeInTheDocument()
  })

  it('should not show a screen saying that DVC is not initialized if the project is initialized and dvc is installed', () => {
    render(<App />)
    setData(true, true, false)

    expect(screen.queryByText('DVC is not initialized')).toBeNull()
  })

  it('should send a message to initialize the project when clicking the Initialize Project buttons when the project is not initialized', () => {
    render(<App />)
    setData(true, false, false)

    const initializeButton = screen.getByText('Initialize Project')
    fireEvent.click(initializeButton)

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.INITIALIZE_PROJECT
    })
  })

  it('should show a screen saying that the project contains no data if dvc is installed, the project is initialized but has no data', () => {
    render(<App />)
    setData(true, true, false)

    expect(
      screen.getByText('Your project contains no data')
    ).toBeInTheDocument()
  })

  it('should not show a screen saying that the project contains no data if dvc is installed, the project is initialized and has data', () => {
    render(<App />)
    setData(true, true, true)

    expect(screen.queryByText('Your project contains no data')).toBeNull()
  })

  it('should show a screen saying that the extension is ready to use if the project is initialized and dvc is installed', () => {
    render(<App />)
    setData(true, true, true)

    expect(
      screen.getByText('You are now ready to use the DVC VS Code extension')
    ).toBeInTheDocument()
  })

  it('should send a message to open the experiments when clicking the View Experiments button when the project is initialized and DVC is installed', () => {
    render(<App />)
    setData(true, true, true)

    const viewExperimentsButton = screen.getByText('View Experiments')
    fireEvent.click(viewExperimentsButton)

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.OPEN_EXPERIMENTS_WEBVIEW
    })
  })
})
