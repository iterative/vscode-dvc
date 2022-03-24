/**
 * @jest-environment jsdom
 */
import { join } from 'path'
import React from 'react'
import { render, cleanup, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import comparisonTableFixture from 'dvc/src/test/fixtures/plotsDiff/comparison'
import checkpointPlotsFixture from 'dvc/src/test/fixtures/expShow/checkpointPlots'
import templatePlotsFixture from 'dvc/src/test/fixtures/plotsDiff/template/webview'
import {
  CheckpointPlotsColors,
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
import { App } from './App'
import { Plots } from './Plots'
import { NewSectionBlock } from './TemplatePlots/TemplatePlots'
import { vsCodeApi } from '../../shared/api'
import { createBubbledEvent, dragAndDrop } from '../../test/dragDrop'

jest.mock('../../shared/api')

jest.mock('./constants', () => ({
  ...jest.requireActual('./constants'),
  createSpec: (title: string, scale?: CheckpointPlotsColors) => ({
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
    jest.spyOn(console, 'warn').mockImplementation(() => {})
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

    const heightToSuppressVegaError = 1000
    jest
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockImplementation(() => heightToSuppressVegaError)
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

    const hiddenPlots = await screen.findAllByLabelText('Vega visualization')
    hiddenPlots.map(hiddenPlot => expect(hiddenPlot).not.toBeVisible())
    expect(mockPostMessage).toBeCalledWith({
      payload: { [Section.CHECKPOINT_PLOTS]: true },
      type: MessageFromWebviewType.PLOTS_SECTION_TOGGLED
    })
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
      checkpoint: checkpointPlotsFixture,
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

  it('should add the new plot at the end of the set order', () => {
    renderAppWithData({
      checkpoint: checkpointPlotsFixture,
      sectionCollapsed: DEFAULT_SECTION_COLLAPSED
    })

    let plots = screen.getAllByTestId(/summary\.json/)
    dragAndDrop(plots[3], plots[0])

    sendSetDataMessage({
      checkpoint: {
        ...checkpointPlotsFixture,
        plots: [
          {
            title: 'summary.json:new-plot',
            values: checkpointPlotsFixture.plots[0].values
          },
          ...checkpointPlotsFixture.plots
        ]
      }
    })
    plots = screen.getAllByTestId(/summary\.json/)
    expect(plots.map(plot => plot.id)).toStrictEqual([
      'summary.json:val_accuracy',
      'summary.json:loss',
      'summary.json:accuracy',
      'summary.json:val_loss',
      'summary.json:new-plot'
    ])
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

  it('should move a template plot from one type in another section of the same type', async () => {
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
})
