/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import livePlotsFixture from 'dvc/src/test/fixtures/expShow/livePlots'
import staticPlotsFixture from 'dvc/src/test/fixtures/plotsDiff/static/webview'
import {
  DEFAULT_SECTION_COLLAPSED,
  LivePlotsColors,
  PlotsData,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { App } from './App'
import { Plots } from './Plots'
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
const mockPostMessage = jest.mocked(postMessage)
const mockSetState = jest.mocked(setState)

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
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })
    const emptyState = await screen.findByText('No Plots to Display')

    expect(emptyState).toBeInTheDocument()
  })

  it('should render only live plots when given a message with only live plots data', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Experiment Checkpoints')).toBeInTheDocument()
    expect(screen.queryByText('Plots')).not.toBeInTheDocument()
    expect(screen.queryByText('Comparison')).not.toBeInTheDocument()
  })

  it('should render live and static plots when given messages with both types of plots data', () => {
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    const heightToSuppressVegaError = 1000
    jest
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockImplementation(() => heightToSuppressVegaError)
    sendSetDataMessage({
      static: staticPlotsFixture
    })

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Experiment Checkpoints')).toBeInTheDocument()
    expect(screen.getByText('Plots')).toBeInTheDocument()
  })

  it('should render the comparison table when given a message with comparison plots data', () => {
    const expectedSectionName = 'Comparison'

    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    sendSetDataMessage({
      comparison: comparisonTableFixture
    })

    expect(screen.getByText(expectedSectionName)).toBeInTheDocument()
  })

  it('should remove live plots given a message showing live plots as null', () => {
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    expect(screen.getByText('Experiment Checkpoints')).toBeInTheDocument()

    sendSetDataMessage({
      live: null
    })
    expect(screen.queryByText('Experiment Checkpoints')).not.toBeInTheDocument()
  })

  it('should toggle the live plots section in state when its header is clicked', async () => {
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    const summaryElement = await screen.findByText('Experiment Checkpoints')
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
            sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
            static: null
          }
        }}
        dispatch={jest.fn}
      />
    )

    const summaryElement = await screen.findByText('Experiment Checkpoints')
    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(() => screen.getByTestId('plot-summary.json:loss')).not.toThrow()

    const [, pickerButton] = screen.queryAllByTestId('icon-menu-item')
    fireEvent.mouseEnter(pickerButton)
    fireEvent.click(pickerButton)

    const lossItem = await screen.findByText('loss')

    fireEvent.click(lossItem, {
      bubbles: true,
      cancelable: true
    })

    expect(() => screen.getByTestId('plot-summary.json:loss')).toThrow()

    fireEvent.mouseEnter(pickerButton)
    fireEvent.click(pickerButton)

    fireEvent.click(lossItem, {
      bubbles: true,
      cancelable: true
    })

    expect(() => screen.getByTestId('plot-summary.json:loss')).not.toThrow()
  })

  it('should send a message to the extension with the selected metrics when toggling the visibility of a plot', async () => {
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    const [, pickerButton] = screen.getAllByTestId('icon-menu-item')
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
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    const [, , sizePickerButton] = screen.getAllByTestId('icon-menu-item')
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
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    const [, , sizeButton] = screen.getAllByTestId('icon-menu-item')
    fireEvent.mouseEnter(sizeButton)
    fireEvent.click(sizeButton)

    const largeButton = screen.getByText('Large')
    fireEvent.click(largeButton)

    expect(mockPostMessage).toBeCalledWith({
      payload: { section: Section.LIVE_PLOTS, size: PlotSize.LARGE },
      type: MessageFromWebviewType.PLOTS_RESIZED
    })

    const smallButton = screen.getByText('Small')
    fireEvent.click(smallButton)

    expect(mockPostMessage).toBeCalledWith({
      payload: { section: Section.LIVE_PLOTS, size: PlotSize.SMALL },
      type: MessageFromWebviewType.PLOTS_RESIZED
    })
  })

  it('should show an input to rename the section when clicking the rename icon button', () => {
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    expect(screen.queryByRole('textbox')).toBeNull()

    const [renameButton] = screen.getAllByTestId('icon-menu-item')
    fireEvent.mouseEnter(renameButton)
    fireEvent.click(renameButton)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should change the title of the section when hitting enter on the title input', () => {
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })
    const originalText = 'Experiment Checkpoints'

    expect(screen.getByText(originalText)).toBeInTheDocument()

    const [renameButton] = screen.getAllByTestId('icon-menu-item')
    fireEvent.mouseEnter(renameButton)
    fireEvent.click(renameButton)

    const titleInput = screen.getByRole('textbox')
    const newTitle = 'Brand new section'
    fireEvent.change(titleInput, { target: { value: newTitle } })
    fireEvent.keyDown(titleInput, { key: 'Enter' })

    expect(screen.getByText(newTitle)).toBeInTheDocument()
  })

  it('should send a message to the extension with the new section name after a section rename', () => {
    renderAppWithData({
      live: livePlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    const [renameButton] = screen.getAllByTestId('icon-menu-item')
    fireEvent.mouseEnter(renameButton)
    fireEvent.click(renameButton)

    const titleInput = screen.getByRole('textbox')
    const newTitle = 'Brand new section'
    fireEvent.change(titleInput, { target: { value: newTitle } })
    fireEvent.keyDown(titleInput, { key: 'Enter' })

    expect(mockPostMessage).toBeCalledWith({
      payload: { name: newTitle, section: Section.LIVE_PLOTS },
      type: MessageFromWebviewType.SECTION_RENAMED
    })
  })
})
