/**
 * @jest-environment jsdom
 */
import React from 'react'
import {
  render,
  cleanup,
  waitFor,
  screen,
  fireEvent
} from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { mocked } from 'ts-jest/utils'
import { App } from './App'
import complexExperimentsOutput from '../stories/complex-experiments-output.json'

interface CustomWindow extends Window {
  webviewData: {
    publicPath: string
    theme: WebviewColorTheme
  }
}

import { getVsCodeApi } from '../model/VsCodeApi'
import {
  MessageFromWebviewType,
  MessageToWebviewType,
  WebviewColorTheme
} from 'dvc/src/webviewContract'

const { postMessage, getState } = getVsCodeApi()
const mockGetVsCodeApi = mocked(getVsCodeApi)
const mockPostMessage = mocked(postMessage)
const mockGetState = mocked(getState)

jest.mock('../model/VsCodeApi')

let customWindow: CustomWindow
beforeEach(() => {
  jest.clearAllMocks()
  customWindow = (global as unknown) as CustomWindow
  customWindow.webviewData = {
    publicPath: '/some/path',
    theme: WebviewColorTheme.dark
  }
})

afterEach(() => {
  cleanup()
})

describe('App', () => {
  describe('Given an initial empty state', () => {
    mockGetState.mockReturnValue({})

    describe('When we render the App', () => {
      it('Then a message should be sent to the extension on the first render', async () => {
        render(<App />)
        expect(mockGetVsCodeApi).toHaveBeenCalledTimes(1)
        expect(mockPostMessage).toHaveBeenCalledWith({
          type: MessageFromWebviewType.initialized
        })

        expect(mockPostMessage).toHaveBeenCalledTimes(1)
      })

      it('Then the run experiment button should be displayed', async () => {
        render(<App />)
        const runExperimentButton = screen.getByText('Run Experiment')
        await waitFor(() => runExperimentButton)

        expect(runExperimentButton).toBeInTheDocument()
      })

      it('Then the empty state should be displayed', async () => {
        render(<App />)
        const emptyState = screen.getByText('Loading experiments...')
        await waitFor(() => emptyState)
        expect(emptyState).toBeInTheDocument()
      })
    })
  })

  describe('Given a message to add experiments to the state', () => {
    const messageToChangeState = new MessageEvent('message', {
      data: {
        type: MessageToWebviewType.showExperiments,
        tableData: complexExperimentsOutput
      }
    })

    describe('When we render the App and send the message', () => {
      it('Then the experiments table should be shown', async () => {
        render(<App />)
        fireEvent(customWindow, messageToChangeState)

        const experimentText = screen.queryAllByText('Experiment')
        await waitFor(() => experimentText)
        const emptyState = screen.queryByText('Loading experiments...')
        expect(emptyState).not.toBeInTheDocument()
      })
    })
  })
})
