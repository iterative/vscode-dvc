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

const mockedRevisions = [
  { displayColor: 'white', label: 'workspace' },
  { displayColor: 'red', label: 'main' },
  { displayColor: 'blue', label: '71f31cf' },
  { displayColor: 'black', label: 'e93c7e6' },
  { displayColor: 'brown', label: 'ffbe811' }
]

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

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(2)
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

  it('should reorder comparison revisions after receiving a message to reorder', () => {
    mockedGetSelectedRevisions.mockReturnValue(mockedRevisions)

    const mementoUpdateSpy = jest.spyOn(memento, 'update')
    const newOrder = ['71f31cf', 'e93c7e6', 'ffbe811', 'workspace', 'main']
    model.setComparisonOrder(newOrder)

    expect(mementoUpdateSpy).toBeCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      MementoPrefix.PLOT_COMPARISON_ORDER + exampleDvcRoot,
      newOrder
    )

    expect(
      model.getSelectedRevisionDetails().map(({ revision }) => revision)
    ).toStrictEqual(newOrder)
  })

  it('should always send new revisions to the end of the list', () => {
    mockedGetSelectedRevisions.mockReturnValue(mockedRevisions)

    const newOrder = ['71f31cf', 'e93c7e6']

    model.setComparisonOrder(newOrder)

    expect(
      model.getSelectedRevisionDetails().map(({ revision }) => revision)
    ).toStrictEqual([
      ...newOrder,
      ...mockedRevisions
        .map(({ label }) => label)
        .filter(revision => !newOrder.includes(revision))
    ])
  })

  it('should send previously selected revisions to the end of the list', () => {
    const allRevisions = mockedRevisions.slice(0, 3)
    const revisionDropped = allRevisions.filter(({ label }) => label !== 'main')
    const revisionReAdded = allRevisions

    mockedGetSelectedRevisions
      .mockReturnValueOnce(allRevisions)
      .mockReturnValueOnce(allRevisions)
      .mockReturnValueOnce(revisionDropped)
      .mockReturnValueOnce(revisionDropped)
      .mockReturnValueOnce(revisionReAdded)
      .mockReturnValueOnce(revisionReAdded)

    const initialOrder = ['workspace', 'main', '71f31cf']
    model.setComparisonOrder(initialOrder)

    expect(
      model.getSelectedRevisionDetails().map(({ revision }) => revision)
    ).toStrictEqual(initialOrder)

    model.setComparisonOrder()

    expect(
      model.getSelectedRevisionDetails().map(({ revision }) => revision)
    ).toStrictEqual(initialOrder.filter(revision => revision !== 'main'))

    model.setComparisonOrder()

    expect(
      model.getSelectedRevisionDetails().map(({ revision }) => revision)
    ).toStrictEqual(['workspace', '71f31cf', 'main'])
  })
})
