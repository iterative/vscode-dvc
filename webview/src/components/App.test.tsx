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
import complexExperimentsOutput from 'dvc/src/experiments/webview/complex-output-example.json'
import complexMetricsColumnData from 'dvc/src/experiments/webview/complex-metric-column-data-example.json'
import complexParamsColumnData from 'dvc/src/experiments/webview/complex-params-column-data-example.json'
import {
  MessageFromWebviewType,
  MessageToWebviewType,
  WebviewColorTheme
} from 'dvc/src/experiments/webview/contract'
import { App } from './App'
import { getVsCodeApi } from '../model/vsCodeApi'

jest.mock('../model/vsCodeApi')

const { postMessage, getState } = getVsCodeApi()
const mockGetVsCodeApi = mocked(getVsCodeApi)
const mockPostMessage = mocked(postMessage)
const mockGetState = mocked(getState)

interface CustomWindow extends Window {
  webviewData: {
    publicPath: string
    theme: WebviewColorTheme
  }
}

let customWindow: CustomWindow
beforeEach(() => {
  jest.clearAllMocks()
  mockGetState.mockReturnValueOnce({})
  customWindow = window as unknown as CustomWindow
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
    describe('When we render the App', () => {
      it('Then a message should be sent to the extension on the first render', () => {
        render(<App />)
        expect(mockGetVsCodeApi).toHaveBeenCalledTimes(1)
        expect(mockPostMessage).toHaveBeenCalledWith({
          type: MessageFromWebviewType.initialized
        })

        expect(mockPostMessage).toHaveBeenCalledTimes(1)
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
        metrics: complexMetricsColumnData,
        params: complexParamsColumnData,
        tableData: complexExperimentsOutput,
        type: MessageToWebviewType.showExperiments
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
