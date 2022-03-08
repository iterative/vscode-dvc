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
})
