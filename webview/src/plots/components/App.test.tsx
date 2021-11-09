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
import livePlotsFixture from 'dvc/src/test/fixtures/expShow/livePlots'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { App } from './App'

import { vsCodeApi } from '../../shared/api'

jest.mock('../../shared/api')

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
      screen.getByText('Loading Plots...')
    )
    expect(loadingState).toBeInTheDocument()
  })

  it('Renders the empty state when given data with no experiments', async () => {
    const dataMessageWithoutPlots = new MessageEvent('message', {
      data: {
        data: { live: { plots: [] }, static: {} },
        type: MessageToWebviewType.setData
      }
    })
    render(<App />)
    fireEvent(window, dataMessageWithoutPlots)
    const emptyState = await waitFor(() =>
      screen.getByText('No Plots to Display')
    )
    expect(emptyState).toBeInTheDocument()
  })

  it('Renders plots when given a message with plots data', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})

    const dataMessageWithPlots = new MessageEvent('message', {
      data: {
        data: { live: { plots: livePlotsFixture }, static: {} },
        type: MessageToWebviewType.setData
      }
    })
    render(<App />)
    fireEvent(window, dataMessageWithPlots)

    const loadingEmptyState = screen.queryByText('Loading Plots...')
    expect(loadingEmptyState).not.toBeInTheDocument()

    const noPlotsEmptyState = screen.queryByText('No Plots to Display')
    expect(noPlotsEmptyState).not.toBeInTheDocument()
  })
})
