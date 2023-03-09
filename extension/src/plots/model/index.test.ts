import { PlotsModel } from '.'
import {
  DEFAULT_NB_ITEMS_PER_ROW,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW,
  Section
} from '../webview/contract'
import { buildMockMemento } from '../../test/util'
import { Experiments } from '../../experiments'
import { PersistenceKey } from '../../persistence/constants'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'

const mockedRevisions = [
  { displayColor: 'white', label: EXPERIMENT_WORKSPACE_ID },
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
    [PersistenceKey.PLOT_SELECTED_METRICS + exampleDvcRoot]:
      persistedSelectedMetrics,
    [PersistenceKey.PLOT_NB_ITEMS_PER_ROW + exampleDvcRoot]:
      DEFAULT_SECTION_NB_ITEMS_PER_ROW
  })
  const mockedGetSelectedRevisions = jest.fn()
  const mockedGetFirstThreeColumnOrder = jest.fn()
  mockedGetFirstThreeColumnOrder.mockReturnValue([])

  beforeEach(() => {
    model = new PlotsModel(
      exampleDvcRoot,
      {
        getFirstThreeColumnOrder: mockedGetFirstThreeColumnOrder,
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
      PersistenceKey.PLOT_SELECTED_METRICS + exampleDvcRoot,
      newSelectedMetrics
    )
  })

  it('should change the plotSize when calling setPlotSize', () => {
    expect(model.getNbItemsPerRow(Section.CHECKPOINT_PLOTS)).toStrictEqual(
      DEFAULT_NB_ITEMS_PER_ROW
    )

    model.setNbItemsPerRow(Section.CHECKPOINT_PLOTS, 1)

    expect(model.getNbItemsPerRow(Section.CHECKPOINT_PLOTS)).toStrictEqual(1)
  })

  it('should update the persisted plot size when calling setPlotSize', () => {
    const mementoUpdateSpy = jest.spyOn(memento, 'update')

    model.setNbItemsPerRow(Section.CHECKPOINT_PLOTS, 2)

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      PersistenceKey.PLOT_NB_ITEMS_PER_ROW + exampleDvcRoot,
      {
        ...DEFAULT_SECTION_NB_ITEMS_PER_ROW,
        [Section.CHECKPOINT_PLOTS]: 2
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
      [Section.CUSTOM_PLOTS]: false,
      [Section.COMPARISON_TABLE]: false
    }

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      PersistenceKey.PLOT_SECTION_COLLAPSED + exampleDvcRoot,
      expectedSectionCollapsed
    )

    expect(model.getSectionCollapsed()).toStrictEqual(expectedSectionCollapsed)
  })

  it('should reorder comparison revisions after receiving a message to reorder', () => {
    mockedGetSelectedRevisions.mockReturnValue(mockedRevisions)

    const mementoUpdateSpy = jest.spyOn(memento, 'update')
    const newOrder = [
      '71f31cf',
      'e93c7e6',
      'ffbe811',
      EXPERIMENT_WORKSPACE_ID,
      'main'
    ]
    model.setComparisonOrder(newOrder)

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      PersistenceKey.PLOT_COMPARISON_ORDER + exampleDvcRoot,
      newOrder
    )

    expect(
      model.getComparisonRevisions().map(({ revision }) => revision)
    ).toStrictEqual(newOrder)
  })

  it('should always send new revisions to the end of the list', () => {
    mockedGetSelectedRevisions.mockReturnValue(mockedRevisions)

    const newOrder = ['71f31cf', 'e93c7e6']

    model.setComparisonOrder(newOrder)

    expect(
      model.getComparisonRevisions().map(({ revision }) => revision)
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

    const initialOrder = [EXPERIMENT_WORKSPACE_ID, 'main', '71f31cf']
    model.setComparisonOrder(initialOrder)

    expect(
      model.getComparisonRevisions().map(({ revision }) => revision)
    ).toStrictEqual(initialOrder)

    model.setComparisonOrder()

    expect(
      model.getComparisonRevisions().map(({ revision }) => revision)
    ).toStrictEqual(initialOrder.filter(revision => revision !== 'main'))

    model.setComparisonOrder()

    expect(
      model.getComparisonRevisions().map(({ revision }) => revision)
    ).toStrictEqual([EXPERIMENT_WORKSPACE_ID, '71f31cf', 'main'])
  })
})
