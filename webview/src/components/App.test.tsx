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
import complexRowData from 'dvc/src/test/fixtures/complex-row-example'
import complexColumnData from 'dvc/src/test/fixtures/complex-column-example'
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
    theme: WebviewColorTheme
  }
}

let customWindow: CustomWindow
beforeEach(() => {
  jest.clearAllMocks()
  mockGetState.mockReturnValueOnce({})
  customWindow = window as unknown as CustomWindow
  customWindow.webviewData = {
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
        const emptyState = await waitFor(() =>
          screen.getByText('Loading experiments...')
        )
        expect(emptyState).toBeInTheDocument()
      })
    })
  })

  describe('Given a message to add experiments to the state', () => {
    const messageToChangeState = new MessageEvent('message', {
      data: {
        tableData: {
          columns: complexColumnData,
          rows: complexRowData,
          sorts: []
        },
        type: MessageToWebviewType.setData
      }
    })

    describe('When we render the App and send the message', () => {
      it('Then the experiments table should be shown', async () => {
        render(<App />)
        fireEvent(customWindow, messageToChangeState)

        await waitFor(() => screen.queryAllByText('Experiment'))
        const emptyState = screen.queryByText('Loading experiments...')
        expect(emptyState).not.toBeInTheDocument()
      })
    })
  })
})
