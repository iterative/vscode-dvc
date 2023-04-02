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
import customPlotsFixture from 'dvc/src/test/fixtures/expShow/base/customPlots'
import plotsRevisionsFixture from 'dvc/src/test/fixtures/plotsDiff/revisions'
import templatePlotsFixture from 'dvc/src/test/fixtures/plotsDiff/template/webview'
import smoothTemplatePlotContent from 'dvc/src/test/fixtures/plotsDiff/template/smoothTemplatePlot'
import manyTemplatePlots from 'dvc/src/test/fixtures/plotsDiff/template/virtualization'
import {
  DEFAULT_SECTION_COLLAPSED,
  PlotsData,
  PlotsType,
  Revision,
  PlotsSection,
  TemplatePlotGroup,
  TemplatePlotsData,
  CustomPlotType,
  CustomPlotsData,
  DEFAULT_PLOT_HEIGHT,
  DEFAULT_NB_ITEMS_PER_ROW
} from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { act } from 'react-dom/test-utils'
import { EXPERIMENT_WORKSPACE_ID } from 'dvc/src/cli/dvc/contract'
import { VisualizationSpec } from 'react-vega'
import { App } from './App'
import { NewSectionBlock } from './templatePlots/TemplatePlots'
import {
  CustomPlotsById,
  plotDataStore,
  TemplatePlotsById
} from './plotDataStore'
import { setMaxNbPlotsPerRow } from './webviewSlice'
import { plotsReducers, plotsStore } from '../store'
import { vsCodeApi } from '../../shared/api'
import {
  createBubbledEvent,
  dragAndDrop,
  dragEnter,
  dragLeave
} from '../../test/dragDrop'
import { SectionDescription } from '../../shared/components/sectionContainer/SectionContainer'
import { DragEnterDirection } from '../../shared/components/dragDrop/util'
import { clearSelection, createWindowTextSelection } from '../../test/selection'
import * as EventCurrentTargetDistances from '../../shared/components/dragDrop/currentTarget'
import { OVERSCAN_ROW_COUNT } from '../../shared/components/virtualizedGrid/VirtualizedGrid'

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

jest.mock('./customPlots/util', () => ({
  createCheckpointSpec: () => ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    encoding: {},
    height: 100,
    layer: [],
    transform: [],
    width: 100
  }),
  createMetricVsParamSpec: () => ({
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

  const setWrapperSize = (store: typeof plotsStore, size = 2000) =>
    act(() => {
      store.dispatch(setMaxNbPlotsPerRow(size))
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

  const renderAppAndChangeSize = async (
    data: PlotsData,
    nbItemsPerRow: number,
    section: PlotsSection
  ) => {
    const withSize = {
      nbItemsPerRow
    }
    const plotsData = {
      ...data,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    }
    if (section === PlotsSection.CUSTOM_PLOTS) {
      plotsData.custom = {
        ...data?.custom,
        ...withSize
      } as CustomPlotsData
    }
    if (section === PlotsSection.TEMPLATE_PLOTS) {
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
    plotDataStore[PlotsSection.CUSTOM_PLOTS] = {} as CustomPlotsById
    plotDataStore[PlotsSection.TEMPLATE_PLOTS] = {} as TemplatePlotsById
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
    renderAppWithOptionalData({ custom: null })
    const emptyState = await screen.findByText('No Plots Detected.')

    expect(emptyState).toBeInTheDocument()
  })

  it('should render loading section states when given a single revision which has not been fetched', async () => {
    renderAppWithOptionalData({
      comparison: {
        height: DEFAULT_PLOT_HEIGHT,
        plots: [
          {
            path: 'training/plots/images/misclassified.jpg',
            revisions: {
              ad2b5ec: {
                error: undefined,
                loading: true,
                revision: 'ad2b5ec',
                url: undefined
              }
            }
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
        width: DEFAULT_NB_ITEMS_PER_ROW
      },
      custom: null,
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
      custom: null,
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

  it('should render an empty state given a message with only custom plots data', () => {
    renderAppWithOptionalData({
      custom: customPlotsFixture
    })

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    const addExperimentsButton = screen.queryByText('Add Experiments')

    expect(addExperimentsButton).toBeInTheDocument()
  })

  it('should render custom with "No Plots to Display" message when there is no custom plots data', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      template: templatePlotsFixture
    })

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Custom')).toBeInTheDocument()
    expect(screen.getByText('No Plots to Display')).toBeInTheDocument()
  })

  it('should render custom with "No Plots Added" message when there are no plots added', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: {
        ...customPlotsFixture,
        plots: []
      }
    })

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Custom')).toBeInTheDocument()
    expect(screen.getByText('No Plots to Display')).toBeInTheDocument()
    expect(screen.getByText('No Plots Added')).toBeInTheDocument()
  })

  it('should render the comparison table when given a message with comparison plots data', () => {
    const expectedSectionName = 'Images'

    renderAppWithOptionalData({
      custom: customPlotsFixture
    })

    sendSetDataMessage({
      comparison: comparisonTableFixture
    })

    expect(screen.getByText(expectedSectionName)).toBeInTheDocument()
  })

  it('should remove image plots given a message showing image plots as null', async () => {
    const emptyStateText = 'No Images to Compare'

    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      template: templatePlotsFixture
    })

    expect(screen.queryByText(emptyStateText)).not.toBeInTheDocument()

    sendSetDataMessage({
      comparison: null
    })

    const emptyState = await screen.findByText(emptyStateText)

    expect(emptyState).toBeInTheDocument()
  })

  it('should remove custom plots given a message showing custom plots as null', async () => {
    const emptyStateText = 'No Plots to Display'

    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture,
      template: templatePlotsFixture
    })

    expect(screen.queryByText(emptyStateText)).not.toBeInTheDocument()

    sendSetDataMessage({
      custom: null
    })

    const emptyState = await screen.findByText(emptyStateText)

    expect(emptyState).toBeInTheDocument()
  })

  it('should remove all sections from the document if there is no data provided', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture
    })

    expect(screen.getByText('Images')).toBeInTheDocument()

    sendSetDataMessage({
      comparison: null
    })

    expect(screen.queryByText('Images')).not.toBeInTheDocument()
  })

  it('should toggle the custom plots section in state when its header is clicked', async () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture
    })

    const summaryElement = await screen.findByText('Custom')
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
      payload: { [PlotsSection.CUSTOM_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })

    sendSetDataMessage({
      sectionCollapsed: {
        ...DEFAULT_SECTION_COLLAPSED,
        [PlotsSection.CUSTOM_PLOTS]: true
      }
    })

    expect(
      screen.queryByLabelText('Vega visualization')
    ).not.toBeInTheDocument()
  })

  it('should not toggle the custom plots section when its header is clicked and its title is selected', async () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture
    })

    const summaryElement = await screen.findByText('Custom')

    createWindowTextSelection('Custom', 2)
    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).not.toHaveBeenCalledWith({
      payload: { [PlotsSection.CUSTOM_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })

    clearSelection()
    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: { [PlotsSection.CUSTOM_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })
  })

  it('should not toggle the comparison plots section if the tooltip is clicked', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture
    })

    const comparisonTooltipToggle = screen.getAllByTestId(
      'info-tooltip-toggle'
    )[1]
    fireEvent.mouseEnter(comparisonTooltipToggle, {
      bubbles: true,
      cancelable: true
    })

    const tooltip = screen.getByTestId('tooltip-comparison-plots')
    const tooltipLink = within(tooltip).getByRole('link')
    fireEvent.click(tooltipLink, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).not.toHaveBeenCalledWith({
      payload: { [PlotsSection.CUSTOM_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })

    fireEvent.click(comparisonTooltipToggle, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).not.toHaveBeenCalledWith({
      payload: { [PlotsSection.CUSTOM_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })
  })

  it('should not toggle the custom plots section when its header is clicked and the content of its tooltip is selected', async () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture
    })

    const summaryElement = await screen.findByText('Custom')
    createWindowTextSelection(
      // eslint-disable-next-line testing-library/no-node-access
      SectionDescription['custom-plots'].props.children,
      2
    )
    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).not.toHaveBeenCalledWith({
      payload: { [PlotsSection.CUSTOM_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })

    clearSelection()
    fireEvent.click(summaryElement, {
      bubbles: true,
      cancelable: true
    })

    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: { [PlotsSection.CUSTOM_PLOTS]: true },
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
    })
  })

  it('should hide the custom plots add button if there are no more plots to create', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture
    })

    const customSection = screen.getAllByTestId('section-container')[2]

    expect(
      within(customSection).getByLabelText('Add Plots')
    ).toBeInTheDocument()

    sendSetDataMessage({
      custom: { ...customPlotsFixture, enablePlotCreation: false }
    })

    expect(
      within(customSection).queryByLabelText('Add Plots')
    ).not.toBeInTheDocument()
  })

  it('should display a slider to pick the number of items per row if there are items and the action is available', () => {
    const store = renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture
    })
    setWrapperSize(store)

    expect(screen.getAllByTestId('size-sliders')[1]).toBeInTheDocument()
  })

  it('should not display a slider to pick the number of items per row if there are no items', () => {
    const store = renderAppWithOptionalData({})
    setWrapperSize(store)

    expect(screen.queryByTestId('size-sliders')).not.toBeInTheDocument()
  })

  it('should not display a slider to pick the number of items per row if the only width available for one item per row or less', () => {
    const store = renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture
    })
    setWrapperSize(store, 400)

    expect(screen.queryByTestId('size-sliders')).not.toBeInTheDocument()
  })

  it('should display both size sliders for template plots', () => {
    const store = renderAppWithOptionalData({
      template: templatePlotsFixture
    })
    setWrapperSize(store)

    const plotResizers = within(
      screen.getByTestId('size-sliders')
    ).getAllByRole('slider')

    expect(plotResizers.length).toBe(2)
  })

  it('should display both size sliders for custom plots', () => {
    const store = renderAppWithOptionalData({
      custom: customPlotsFixture,
      template: templatePlotsFixture
    })
    setWrapperSize(store)

    const plotResizers = within(
      screen.getAllByTestId('size-sliders')[1]
    ).getAllByRole('slider')

    expect(plotResizers.length).toBe(2)
  })

  it('should not display the height slider for the comparison table', () => {
    const store = renderAppWithOptionalData({
      comparison: comparisonTableFixture
    })
    setWrapperSize(store)

    const plotResizers = within(
      screen.getByTestId('size-sliders')
    ).getAllByRole('slider')

    expect(plotResizers.length).toBe(1)
  })

  it('should send a message to the extension with the selected size when changing the width of plots', () => {
    const store = renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture
    })
    setWrapperSize(store)

    const plotResizer = within(
      screen.getAllByTestId('size-sliders')[1]
    ).getAllByRole('slider')[0]

    fireEvent.change(plotResizer, { target: { value: -3 } })
    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: {
        height: 1,
        nbItemsPerRow: 3,
        section: PlotsSection.CUSTOM_PLOTS
      },
      type: MessageFromWebviewType.RESIZE_PLOTS
    })
  })

  it('should send a message to the extension with the selected size when changing the height of plots', () => {
    const store = renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture
    })
    setWrapperSize(store)

    const plotResizer = within(
      screen.getAllByTestId('size-sliders')[1]
    ).getAllByRole('slider')[1]

    fireEvent.change(plotResizer, { target: { value: 3 } })
    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: {
        height: 3,
        nbItemsPerRow: 2,
        section: PlotsSection.CUSTOM_PLOTS
      },
      type: MessageFromWebviewType.RESIZE_PLOTS
    })
  })

  it('should display the custom plots in the order stored', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture
    })

    let plots = screen.getAllByTestId(/summary\.json/)

    expect(plots.map(plot => plot.id)).toStrictEqual([
      'custom-summary.json:loss-params.yaml:dropout',
      'custom-summary.json:accuracy-params.yaml:epochs',
      'custom-summary.json:loss-epoch',
      'custom-summary.json:accuracy-epoch'
    ])

    dragAndDrop(plots[1], plots[0])

    plots = screen.getAllByTestId(/summary\.json/)

    expect(plots.map(plot => plot.id)).toStrictEqual([
      'custom-summary.json:accuracy-params.yaml:epochs',
      'custom-summary.json:loss-params.yaml:dropout',
      'custom-summary.json:loss-epoch',
      'custom-summary.json:accuracy-epoch'
    ])
  })

  it('should send a message to the extension when the custom plots are reordered', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture
    })

    const plots = screen.getAllByTestId(/summary\.json/)
    expect(plots.map(plot => plot.id)).toStrictEqual([
      'custom-summary.json:loss-params.yaml:dropout',
      'custom-summary.json:accuracy-params.yaml:epochs',
      'custom-summary.json:loss-epoch',
      'custom-summary.json:accuracy-epoch'
    ])

    mockPostMessage.mockClear()

    dragAndDrop(plots[2], plots[0])

    const expectedOrder = [
      'custom-summary.json:loss-epoch',
      'custom-summary.json:loss-params.yaml:dropout',
      'custom-summary.json:accuracy-params.yaml:epochs',
      'custom-summary.json:accuracy-epoch'
    ]

    expect(mockPostMessage).toHaveBeenCalledTimes(1)
    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: expectedOrder,
      type: MessageFromWebviewType.REORDER_PLOTS_CUSTOM
    })
    expect(
      screen.getAllByTestId(/summary\.json/).map(plot => plot.id)
    ).toStrictEqual(expectedOrder)
  })

  it('should add a custom plot if a user creates a custom plot', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: {
        ...customPlotsFixture,
        plots: customPlotsFixture.plots.slice(0, 3)
      }
    })

    expect(
      screen.getAllByTestId(/summary\.json/).map(plot => plot.id)
    ).toStrictEqual([
      'custom-summary.json:loss-params.yaml:dropout',
      'custom-summary.json:accuracy-params.yaml:epochs',
      'custom-summary.json:loss-epoch'
    ])

    sendSetDataMessage({
      custom: customPlotsFixture
    })

    expect(
      screen.getAllByTestId(/summary\.json/).map(plot => plot.id)
    ).toStrictEqual([
      'custom-summary.json:loss-params.yaml:dropout',
      'custom-summary.json:accuracy-params.yaml:epochs',
      'custom-summary.json:loss-epoch',
      'custom-summary.json:accuracy-epoch'
    ])
  })

  it('should remove a custom plot if a user deletes a custom plot', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture
    })

    expect(
      screen.getAllByTestId(/summary\.json/).map(plot => plot.id)
    ).toStrictEqual([
      'custom-summary.json:loss-params.yaml:dropout',
      'custom-summary.json:accuracy-params.yaml:epochs',
      'custom-summary.json:loss-epoch',
      'custom-summary.json:accuracy-epoch'
    ])

    sendSetDataMessage({
      custom: {
        ...customPlotsFixture,
        plots: customPlotsFixture.plots.slice(1)
      }
    })

    expect(
      screen.getAllByTestId(/summary\.json/).map(plot => plot.id)
    ).toStrictEqual([
      'custom-summary.json:accuracy-params.yaml:epochs',
      'custom-summary.json:loss-epoch',
      'custom-summary.json:accuracy-epoch'
    ])
  })

  it('should not be possible to drag a plot from a section to another', () => {
    renderAppWithOptionalData({
      custom: customPlotsFixture,
      template: templatePlotsFixture
    })

    const customPlots = screen.getAllByTestId(/summary\.json/)
    const templatePlots = screen.getAllByTestId(/^plot_/)

    dragAndDrop(templatePlots[0], customPlots[2])

    expect(customPlots.map(plot => plot.id)).toStrictEqual([
      'custom-summary.json:loss-params.yaml:dropout',
      'custom-summary.json:accuracy-params.yaml:epochs',
      'custom-summary.json:loss-epoch',
      'custom-summary.json:accuracy-epoch'
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

  it('should show a drop target at the end of the custom plots when moving a plot inside the section but not over any other plot', () => {
    renderAppWithOptionalData({
      custom: customPlotsFixture,
      template: templatePlotsFixture
    })

    const plots = screen.getAllByTestId(/summary\.json/)

    dragEnter(plots[0], 'custom-plots', DragEnterDirection.LEFT)

    expect(screen.getByTestId('plot_drop-target')).toBeInTheDocument()
  })

  it('should show a drop a plot at the end of the custom plots when moving a plot inside the section but not over any other plot', () => {
    renderAppWithOptionalData({
      custom: customPlotsFixture,
      template: templatePlotsFixture
    })

    const plots = screen.getAllByTestId(/summary\.json/)

    dragAndDrop(plots[0], screen.getByTestId('custom-plots'))

    const expectedOrder = [
      'custom-summary.json:accuracy-params.yaml:epochs',
      'custom-summary.json:loss-epoch',
      'custom-summary.json:accuracy-epoch',
      'custom-summary.json:loss-params.yaml:dropout'
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

  it('should send a message to the extension when a plot is opened in a modal', () => {
    renderAppWithOptionalData({
      template: complexTemplatePlotsFixture
    })

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()

    const plot = within(screen.getAllByTestId(/^plot_/)[0]).getByRole('button')

    fireEvent.click(plot)

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.ZOOM_PLOT
    })
  })

  it('should send a message with the plot path when a comparison table plot is zoomed', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture
    })

    const plot = screen.getAllByTestId('image-plot-button')[0]

    fireEvent.click(plot)

    expect(mockPostMessage).toHaveBeenCalledWith({
      payload: comparisonTableFixture.plots[0].revisions.workspace.url,
      type: MessageFromWebviewType.ZOOM_PLOT
    })
  })

  it('should open a modal with the plot zoomed in when clicking a custom plot', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture
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
      comparison: comparisonTableFixture,
      custom: customPlotsFixture,
      template: complexTemplatePlotsFixture
    })

    const [templateInfo, comparisonInfo, customInfo] = screen.getAllByTestId(
      'info-tooltip-toggle'
    )

    fireEvent.mouseEnter(templateInfo, { bubbles: true })
    expect(screen.getByTestId('tooltip-template-plots')).toBeInTheDocument()

    fireEvent.mouseEnter(comparisonInfo, { bubbles: true })
    expect(screen.getByTestId('tooltip-comparison-plots')).toBeInTheDocument()

    fireEvent.mouseEnter(customInfo, { bubbles: true })
    expect(screen.getByTestId('tooltip-custom-plots')).toBeInTheDocument()
  })

  it('should dismiss a tooltip by pressing esc', () => {
    renderAppWithOptionalData({
      comparison: comparisonTableFixture,
      custom: customPlotsFixture,
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
    const createCustomPlots = (nbOfPlots: number): CustomPlotsData => {
      const plots = []
      for (let i = 0; i < nbOfPlots; i++) {
        const id = `plot-${i}`
        plots.push({
          id,
          metric: '',
          param: '',
          type: CustomPlotType.CHECKPOINT,
          values: [],
          yTitle: id
        })
      }
      return {
        ...customPlotsFixture,
        plots,
        selectedMetrics: plots.map(plot => plot.id)
      } as CustomPlotsData
    }

    const resizeScreen = (width: number, store: typeof plotsStore) => {
      act(() => {
        store.dispatch(setMaxNbPlotsPerRow(width))
      })
      act(() => {
        global.innerWidth = width
        global.dispatchEvent(new Event('resize'))
      })
    }

    describe('Large plots', () => {
      it('should  wrap the custom plots in a big grid (virtualize them) when there are more than eight large plots', async () => {
        await renderAppAndChangeSize(
          { comparison: comparisonTableFixture, custom: createCustomPlots(9) },
          1,
          PlotsSection.CUSTOM_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()

        sendSetDataMessage({
          custom: createCustomPlots(50)
        })

        await screen.findAllByTestId('plots-wrapper')

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the custom plots in a big grid (virtualize them) when there are eight or fewer large plots', async () => {
        await renderAppAndChangeSize(
          { comparison: comparisonTableFixture, custom: createCustomPlots(8) },
          1,
          PlotsSection.CUSTOM_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()

        sendSetDataMessage({
          custom: createCustomPlots(1)
        })

        await screen.findAllByTestId('plots-wrapper')

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      it('should  wrap the template plots in a big grid (virtualize them) when there are more than eight large plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(9) },
          1,
          PlotsSection.TEMPLATE_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()

        sendSetDataMessage({
          template: manyTemplatePlots(50)
        })

        await screen.findAllByTestId('plots-wrapper')

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the template plots in a big grid (virtualize them) when there are eight or fewer large plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(8) },
          1,
          PlotsSection.TEMPLATE_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()

        sendSetDataMessage({
          template: manyTemplatePlots(1)
        })

        await screen.findAllByTestId('plots-wrapper')

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      describe('Sizing', () => {
        const custom = createCustomPlots(25)
        let store: typeof plotsStore

        beforeEach(async () => {
          store = await renderAppAndChangeSize(
            { comparison: comparisonTableFixture, custom },
            1,
            PlotsSection.CUSTOM_PLOTS
          )
        })

        it('should render the plots correctly when the screen is larger than 2000px', () => {
          let plots = screen.getAllByTestId(/^plot-/)

          expect(plots[4].id).toBe(custom.plots[4].yTitle)
          expect(plots.length).toBe(OVERSCAN_ROW_COUNT + 1)

          resizeScreen(5453, store)

          plots = screen.getAllByTestId(/^plot-/)

          expect(plots[3].id).toBe(custom.plots[3].yTitle)
          expect(plots.length).toBe(OVERSCAN_ROW_COUNT + 1)
        })

        it('should render the plots correctly when the screen is larger than 1600px (but less than 2000px)', () => {
          resizeScreen(1849, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[12].id).toBe(custom.plots[12].yTitle)
          expect(plots.length).toBe(OVERSCAN_ROW_COUNT + 1)
        })

        it('should render the plots correctly when the screen is larger than 800px (but less than 1600px)', () => {
          resizeScreen(936, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[14].id).toBe(custom.plots[14].yTitle)
          expect(plots.length).toBe(1 + OVERSCAN_ROW_COUNT) // Only the first and the next lines defined by the overscan row count will be rendered
        })

        it('should render the plots correctly when the screen is smaller than 800px', () => {
          resizeScreen(563, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[4].id).toBe(custom.plots[4].yTitle)
        })
      })
    })

    describe('Regular plots', () => {
      it('should  wrap the custom plots in a big grid (virtualize them) when there are more than fourteen regular plots', async () => {
        await renderAppAndChangeSize(
          { comparison: comparisonTableFixture, custom: createCustomPlots(15) },
          DEFAULT_NB_ITEMS_PER_ROW,
          PlotsSection.CUSTOM_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the custom plots in a big grid (virtualize them) when there are fourteen regular plots', async () => {
        await renderAppAndChangeSize(
          { comparison: comparisonTableFixture, custom: createCustomPlots(14) },
          DEFAULT_NB_ITEMS_PER_ROW,
          PlotsSection.CUSTOM_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      it('should  wrap the template plots in a big grid (virtualize them) when there are more than fourteen regular plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(15) },
          DEFAULT_NB_ITEMS_PER_ROW,
          PlotsSection.TEMPLATE_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the template plots in a big grid (virtualize them) when there are fourteen or fewer regular plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(14) },
          DEFAULT_NB_ITEMS_PER_ROW,
          PlotsSection.TEMPLATE_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      describe('Sizing', () => {
        const custom = createCustomPlots(25)
        let store: typeof plotsStore

        beforeEach(async () => {
          store = await renderAppAndChangeSize(
            { comparison: comparisonTableFixture, custom },
            DEFAULT_NB_ITEMS_PER_ROW,
            PlotsSection.CUSTOM_PLOTS
          )
        })

        it('should render the plots correctly when the screen is larger than 2000px', () => {
          resizeScreen(3200, store)

          let plots = screen.getAllByTestId(/^plot-/)

          expect(plots[20].id).toBe(custom.plots[20].yTitle)
          expect(plots.length).toBe(custom.plots.length)

          resizeScreen(6453, store)

          plots = screen.getAllByTestId(/^plot-/)

          expect(plots[19].id).toBe(custom.plots[19].yTitle)
          expect(plots.length).toBe(custom.plots.length)
        })

        it('should render the plots correctly when the screen is larger than 1600px (but less than 2000px)', () => {
          resizeScreen(1889, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[7].id).toBe(custom.plots[7].yTitle)
          expect(plots.length).toBe(custom.plots.length)
        })

        it('should render the plots correctly when the screen is larger than 800px (but less than 1600px)', () => {
          resizeScreen(938, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[7].id).toBe(custom.plots[7].yTitle)
          expect(plots.length).toBe(custom.plots.length)
        })

        it('should render the plots correctly when the screen is smaller than 800px', () => {
          resizeScreen(562, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[4].id).toBe(custom.plots[4].yTitle)
        })
      })
    })

    describe('Smaller plots', () => {
      it('should  wrap the custom plots in a big grid (virtualize them) when there are more than twenty small plots', async () => {
        await renderAppAndChangeSize(
          { comparison: comparisonTableFixture, custom: createCustomPlots(21) },
          4,
          PlotsSection.CUSTOM_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the custom plots in a big grid (virtualize them) when there are twenty or fewer small plots', async () => {
        await renderAppAndChangeSize(
          { comparison: comparisonTableFixture, custom: createCustomPlots(20) },
          4,
          PlotsSection.CUSTOM_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      it('should  wrap the template plots in a big grid (virtualize them) when there are more than twenty small plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(21) },
          4,
          PlotsSection.TEMPLATE_PLOTS
        )

        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      it('should not wrap the template plots in a big grid (virtualize them) when there are twenty or fewer small plots', async () => {
        await renderAppAndChangeSize(
          { template: manyTemplatePlots(20) },
          4,
          PlotsSection.TEMPLATE_PLOTS
        )

        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })

      describe('Sizing', () => {
        const custom = createCustomPlots(25)
        let store: typeof plotsStore

        beforeEach(async () => {
          store = await renderAppAndChangeSize(
            { comparison: comparisonTableFixture, custom },
            4,
            PlotsSection.CUSTOM_PLOTS
          )
        })

        it('should render the plots correctly when the screen is larger than 2000px', () => {
          resizeScreen(3004, store)

          let plots = screen.getAllByTestId(/^plot-/)

          expect(plots[7].id).toBe(custom.plots[7].yTitle)
          expect(plots.length).toBe(custom.plots.length)

          resizeScreen(5473, store)

          plots = screen.getAllByTestId(/^plot-/)

          expect(plots[9].id).toBe(custom.plots[9].yTitle)
          expect(plots.length).toBe(custom.plots.length)
        })

        it('should render the plots correctly when the screen is larger than 1600px (but less than 2000px)', () => {
          resizeScreen(1839, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[24].id).toBe(custom.plots[24].yTitle)
          expect(plots.length).toBe(custom.plots.length)
        })

        it('should render the plots correctly when the screen is larger than 800px (but less than 1600px)', () => {
          resizeScreen(956, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[9].id).toBe(custom.plots[9].yTitle)
          expect(plots.length).toBe(custom.plots.length)
        })

        it('should render the plots correctly when the screen is smaller than 800px but larger than 600px', () => {
          resizeScreen(663, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[9].id).toBe(custom.plots[9].yTitle)
          expect(plots.length).toBe(custom.plots.length)
        })

        it('should render the plots correctly when the screen is smaller than 600px', () => {
          resizeScreen(569, store)

          const plots = screen.getAllByTestId(/^plot-/)

          expect(plots[4].id).toBe(custom.plots[4].yTitle)
        })
      })
    })
  })

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
})
