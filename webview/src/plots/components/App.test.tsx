/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import livePlotsFixture from 'dvc/src/test/fixtures/expShow/livePlots'
import staticPlotsFixture from 'dvc/src/test/fixtures/plotsShow/staticPlots/webview'
import {
  defaultCollapsedSections,
  Section
} from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { mocked } from 'ts-jest/utils'
import { App } from './App'
import Plots from './Plots'
import { vsCodeApi } from '../../shared/api'

jest.mock('../../shared/api')

const { postMessage, setState } = vsCodeApi
const mockPostMessage = mocked(postMessage)
const mockSetState = mocked(setState)

const toStringSize = (size: number, addedSize = 44) =>
  (size + addedSize).toString()

const getPlotSvg = async () => {
  const [plot] = await screen.findAllByRole('graphics-document')
  // eslint-disable-next-line testing-library/no-node-access
  return plot.getElementsByTagName('svg')[0]
}

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
      dvcRoot: 'root'
    })
    expect(mockSetState).toBeCalledTimes(1)
  })

  it('should render the loading state when given no data', async () => {
    render(<App />)
    const loadingState = await screen.findByText('Loading Plots...')

    expect(loadingState).toBeInTheDocument()
  })

  it('should render the loading state when not initially provided with collapsed sections', async () => {
    const initialMessage = new MessageEvent('message', {
      data: {
        data: {
          live: null
        },
        type: MessageToWebviewType.SET_DATA
      }
    })

    render(<App />)
    fireEvent(window, initialMessage)
    const loadingState = await screen.findByText('Loading Plots...')

    expect(loadingState).toBeInTheDocument()
  })

  it('should render the empty state when given data with no plots', async () => {
    const initialMessage = new MessageEvent('message', {
      data: {
        data: {
          collapsedSections: defaultCollapsedSections,
          live: null
        },
        type: MessageToWebviewType.SET_DATA
      }
    })
    render(<App />)
    fireEvent(window, initialMessage)
    const emptyState = await screen.findByText('No Plots to Display')

    expect(emptyState).toBeInTheDocument()
  })

  it('should render only live plots when given a message with only live plots data', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const initialMessage = new MessageEvent('message', {
      data: {
        data: {
          collapsedSections: defaultCollapsedSections,
          live: livePlotsFixture
        },
        type: MessageToWebviewType.SET_DATA
      }
    })
    render(<App />)
    fireEvent(window, initialMessage)

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Live Experiments Plots')).toBeInTheDocument()
    expect(screen.queryByText('Static Plots')).not.toBeInTheDocument()
  })

  it('should render live and static plots when given messages with both types of plots data', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const initialMessage = new MessageEvent('message', {
      data: {
        data: {
          collapsedSections: defaultCollapsedSections,
          live: livePlotsFixture
        },
        type: MessageToWebviewType.SET_DATA
      }
    })

    const staticPlotsMessage = new MessageEvent('message', {
      data: {
        data: {
          static: staticPlotsFixture
        },
        type: MessageToWebviewType.SET_DATA
      }
    })

    render(<App />)
    fireEvent(window, initialMessage)
    fireEvent(window, staticPlotsMessage)

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Live Experiments Plots')).toBeInTheDocument()
    expect(screen.getByText('Static Plots')).toBeInTheDocument()
  })

  it('should remove live plots given a message showing live plots as null', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const initialMessage = new MessageEvent('message', {
      data: {
        data: {
          collapsedSections: defaultCollapsedSections,
          live: livePlotsFixture
        },
        type: MessageToWebviewType.SET_DATA
      }
    })

    const removalMessage = new MessageEvent('message', {
      data: {
        data: {
          live: null
        },
        type: MessageToWebviewType.SET_DATA
      }
    })

    render(<App />)

    fireEvent(window, initialMessage)
    expect(screen.getByText('Live Experiments Plots')).toBeInTheDocument()

    fireEvent(window, removalMessage)
    expect(screen.queryByText('Live Experiments Plots')).not.toBeInTheDocument()
  })

  it('should toggle the live plots section in state when its header is clicked', async () => {
    const setInitialData = new MessageEvent('message', {
      data: {
        data: {
          collapsedSections: defaultCollapsedSections,
          live: livePlotsFixture
        },
        type: MessageToWebviewType.SET_DATA
      }
    })
    render(<App />)
    fireEvent(window, setInitialData)

    const summaryElement = await screen.findByText('Live Experiments Plots')
    const [plot] = await screen.findAllByLabelText('Vega visualization')
    expect(plot).toBeInTheDocument()

    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(
      screen.queryByLabelText('Vega visualization')
    ).not.toBeInTheDocument()
    expect(mockPostMessage).toBeCalledWith({
      payload: { [Section.LIVE_PLOTS]: true },
      type: MessageFromWebviewType.PLOTS_SECTION_TOGGLED
    })
  })

  it('should toggle the visibility of plots when clicking the metrics in the metrics picker', async () => {
    render(
      <Plots
        state={{
          data: {
            collapsedSections: defaultCollapsedSections,
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
    const setInitialData = new MessageEvent('message', {
      data: {
        data: {
          collapsedSections: defaultCollapsedSections,
          live: livePlotsFixture
        },
        type: MessageToWebviewType.SET_DATA
      }
    })
    render(<App />)
    fireEvent(window, setInitialData)

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
    render(
      <Plots
        state={{
          data: {
            collapsedSections: defaultCollapsedSections,
            live: livePlotsFixture,
            static: undefined
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

    const [, sizePickerButton] = screen.getAllByTestId('icon-menu-item')
    fireEvent.mouseEnter(sizePickerButton)
    fireEvent.click(sizePickerButton)

    const smallButton = screen.getByText('Small')
    const regularButton = screen.getByText('Regular')
    const largeButton = screen.getByText('Large')

    fireEvent.click(smallButton)
    let svg = await getPlotSvg()
    expect(svg.getAttribute('height')).toBe(toStringSize(200))

    fireEvent.click(regularButton)
    svg = await getPlotSvg()
    expect(svg.getAttribute('height')).toBe(toStringSize(300))

    fireEvent.click(largeButton)
    svg = await getPlotSvg()
    expect(svg.getAttribute('height')).toBe(toStringSize(750, 48))
  })
})
