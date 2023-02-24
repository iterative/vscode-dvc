import { join } from 'dvc/src/test/util/path'
import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'
import {
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import checkpointPlotsFixture from 'dvc/src/test/fixtures/expShow/base/checkpointPlots'
import plotsRevisionsFixture from 'dvc/src/test/fixtures/plotsDiff/revisions'
import templatePlotsFixture from 'dvc/src/test/fixtures/plotsDiff/template/webview'
import smoothTemplatePlotContent from 'dvc/src/test/fixtures/plotsDiff/template/smoothTemplatePlot'
import manyTemplatePlots from 'dvc/src/test/fixtures/plotsDiff/template/virtualization'
import {
  CheckpointPlotsData,
  DEFAULT_SECTION_COLLAPSED,
  PlotsData,
  PlotSizeNumber,
  PlotsType,
  Revision,
  Section,
  TemplatePlotGroup,
  TemplatePlotsData
} from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { reorderObjectList } from 'dvc/src/util/array'
import { act } from 'react-dom/test-utils'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import { VisualizationSpec } from 'react-vega'
import { App } from './App'
import { NewSectionBlock } from './templatePlots/TemplatePlots'
import { SectionDescription } from './PlotsContainer'
import {
  CheckpointPlotsById,
  plotDataStore,
  TemplatePlotsById
} from './plotDataStore'
import { setSnapPoints } from './webviewSlice'
import { plotsReducers, plotsStore } from '../store'
import { vsCodeApi } from '../../shared/api'
import {
  createBubbledEvent,
  dragAndDrop,
  dragEnter,
  dragLeave
} from '../../test/dragDrop'
import { DragEnterDirection } from '../../shared/components/dragDrop/util'
import { clearSelection, createWindowTextSelection } from '../../test/selection'
import * as EventCurrentTargetDistances from '../../shared/components/dragDrop/currentTarget'
import { OVERSCAN_ROW_COUNT } from '../../shared/components/virtualizedGrid/VirtualizedGrid'
import { pickAndMove } from '../../test/mouseEventsWithCoordinates'
import {
  stopTrackingAllComponentsRenders,
  stopTrackingComponentRenders,
  trackComponentRenders
} from '../../util/wdyr'
import { ZoomablePlot } from './ZoomablePlot'

jest.mock('../../shared/components/dragDrop/currentTarget', () => {
  const actualModule = jest.requireActual(
    '../../shared/components/dragDrop/currentTarget'
  )
  return {
    __esModule: true,
    ...actualModule
  }
})

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

    return store
  }

  const setWrapperSize = (store: typeof plotsStore) =>
    act(() => {
      store.dispatch(setSnapPoints(1000))
    })

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

  const complexData = {
    template: complexTemplatePlotsFixture,
    checkpoint: checkpointPlotsFixture,
    comparison: comparisonTableFixture
  }

  const renderAppWithComplexData = () => {
    return renderAppWithOptionalData(complexData)
  }

  const getCheckpointMenuItem = (position: number) =>
    within(
      screen.getAllByTestId('plots-container')[
        sectionPosition[Section.CHECKPOINT_PLOTS]
      ]
    ).getAllByTestId('icon-menu-item')[position]

  const renderAppAndChangeSize = async (
    data: PlotsData,
    size: number,
    section: Section
  ) => {
    const withSize = {
      size
    }
    const plotsData = {
      ...data,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    }
    if (section === Section.CHECKPOINT_PLOTS) {
      plotsData.checkpoint = {
        ...data?.checkpoint,
        ...withSize
      } as CheckpointPlotsData
    }
    if (section === Section.TEMPLATE_PLOTS) {
      plotsData.template = {
        ...data?.template,
        ...withSize
      } as TemplatePlotsData
    }

    const store = renderAppWithOptionalData(plotsData)
    await screen.findAllByTestId('plots-wrapper')

    return store
  }

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
    plotDataStore[Section.CHECKPOINT_PLOTS] = {} as CheckpointPlotsById
    plotDataStore[Section.TEMPLATE_PLOTS] = {} as TemplatePlotsById
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
    const emptyState = await screen.findByText('No Plots Detected.')

    expect(emptyState).toBeInTheDocument()
  })

  it('should render loading section states when given a single revision which has not been fetched', async () => {
    renderAppWithOptionalData({
      checkpoint: null,
      comparison: {
        plots: [
          {
            path: 'training/plots/images/misclassified.jpg',
            revisions: { ad2b5ec: { revision: 'ad2b5ec' } }
          }
        ],
        revisions: [
          {
            displayColor: '#945dd6',
            fetched: false,
            firstThreeColumns: [],
            group: '[exp-a270a]',
            id: 'ad2b5ec854a447d00d9dfa9cdf88211a39a17813',
            revision: 'ad2b5ec'
          }
        ],
        size: PlotSizeNumber.REGULAR
      },
      hasPlots: true,
      hasUnselectedPlots: false,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
      selectedRevisions: [
        {
          displayColor: '#945dd6',
          fetched: false,
          firstThreeColumns: [],
          group: '[exp-a270a]',
          id: 'ad2b5ec854a447d00d9dfa9cdf88211a39a17813',
          revision: 'ad2b5ec'
        }
      ],
      template: null
    })
    const loading = await screen.findAllByText('Loading...')

    expect(loading).toHaveLength(3)
  })

  it('should render the Add Plots and Add Experiments get started button when there are experiments which have plots that are all unselected', async () => {
    renderAppWithOptionalData({
      checkpoint: null,
      hasPlots: true,
      hasUnselectedPlots: true,
      selectedRevisions: [{} as Revision]
    })
    const addExperimentsButton = await screen.findByText('Add Experiments')
    const addPlotsButton = await screen.findByText('Add Plots')

    expect(addExperimentsButton).toBeInTheDocument()
    expect(addPlotsButton).toBeInTheDocument()

    mockPostMessage.mockReset()

    fireEvent.click(addExperimentsButton)

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.SELECT_EXPERIMENTS
    })

    mockPostMessage.mockReset()

    fireEvent.click(addPlotsButton)

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.SELECT_PLOTS
    })
    mockPostMessage.mockReset()
  })

  it('should render only the Add Experiments get started button when no experiments are selected', async () => {
    renderAppWithOptionalData({
      checkpoint: null,
      hasPlots: true,
      hasUnselectedPlots: false,
      selectedRevisions: undefined
    })
    const addExperimentsButton = await screen.findByText('Add Experiments')
    const addPlotsButton = screen.queryByText('Add Plots')

    expect(addExperimentsButton).toBeInTheDocument()
    expect(addPlotsButton).not.toBeInTheDocument()

    mockPostMessage.mockReset()

    fireEvent.click(addExperimentsButton)
    expect(mockPostMessage).toHaveBeenCalledWith({
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

  it('should remove image plots given a message showing image plots as null', async () => {
    const emptyStateText = 'No Images to Compare'

    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture,
      comparison: comparisonTableFixture
    })

    expect(screen.queryByText(emptyStateText)).not.toBeInTheDocument()

    sendSetDataMessage({
      comparison: null
    })

    const emptyState = await screen.findByText(emptyStateText)

    expect(emptyState).toBeInTheDocument()
  })

  it('should remove checkpoint plots given a message showing checkpoint plots as null', async () => {
    const emptyStateText = 'No Plots to Display'

    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture,
      comparison: comparisonTableFixture,
      template: templatePlotsFixture
    })

    expect(screen.queryByText(emptyStateText)).not.toBeInTheDocument()

    sendSetDataMessage({
      checkpoint: null
    })

    const emptyState = await screen.findByText(emptyStateText)

    expect(emptyState).toBeInTheDocument()
  })

  it('should remove all sections from the document if there is no data provided', () => {
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
    for (const visiblePlot of visiblePlots) {
      expect(visiblePlot).toBeInTheDocument()
      expect(visiblePlot).toBeVisible()
    }

    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).toHaveBeenCalledWith({
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

  it('should not toggle the checkpoint plots section when its header is clicked and its title is selected', async () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const summaryElement = await screen.findByText('Trends')

    createWindowTextSelection('Trends', 2)
    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).not.toHaveBeenCalledWith({
      payload: { [Section.CHECKPOINT_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })

    clearSelection()
    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: { [Section.CHECKPOINT_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })
  })

  it('should not toggle the checkpoint plots section if the tooltip is clicked', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const checkpointsTooltipToggle = screen.getAllByTestId(
      'info-tooltip-toggle'
    )[2]
    fireEvent.mouseEnter(checkpointsTooltipToggle, {
      bubbles: true,
      cancelable: true
    })

    const tooltip = screen.getByTestId('tooltip-checkpoint-plots')
    const tooltipLink = within(tooltip).getByRole('link')
    fireEvent.click(tooltipLink, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).not.toHaveBeenCalledWith({
      payload: { [Section.CHECKPOINT_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })

    fireEvent.click(checkpointsTooltipToggle, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).not.toHaveBeenCalledWith({
      payload: { [Section.CHECKPOINT_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })
  })

  it('should not toggle the checkpoint plots section when its header is clicked and the content of its tooltip is selected', async () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const summaryElement = await screen.findByText('Trends')
    createWindowTextSelection(
      // eslint-disable-next-line testing-library/no-node-access
      SectionDescription['checkpoint-plots'].props.children,
      2
    )
    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).not.toHaveBeenCalledWith({
      payload: { [Section.CHECKPOINT_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })

    clearSelection()
    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: { [Section.CHECKPOINT_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })
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

    expect(mockPostMessage).toHaveBeenCalledWith({
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

    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: [
        'summary.json:accuracy',
        'summary.json:loss',
        'summary.json:val_accuracy',
        'summary.json:val_loss'
      ],
      type: MessageFromWebviewType.TOGGLE_METRIC
    })
  })

  it('should send a message to the extension with the selected size when changing the size of plots', () => {
    const store = renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const plotResizer = screen.getAllByTestId('vertical-plot-resizer')[0]

    setWrapperSize(store)
    pickAndMove(plotResizer, 10)
    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: {
        section: Section.CHECKPOINT_PLOTS,
        size: PlotSizeNumber.LARGE
      },
      type: MessageFromWebviewType.RESIZE_PLOTS
    })

    setWrapperSize(store)
    pickAndMove(plotResizer, -10)
    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: {
        section: Section.CHECKPOINT_PLOTS,
        size: PlotSizeNumber.REGULAR
      },
      type: MessageFromWebviewType.RESIZE_PLOTS
    })

    setWrapperSize(store)

    pickAndMove(plotResizer, -10)

    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: {
        section: Section.CHECKPOINT_PLOTS,
        size: PlotSizeNumber.SMALL
      },
      type: MessageFromWebviewType.RESIZE_PLOTS
    })

    setWrapperSize(store)
    pickAndMove(plotResizer, -10)
    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: {
        section: Section.CHECKPOINT_PLOTS,
        size: PlotSizeNumber.SMALLER
      },
      type: MessageFromWebviewType.RESIZE_PLOTS
    })
  })

  it('should not send a message to the extension with the selected size when changing the size of plots and pressing escape', () => {
    const store = renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const plotResizer = screen.getAllByTestId('vertical-plot-resizer')[0]

    setWrapperSize(store)
    pickAndMove(plotResizer, 10, 0, true)
    expect(mockPostMessage).not.toHaveBeenCalledWith({
      payload: {
        section: Section.CHECKPOINT_PLOTS,
        size: PlotSizeNumber.LARGE
      },
      type: MessageFromWebviewType.RESIZE_PLOTS
    })
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

    expect(mockPostMessage).toHaveBeenCalledTimes(1)
    expect(mockPostMessage).toHaveBeenCalledWith({
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
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
    expect(mockPostMessage).toHaveBeenCalledWith({
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

  it('should show a drop target at the end of the section when moving a plot from one section to another but not over any other plot', async () => {
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

    dragEnter(
      anotherSingleViewPlot,
      'template-single_0',
      DragEnterDirection.LEFT
    )

    expect(screen.getByTestId('plot_drop-target')).toBeInTheDocument()
  })

  it('should show a drop target at the end of the template plots section when moving a plot inside of one section but not over any other plot', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const aSingleViewPlot = screen.getByTestId(join('plot_other', 'plot.tsv'))

    dragEnter(aSingleViewPlot, 'template-single_0', DragEnterDirection.LEFT)

    expect(screen.getByTestId('plot_drop-target')).toBeInTheDocument()
  })

  it('should drop a plot at the end of the template plots section when moving a plot inside of one section but not over any other plot', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const aSingleViewPlot = screen.getByTestId(join('plot_other', 'plot.tsv'))
    const topSection = screen.getByTestId('plots-section_template-single_0')

    dragAndDrop(aSingleViewPlot, topSection)
    const plots = within(topSection).getAllByTestId(/^plot_/)

    expect(plots.map(plot => plot.id)).toStrictEqual([
      join('logs', 'loss.tsv'),
      join('other', 'plot.tsv')
    ])
  })

  it('should show a drop target at the end of the checkpoint plots when moving a plot inside the section but not over any other plot', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const plots = screen.getAllByTestId(/summary\.json/)

    dragEnter(plots[0], 'checkpoint-plots', DragEnterDirection.LEFT)

    expect(screen.getByTestId('plot_drop-target')).toBeInTheDocument()
  })

  it('should show a drop a plot at the end of the checkpoint plots when moving a plot inside the section but not over any other plot', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture
    })

    const plots = screen.getAllByTestId(/summary\.json/)

    dragAndDrop(plots[0], screen.getByTestId('checkpoint-plots'))

    const expectedOrder = [
      'summary.json:accuracy',
      'summary.json:val_loss',
      'summary.json:val_accuracy',
      'summary.json:loss'
    ]

    expect(
      screen.getAllByTestId(/summary\.json/).map(plot => plot.id)
    ).toStrictEqual(expectedOrder)
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

    dragEnter(multiViewPlot, topSection.id, DragEnterDirection.LEFT)

    topDropIcon = screen.queryByTestId(`${NewSectionBlock.TOP}_drop-icon`)

    expect(topDropIcon).toBeInTheDocument()
  })

  it('should remove the drop zone when hovering out a new section', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const topSection = screen.getByTestId(NewSectionBlock.TOP)
    const multiViewPlot = screen.getByTestId(
      join('plot_other', 'multiview.tsv')
    )

    dragEnter(multiViewPlot, topSection.id, DragEnterDirection.LEFT)

    let topDropIcon = screen.queryByTestId(`${NewSectionBlock.TOP}_drop-icon`)

    expect(topDropIcon).toBeInTheDocument()

    dragLeave(topSection)

    topDropIcon = screen.queryByTestId(`${NewSectionBlock.TOP}_drop-icon`)

    expect(topDropIcon).not.toBeInTheDocument()
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

    act(() => {
      const dragOverEvent = createBubbledEvent('dragover', {
        preventDefault: jest.fn()
      })

      topSection.dispatchEvent(dragOverEvent)
      expect(dragOverEvent.preventDefault).toHaveBeenCalled()
    })
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

    dragEnter(
      plots[0],
      plots[1].id,
      DragEnterDirection.RIGHT,
      EventCurrentTargetDistances
    )

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

  it('should remove the drop target after exiting a section after dragging in and out of it', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    const movingPlotId = join('plot_other', 'plot.tsv')

    const bottomSection = screen.getByTestId(NewSectionBlock.BOTTOM)
    const aSingleViewPlot = screen.getByTestId(movingPlotId)

    dragAndDrop(aSingleViewPlot, bottomSection)

    const movedPlot = screen.getByTestId(movingPlotId)
    const otherSingleSection = screen.getByTestId(join('plot_logs', 'loss.tsv'))

    dragEnter(movedPlot, otherSingleSection.id, DragEnterDirection.LEFT)

    const topSection = screen.getByTestId('plots-section_template-single_0')

    let topSectionPlots = within(topSection)
      .getAllByTestId(/^plot_/)
      .map(plot => plot.id)
    expect(topSectionPlots.includes('plot-drop-target')).toBe(true)

    const previousSection = screen.getByTestId(
      'plots-section_template-single_2'
    )
    act(() => {
      previousSection.dispatchEvent(createBubbledEvent('dragenter'))
    })

    topSectionPlots = within(topSection)
      .getAllByTestId(/^plot_/)
      .map(plot => plot.id)
    expect(topSectionPlots.includes('plot-drop-target')).toBe(false)
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

    fireEvent.mouseEnter(templateInfo, { bubbles: true })
    expect(screen.getByTestId('tooltip-template-plots')).toBeInTheDocument()

    fireEvent.mouseEnter(comparisonInfo, { bubbles: true })
    expect(screen.getByTestId('tooltip-comparison-plots')).toBeInTheDocument()

    fireEvent.mouseEnter(checkpointInfo, { bubbles: true })
    expect(screen.getByTestId('tooltip-checkpoint-plots')).toBeInTheDocument()
  })

  it('should dismiss a tooltip by pressing esc', () => {
    renderAppWithOptionalData({
      checkpoint: checkpointPlotsFixture,
      comparison: comparisonTableFixture,
      template: complexTemplatePlotsFixture
    })

    const [templateInfo] = screen.getAllByTestId('info-tooltip-toggle')

    fireEvent.mouseEnter(templateInfo, { bubbles: true })
    expect(screen.getByTestId('tooltip-template-plots')).toBeInTheDocument()

    fireEvent.keyDown(templateInfo, { bubbles: true, key: 'Space' })
    expect(screen.getByTestId('tooltip-template-plots')).toBeInTheDocument()

    fireEvent.keyDown(templateInfo, { bubbles: true, key: 'Escape' })
    expect(
      screen.queryByTestId('tooltip-template-plots')
    ).not.toBeInTheDocument()
  })

  describe('Virtualization', () => {
    const createCheckpointPlots = (nbOfPlots: number) => {
      const plots = []
      for (let i = 0; i < nbOfPlots; i++) {
        const id = `plot-${i}`
        plots.push({
          id,
          title: id,
          values: []
        })
      }
      return {
        ...checkpointPlotsFixture,
        plots,
        selectedMetrics: plots.map(plot => plot.id)
      }
    }

    const resizeScreen = (width: number, store: typeof plotsStore) => {
      act(() => {
        store.dispatch(setSnapPoints(width))
      })
      act(() => {
        global.innerWidth = width
        global.dispatchEvent(new Event('resize'))
      })
    }

    describe('Large plots', () => {
      it('should  wrap the checkpoint plots in a big grid (virtualize them) when there are more than ten large plots', async () => {
        await renderAppAndChangeSize(
          { checkpoint: createCheckpointPlots(11) },
          PlotSizeNumber.LARGE,
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
          PlotSizeNumber.LARGE,
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
          PlotSizeNumber.LARGE,
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
          PlotSizeNumber.LARGE,
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
        let store: typeof plotsStore

        beforeEach(async () => {
          store = await renderAppAndChangeSize(
            { checkpoint },
            PlotSizeNumber.LARGE,
            Section.CHECKPOINT_PLOTS
          )
        })

        it('should render the plots correctly when the screen is larger than 2000px', () => {
          resizeScreen(3000, store)

          let plots = screen.getAllByTestId(/^plot-/)

          expect(plots[4].id).toBe(checkpoint.plots[4].title)
          expect(plots.length).toBe(OVERSCAN_ROW_COUNT + 1)

          resizeScreen(5453, store)

          plots = screen.getAllByTestId(/^plot-/)

          expect(plots[3].id).toBe(checkpoint.plots[3].title)
          expect(plots.length).toBe(OVERSCAN_ROW_COUNT + 1)
        })

        it('should render the plots correctly when the screen is larger than 1600px (but less than 2000px)', () => {
          resizeScreen(1849, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[12].id).toBe(checkpoint.plots[12].title)
          expect(plots.length).toBe(OVERSCAN_ROW_COUNT + 1)
        })

        it('should render the plots correctly when the screen is larger than 800px (but less than 1600px)', () => {
          resizeScreen(936, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[14].id).toBe(checkpoint.plots[14].title)
          expect(plots.length).toBe(1 + OVERSCAN_ROW_COUNT) // Only the first and the next lines defined by the overscan row count will be rendered
        })

        it('should render the plots correctly when the screen is smaller than 800px', () => {
          resizeScreen(563, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[4].id).toBe(checkpoint.plots[4].title)
        })
      })
    })

    describe('Regular plots', () => {
      it('should  wrap the checkpoint plots in a big grid (virtualize them) when there are more than fifteen regular plots', async () => {
        await renderAppAndChangeSize(
          { checkpoint: createCheckpointPlots(16) },
          PlotSizeNumber.REGULAR,
          Section.CHECKPOINT_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the checkpoint plots in a big grid (virtualize them) when there are eight or fifteen regular plots', async () => {
        await renderAppAndChangeSize(
          { checkpoint: createCheckpointPlots(15) },
          PlotSizeNumber.REGULAR,
          Section.CHECKPOINT_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      it('should  wrap the template plots in a big grid (virtualize them) when there are more than fifteen regular plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(16) },
          PlotSizeNumber.REGULAR,
          Section.TEMPLATE_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the template plots in a big grid (virtualize them) when there are fifteen or fewer regular plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(15) },
          PlotSizeNumber.REGULAR,
          Section.TEMPLATE_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      describe('Sizing', () => {
        const checkpoint = createCheckpointPlots(25)
        let store: typeof plotsStore

        beforeEach(async () => {
          store = await renderAppAndChangeSize(
            { checkpoint },
            PlotSizeNumber.REGULAR,
            Section.CHECKPOINT_PLOTS
          )
        })

        it('should render the plots correctly when the screen is larger than 2000px', () => {
          resizeScreen(3200, store)

          let plots = screen.getAllByTestId(/^plot-/)

          expect(plots[20].id).toBe(checkpoint.plots[20].title)
          expect(plots.length).toBe(checkpoint.plots.length)

          resizeScreen(6453, store)

          plots = screen.getAllByTestId(/^plot-/)

          expect(plots[19].id).toBe(checkpoint.plots[19].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render the plots correctly when the screen is larger than 1600px (but less than 2000px)', () => {
          resizeScreen(1889, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[7].id).toBe(checkpoint.plots[7].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render the plots correctly when the screen is larger than 800px (but less than 1600px)', () => {
          resizeScreen(938, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[7].id).toBe(checkpoint.plots[7].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render the plots correctly when the screen is smaller than 800px', () => {
          resizeScreen(562, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[4].id).toBe(checkpoint.plots[4].title)
        })
      })
    })

    describe('Smaller plots', () => {
      it('should  wrap the checkpoint plots in a big grid (virtualize them) when there are more than twenty small plots', async () => {
        await renderAppAndChangeSize(
          { checkpoint: createCheckpointPlots(21) },
          PlotSizeNumber.SMALLER,
          Section.CHECKPOINT_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the checkpoint plots in a big grid (virtualize them) when there are twenty or fewer small plots', async () => {
        await renderAppAndChangeSize(
          { checkpoint: createCheckpointPlots(20) },
          PlotSizeNumber.SMALLER,
          Section.CHECKPOINT_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      it('should  wrap the template plots in a big grid (virtualize them) when there are more than twenty small plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(21) },
          PlotSizeNumber.SMALLER,
          Section.TEMPLATE_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the template plots in a big grid (virtualize them) when there are twenty or fewer small plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(20) },
          PlotSizeNumber.SMALLER,
          Section.TEMPLATE_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      describe('Sizing', () => {
        const checkpoint = createCheckpointPlots(25)
        let store: typeof plotsStore

        beforeEach(async () => {
          store = await renderAppAndChangeSize(
            { checkpoint },
            PlotSizeNumber.SMALLER,
            Section.CHECKPOINT_PLOTS
          )
        })

        it('should render the plots correctly when the screen is larger than 2000px', () => {
          resizeScreen(3004, store)

          let plots = screen.getAllByTestId(/^plot-/)

          expect(plots[7].id).toBe(checkpoint.plots[7].title)
          expect(plots.length).toBe(checkpoint.plots.length)

          resizeScreen(5473, store)

          plots = screen.getAllByTestId(/^plot-/)

          expect(plots[9].id).toBe(checkpoint.plots[9].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render the plots correctly when the screen is larger than 1600px (but less than 2000px)', () => {
          resizeScreen(1839, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[24].id).toBe(checkpoint.plots[24].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render the plots correctly when the screen is larger than 800px (but less than 1600px)', () => {
          resizeScreen(956, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[9].id).toBe(checkpoint.plots[9].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render the plots correctly when the screen is smaller than 800px but larger than 600px', () => {
          resizeScreen(663, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[9].id).toBe(checkpoint.plots[9].title)
          expect(plots.length).toBe(checkpoint.plots.length)
        })

        it('should render the plots correctly when the screen is smaller than 600px', () => {
          resizeScreen(569, store)

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

      expect(mockPostMessage).toHaveBeenCalledWith({
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

      expect(mockPostMessage).toHaveBeenCalledWith({
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
      expect(mockPostMessage).toHaveBeenCalledWith({
        payload: [
          EXPERIMENT_WORKSPACE_ID,
          'main',
          '4fb124a',
          '42b8736',
          '1ba7bcd'
        ],
        type: MessageFromWebviewType.REFRESH_REVISIONS
      })
    })
  })

  describe('Vega panels', () => {
    const smoothId = join('template', 'smooth.tsv')
    const withVegaPanels = {
      ...templatePlotsFixture,
      plots: [
        {
          entries: [
            {
              content: {
                ...smoothTemplatePlotContent
              } as unknown as VisualizationSpec,
              datapoints: {
                [EXPERIMENT_WORKSPACE_ID]:
                  smoothTemplatePlotContent.data.values.slice(0, 10)
              },
              id: smoothId,
              type: PlotsType.VEGA
            }
          ],
          group: TemplatePlotGroup.SINGLE_VIEW
        }
      ]
    }

    const waitForVega = (plot: HTMLElement): Promise<void> =>
      waitFor(
        () =>
          // eslint-disable-next-line testing-library/no-node-access
          expect(plot.querySelectorAll('.marks')[0]).toBeInTheDocument(),
        { timeout: 5000 }
      )

    const getPanel = async (smoothPlot: HTMLElement) => {
      await waitFor(() =>
        // eslint-disable-next-line testing-library/no-node-access
        expect(smoothPlot.querySelector('.vega-bindings')).toBeInTheDocument()
      )
      // eslint-disable-next-line testing-library/no-node-access
      return smoothPlot.querySelector('.vega-bindings')
    }

    it('should disable a template plot from drag and drop when hovering a vega panel', async () => {
      renderAppWithOptionalData({ template: withVegaPanels })

      const smoothPlot = screen.getByTestId(`plot_${smoothId}`)

      await waitForVega(smoothPlot)

      const panel = await getPanel(smoothPlot)

      expect(smoothPlot.draggable).toBe(true)

      panel && fireEvent.mouseEnter(panel)

      expect(smoothPlot.draggable).toBe(false)
    })

    it('should re-enable a template plot for drag and drop when the mouse leaves a vega panel', async () => {
      renderAppWithOptionalData({ template: withVegaPanels })

      const smoothPlot = screen.getByTestId(`plot_${smoothId}`)

      await waitForVega(smoothPlot)

      const panel = await getPanel(smoothPlot)

      panel && fireEvent.mouseEnter(panel)
      panel && fireEvent.mouseLeave(panel)
      expect(smoothPlot.draggable).toBe(true)
    })

    it('should disable zooming the template plot when clicking inside the vega panel', async () => {
      renderAppWithOptionalData({ template: withVegaPanels })

      const smoothPlot = screen.getByTestId(`plot_${smoothId}`)
      await waitForVega(smoothPlot)

      // eslint-disable-next-line testing-library/no-node-access
      const panel = smoothPlot.querySelector('.vega-bindings') || smoothPlot
      expect(panel).toBeInTheDocument()

      const clickEvent = createEvent.click(panel)
      clickEvent.stopPropagation = jest.fn()
      fireEvent(panel, clickEvent)
      expect(clickEvent.stopPropagation).toHaveBeenCalledTimes(1)
    })
  })

  describe('Re-rendering', () => {
    afterEach(() => {
      stopTrackingAllComponentsRenders()
    })

    it('should not cause any unecessary renders on first load of <ZoomablePlot />', () => {
      let renders = 0
      trackComponentRenders(ZoomablePlot, () => {
        renders++
      })

      renderAppWithComplexData()
      sendSetDataMessage(complexData)

      expect(renders).toBe(0)
    })

    xit('should have minimal unecessary renders for <ZoomablePLot /> when re-ordering the plots', () => {
      let renders = 0
      trackComponentRenders(ZoomablePlot, () => {
        renders++
      })
      renderAppWithComplexData()
      const plots = screen.getAllByTestId(/^plot_/)

      expect(plots.map(plot => plot.id)).toStrictEqual([
        join('logs', 'loss.tsv'),
        join('other', 'plot.tsv'),
        join('other', 'multiview.tsv')
      ])

      mockPostMessage.mockClear()
      dragAndDrop(plots[1], plots[0])

      expect(renders).toBe(-2323)
    })
  })
})
