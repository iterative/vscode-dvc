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
import staticPlotsFixture from 'dvc/src/test/fixtures/plotsShow/staticPlots/webview'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { PlotSize } from 'dvc/src/plots/webview/contract'
import { mocked } from 'ts-jest/utils'
import { LivePlotsColors } from 'dvc/src/plots/webview/contract'
import { App } from './App'
import Plots from './Plots'
import { vsCodeApi } from '../../shared/api'

import {
  PlotsSectionKeys,
  defaultCollapsibleSectionsState
} from '../hooks/useAppReducer'

jest.mock('../../shared/api')

jest.mock('./constants', () => ({
  ...jest.requireActual('./constants'),
  createSpec: (title: string, scale?: LivePlotsColors) => ({
    ...jest.requireActual('./constants').createSpec(title, scale),
    height: 100,
    width: 100
  })
}))

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
      type: MessageFromWebviewType.INITIALIZED
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
          type: MessageToWebviewType.SET_DVC_ROOT
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
    const loadingState = await screen.findByText('Loading Plots...')

    expect(loadingState).toBeInTheDocument()
  })

  it('should render the empty state when given data with no experiments', async () => {
    const dataMessageWithoutPlots = new MessageEvent('message', {
      data: {
        data: { live: null, static: null },
        type: MessageToWebviewType.SET_DATA
      }
    })
    render(<App />)
    fireEvent(window, dataMessageWithoutPlots)
    const emptyState = await screen.findByText('No Plots to Display')

    expect(emptyState).toBeInTheDocument()
  })

  it('should render only live plots when given a message with only live plots data', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const dataMessageWithPlots = new MessageEvent('message', {
      data: {
        data: { live: livePlotsFixture },
        type: MessageToWebviewType.SET_DATA
      }
    })
    render(<App />)
    fireEvent(window, dataMessageWithPlots)

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Live Experiments Plots')).toBeInTheDocument()
    expect(screen.queryByText('Static Plots')).not.toBeInTheDocument()
  })

  it('should render live and static plots when given a message with both types of plots data', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const dataMessageWithPlots = new MessageEvent('message', {
      data: {
        data: { live: livePlotsFixture, static: staticPlotsFixture },
        type: MessageToWebviewType.SET_DATA
      }
    })
    render(<App />)
    fireEvent(window, dataMessageWithPlots)

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Live Experiments Plots')).toBeInTheDocument()
    expect(screen.getByText('Static Plots')).toBeInTheDocument()
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
    const summaryElement = await screen.findByText('Live Experiments Plots')
    const [plot] = await screen.findAllByLabelText('Vega visualization')
    expect(plot).toBeInTheDocument()

    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })
    await waitFor(() => expect(mockSetState).toBeCalledTimes(2))

    expect(
      screen.queryByLabelText('Vega visualization')
    ).not.toBeInTheDocument()
    expect(mockSetState).toBeCalledWith({
      ...initialState,
      collapsedSections: {
        ...defaultCollapsibleSectionsState,
        [PlotsSectionKeys.LIVE_PLOTS]: true
      }
    })
  })

  it('should toggle the visibility of plots when clicking the metrics in the metrics picker', async () => {
    render(
      <Plots
        state={{
          collapsedSections: defaultCollapsibleSectionsState,
          data: {
            live: livePlotsFixture,
            static: null
          }
        }}
        dispatch={jest.fn}
        sendMessage={jest.fn}
      />
    )

    const summaryElement = await screen.findByText('Live Experiments Plots')
    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(() =>
      screen.getByTestId('plot-metrics:summary.json:loss')
    ).not.toThrow()

    const [pickerButton] = screen.queryAllByTestId('icon-menu-item')
    fireEvent.mouseEnter(pickerButton)
    fireEvent.click(pickerButton)

    const lossItem = await screen.findByText('loss')

    fireEvent.click(lossItem, {
      bubbles: true,
      cancelable: true
    })

    expect(() => screen.getByTestId('plot-metrics:summary.json:loss')).toThrow()

    fireEvent.mouseEnter(pickerButton)
    fireEvent.click(pickerButton)

    fireEvent.click(lossItem, {
      bubbles: true,
      cancelable: true
    })

    expect(() =>
      screen.getByTestId('plot-metrics:summary.json:loss')
    ).not.toThrow()
  })

  it('should send a message to the extension with the selected metrics when toggling the visibility of a plot', async () => {
    const initialState = {
      collapsedSections: defaultCollapsibleSectionsState,
      data: {
        live: livePlotsFixture
      }
    }
    mockGetState.mockReturnValue(initialState)
    render(<App />)

    const [pickerButton] = screen.getAllByTestId('icon-menu-item')
    fireEvent.mouseEnter(pickerButton)
    fireEvent.click(pickerButton)

    const lossItem = await screen.findByText('loss')

    fireEvent.click(lossItem, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).toBeCalledWith({
      payload: ['accuracy', 'val_loss', 'val_accuracy'],
      type: MessageFromWebviewType.METRIC_TOGGLED
    })

    fireEvent.click(lossItem, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).toBeCalledWith({
      payload: ['loss', 'accuracy', 'val_loss', 'val_accuracy'],
      type: MessageFromWebviewType.METRIC_TOGGLED
    })
  })

  it('should change the size of the plots according to the size picker', async () => {
    const initialState = {
      collapsedSections: defaultCollapsibleSectionsState,
      data: {
        live: livePlotsFixture
      }
    }
    mockGetState.mockReturnValue(initialState)
    render(<App />)

    const [, sizePickerButton] = screen.getAllByTestId('icon-menu-item')
    fireEvent.mouseEnter(sizePickerButton)
    fireEvent.click(sizePickerButton)

    const smallButton = screen.getByText('Small')
    const regularButton = screen.getByText('Regular')
    const largeButton = screen.getByText('Large')

    fireEvent.click(smallButton)
    let wrapper = await screen.findByTestId('plots-wrapper')
    expect(wrapper).toHaveClass('smallPlots')

    fireEvent.click(regularButton)
    wrapper = await screen.findByTestId('plots-wrapper')
    expect(wrapper).toHaveClass('regularPlots')

    fireEvent.click(largeButton)
    wrapper = await screen.findByTestId('plots-wrapper')
    expect(wrapper).toHaveClass('largePlots')
  })

  it('should send a message to the extension with the selected size when changing the size of plots', () => {
    const initialState = {
      collapsedSections: defaultCollapsibleSectionsState,
      data: {
        live: livePlotsFixture
      }
    }
    mockGetState.mockReturnValue(initialState)
    render(<App />)

    const [, sizeButton] = screen.getAllByTestId('icon-menu-item')
    fireEvent.mouseEnter(sizeButton)
    fireEvent.click(sizeButton)

    const largeButton = screen.getByText('Large')
    fireEvent.click(largeButton)

    expect(mockPostMessage).toBeCalledWith({
      payload: PlotSize.LARGE,
      type: MessageFromWebviewType.PLOTS_RESIZED
    })

    const smallButton = screen.getByText('Small')
    fireEvent.click(smallButton)

    expect(mockPostMessage).toBeCalledWith({
      payload: PlotSize.SMALL,
      type: MessageFromWebviewType.PLOTS_RESIZED
    })
  })
})
