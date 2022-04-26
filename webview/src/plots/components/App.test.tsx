/**
 * @jest-environment jsdom
 */
import { join } from 'dvc/src/test/util/path'
import React from 'react'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import checkpointPlotsFixture from 'dvc/src/test/fixtures/expShow/checkpointPlots'
import templatePlotsFixture from 'dvc/src/test/fixtures/plotsDiff/template/webview'
import {
  ColorScale,
  DEFAULT_SECTION_COLLAPSED,
  PlotsData,
  PlotSize,
  Section,
  TemplatePlotGroup,
  TemplatePlotsData
} from 'dvc/src/plots/webview/contract'
import {
  MessageFromWebviewType,
  MessageToWebviewType
} from 'dvc/src/webview/contract'
import { reorderObjectList } from 'dvc/src/util/array'
import { App } from './App'
import { Plots } from './Plots'
import { NewSectionBlock } from './templatePlots/TemplatePlots'
import { vsCodeApi } from '../../shared/api'
import { createBubbledEvent, dragAndDrop, dragEnter } from '../../test/dragDrop'
import { DragEnterDirection } from '../../shared/components/dragDrop/util'

jest.mock('../../shared/api')

jest.mock('./checkpointPlots/util', () => ({
  ...jest.requireActual('./checkpointPlots/util'),
  createSpec: (title: string, scale?: ColorScale) => ({
    ...jest.requireActual('./checkpointPlots/util').createSpec(title, scale),
    height: 100,
    width: 100
  })
}))
jest.spyOn(console, 'warn').mockImplementation(() => {})

const { postMessage } = vsCodeApi
const mockPostMessage = jest.mocked(postMessage)

const heightToSuppressVegaError = 1000

beforeEach(() => {
  jest.clearAllMocks()
  jest
    .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
    .mockImplementation(() => heightToSuppressVegaError)
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

  it('should send the initialized message on first render', () => {
    render(<App />)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: MessageFromWebviewType.INITIALIZED
    })
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
  })

  it('should render the loading state when given no data', async () => {
    render(<App />)
    const loadingState = await screen.findByText('Loading Plots...')

    expect(loadingState).toBeInTheDocument()
  })

  it('should render the loading state when not initially provided with collapsed sections', async () => {
    renderAppWithData({
      checkpoint: null
    })

    const loadingState = await screen.findByText('Loading Plots...')

    expect(loadingState).toBeInTheDocument()
  })

  it('should render the empty state when given data with no plots', async () => {
    renderAppWithData({
      checkpoint: null,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })
    const emptyState = await screen.findByText('No Plots to Display')

    expect(emptyState).toBeInTheDocument()
  })

  it('should render only checkpoint plots when given a message with only checkpoint plots data', () => {
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Experiment Checkpoints')).toBeInTheDocument()
    expect(screen.queryByText('Plots')).not.toBeInTheDocument()
    expect(screen.queryByText('Comparison')).not.toBeInTheDocument()
  })

  it('should render checkpoint and template plots when given messages with both types of plots data', () => {
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    sendSetDataMessage({
      template: templatePlotsFixture
    })

    expect(screen.queryByText('Loading Plots...')).not.toBeInTheDocument()
    expect(screen.getByText('Experiment Checkpoints')).toBeInTheDocument()
    expect(screen.getByText('Plots')).toBeInTheDocument()
  })

  it('should render the comparison table when given a message with comparison plots data', () => {
    const expectedSectionName = 'Comparison'

    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    sendSetDataMessage({
      comparison: comparisonTableFixture
    })

    expect(screen.getByText(expectedSectionName)).toBeInTheDocument()
  })

  it('should remove checkpoint plots given a message showing checkpoint plots as null', () => {
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    expect(screen.getByText('Experiment Checkpoints')).toBeInTheDocument()

    sendSetDataMessage({
      checkpoint: null
    })
    expect(screen.queryByText('Experiment Checkpoints')).not.toBeInTheDocument()
  })

  it('should toggle the checkpoint plots section in state when its header is clicked', async () => {
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    const summaryElement = await screen.findByText('Experiment Checkpoints')
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
      type: MessageFromWebviewType.PLOTS_SECTION_TOGGLED
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
    render(
      <Plots
        state={{
          data: {
            checkpoint: checkpointPlotsFixture,
            sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
            template: null
          }
        }}
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

    const lossItem = await screen.findByText('summary.json:loss', {
      ignore: 'text'
    })

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
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    const [, pickerButton] = screen.getAllByTestId('icon-menu-item')
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
      type: MessageFromWebviewType.METRIC_TOGGLED
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
      type: MessageFromWebviewType.METRIC_TOGGLED
    })
  })

  it('should change the size of the plots according to the size picker', async () => {
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    const sizePickerButton = screen.getAllByTestId('icon-menu-item')[2]
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
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    const sizeButton = screen.getAllByTestId('icon-menu-item')[2]
    fireEvent.mouseEnter(sizeButton)
    fireEvent.click(sizeButton)

    const largeButton = screen.getByText('Large')
    fireEvent.click(largeButton)

    expect(mockPostMessage).toBeCalledWith({
      payload: { section: Section.CHECKPOINT_PLOTS, size: PlotSize.LARGE },
      type: MessageFromWebviewType.PLOTS_RESIZED
    })

    const smallButton = screen.getByText('Small')
    fireEvent.click(smallButton)

    expect(mockPostMessage).toBeCalledWith({
      payload: { section: Section.CHECKPOINT_PLOTS, size: PlotSize.SMALL },
      type: MessageFromWebviewType.PLOTS_RESIZED
    })
  })

  it('should not send a message to the extension with the selected size when the size has not changed', () => {
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    const sizeButton = screen.getAllByTestId('icon-menu-item')[2]
    fireEvent.mouseEnter(sizeButton)
    fireEvent.click(sizeButton)

    const largeButton = screen.getByText('Large')
    fireEvent.click(largeButton)

    expect(mockPostMessage).toBeCalledWith({
      payload: { section: Section.CHECKPOINT_PLOTS, size: PlotSize.LARGE },
      type: MessageFromWebviewType.PLOTS_RESIZED
    })

    mockPostMessage.mockClear()

    sendSetDataMessage({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    expect(mockPostMessage).not.toBeCalled()
  })

  it('should show an input to rename the section when clicking the rename icon button', () => {
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
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
      checkpoint: checkpointPlotsFixture,
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

  it('should change the title of the section on the blur event of the input', () => {
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
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
    fireEvent.blur(titleInput)

    expect(screen.getByText(newTitle)).toBeInTheDocument()
  })

  it('should send a message to the extension with the new section name after a section rename', () => {
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
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
      payload: { name: newTitle, section: Section.CHECKPOINT_PLOTS },
      type: MessageFromWebviewType.SECTION_RENAMED
    })
  })

  it('should display the checkpoint plots in the order stored', () => {
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
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
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
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
      type: MessageFromWebviewType.PLOTS_METRICS_REORDERED
    })
    expect(
      screen.getAllByTestId(/summary\.json/).map(plot => plot.id)
    ).toStrictEqual(expectedOrder)
  })

  it('should remove the checkpoint plot from the order if it is removed from the plots', () => {
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
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
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    const [, pickerButton] = screen.queryAllByTestId('icon-menu-item')
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
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
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
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
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
      type: MessageFromWebviewType.PLOTS_TEMPLATES_REORDERED
    })
  })

  it('should render two template plot sections', () => {
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
      template: complexTemplatePlotsFixture
    })

    const sections = screen.getAllByTestId(/^plots-section_/)

    expect(sections.map(section => section.id)).toStrictEqual([
      'template-single_0',
      'template-multi_1'
    ])
  })

  it('should create a new section above the others if the template plot type is different than the first section', () => {
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
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
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
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
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
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
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
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
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
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
      movedSingleViewPlot,
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
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
      template: complexTemplatePlotsFixture
    })

    const topSection = screen.getByTestId(NewSectionBlock.TOP)
    const multiViewPlot = screen.getByTestId(
      join('plot_other', 'multiview.tsv')
    )
    let topDropIcon = screen.queryByTestId(`${NewSectionBlock.TOP}_drop-icon`)

    expect(topDropIcon).not.toBeInTheDocument()

    multiViewPlot.dispatchEvent(createBubbledEvent('dragstart'))
    topSection.dispatchEvent(createBubbledEvent('dragenter'))

    topDropIcon = screen.queryByTestId(`${NewSectionBlock.TOP}_drop-icon`)

    expect(topDropIcon).toBeInTheDocument()
  })

  it('should not show a drop target when moving an element from a whole different section (comparison to template)', () => {
    renderAppWithData({
      comparison: comparisonTableFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
      template: complexTemplatePlotsFixture
    })

    const headers = screen.getAllByRole('columnheader')
    const bottomSection = screen.getByTestId(NewSectionBlock.BOTTOM)

    dragEnter(headers[1], bottomSection, DragEnterDirection.LEFT)

    const bottomDropIcon = screen.queryByTestId(
      `${NewSectionBlock.BOTTOM}_drop-icon`
    )

    expect(bottomDropIcon).not.toBeInTheDocument()
  })

  it('should prevent default behaviour when dragging over a new section', () => {
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
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
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
      template: complexTemplatePlotsFixture
    })

    const plots = screen.getAllByTestId(/^plot_/)

    dragEnter(plots[1], plots[0], DragEnterDirection.LEFT)

    const plotsWithDropTarget = screen.getAllByTestId(/^plot_/)
    expect(plotsWithDropTarget.map(plot => plot.id)).toStrictEqual([
      'plot-drop-target',
      plots[0].id,
      plots[1].id,
      plots[2].id
    ])
  })

  it('should show a drop target after a plot on drag enter from the right', () => {
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
      template: complexTemplatePlotsFixture
    })

    const plots = screen.getAllByTestId(/^plot_/)
    dragEnter(plots[0], plots[1], DragEnterDirection.RIGHT)

    const plotsWithDropTarget = screen.getAllByTestId(/^plot_/)

    expect(plotsWithDropTarget.map(plot => plot.id)).toStrictEqual([
      plots[0].id,
      plots[1].id,
      'plot-drop-target',
      plots[2].id
    ])
  })

  it('should hide the plot being dragged from the list', () => {
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
      template: complexTemplatePlotsFixture
    })

    const plots = screen.getAllByTestId(/^plot_/)
    expect(plots[1].style.display).not.toBe('none')

    dragEnter(plots[1], plots[1], DragEnterDirection.LEFT)

    expect(plots[1].style.display).toBe('none')
  })

  it('should open a modal with the plot zoomed in when clicking a template plot', () => {
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
      template: complexTemplatePlotsFixture
    })

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()

    const [plot] = screen.getAllByTestId(/^plot_/)

    fireEvent.click(plot)

    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })

  it('should open a modal with the plot zoomed in when clicking a checkpoint plot', () => {
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()

    const [plot] = screen.getAllByTestId(/^plot-/)

    fireEvent.click(plot)

    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })

  it('should not open a modal with the plot zoomed in when clicking a comparison table plot', () => {
    renderAppWithData({
      comparison: comparisonTableFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()

    const [plot] = screen.getAllByAltText(/^Plot of/)

    fireEvent.click(plot)

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  it('should close the zoomed plot modal when clicking the backdrop or the close button', () => {
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
      template: complexTemplatePlotsFixture
    })

    const [plot] = screen.getAllByTestId(/^plot_/)

    fireEvent.click(plot)
    fireEvent.click(screen.getByTestId('modal'))

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()

    fireEvent.click(plot)
    fireEvent.click(screen.getByTestId('modal-close'))

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  it('should not close the zoomed in plot modal when interacting with the plot inside (modal content)', () => {
    renderAppWithData({
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
      template: complexTemplatePlotsFixture
    })

    const [plot] = screen.getAllByTestId(/^plot_/)

    fireEvent.click(plot)
    fireEvent.click(screen.getByTestId('modal-content'))

    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })
})
