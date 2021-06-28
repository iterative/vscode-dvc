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
    const summary = 'summary.json'
    const params = 'params.yaml'
    const messageToChangeState = new MessageEvent('message', {
      data: {
        metrics: [
          {
            childColumns: [
              {
                ancestors: [summary],
                maxNumber: 2.048856019973755,
                maxStringLength: 18,
                minNumber: 1.775016188621521,
                name: 'loss',
                types: ['number']
              },
              {
                ancestors: [summary],
                maxNumber: 0.5926499962806702,
                maxStringLength: 19,
                minNumber: 0.3484833240509033,
                name: 'accuracy',
                types: ['number']
              },
              {
                ancestors: [summary],
                maxNumber: 1.9979370832443237,
                maxStringLength: 18,
                minNumber: 1.7233840227127075,
                name: 'val_loss',
                types: ['number']
              },
              {
                ancestors: [summary],
                maxNumber: 0.6704000234603882,
                maxStringLength: 19,
                minNumber: 0.4277999997138977,
                name: 'val_accuracy',
                types: ['number']
              }
            ],
            name: summary
          }
        ],
        params: [
          {
            childColumns: [
              {
                ancestors: [params],
                maxNumber: 5,
                maxStringLength: 1,
                minNumber: 2,
                name: 'epochs',
                types: ['number']
              },
              {
                ancestors: [params],
                maxNumber: 2.2e-7,
                maxStringLength: 6,
                minNumber: 2e-12,
                name: 'learning_rate',
                types: ['number']
              },
              {
                ancestors: [params],
                maxStringLength: 8,
                name: 'dvc_logs_dir',
                types: ['string']
              },
              {
                ancestors: [params],
                maxStringLength: 8,
                name: 'log_file',
                types: ['string']
              },
              {
                ancestors: [params],
                maxNumber: 0.15,
                maxStringLength: 5,
                minNumber: 0.122,
                name: 'dropout',
                types: ['number']
              },
              {
                ancestors: [params],
                childColumns: [
                  {
                    ancestors: [params, 'process'],
                    maxNumber: 0.86,
                    maxStringLength: 4,
                    minNumber: 0.85,
                    name: 'threshold',
                    types: ['number']
                  },
                  {
                    ancestors: [params, 'process'],
                    maxNumber: 3,
                    maxStringLength: 6,
                    minNumber: 3,
                    name: 'test_arg',
                    types: ['string', 'number']
                  }
                ],
                name: 'process'
              }
            ],
            name: params
          }
        ],
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
