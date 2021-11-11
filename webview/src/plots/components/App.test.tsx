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
import plotsShowFixture from 'dvc/src/test/fixtures/plotsShow/output'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { mocked } from 'ts-jest/utils'
import { App } from './App'

import { vsCodeApi } from '../../shared/api'

import {
  CollapsibleSectionsKeys,
  defaultCollapsibleSectionsState
} from '../hooks/useAppReducer'

jest.mock('../../shared/api')

const { postMessage, getState, setState } = vsCodeApi
const mockPostMessage = mocked(postMessage)
const mockGetState = mocked(getState)
const mockSetState = mocked(setState)

beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('App', () => {
  it('should send the initialized message on first render', () => {
    render(<App />)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.initialized
    })
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
  })

  it('should recall state from VSCode on first render', () => {
    const mockState = {
      collapsedSections: defaultCollapsibleSectionsState,
      data: { live: { plots: [] }, static: {} },
      dvcRoot: 'root'
    }
    mockGetState.mockReturnValueOnce(mockState)
    render(<App />)
    expect(mockGetState).toBeCalledTimes(1)
    expect(mockSetState).toBeCalledTimes(1)
    expect(mockSetState).toBeCalledWith(mockState)
  })

  it('should set dvcRoot when the setDvcRoot message comes in', () => {
    render(<App />)
    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          dvcRoot: 'root',
          type: MessageToWebviewType.setDvcRoot
        }
      })
    )
    expect(mockSetState).toBeCalledWith({
      collapsedSections: defaultCollapsibleSectionsState,
      dvcRoot: 'root'
    })
    expect(mockSetState).toBeCalledTimes(2)
  })

  it('should not update state when given an invalid message type', () => {
    render(<App />)
    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          dvcRoot: 'root',
          type: 'this is a bad message'
        }
      })
    )
    expect(mockSetState).toBeCalledTimes(1)
  })

  it('should render the loading state when given no data', async () => {
    render(<App />)
    const loadingState = await waitFor(() =>
      screen.getByText('Loading Plots...')
    )
    expect(loadingState).toBeInTheDocument()
  })

  it('should render the empty state when given data with no experiments', async () => {
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

  it('should render only live plots when given a message with only live plots data', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const dataMessageWithPlots = new MessageEvent('message', {
      data: {
        data: { live: livePlotsFixture },
        type: MessageToWebviewType.setData
      }
    })
    render(<App />)
    fireEvent(window, dataMessageWithPlots)

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.queryByText('Live Experiments Plots')).toBeInTheDocument()
    expect(screen.queryByText('Static Plots')).not.toBeInTheDocument()
  })

  it('should render live and static plots when given a message with both types of plots data', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const dataMessageWithPlots = new MessageEvent('message', {
      data: {
        data: { live: livePlotsFixture, static: plotsShowFixture },
        type: MessageToWebviewType.setData
      }
    })
    render(<App />)
    fireEvent(window, dataMessageWithPlots)

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.queryByText('Live Experiments Plots')).toBeInTheDocument()
    expect(screen.queryByText('Static Plots')).toBeInTheDocument()
  })

  it('should toggle the live plots section in state when its header is clicked', async () => {
    const initialState = {
      collapsedSections: defaultCollapsibleSectionsState,
      data: {
        live: livePlotsFixture
      }
    }
    mockGetState.mockReturnValue(initialState)
    render(<App />)
    const summaryElement = await waitFor(() =>
      screen.getByText('Live Experiments Plots')
    )
    summaryElement.click()
    await waitFor(() => expect(mockSetState).toBeCalledTimes(2))
    expect((summaryElement.parentElement as HTMLDetailsElement).open).toBe(
      false
    )
    expect(mockSetState).toBeCalledWith({
      ...initialState,
      collapsedSections: {
        ...defaultCollapsibleSectionsState,
        [CollapsibleSectionsKeys.LIVE_PLOTS]: true
      }
    })
  })
})
