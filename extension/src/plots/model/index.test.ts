import { PlotsModel } from '.'
import { defaultSectionCollapsed, PlotSize, Section } from '../webview/contract'
import { buildMockMemento } from '../../test/util'
import { Experiments } from '../../experiments'
import { MementoPrefix } from '../../vscode/memento'

describe('experimentsModel', () => {
  let model: PlotsModel
  const exampleDvcRoot = 'test'
  const persistedSelectedMetrics = ['loss', 'accuracy']
  const memento = buildMockMemento({
    [MementoPrefix.PLOT_SELECTED_METRICS + exampleDvcRoot]:
      persistedSelectedMetrics,
    [MementoPrefix.PLOT_SIZE + exampleDvcRoot]: PlotSize.REGULAR
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
    expect(model.getSelectedMetrics()).toEqual(persistedSelectedMetrics)

    const newSelectedMetrics = ['one', 'two', 'four', 'hundred']
    model.setSelectedMetrics(newSelectedMetrics)

    expect(model.getSelectedMetrics()).toEqual(newSelectedMetrics)
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
    expect(model.getPlotSize()).toEqual(PlotSize.REGULAR)

    model.setPlotSize(PlotSize.LARGE)

    expect(model.getPlotSize()).toEqual(PlotSize.LARGE)
  })

  it('should update the persisted plot size when calling setPlotSize', () => {
    const mementoUpdateSpy = jest.spyOn(memento, 'update')

    model.setPlotSize(PlotSize.SMALL)

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      MementoPrefix.PLOT_SIZE + exampleDvcRoot,
      PlotSize.SMALL
    )
  })

  it('should update the persisted collapsible section state when calling setSectionCollapsed', () => {
    const mementoUpdateSpy = jest.spyOn(memento, 'update')

    expect(model.getSectionCollapsed()).toEqual(defaultSectionCollapsed)

    model.setSectionCollapsed({ [Section.LIVE_PLOTS]: true })

    const expectedSectionCollapsed = {
      [Section.LIVE_PLOTS]: true,
      [Section.STATIC_PLOTS]: false
    }

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      MementoPrefix.PLOT_SECTION_COLLAPSED + exampleDvcRoot,
      expectedSectionCollapsed
    )

    expect(model.getSectionCollapsed()).toEqual(expectedSectionCollapsed)
  })
})
