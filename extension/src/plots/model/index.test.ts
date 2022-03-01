import { PlotsModel } from '.'
import {
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NAMES,
  DEFAULT_SECTION_SIZES,
  PlotSize,
  Section
} from '../webview/contract'
import { buildMockMemento } from '../../test/util'
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

  beforeEach(() => {
    model = new PlotsModel(
      exampleDvcRoot,
      {
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
    expect(model.getPlotSize(Section.LIVE_PLOTS)).toStrictEqual(
      PlotSize.REGULAR
    )

    model.setPlotSize(Section.LIVE_PLOTS, PlotSize.LARGE)

    expect(model.getPlotSize(Section.LIVE_PLOTS)).toStrictEqual(PlotSize.LARGE)
  })

  it('should update the persisted plot size when calling setPlotSize', () => {
    const mementoUpdateSpy = jest.spyOn(memento, 'update')

    model.setPlotSize(Section.LIVE_PLOTS, PlotSize.SMALL)

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      MementoPrefix.PLOT_SIZES + exampleDvcRoot,
      { ...DEFAULT_SECTION_SIZES, [Section.LIVE_PLOTS]: PlotSize.SMALL }
    )
  })

  it('should change the the sectionName of a section when calling setSectionName', () => {
    expect(model.getSectionName(Section.LIVE_PLOTS)).toStrictEqual(
      DEFAULT_SECTION_NAMES[Section.LIVE_PLOTS]
    )
    expect(model.getSectionName(Section.STATIC_PLOTS)).toStrictEqual(
      DEFAULT_SECTION_NAMES[Section.STATIC_PLOTS]
    )

    const newLivePlotsName = 'Live Section'
    model.setSectionName(Section.LIVE_PLOTS, newLivePlotsName)

    expect(model.getSectionName(Section.LIVE_PLOTS)).toStrictEqual(
      newLivePlotsName
    )
    expect(model.getSectionName(Section.STATIC_PLOTS)).toStrictEqual(
      DEFAULT_SECTION_NAMES[Section.STATIC_PLOTS]
    )

    const newStaticPlotsName = 'Static'
    model.setSectionName(Section.STATIC_PLOTS, newStaticPlotsName)
    expect(model.getSectionName(Section.STATIC_PLOTS)).toStrictEqual(
      newStaticPlotsName
    )
  })

  it('should update the persisted section names when calling setSectionName', () => {
    const mementoUpdateSpy = jest.spyOn(memento, 'update')

    const newName = 'Important Plots'
    model.setSectionName(Section.LIVE_PLOTS, newName)

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      MementoPrefix.PLOT_SECTION_NAMES + exampleDvcRoot,
      {
        [Section.LIVE_PLOTS]: newName,
        [Section.STATIC_PLOTS]: DEFAULT_SECTION_NAMES[Section.STATIC_PLOTS],
        [Section.COMPARISON_TABLE]:
          DEFAULT_SECTION_NAMES[Section.COMPARISON_TABLE]
      }
    )
  })

  it('should update the persisted collapsible section state when calling setSectionCollapsed', () => {
    const mementoUpdateSpy = jest.spyOn(memento, 'update')

    expect(model.getSectionCollapsed()).toStrictEqual(DEFAULT_SECTION_COLLAPSED)

    model.setSectionCollapsed({ [Section.LIVE_PLOTS]: true })

    const expectedSectionCollapsed = {
      [Section.LIVE_PLOTS]: true,
      [Section.STATIC_PLOTS]: false,
      [Section.COMPARISON_TABLE]: false
    }

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      MementoPrefix.PLOT_SECTION_COLLAPSED + exampleDvcRoot,
      expectedSectionCollapsed
    )

    expect(model.getSectionCollapsed()).toStrictEqual(expectedSectionCollapsed)
  })
})
