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
import rowsFixture from 'dvc/src/test/fixtures/expShow/rows'
import columnsFixture from 'dvc/src/test/fixtures/expShow/columns'
import {
  MessageFromWebviewType,
  MessageToWebviewType,
  WebviewColorTheme
} from 'dvc/src/webview/contract'
import { App } from './App'
import { vsCodeApi } from '../../shared/api'

jest.mock('../../shared/api')

const { postMessage, getState } = vsCodeApi
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
        data: {
          columns: columnsFixture,
          rows: rowsFixture,
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
