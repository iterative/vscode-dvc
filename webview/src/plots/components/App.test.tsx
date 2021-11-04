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
import complexLivePlotsData from 'dvc/src/test/fixtures/complex-live-plots-example'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { App } from './App'

import { vsCodeApi } from '../util/vscode'

jest.mock('../util/vscode')

const { postMessage: mockPostMessage } = vsCodeApi
beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('App', () => {
  it('Sends the initialized message on first render', () => {
    render(<App />)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.initialized
    })
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
  })

  it('Renders the loading state when given no data', async () => {
    render(<App />)
    const loadingState = await waitFor(() =>
      screen.getByText('Loading plots data...')
    )
    expect(loadingState).toBeInTheDocument()
  })

  it('Renders the empty state when given data with no experiments', async () => {
    const dataMessageWithoutPlots = new MessageEvent('message', {
      data: {
        data: [],
        type: MessageToWebviewType.setData
      }
    })
    render(<App />)
    fireEvent(window, dataMessageWithoutPlots)
    const emptyState = await waitFor(() =>
      screen.getByText('There are no experiments to make plots from.')
    )
    expect(emptyState).toBeInTheDocument()
  })

  it('Renders plots when given a message with plots data', () => {
    const dataMessageWithPlots = new MessageEvent('message', {
      data: {
        data: complexLivePlotsData,
        type: MessageToWebviewType.setData
      }
    })
    render(<App />)
    fireEvent(window, dataMessageWithPlots)

    const emptyState = screen.queryByText('Loading plots data...')
    expect(emptyState).not.toBeInTheDocument()
  })
})
