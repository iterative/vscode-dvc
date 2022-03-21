import { PlotsModel } from '.'
import {
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NAMES,
  DEFAULT_SECTION_SIZES,
  PlotSize,
  Section
} from '../webview/contract'
import { buildMockMemento } from '../../test/util'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output/image'
import { Experiments } from '../../experiments'
import { MementoPrefix } from '../../vscode/memento'

describe('plotsModel', () => {
  let model: PlotsModel
  const exampleDvcRoot = 'test'
  const persistedSelectedMetrics = ['loss', 'accuracy']
  const memento = buildMockMemento({
    [MementoPrefix.PLOT_SELECTED_METRICS + exampleDvcRoot]:
      persistedSelectedMetrics,
    [MementoPrefix.PLOT_SIZES + exampleDvcRoot]: DEFAULT_SECTION_SIZES
  })
  const mockedGetSelectedRevisions = jest.fn()

  beforeEach(() => {
    model = new PlotsModel(
      exampleDvcRoot,
      {
        getSelectedRevisions: mockedGetSelectedRevisions,
        isReady: () => Promise.resolve(undefined)
      } as unknown as Experiments,
      memento
    )
    jest.clearAllMocks()
  })

  it('should change the selectedMetrics when calling setSelectedMetrics', () => {
    expect(model.getSelectedMetrics()).toStrictEqual(persistedSelectedMetrics)

    const newSelectedMetrics = ['one', 'two', 'four', 'hundred']
    model.setSelectedMetrics(newSelectedMetrics)

    expect(model.getSelectedMetrics()).toStrictEqual(newSelectedMetrics)
  })

  it('should update the persisted selected metrics when calling setSelectedMetrics', () => {
    const mementoUpdateSpy = jest.spyOn(memento, 'update')
    const newSelectedMetrics = ['one', 'two', 'four', 'hundred']

    model.setSelectedMetrics(newSelectedMetrics)

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      MementoPrefix.PLOT_SELECTED_METRICS + exampleDvcRoot,
      newSelectedMetrics
    )
  })

  it('should change the plotSize when calling setPlotSize', () => {
    expect(model.getPlotSize(Section.CHECKPOINT_PLOTS)).toStrictEqual(
      PlotSize.REGULAR
    )

    model.setPlotSize(Section.CHECKPOINT_PLOTS, PlotSize.LARGE)

    expect(model.getPlotSize(Section.CHECKPOINT_PLOTS)).toStrictEqual(
      PlotSize.LARGE
    )
  })

  it('should update the persisted plot size when calling setPlotSize', () => {
    const mementoUpdateSpy = jest.spyOn(memento, 'update')

    model.setPlotSize(Section.CHECKPOINT_PLOTS, PlotSize.SMALL)

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      MementoPrefix.PLOT_SIZES + exampleDvcRoot,
      { ...DEFAULT_SECTION_SIZES, [Section.CHECKPOINT_PLOTS]: PlotSize.SMALL }
    )
  })

  it('should change the the sectionName of a section when calling setSectionName', () => {
    expect(model.getSectionName(Section.CHECKPOINT_PLOTS)).toStrictEqual(
      DEFAULT_SECTION_NAMES[Section.CHECKPOINT_PLOTS]
    )
    expect(model.getSectionName(Section.TEMPLATE_PLOTS)).toStrictEqual(
      DEFAULT_SECTION_NAMES[Section.TEMPLATE_PLOTS]
    )

    const newCheckpointPlotsName = 'Previously called live'
    model.setSectionName(Section.CHECKPOINT_PLOTS, newCheckpointPlotsName)

    expect(model.getSectionName(Section.CHECKPOINT_PLOTS)).toStrictEqual(
      newCheckpointPlotsName
    )
    expect(model.getSectionName(Section.TEMPLATE_PLOTS)).toStrictEqual(
      DEFAULT_SECTION_NAMES[Section.TEMPLATE_PLOTS]
    )

    const newTemplatePlotsName = 'Previously Called Static'
    model.setSectionName(Section.TEMPLATE_PLOTS, newTemplatePlotsName)
    expect(model.getSectionName(Section.TEMPLATE_PLOTS)).toStrictEqual(
      newTemplatePlotsName
    )
  })

  it('should update the persisted section names when calling setSectionName', () => {
    const mementoUpdateSpy = jest.spyOn(memento, 'update')

    const newName = 'Important Plots'
    model.setSectionName(Section.CHECKPOINT_PLOTS, newName)

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      MementoPrefix.PLOT_SECTION_NAMES + exampleDvcRoot,
      {
        [Section.CHECKPOINT_PLOTS]: newName,
        [Section.TEMPLATE_PLOTS]: DEFAULT_SECTION_NAMES[Section.TEMPLATE_PLOTS],
        [Section.COMPARISON_TABLE]:
          DEFAULT_SECTION_NAMES[Section.COMPARISON_TABLE]
      }
    )
  })

  it('should update the persisted collapsible section state when calling setSectionCollapsed', () => {
    const mementoUpdateSpy = jest.spyOn(memento, 'update')

    expect(model.getSectionCollapsed()).toStrictEqual(DEFAULT_SECTION_COLLAPSED)

    model.setSectionCollapsed({ [Section.CHECKPOINT_PLOTS]: true })

    const expectedSectionCollapsed = {
      [Section.CHECKPOINT_PLOTS]: true,
      [Section.TEMPLATE_PLOTS]: false,
      [Section.COMPARISON_TABLE]: false
    }

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      MementoPrefix.PLOT_SECTION_COLLAPSED + exampleDvcRoot,
      expectedSectionCollapsed
    )

    expect(model.getSectionCollapsed()).toStrictEqual(expectedSectionCollapsed)
  })

  it('should reorder comparison revisions after receiving a message to reorder', async () => {
    mockedGetSelectedRevisions.mockReturnValue([
      { displayColor: 'white', label: 'workspace' },
      { displayColor: 'red', label: 'main' },
      { displayColor: 'blue', label: '4fb124a' },
      { displayColor: 'black', label: '42b8736' },
      { displayColor: 'brown', label: '1ba7bcd' }
    ])
    await model.transformAndSetPlots(plotsDiffFixture)

    const mementoUpdateSpy = jest.spyOn(memento, 'update')
    const newOrder = ['4fb124a', '42b8736', '1ba7bcd', 'workspace', 'main']
    model.setComparisonOrder(newOrder)

    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      MementoPrefix.PLOT_COMPARISON_ORDER + exampleDvcRoot,
      newOrder
    )

    expect(model.getSelectedRevisionDetails()).toStrictEqual([
      { displayColor: 'blue', revision: '4fb124a' },
      { displayColor: 'black', revision: '42b8736' },
      { displayColor: 'brown', revision: '1ba7bcd' },
      { displayColor: 'white', revision: 'workspace' },
      { displayColor: 'red', revision: 'main' }
    ])
  })

  it('should always send new revisions to the end of the list', async () => {
    mockedGetSelectedRevisions.mockReturnValue([
      { displayColor: 'white', label: 'workspace' },
      { displayColor: 'red', label: 'main' },
      { displayColor: 'blue', label: '4fb124a' },
      { displayColor: 'black', label: '42b8736' },
      { displayColor: 'brown', label: '1ba7bcd' }
    ])

    await model.transformAndSetPlots(plotsDiffFixture)

    const newOrder = ['4fb124a', '42b8736']

    model.setComparisonOrder(newOrder)

    expect(model.getSelectedRevisionDetails()).toStrictEqual([
      { displayColor: 'blue', revision: '4fb124a' },
      { displayColor: 'black', revision: '42b8736' },
      { displayColor: 'white', revision: 'workspace' },
      { displayColor: 'red', revision: 'main' },
      { displayColor: 'brown', revision: '1ba7bcd' }
    ])
  })
})
