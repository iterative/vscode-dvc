/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import livePlotsFixture from 'dvc/src/test/fixtures/expShow/livePlots'
import staticPlotsFixture from 'dvc/src/test/fixtures/plotsShow/staticPlots/webview'
import {
  defaultSectionCollapsed,
  LivePlotsColors,
  PlotsData,
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

jest.mock('./constants', () => ({
  ...jest.requireActual('./constants'),
  createSpec: (title: string, scale?: LivePlotsColors) => ({
    ...jest.requireActual('./constants').createSpec(title, scale),
    height: 100,
    width: 100
  })
}))

const { postMessage, setState } = vsCodeApi
const mockPostMessage = mocked(postMessage)
const mockSetState = mocked(setState)

beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('App', () => {
  const sendSetDataMessage = (data: PlotsData) => {
    const message = new MessageEvent('message', {
      data: {
        data,
        type: MessageToWebviewType.SET_DATA
      }
    })
    fireEvent(window, message)
  }

  const renderAppWithData = (data: PlotsData) => {
    render(<App />)
    sendSetDataMessage(data)
  }

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
    renderAppWithData({
      live: null
    })

    const loadingState = await screen.findByText('Loading Plots...')

    expect(loadingState).toBeInTheDocument()
  })

  it('should render the empty state when given data with no plots', async () => {
    renderAppWithData({
      live: null,
      sectionCollapsed: defaultSectionCollapsed
    })
    const emptyState = await screen.findByText('No Plots to Display')

    expect(emptyState).toBeInTheDocument()
  })

  it('should render only live plots when given a message with only live plots data', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: defaultSectionCollapsed
    })

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Live Experiments Plots')).toBeInTheDocument()
    expect(screen.queryByText('Static Plots')).not.toBeInTheDocument()
  })

  it('should render live and static plots when given messages with both types of plots data', () => {
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: defaultSectionCollapsed
    })

    sendSetDataMessage({
      static: staticPlotsFixture
    })

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Live Experiments Plots')).toBeInTheDocument()
    expect(screen.getByText('Static Plots')).toBeInTheDocument()
  })

  it('should remove live plots given a message showing live plots as null', () => {
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: defaultSectionCollapsed
    })

    expect(screen.getByText('Live Experiments Plots')).toBeInTheDocument()

    sendSetDataMessage({
      live: null
    })
    expect(screen.queryByText('Live Experiments Plots')).not.toBeInTheDocument()
  })

  it('should toggle the live plots section in state when its header is clicked', async () => {
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: defaultSectionCollapsed
    })

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
            live: livePlotsFixture,
            sectionCollapsed: defaultSectionCollapsed,
            static: null
          }
        }}
        dispatch={jest.fn}
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
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: defaultSectionCollapsed
    })

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
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: defaultSectionCollapsed
    })

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
})
