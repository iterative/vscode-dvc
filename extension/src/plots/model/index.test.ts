import { PlotsModel } from '.'
import {
  DEFAULT_NB_ITEMS_PER_ROW,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH,
  PlotsSection
} from '../webview/contract'
import { buildMockMemento } from '../../test/util'
import { Experiments } from '../../experiments'
import { PersistenceKey } from '../../persistence/constants'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'
import { customPlotsOrderFixture } from '../../test/fixtures/expShow/base/customPlots'
import { ErrorsModel } from '../errors/model'

const mockedSelectedRevisions = [
  {
    displayColor: 'white',
    id: EXPERIMENT_WORKSPACE_ID,
    label: EXPERIMENT_WORKSPACE_ID
  },
  { displayColor: 'red', id: 'main', label: 'main' },
  { displayColor: 'blue', id: '71f31cf', label: '71f31cf' },
  { displayColor: 'black', id: 'e93c7e6', label: 'e93c7e6' },
  { displayColor: 'brown', id: 'ffbe811', label: 'ffbe811' }
]

describe('plotsModel', () => {
  let model: PlotsModel
  const exampleDvcRoot = 'test'
  let memento = buildMockMemento({
    [PersistenceKey.PLOTS_CUSTOM_ORDER + exampleDvcRoot]:
      customPlotsOrderFixture,
    [PersistenceKey.PLOT_NB_ITEMS_PER_ROW_OR_WIDTH + exampleDvcRoot]:
      DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH
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
      {
        getImageErrors: () => undefined,
        getRevisionErrors: () => undefined
      } as unknown as ErrorsModel,
      memento
    )
    jest.clearAllMocks()
  })

  it('should update outdated custom and trends state', () => {
    memento = buildMockMemento({
      [PersistenceKey.PLOTS_CUSTOM_ORDER + exampleDvcRoot]: [
        {
          metric: 'metrics:summary.json:loss',
          param: 'params:params.yaml:dropout'
        }
      ],
      [PersistenceKey.PLOT_SELECTED_METRICS + exampleDvcRoot]: ['string'],
      [PersistenceKey.PLOT_METRIC_ORDER + exampleDvcRoot]: ['string']
    })
    model = new PlotsModel(
      exampleDvcRoot,
      {
        getFirstThreeColumnOrder: mockedGetFirstThreeColumnOrder,
        getSelectedRevisions: mockedGetSelectedRevisions,
        isReady: () => Promise.resolve(undefined)
      } as unknown as Experiments,
      { getImageErrors: () => undefined } as unknown as ErrorsModel,
      memento
    )
    expect(model.getCustomPlotsOrder()).toStrictEqual([
      {
        metric: 'summary.json:loss',
        param: 'params.yaml:dropout'
      }
    ])
    expect(
      memento.get(PersistenceKey.PLOT_SELECTED_METRICS + exampleDvcRoot)
    ).toStrictEqual(undefined)
    expect(
      memento.get(PersistenceKey.PLOT_METRIC_ORDER + exampleDvcRoot)
    ).toStrictEqual(undefined)
  })

  it('should change the plotSize when calling setPlotSize', () => {
    expect(
      model.getNbItemsPerRowOrWidth(PlotsSection.CUSTOM_PLOTS)
    ).toStrictEqual(DEFAULT_NB_ITEMS_PER_ROW)

    model.setNbItemsPerRowOrWidth(PlotsSection.CUSTOM_PLOTS, 1)

    expect(
      model.getNbItemsPerRowOrWidth(PlotsSection.CUSTOM_PLOTS)
    ).toStrictEqual(1)
  })

  it('should update the persisted plot size when calling setPlotSize', () => {
    const mementoUpdateSpy = jest.spyOn(memento, 'update')

    model.setNbItemsPerRowOrWidth(PlotsSection.CUSTOM_PLOTS, 2)

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      PersistenceKey.PLOT_NB_ITEMS_PER_ROW_OR_WIDTH + exampleDvcRoot,
      {
        ...DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH,
        [PlotsSection.CUSTOM_PLOTS]: 2
      }
    )
  })

  it('should update the persisted collapsible section state when calling setSectionCollapsed', () => {
    const mementoUpdateSpy = jest.spyOn(memento, 'update')

    expect(model.getSectionCollapsed()).toStrictEqual(DEFAULT_SECTION_COLLAPSED)

    model.setSectionCollapsed({ [PlotsSection.CUSTOM_PLOTS]: true })

    const expectedSectionCollapsed = {
      [PlotsSection.TEMPLATE_PLOTS]: false,
      [PlotsSection.CUSTOM_PLOTS]: true,
      [PlotsSection.COMPARISON_TABLE]: false
    }

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      PersistenceKey.PLOT_SECTION_COLLAPSED + exampleDvcRoot,
      expectedSectionCollapsed
    )

    expect(model.getSectionCollapsed()).toStrictEqual(expectedSectionCollapsed)
  })

  it('should reorder comparison revisions after receiving a message to reorder', () => {
    mockedGetSelectedRevisions.mockReturnValue(mockedSelectedRevisions)

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
      model.getComparisonRevisions().map(({ label }) => label)
    ).toStrictEqual(newOrder)
  })

  it('should always send new revisions to the end of the list', () => {
    mockedGetSelectedRevisions.mockReturnValue(mockedSelectedRevisions)

    const newOrder = ['71f31cf', 'e93c7e6']

    model.setComparisonOrder(newOrder)

    expect(
      model.getComparisonRevisions().map(({ label }) => label)
    ).toStrictEqual([
      ...newOrder,
      ...mockedSelectedRevisions
        .map(({ id }) => id)
        .filter(revision => !newOrder.includes(revision))
    ])
  })

  it('should send previously selected revisions to the end of the list', () => {
    const allRevisions = mockedSelectedRevisions.slice(0, 3)
    const revisionDropped = allRevisions.filter(({ id }) => id !== 'main')
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
      model.getComparisonRevisions().map(({ label }) => label)
    ).toStrictEqual(initialOrder)

    model.setComparisonOrder()

    expect(
      model.getComparisonRevisions().map(({ label }) => label)
    ).toStrictEqual(initialOrder.filter(revision => revision !== 'main'))

    model.setComparisonOrder()

    expect(
      model.getComparisonRevisions().map(({ label }) => label)
    ).toStrictEqual([EXPERIMENT_WORKSPACE_ID, '71f31cf', 'main'])
  })
})
