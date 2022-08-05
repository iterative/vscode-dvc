/**
 * @jest-environment jsdom
 */
import { join } from 'dvc/src/test/util/path'
import { configureStore } from '@reduxjs/toolkit'
import React, { ReactElement } from 'react'
import { Provider } from 'react-redux'
import {
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
  within
} from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import checkpointPlotsFixture from 'dvc/src/test/fixtures/expShow/checkpointPlots'
import plotsRevisionsFixture from 'dvc/src/test/fixtures/plotsDiff/revisions'
import templatePlotsFixture from 'dvc/src/test/fixtures/plotsDiff/template/webview'
import manyTemplatePlots from 'dvc/src/test/fixtures/plotsDiff/template/virtualization'
import {
  DEFAULT_SECTION_COLLAPSED,
  PlotsData,
  PlotSize,
  Section,
  TemplatePlotGroup,
  TemplatePlotsData,
  TemplatePlotSection
} from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { reorderObjectList } from 'dvc/src/util/array'
import { act } from 'react-dom/test-utils'
import { App } from './App'
import { NewSectionBlock } from './templatePlots/TemplatePlots'
import { SectionDescription } from './PlotsContainer'
import { CheckpointPlotsById, plotDataStore } from './plotDataStore'
import { plotsReducers } from '../store'
import { vsCodeApi } from '../../shared/api'
import { createBubbledEvent, dragAndDrop, dragEnter } from '../../test/dragDrop'
import { DragEnterDirection } from '../../shared/components/dragDrop/util'

jest.mock('../../shared/api')

jest.mock('./checkpointPlots/util', () => ({
  createSpec: () => ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    encoding: {},
    height: 100,
    layer: [],
    transform: [],
    width: 100
  })
}))
jest.spyOn(console, 'warn').mockImplementation(() => {})

const { postMessage } = vsCodeApi
const mockPostMessage = jest.mocked(postMessage)

const heightToSuppressVegaError = 1000
const originalOffsetHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'offsetHeight'
)?.value
const originalOffsetWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'offsetWidth'
)?.value

describe('App', () => {
  const sectionPosition = {
    [Section.CHECKPOINT_PLOTS]: 2,
    [Section.TEMPLATE_PLOTS]: 0,
    [Section.COMPARISON_TABLE]: 1
  }

  const sendSetDataMessage = (data: PlotsData) => {
    const message = new MessageEvent('message', {
      data: {
        data,
        type: MessageToWebviewType.SET_DATA
      }
    })
    fireEvent(window, message)
  }

  const renderAppWithOptionalData = (data?: PlotsData) => {
    const store = configureStore({ reducer: { ...plotsReducers } })

    render(
      <Provider store={store}>
        <App />
      </Provider>
    )
    data && sendSetDataMessage(data)
  }

  const templatePlot = templatePlotsFixture.plots[0].entries[0]
  const complexTemplatePlotsFixture = {
    ...templatePlotsFixture,
    plots: [
      {
        entries: [
          ...templatePlotsFixture.plots[0].entries,
          { ...templatePlot, id: join('other', 'plot.tsv') }
        ],
        group: TemplatePlotGroup.SINGLE_VIEW
      },
      {
        entries: [{ ...templatePlot, id: join('other', 'multiview.tsv') }],
        group: TemplatePlotGroup.MULTI_VIEW
      }
    ]
  } as TemplatePlotsData

  const getCheckpointMenuItem = (position: number) =>
    within(
      screen.getAllByTestId('plots-container')[
        sectionPosition[Section.CHECKPOINT_PLOTS]
      ]
    ).getAllByTestId('icon-menu-item')[position]

  const getCheckpointSizePickerButton = () => getCheckpointMenuItem(1)

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 50
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 50
    })
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockImplementation(() => heightToSuppressVegaError)
    plotDataStore.checkpoint = {} as CheckpointPlotsById
    plotDataStore.template = [] as TemplatePlotSection[]
  })

  afterEach(() => {
    cleanup()
  })

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: originalOffsetHeight
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: originalOffsetWidth
    })
  })

  it('should send the initialized message on first render', () => {
    renderAppWithOptionalData()
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.INITIALIZED
    })
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
  })

  it('should render the loading state when given no data', async () => {
    renderAppWithOptionalData()
    const loadingState = await screen.findByText('Loading Plots...')

    expect(loadingState).toBeInTheDocument()
  })

  it('should render the empty state when given data with no plots', async () => {
    renderAppWithOptionalData({
      checkpoint: null
    })
    const emptyState = await screen.findByText('No Plots to Display.')

    expect(emptyState).toBeInTheDocument()
  })

  it('should render the get started buttons when no plots or experiments are selected', async () => {
    renderAppWithOptionalData({
      checkpoint: null,
      hasPlots: true,
      hasSelectedPlots: false,
      selectedRevisions: undefined
    })
    const addPlotsButton = await screen.findByText('Add Plots')
    const addExperimentsButton = await screen.findByText('Add Experiments')

    expect(addPlotsButton).toBeInTheDocument()
    expect(addExperimentsButton).toBeInTheDocument()

    mockPostMessage.mockReset()

    fireEvent.click(addPlotsButton)

    expect(mockPostMessage).toBeCalledWith({
      type: MessageFromWebviewType.SELECT_PLOTS
    })
    mockPostMessage.mockReset()

    fireEvent.click(addExperimentsButton)
    expect(mockPostMessage).toBeCalledWith({
      type: MessageFromWebviewType.SELECT_EXPERIMENTS
    })
  })

  it('should render other sections given a message with only checkpoint plots data', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Trends')).toBeInTheDocument()
    expect(screen.getByText('Data Series')).toBeInTheDocument()
    expect(screen.getByText('Images')).toBeInTheDocument()
    expect(screen.getByText('No Plots to Display')).toBeInTheDocument()
    expect(screen.getByText('No Images to Compare')).toBeInTheDocument()
  })

  it('should render checkpoint even when there is no checkpoint plots data', () => {
    renderAppWithOptionalData({
      template: templatePlotsFixture
    })

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Trends')).toBeInTheDocument()
    expect(screen.getByText('No Plots to Display')).toBeInTheDocument()
  })

  it('should render the comparison table when given a message with comparison plots data', () => {
    const expectedSectionName = 'Images'

    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    sendSetDataMessage({
      comparison: comparisonTableFixture
    })

    expect(screen.getByText(expectedSectionName)).toBeInTheDocument()
  })

  it('should remove checkpoint plots given a message showing checkpoint plots as null', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    expect(screen.getByText('Trends')).toBeInTheDocument()

    sendSetDataMessage({
      checkpoint: null
    })

    expect(screen.queryByText('Trends')).not.toBeInTheDocument()
  })

  it('should toggle the checkpoint plots section in state when its header is clicked', async () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const summaryElement = await screen.findByText('Trends')
    const visiblePlots = await screen.findAllByLabelText('Vega visualization')
    visiblePlots.map(visiblePlot => {
      expect(visiblePlot).toBeInTheDocument()
      expect(visiblePlot).toBeVisible()
    })

    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).toBeCalledWith({
      payload: { [Section.CHECKPOINT_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })

    sendSetDataMessage({
      sectionCollapsed: {
        ...DEFAULT_SECTION_COLLAPSED,
        [Section.CHECKPOINT_PLOTS]: true
      }
    })

    expect(
      screen.queryByLabelText('Vega visualization')
    ).not.toBeInTheDocument()
  })

  it('should toggle the visibility of plots when clicking the metrics in the metrics picker', async () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const summaryElement = await screen.findByText('Trends')
    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(screen.getByTestId('plot-summary.json:loss')).toBeInTheDocument()

    const pickerButton = getCheckpointMenuItem(0)
    fireEvent.mouseEnter(pickerButton)
    fireEvent.click(pickerButton)

    const lossItem = await screen.findByText('summary.json:loss', {
      ignore: 'text'
    })

    fireEvent.click(lossItem, {
      bubbles: true,
      cancelable: true
    })

    expect(
      screen.queryByTestId('plot-summary.json:loss')
    ).not.toBeInTheDocument()

    fireEvent.mouseEnter(pickerButton)
    fireEvent.click(pickerButton)

    fireEvent.click(lossItem, {
      bubbles: true,
      cancelable: true
    })

    expect(screen.getByTestId('plot-summary.json:loss')).toBeInTheDocument()
  })

  it('should send a message to the extension with the selected metrics when toggling the visibility of a plot', async () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const pickerButton = getCheckpointMenuItem(0)
    fireEvent.mouseEnter(pickerButton)
    fireEvent.click(pickerButton)

    const lossItem = await screen.findByText('summary.json:loss')

    fireEvent.click(lossItem, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).toBeCalledWith({
      payload: [
        'summary.json:accuracy',
        'summary.json:val_accuracy',
        'summary.json:val_loss'
      ],
      type: MessageFromWebviewType.TOGGLE_METRIC
    })

    fireEvent.click(lossItem, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).toBeCalledWith({
      payload: [
        'summary.json:accuracy',
        'summary.json:loss',
        'summary.json:val_accuracy',
        'summary.json:val_loss'
      ],
      type: MessageFromWebviewType.TOGGLE_METRIC
    })
  })

  it('should change the size of the plots according to the size picker', async () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })
    const position = sectionPosition[Section.CHECKPOINT_PLOTS]
    const getWrapper = async () => {
      const wrappers = await screen.findAllByTestId('plots-wrapper')
      return wrappers[position]
    }

    const sizePickerButton = getCheckpointSizePickerButton()
    fireEvent.mouseEnter(sizePickerButton)
    fireEvent.click(sizePickerButton)

    const smallButton = screen.getByText('Small')
    const regularButton = screen.getByText('Regular')
    const largeButton = screen.getByText('Large')

    fireEvent.click(smallButton)
    let wrapper = await getWrapper()
    expect(wrapper).toHaveClass('smallPlots')

    fireEvent.click(regularButton)
    wrapper = await getWrapper()
    expect(wrapper).toHaveClass('regularPlots')

    fireEvent.click(largeButton)
    wrapper = await getWrapper()
    expect(wrapper).toHaveClass('largePlots')
  })

  it('should send a message to the extension with the selected size when changing the size of plots', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const sizeButton = getCheckpointSizePickerButton()
    fireEvent.mouseEnter(sizeButton)
    fireEvent.click(sizeButton)

    const largeButton = screen.getByText('Large')
    fireEvent.click(largeButton)

    expect(mockPostMessage).toBeCalledWith({
      payload: { section: Section.CHECKPOINT_PLOTS, size: PlotSize.LARGE },
      type: MessageFromWebviewType.RESIZE_PLOTS
    })

    const smallButton = screen.getByText('Small')
    fireEvent.click(smallButton)

    expect(mockPostMessage).toBeCalledWith({
      payload: { section: Section.CHECKPOINT_PLOTS, size: PlotSize.SMALL },
      type: MessageFromWebviewType.RESIZE_PLOTS
    })
  })

  it('should not send a message to the extension with the selected size when the size has not changed', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const sizeButton = getCheckpointSizePickerButton()
    fireEvent.mouseEnter(sizeButton)
    fireEvent.click(sizeButton)

    const largeButton = screen.getByText('Large')
    fireEvent.click(largeButton)

    expect(mockPostMessage).toBeCalledWith({
      payload: { section: Section.CHECKPOINT_PLOTS, size: PlotSize.LARGE },
      type: MessageFromWebviewType.RESIZE_PLOTS
    })

    mockPostMessage.mockClear()

    sendSetDataMessage({
      checkpoint: checkpointPlotsFixture
    })

    expect(mockPostMessage).not.toBeCalled()
  })

  it('should display the checkpoint plots in the order stored', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    let plots = screen.getAllByTestId(/summary\.json/)

    expect(plots.map(plot => plot.id)).toStrictEqual([
      'summary.json:loss',
      'summary.json:accuracy',
      'summary.json:val_loss',
      'summary.json:val_accuracy'
    ])

    dragAndDrop(plots[1], plots[0])

    plots = screen.getAllByTestId(/summary\.json/)

    expect(plots.map(plot => plot.id)).toStrictEqual([
      'summary.json:accuracy',
      'summary.json:loss',
      'summary.json:val_loss',
      'summary.json:val_accuracy'
    ])
  })

  it('should send a message to the extension when the checkpoint plots are reordered', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const plots = screen.getAllByTestId(/summary\.json/)
    expect(plots.map(plot => plot.id)).toStrictEqual([
      'summary.json:loss',
      'summary.json:accuracy',
      'summary.json:val_loss',
      'summary.json:val_accuracy'
    ])

    mockPostMessage.mockClear()

    dragAndDrop(plots[2], plots[0])

    const expectedOrder = [
      'summary.json:val_loss',
      'summary.json:loss',
      'summary.json:accuracy',
      'summary.json:val_accuracy'
    ]

    expect(mockPostMessage).toBeCalledTimes(1)
    expect(mockPostMessage).toBeCalledWith({
      payload: expectedOrder,
      type: MessageFromWebviewType.REORDER_PLOTS_METRICS
    })
    expect(
      screen.getAllByTestId(/summary\.json/).map(plot => plot.id)
    ).toStrictEqual(expectedOrder)
  })

  it('should remove the checkpoint plot from the order if it is removed from the plots', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    let plots = screen.getAllByTestId(/summary\.json/)
    dragAndDrop(plots[1], plots[0])

    sendSetDataMessage({
      checkpoint: {
        ...checkpointPlotsFixture,
        plots: checkpointPlotsFixture.plots.slice(1)
      }
    })
    plots = screen.getAllByTestId(/summary\.json/)
    expect(plots.map(plot => plot.id)).toStrictEqual([
      'summary.json:accuracy',
      'summary.json:val_loss',
      'summary.json:val_accuracy'
    ])
  })

  it('should not change the metric order in the hover menu by reordering the plots', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const [pickerButton] = within(
      screen.getAllByTestId('plots-container')[
        sectionPosition[Section.CHECKPOINT_PLOTS]
      ]
    ).queryAllByTestId('icon-menu-item')

    fireEvent.mouseEnter(pickerButton)
    fireEvent.click(pickerButton)

    let options = screen.getAllByTestId('select-menu-option-label')
    const optionsOrder = [
      'summary.json:accuracy',
      'summary.json:loss',
      'summary.json:val_accuracy',
      'summary.json:val_loss'
    ]
    expect(options.map(({ textContent }) => textContent)).toStrictEqual(
      optionsOrder
    )

    fireEvent.click(pickerButton)

    let plots = screen.getAllByTestId(/summary\.json/)
    const newPlotOrder = [
      'summary.json:val_accuracy',
      'summary.json:loss',
      'summary.json:accuracy',
      'summary.json:val_loss'
    ]
    expect(plots.map(plot => plot.id)).not.toStrictEqual(newPlotOrder)

    dragAndDrop(plots[3], plots[0])
    sendSetDataMessage({
      checkpoint: {
        ...checkpointPlotsFixture,
        plots: reorderObjectList(
          newPlotOrder,
          checkpointPlotsFixture.plots,
          'title'
        )
      }
    })

    plots = screen.getAllByTestId(/summary\.json/)

    expect(plots.map(plot => plot.id)).toStrictEqual(newPlotOrder)

    fireEvent.mouseEnter(pickerButton)
    fireEvent.click(pickerButton)

    options = screen.getAllByTestId('select-menu-option-label')
    expect(options.map(({ textContent }) => textContent)).toStrictEqual(
      optionsOrder
    )
  })

  it('should not be possible to drag a plot from a section to another', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture,
      template: templatePlotsFixture
    })

    const checkpointPlots = screen.getAllByTestId(/summary\.json/)
    const templatePlots = screen.getAllByTestId(/^plot_/)

    dragAndDrop(templatePlots[0], checkpointPlots[2])

    expect(checkpointPlots.map(plot => plot.id)).toStrictEqual([
      'summary.json:loss',
      'summary.json:accuracy',
      'summary.json:val_loss',
      'summary.json:val_accuracy'
    ])
  })

  it('should reorder template plots and send a message to the extension on drop', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    let plots = screen.getAllByTestId(/^plot_/)

    expect(plots.map(plot => plot.id)).toStrictEqual([
      join('logs', 'loss.tsv'),
      join('other', 'plot.tsv'),
      join('other', 'multiview.tsv')
    ])

    mockPostMessage.mockClear()
    dragAndDrop(plots[1], plots[0])

    plots = screen.getAllByTestId(/^plot_/)

    expect(plots.map(plot => plot.id)).toStrictEqual([
      join('other', 'plot.tsv'),
      join('logs', 'loss.tsv'),
      join('other', 'multiview.tsv')
    ])
    expect(mockPostMessage).toBeCalledTimes(1)
    expect(mockPostMessage).toBeCalledWith({
      payload: [
        {
          group: TemplatePlotGroup.SINGLE_VIEW,
          paths: [join('other', 'plot.tsv'), join('logs', 'loss.tsv')]
        },
        {
          group: TemplatePlotGroup.MULTI_VIEW,
          paths: [join('other', 'multiview.tsv')]
        }
      ],
      type: MessageFromWebviewType.REORDER_PLOTS_TEMPLATES
    })
  })

  it('should render two template plot sections', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const sections = screen.getAllByTestId(/^plots-section_/)

    expect(sections.map(section => section.id)).toStrictEqual([
      'template-single_0',
      'template-multi_1'
    ])
  })

  it('should create a new section above the others if the template plot type is different than the first section', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const topSection = screen.getByTestId(NewSectionBlock.TOP)
    const multiViewPlot = screen.getByTestId(
      join('plot_other', 'multiview.tsv')
    )

    dragAndDrop(multiViewPlot, topSection)

    const sections = screen.getAllByTestId(/^plots-section_/)
    expect(sections.map(section => section.id)).toStrictEqual([
      'template-multi_0',
      'template-single_1'
    ])
  })

  it('should not create a new section above the others by dragging a template plot from the same type as the first section above it', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const topSection = screen.getByTestId(NewSectionBlock.TOP)
    const aSingleViewPlot = screen.getByTestId(join('plot_other', 'plot.tsv'))

    dragAndDrop(aSingleViewPlot, topSection)

    const sections = screen.getAllByTestId(/^plots-section_/)
    expect(sections.map(section => section.id)).toStrictEqual([
      'template-single_0',
      'template-multi_1'
    ])
  })

  it('should create a new section below the others if the template plot type is different than the last section', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const bottomSection = screen.getByTestId(NewSectionBlock.BOTTOM)
    const aSingleViewPlot = screen.getByTestId(join('plot_other', 'plot.tsv'))

    dragAndDrop(aSingleViewPlot, bottomSection)

    const sections = screen.getAllByTestId(/^plots-section_/)
    expect(sections.map(section => section.id)).toStrictEqual([
      'template-single_0',
      'template-multi_1',
      'template-single_2'
    ])
  })

  it('should not create a new section below the others by dragging a template plot from the same type as the last section below it', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const bottomSection = screen.getByTestId(NewSectionBlock.BOTTOM)
    const multiViewPlot = screen.getByTestId(
      join('plot_other', 'multiview.tsv')
    )

    dragAndDrop(multiViewPlot, bottomSection)

    const sections = screen.getAllByTestId(/^plots-section_/)
    expect(sections.map(section => section.id)).toStrictEqual([
      'template-single_0',
      'template-multi_1'
    ])
  })

  it('should move a template plot from one type in another section of the same type and show two drop targets', async () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const bottomSection = screen.getByTestId(NewSectionBlock.BOTTOM)
    const aSingleViewPlot = screen.getByTestId(join('plot_other', 'plot.tsv'))

    dragAndDrop(aSingleViewPlot, bottomSection)

    await screen.findByTestId('plots-section_template-single_2')
    const anotherSingleViewPlot = screen.getByTestId(
      join('plot_logs', 'loss.tsv')
    )
    const movedSingleViewPlot = screen.getByTestId(
      join('plot_other', 'plot.tsv')
    )

    dragEnter(
      anotherSingleViewPlot,
      movedSingleViewPlot.id,
      DragEnterDirection.LEFT
    )

    expect(screen.getAllByTestId('drop-target').length).toBe(2) // One in the old section and one in the new one

    dragAndDrop(anotherSingleViewPlot, movedSingleViewPlot)

    const sections = screen.getAllByTestId(/^plots-section_/)
    expect(sections.map(section => section.id)).toStrictEqual([
      'template-multi_0',
      'template-single_1'
    ])
  })

  it('should show a drop zone when hovering a new section', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const topSection = screen.getByTestId(NewSectionBlock.TOP)
    const multiViewPlot = screen.getByTestId(
      join('plot_other', 'multiview.tsv')
    )
    let topDropIcon = screen.queryByTestId(`${NewSectionBlock.TOP}_drop-icon`)

    expect(topDropIcon).not.toBeInTheDocument()

    act(() => {
      multiViewPlot.dispatchEvent(createBubbledEvent('dragstart'))
    })

    act(() => {
      topSection.dispatchEvent(createBubbledEvent('dragenter'))
    })

    topDropIcon = screen.queryByTestId(`${NewSectionBlock.TOP}_drop-icon`)

    expect(topDropIcon).toBeInTheDocument()
  })

  it('should not show a drop target when moving an element from a whole different section (comparison to template)', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      selectedRevisions: plotsRevisionsFixture,
      template: complexTemplatePlotsFixture
    })

    const headers = screen.getAllByRole('columnheader')
    const bottomSection = screen.getByTestId(NewSectionBlock.BOTTOM)

    dragEnter(headers[1], bottomSection.id, DragEnterDirection.LEFT)

    const bottomDropIcon = screen.queryByTestId(
      `${NewSectionBlock.BOTTOM}_drop-icon`
    )

    expect(bottomDropIcon).not.toBeInTheDocument()
  })

  it('should prevent default behaviour when dragging over a new section', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const topSection = screen.getByTestId(NewSectionBlock.TOP)

    const dragOverEvent = createBubbledEvent('dragover', {
      preventDefault: jest.fn()
    })

    topSection.dispatchEvent(dragOverEvent)

    expect(dragOverEvent.preventDefault).toHaveBeenCalled()
  })

  it('should show a drop target before a plot on drag enter from the left', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const plots = screen.getAllByTestId(/^plot_/)

    dragEnter(plots[1], plots[0].id, DragEnterDirection.LEFT)

    const plotsWithDropTarget = screen.getAllByTestId(/^plot_/)
    expect(plotsWithDropTarget.map(plot => plot.id)).toStrictEqual([
      'plot-drop-target',
      plots[0].id,
      plots[1].id,
      plots[2].id
    ])
  })

  it('should show a drop target after a plot on drag enter from the right', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const plots = screen.getAllByTestId(/^plot_/)
    dragEnter(plots[0], plots[1].id, DragEnterDirection.RIGHT)

    const plotsWithDropTarget = screen.getAllByTestId(/^plot_/)

    expect(plotsWithDropTarget.map(plot => plot.id)).toStrictEqual([
      plots[0].id,
      plots[1].id,
      'plot-drop-target',
      plots[2].id
    ])
  })

  it('should hide the plot being dragged from the list', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const plots = screen.getAllByTestId(/^plot_/)
    expect(plots[1].style.display).not.toBe('none')

    dragEnter(plots[1], plots[1].id, DragEnterDirection.LEFT)

    expect(plots[1].style.display).toBe('none')
  })

  it('should open a modal with the plot zoomed in when clicking a template plot', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()

    const plot = within(screen.getAllByTestId(/^plot_/)[0]).getByRole('button')

    fireEvent.click(plot)

    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })

  it('should open a modal with the plot zoomed in when clicking a checkpoint plot', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()

    const plot = within(screen.getAllByTestId(/^plot-/)[0]).getByRole('button')

    fireEvent.click(plot)

    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })

  it('should not open a modal with the plot zoomed in when clicking a comparison table plot', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      selectedRevisions: plotsRevisionsFixture
    })

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()

    const [plot] = screen.getAllByAltText(/^Plot of/)

    expect(within(plot).queryByRole('button')).not.toBeInTheDocument()

    fireEvent.click(plot)

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  it('should close the zoomed plot modal when clicking the backdrop or the close button', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const plot = within(screen.getAllByTestId(/^plot_/)[0]).getByRole('button')

    fireEvent.click(plot)
    fireEvent.click(screen.getByTestId('modal'))

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()

    fireEvent.click(plot)
    fireEvent.click(screen.getByTestId('modal-close'))

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  it('should not close the zoomed in plot modal when interacting with the plot inside (modal content)', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const plot = within(screen.getAllByTestId(/^plot_/)[0]).getByRole('button')

    fireEvent.click(plot)
    fireEvent.click(screen.getByTestId('modal-content'))

    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })

  it('should show a tooltip with the meaning of each plot section', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture,
      comparison: comparisonTableFixture,
      template: complexTemplatePlotsFixture
    })

    const [templateInfo, comparisonInfo, checkpointInfo] =
      screen.getAllByTestId('info-tooltip-toggle')

    const getSectionText = (sectionNode: ReactElement) =>
      // eslint-disable-next-line testing-library/no-node-access
      sectionNode.props.children || ''

    fireEvent.mouseEnter(templateInfo, { bubbles: true })
    expect(
      screen.getByText(
        getSectionText(SectionDescription[Section.TEMPLATE_PLOTS])
      )
    ).toBeInTheDocument()

    fireEvent.mouseEnter(comparisonInfo, { bubbles: true })
    expect(
      screen.getByText(
        getSectionText(SectionDescription[Section.COMPARISON_TABLE])
      )
    ).toBeInTheDocument()

    fireEvent.mouseEnter(checkpointInfo, { bubbles: true })
    expect(
      screen.getByText(
        getSectionText(SectionDescription[Section.CHECKPOINT_PLOTS])
      )
    ).toBeInTheDocument()
  })

  describe('Virtualization', () => {
    const changeSize = async (
      size: string,
      buttonPosition: number,
      wrapper: HTMLElement
    ) => {
      const sizePickerButton =
        within(wrapper).getAllByTestId('icon-menu-item')[buttonPosition]
      fireEvent.mouseEnter(sizePickerButton)
      fireEvent.click(sizePickerButton)

      const sizeButton = await within(wrapper).findByText(size)

      fireEvent.click(sizeButton)
      await screen.findAllByTestId('plots-wrapper')
      fireEvent.click(sizePickerButton)
      await screen.findAllByTestId('plots-wrapper')
    }

    const renderAppAndChangeSize = async (
      data: PlotsData,
      size: string,
      section: Section
    ) => {
      renderAppWithOptionalData({
        ...data,
        sectionCollapsed: DEFAULT_SECTION_COLLAPSED
      })

      const sectionButtonPosition = {
        [Section.CHECKPOINT_PLOTS]: 1,
        [Section.TEMPLATE_PLOTS]: 0,
        [Section.COMPARISON_TABLE]: 0
      }
      const wrappers = await screen.findAllByTestId('plots-container')
      const wrapper = wrappers[sectionPosition[section]]

      await changeSize(size, sectionButtonPosition[section], wrapper)
    }

    const createCheckpointPlots = (nbOfPlots: number) => {
      const plots = []
      for (let i = 0; i < nbOfPlots; i++) {
        plots.push({
          title: `plot-${i}`,
          values: []
        })
      }
      return {
        ...checkpointPlotsFixture,
        plots,
        selectedMetrics: plots.map(plot => plot.title)
      }
    }

    const resizeScreen = (width: number) => {
      act(() => {
        global.innerWidth = width
        global.dispatchEvent(new Event('resize'))
      })
    }

    describe('Large plots', () => {
      it('should  wrap the checkpoint plots in a big grid (virtualize them) when there are more than ten large plots', async () => {
        await renderAppAndChangeSize(
          { checkpoint: createCheckpointPlots(11) },
          'Large',
          Section.CHECKPOINT_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()

        sendSetDataMessage({
          checkpoint: createCheckpointPlots(50)
        })

        await screen.findAllByTestId('plots-wrapper')

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the checkpoint plots in a big grid (virtualize them) when there are ten or fewer large plots', async () => {
        await renderAppAndChangeSize(
          { checkpoint: createCheckpointPlots(10) },
          'Large',
          Section.CHECKPOINT_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()

        sendSetDataMessage({
          checkpoint: createCheckpointPlots(1)
        })

        await screen.findAllByTestId('plots-wrapper')

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      it('should  wrap the template plots in a big grid (virtualize them) when there are more than ten large plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(11) },
          'Large',
          Section.TEMPLATE_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()

        sendSetDataMessage({
          template: manyTemplatePlots(50)
        })

        await screen.findAllByTestId('plots-wrapper')

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the template plots in a big grid (virtualize them) when there are ten or fewer large plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(10) },
          'Large',
          Section.TEMPLATE_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()

        sendSetDataMessage({
          template: manyTemplatePlots(1)
        })

        await screen.findAllByTestId('plots-wrapper')

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      describe('Sizing', () => {
        const checkpoint = createCheckpointPlots(25)

        beforeEach(async () => {
          await renderAppAndChangeSize(
            { checkpoint },
            'Large',
            Section.CHECKPOINT_PLOTS
          )
        })

        it('should render one large plot per row per 1000px of screen when the screen is larger than 2000px', () => {
          resizeScreen(3000)

          let plots = screen.getAllByTestId(/^plot-/)

          expect(plots[24].id).toBe(checkpoint.plots[24].title)
          expect(plots.length).toBe(checkpoint.plots.length)

          resizeScreen(5453)

          plots = screen.getAllByTestId(/^plot-/)

          expect(plots[20].id).toBe(checkpoint.plots[20].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render three large plot per row when the screen is larger than 1600px (but less than 2000px)', () => {
          resizeScreen(1849)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[24].id).toBe(checkpoint.plots[24].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render two large plot per row when the screen is larger than 800px (but less than 1600px)', () => {
          resizeScreen(936)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[24].id).toBe(checkpoint.plots[24].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render one large plot per row when the screen is smaller than 800px', () => {
          resizeScreen(563)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[4].id).toBe(checkpoint.plots[4].title)
        })
      })
    })

    describe('Regular plots', () => {
      it('should  wrap the checkpoint plots in a big grid (virtualize them) when there are more than fifteen regular plots', async () => {
        await renderAppAndChangeSize(
          { checkpoint: createCheckpointPlots(16) },
          'Regular',
          Section.CHECKPOINT_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the checkpoint plots in a big grid (virtualize them) when there are eight or fifteen regular plots', async () => {
        await renderAppAndChangeSize(
          { checkpoint: createCheckpointPlots(15) },
          'Regular',
          Section.CHECKPOINT_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      it('should  wrap the template plots in a big grid (virtualize them) when there are more than fifteen regular plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(16) },
          'Regular',
          Section.TEMPLATE_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the template plots in a big grid (virtualize them) when there are fifteen or fewer regular plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(15) },
          'Regular',
          Section.TEMPLATE_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      describe('Sizing', () => {
        const checkpoint = createCheckpointPlots(25)

        beforeEach(async () => {
          await renderAppAndChangeSize(
            { checkpoint },
            'Regular',
            Section.CHECKPOINT_PLOTS
          )
        })

        it('should render one regular plot per row per 800px of screen when the screen is larger than 2000px', () => {
          resizeScreen(3200)

          let plots = screen.getAllByTestId(/^plot-/)

          expect(plots[20].id).toBe(checkpoint.plots[20].title)
          expect(plots.length).toBe(checkpoint.plots.length)

          resizeScreen(6453)

          plots = screen.getAllByTestId(/^plot-/)

          expect(plots[19].id).toBe(checkpoint.plots[19].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render four regular plot per row when the screen is larger than 1600px (but less than 2000px)', () => {
          resizeScreen(1889)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[7].id).toBe(checkpoint.plots[7].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render three regular plot per row when the screen is larger than 800px (but less than 1600px)', () => {
          resizeScreen(938)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[7].id).toBe(checkpoint.plots[7].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render one regular plot per row when the screen is smaller than 800px', () => {
          resizeScreen(562)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[4].id).toBe(checkpoint.plots[4].title)
        })
      })
    })

    describe('Small plots', () => {
      it('should  wrap the checkpoint plots in a big grid (virtualize them) when there are more than twenty small plots', async () => {
        await renderAppAndChangeSize(
          { checkpoint: createCheckpointPlots(21) },
          'Small',
          Section.CHECKPOINT_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the checkpoint plots in a big grid (virtualize them) when there are twenty or fewer small plots', async () => {
        await renderAppAndChangeSize(
          { checkpoint: createCheckpointPlots(20) },
          'Small',
          Section.CHECKPOINT_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      it('should  wrap the template plots in a big grid (virtualize them) when there are more than twenty small plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(21) },
          'Small',
          Section.TEMPLATE_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the template plots in a big grid (virtualize them) when there are twenty or fewer small plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(20) },
          'Small',
          Section.TEMPLATE_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      describe('Sizing', () => {
        const checkpoint = createCheckpointPlots(25)

        beforeEach(async () => {
          await renderAppAndChangeSize(
            { checkpoint },
            'Small',
            Section.CHECKPOINT_PLOTS
          )
        })

        it('should render one small plot per row per 500px of screen when the screen is larger than 2000px', () => {
          resizeScreen(3004)

          let plots = screen.getAllByTestId(/^plot-/)

          expect(plots[7].id).toBe(checkpoint.plots[7].title)
          expect(plots.length).toBe(checkpoint.plots.length)

          resizeScreen(5473)

          plots = screen.getAllByTestId(/^plot-/)

          expect(plots[9].id).toBe(checkpoint.plots[9].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render six small plot per row when the screen is larger than 1600px (but less than 2000px)', () => {
          resizeScreen(1839)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[24].id).toBe(checkpoint.plots[24].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render four small plot per row when the screen is larger than 800px (but less than 1600px)', () => {
          resizeScreen(956)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[9].id).toBe(checkpoint.plots[9].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render one small plot per row when the screen is smaller than 800px but larger than 600px', () => {
          resizeScreen(663)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[9].id).toBe(checkpoint.plots[9].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render two small plot per row when the screen is smaller than 600px', () => {
          resizeScreen(569)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[4].id).toBe(checkpoint.plots[4].title)
        })
      })
    })
  })

  describe('Context Menu Suppression', () => {
    it('Suppresses the context menu with no plots data', () => {
      renderAppWithOptionalData()
      const target = screen.getByText('Loading Plots...')
      const contextMenuEvent = createEvent.contextMenu(target)
      fireEvent(target, contextMenuEvent)
      expect(contextMenuEvent.defaultPrevented).toBe(true)
    })

    it('Suppresses the context menu with plots data', () => {
      renderAppWithOptionalData({
        checkpoint: checkpointPlotsFixture,
        sectionCollapsed: DEFAULT_SECTION_COLLAPSED
      })
      const target = screen.getByText('Trends')
      const contextMenuEvent = createEvent.contextMenu(target)
      fireEvent(target, contextMenuEvent)
      expect(contextMenuEvent.defaultPrevented).toBe(true)
    })
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('Ribbon', () => {
    const getDisplayedRevisionOrder = () => {
      const ribbon = screen.getByTestId('ribbon')
      const revisionBlocks = within(ribbon).getAllByRole('listitem')
      return revisionBlocks
        .map(item => item.textContent)
        .filter(text => !text?.includes(' of ') && text !== 'Refresh All')
    }

    it('should show the revisions at the top', () => {
      renderAppWithOptionalData({
        comparison: comparisonTableFixture,

        selectedRevisions: plotsRevisionsFixture
      })

      expect(getDisplayedRevisionOrder()).toStrictEqual(
        plotsRevisionsFixture.map(rev =>
          rev.group ? rev.group.slice(1, -1) + rev.revision : rev.revision
        )
      )
    })

    it('should send a message with the revision to be removed when clicking the clear button', () => {
      renderAppWithOptionalData({
        comparison: comparisonTableFixture,

        selectedRevisions: plotsRevisionsFixture
      })

      const mainClearButton = within(
        screen.getByTestId('ribbon-main')
      ).getAllByRole('button')[1]

      fireEvent.click(mainClearButton)

      expect(mockPostMessage).toBeCalledWith({
        payload: 'main',
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })
    })

    it('should display the number of experiments selected', () => {
      renderAppWithOptionalData({
        comparison: comparisonTableFixture,

        selectedRevisions: plotsRevisionsFixture
      })

      expect(
        screen.getByText(`${plotsRevisionsFixture.length} of 7`)
      ).toBeInTheDocument()
    })

    it('should send a message to select the revisions when clicking the filter button', () => {
      renderAppWithOptionalData({
        comparison: comparisonTableFixture,
        sectionCollapsed: DEFAULT_SECTION_COLLAPSED
      })

      const filterButton = within(screen.getByTestId('ribbon')).getAllByRole(
        'button'
      )[0]

      fireEvent.click(filterButton)

      expect(mockPostMessage).toBeCalledWith({
        type: MessageFromWebviewType.SELECT_EXPERIMENTS
      })
    })

    it('should send a message to refresh each revision when clicking the refresh all button', () => {
      renderAppWithOptionalData({
        comparison: comparisonTableFixture,

        selectedRevisions: plotsRevisionsFixture
      })

      const refreshAllButton = within(
        screen.getByTestId('ribbon')
      ).getAllByRole('button')[1]

      mockPostMessage.mockReset()
      fireEvent.click(refreshAllButton)

      expect(mockPostMessage).toHaveBeenCalledTimes(1)
      expect(mockPostMessage).toBeCalledWith({
        payload: ['workspace', 'main', '4fb124a', '42b8736', '1ba7bcd'],
        type: MessageFromWebviewType.REFRESH_REVISIONS
      })
    })

    it('should not reorder the ribbon when comparison plots are reordered', () => {
      renderAppWithOptionalData({
        comparison: comparisonTableFixture,
        selectedRevisions: plotsRevisionsFixture
      })

      const expectedRevisions = plotsRevisionsFixture.map(rev =>
        rev.group ? rev.group.slice(1, -1) + rev.revision : rev.revision
      )

      expect(getDisplayedRevisionOrder()).toStrictEqual(expectedRevisions)

      sendSetDataMessage({
        comparison: comparisonTableFixture,
        selectedRevisions: [
          {
            displayColor: '#f56565',
            group: undefined,
            id: 'new-revision',
            revision: 'new-revision'
          },
          ...[...plotsRevisionsFixture].reverse()
        ]
      })

      expect(getDisplayedRevisionOrder()).toStrictEqual([
        ...expectedRevisions,
        'new-revision'
      ])
    })
  })
})
