import { join } from 'path'
import type { TopLevelSpec } from 'vega-lite'
import { PathsModel } from './model'
import { PathType } from './collect'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'
import { buildMockMemento } from '../../test/util'
import { TemplatePlotGroup } from '../webview/contract'
import {
  PLOT_DATA_ANCHOR,
  EXPERIMENT_WORKSPACE_ID,
  PlotsType
} from '../../cli/dvc/contract'
import { ErrorsModel } from '../errors/model'
import { REVISIONS } from '../../test/fixtures/plotsDiff'
import { PersistenceKey } from '../../persistence/constants'
import { Status } from '../../path/selection/model'

describe('PathsModel', () => {
  const mockDvcRoot = 'test'

  const logsAcc = join('logs', 'acc.tsv')
  const logsLoss = join('logs', 'loss.tsv')
  const plotsAcc = join('plots', 'acc.png')

  const buildMockErrorsModel = () =>
    ({
      getCliError: () => undefined,
      getPathErrors: () => undefined,
      hasCliError: () => undefined
    }) as unknown as ErrorsModel

  it('should return the expected paths when given the default output fixture', () => {
    const comparisonType = new Set([PathType.COMPARISON])
    const singleType = new Set([PathType.TEMPLATE_SINGLE])
    const multiType = new Set([PathType.TEMPLATE_MULTI])

    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )
    model.transformAndSet(plotsDiffFixture, REVISIONS)
    model.setSelectedRevisions(REVISIONS)
    expect(model.getTerminalNodes()).toStrictEqual([
      {
        hasChildren: false,
        label: 'acc.png',
        parentPath: 'plots',
        path: plotsAcc,
        revisions: new Set(REVISIONS),
        selected: true,
        type: comparisonType
      },
      {
        hasChildren: false,
        label: 'heatmap.png',
        parentPath: 'plots',
        path: join('plots', 'heatmap.png'),
        revisions: new Set(REVISIONS),
        selected: true,
        type: comparisonType
      },
      {
        hasChildren: false,
        label: 'loss.png',
        parentPath: 'plots',
        path: join('plots', 'loss.png'),
        revisions: new Set(REVISIONS),
        selected: true,
        type: comparisonType
      },
      {
        hasChildren: false,
        label: 'image',
        parentPath: 'plots',
        path: join('plots', 'image'),
        revisions: new Set(REVISIONS),
        selected: true,
        type: comparisonType
      },
      {
        hasChildren: false,
        label: 'loss.tsv',
        parentPath: 'logs',
        path: logsLoss,
        revisions: new Set(REVISIONS),
        selected: true,
        type: singleType
      },
      {
        hasChildren: false,
        label: 'acc.tsv',
        parentPath: 'logs',
        path: logsAcc,
        revisions: new Set(REVISIONS),
        selected: true,
        type: singleType
      },
      {
        hasChildren: false,
        label: 'predictions.json',
        parentPath: undefined,
        path: 'predictions.json',
        revisions: new Set(REVISIONS),
        selected: true,
        type: multiType
      }
    ])
  })

  const commitBeforePlots = '4c4318d'
  const previousPlotPath = join('dvclive', 'plots', 'metrics', 'loss.tsv')
  const previousPlotFixture = {
    data: {
      [previousPlotPath]: [
        {
          anchor_definitions: {
            [PLOT_DATA_ANCHOR]: [
              {
                loss: '2.29',
                rev: commitBeforePlots,
                step: '0'
              },
              {
                loss: '2.27',
                rev: commitBeforePlots,
                step: '1'
              },
              {
                loss: '2.25',
                rev: commitBeforePlots,
                step: '2'
              }
            ]
          },
          content: {} as TopLevelSpec,
          revisions: [commitBeforePlots],
          type: PlotsType.VEGA
        }
      ]
    }
  }

  const multiViewGroup = {
    group: TemplatePlotGroup.MULTI_VIEW,
    paths: ['predictions.json']
  }
  const originalSingleViewGroup = {
    group: TemplatePlotGroup.SINGLE_VIEW,
    paths: [logsLoss, logsAcc]
  }

  const logsAccGroup = {
    group: TemplatePlotGroup.SINGLE_VIEW,
    paths: [logsAcc]
  }

  const logsLossGroup = {
    group: TemplatePlotGroup.SINGLE_VIEW,
    paths: [logsLoss]
  }

  const originalTemplateOrder = [originalSingleViewGroup, multiViewGroup]

  it('should retain the order of template paths when they are unselected', () => {
    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )
    model.transformAndSet(plotsDiffFixture, REVISIONS)
    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    expect(model.getTemplateOrder()).toStrictEqual(originalTemplateOrder)

    model.toggleStatus(logsAcc)

    const newOrder = model.getTemplateOrder()

    expect(newOrder).toStrictEqual([logsLossGroup, multiViewGroup])

    model.toggleStatus(logsAcc)

    expect(model.getTemplateOrder()).toStrictEqual(originalTemplateOrder)
  })

  it('should move unselected plots to the end when a reordering occurs', () => {
    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )
    model.transformAndSet(plotsDiffFixture, REVISIONS)
    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    expect(model.getTemplateOrder()).toStrictEqual(originalTemplateOrder)

    model.toggleStatus(logsAcc)

    const newOrder = model.getTemplateOrder()

    expect(newOrder).toStrictEqual([logsLossGroup, multiViewGroup])

    model.setTemplateOrder([multiViewGroup, logsLossGroup])

    model.toggleStatus(logsAcc)

    expect(model.getTemplateOrder()).toStrictEqual([
      multiViewGroup,
      {
        group: TemplatePlotGroup.SINGLE_VIEW,
        paths: [logsLoss, logsAcc]
      }
    ])
  })

  it('should not update the order of plots when there are no revisions selected', () => {
    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )
    model.transformAndSet(plotsDiffFixture, REVISIONS)
    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    expect(model.getTemplateOrder()).toStrictEqual(originalTemplateOrder)

    model.setSelectedRevisions([])
    expect(model.getTemplateOrder()).toStrictEqual([])

    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    expect(model.getTemplateOrder()).toStrictEqual(originalTemplateOrder)

    const newOrder = [logsAccGroup, multiViewGroup, logsLossGroup]

    model.setTemplateOrder(newOrder)

    expect(model.getTemplateOrder()).toStrictEqual(newOrder)

    model.setSelectedRevisions([])
    expect(model.getTemplateOrder()).toStrictEqual([])

    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    expect(model.getTemplateOrder()).toStrictEqual(newOrder)
  })

  it('should not move plots which do not have the selected revisions if no reordering occurs', () => {
    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )

    model.transformAndSet(
      { data: { ...plotsDiffFixture.data, ...previousPlotFixture.data } },
      [...REVISIONS, commitBeforePlots]
    )

    const expectedOrderAllRevisions = [
      {
        ...originalSingleViewGroup,
        paths: [...originalSingleViewGroup.paths, previousPlotPath]
      },
      multiViewGroup
    ]

    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    expect(model.getTemplateOrder()).toStrictEqual(originalTemplateOrder)

    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID, commitBeforePlots])

    expect(model.getTemplateOrder()).toStrictEqual(expectedOrderAllRevisions)

    model.setSelectedRevisions([commitBeforePlots])

    expect(model.getTemplateOrder()).toStrictEqual([
      {
        group: TemplatePlotGroup.SINGLE_VIEW,
        paths: [previousPlotPath]
      }
    ])

    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID, commitBeforePlots])

    expect(model.getTemplateOrder()).toStrictEqual(expectedOrderAllRevisions)
  })

  it('should move plots which do not have selected revisions to the end when a reordering occurs', () => {
    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )
    model.transformAndSet(
      { data: { ...plotsDiffFixture.data, ...previousPlotFixture.data } },
      [...REVISIONS, commitBeforePlots]
    )
    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    expect(model.getTemplateOrder()).toStrictEqual(originalTemplateOrder)

    model.setTemplateOrder([logsLossGroup, multiViewGroup, logsAccGroup])

    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID, commitBeforePlots])

    expect(model.getTemplateOrder()).toStrictEqual([
      logsLossGroup,
      multiViewGroup,
      {
        group: TemplatePlotGroup.SINGLE_VIEW,
        paths: [logsAcc, previousPlotPath]
      }
    ])
  })

  it('should move newly collected plot paths to the end', () => {
    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )

    model.transformAndSet(plotsDiffFixture, REVISIONS)
    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    expect(model.getTemplateOrder()).toStrictEqual(originalTemplateOrder)

    model.transformAndSet(previousPlotFixture, [commitBeforePlots])
    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID, commitBeforePlots])

    expect(model.getTemplateOrder()).toStrictEqual([
      ...originalTemplateOrder,
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: [previousPlotPath] }
    ])
  })

  it('should merge template plots groups when a path is unselected', () => {
    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )
    model.transformAndSet(plotsDiffFixture, REVISIONS)
    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    model.setTemplateOrder([logsLossGroup, logsAccGroup, multiViewGroup])

    model.toggleStatus('predictions.json')

    expect(model.getTemplateOrder()).toStrictEqual([originalSingleViewGroup])
  })

  it('should retain the order of the comparison paths when changed', () => {
    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )
    model.transformAndSet(plotsDiffFixture, REVISIONS)
    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    expect(model.getComparisonPaths()).toStrictEqual([
      join('plots', 'acc.png'),
      join('plots', 'heatmap.png'),
      join('plots', 'loss.png'),
      join('plots', 'image')
    ])

    const newOrder = [
      join('plots', 'heatmap.png'),
      join('plots', 'acc.png'),
      join('plots', 'loss.png'),
      join('plots', 'image')
    ]

    model.setComparisonPathsOrder(newOrder)

    expect(model.getComparisonPaths()).toStrictEqual(newOrder)
  })

  it('should return the expected children from the test fixture', () => {
    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )
    model.transformAndSet(plotsDiffFixture, REVISIONS)
    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    const rootChildren = model.getChildren(undefined, {
      'predictions.json': {
        strokeDash: { field: '', scale: { domain: [], range: [] } }
      }
    })

    expect(rootChildren).toStrictEqual([
      {
        descendantStatuses: [2, 2],
        hasChildren: true,
        label: 'logs',
        parentPath: undefined,
        path: 'logs',
        revisions: new Set(REVISIONS),
        status: 2,
        tooltip: undefined
      },
      {
        descendantStatuses: [2, 2, 2, 2],
        hasChildren: true,
        label: 'plots',
        parentPath: undefined,
        path: 'plots',
        revisions: new Set(REVISIONS),
        status: 2,
        tooltip: undefined
      },
      {
        descendantStatuses: [],
        hasChildren: false,
        label: 'predictions.json',
        parentPath: undefined,
        path: 'predictions.json',
        revisions: new Set(REVISIONS),
        status: 2,
        tooltip: undefined,
        type: new Set([PathType.TEMPLATE_MULTI])
      }
    ])

    const directoryChildren = model.getChildren('logs')
    expect(directoryChildren).toStrictEqual([
      {
        descendantStatuses: [],
        hasChildren: false,
        label: 'acc.tsv',
        parentPath: 'logs',
        path: logsAcc,
        revisions: new Set(REVISIONS),
        status: 2,
        tooltip: undefined,
        type: new Set([PathType.TEMPLATE_SINGLE])
      },
      {
        descendantStatuses: [],
        hasChildren: false,
        label: 'loss.tsv',
        parentPath: 'logs',
        path: logsLoss,
        revisions: new Set(REVISIONS),
        status: 2,
        tooltip: undefined,
        type: new Set([PathType.TEMPLATE_SINGLE])
      }
    ])

    const plotsWithEncoding = model.getChildren('logs', {
      [logsAcc]: {
        strokeDash: { field: '', scale: { domain: [], range: [] } }
      },
      [logsLoss]: {
        strokeDash: { field: '', scale: { domain: [], range: [] } }
      }
    })
    expect(plotsWithEncoding).toStrictEqual([
      {
        descendantStatuses: [],
        hasChildren: true,
        label: 'acc.tsv',
        parentPath: 'logs',
        path: logsAcc,
        revisions: new Set(REVISIONS),
        status: 2,
        tooltip: undefined,
        type: new Set([PathType.TEMPLATE_SINGLE])
      },
      {
        descendantStatuses: [],
        hasChildren: true,
        label: 'loss.tsv',
        parentPath: 'logs',
        path: logsLoss,
        revisions: new Set(REVISIONS),
        status: 2,
        tooltip: undefined,
        type: new Set([PathType.TEMPLATE_SINGLE])
      }
    ])

    const noChildren = model.getChildren(logsLoss)
    expect(noChildren).toStrictEqual([])
  })

  it('should not provide error as a path when the CLI throws an error', () => {
    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )
    model.transformAndSet(
      {
        error: {
          msg: 'UNEXPECTED ERROR: a strange thing happened',
          type: 'Caught Error'
        }
      },
      [EXPERIMENT_WORKSPACE_ID]
    )

    expect(model.getTerminalNodes()).toStrictEqual([])
  })

  it('should not change hasCustomSelection when checking for if it is already defined', () => {
    const memento = buildMockMemento({
      [PersistenceKey.PLOTS_HAS_CUSTOM_SELECTION + mockDvcRoot]: true
    })
    const model = new PathsModel(mockDvcRoot, buildMockErrorsModel(), memento)
    const setHasCustomSelectionSpy = jest.spyOn(model, 'setHasCustomSelection')

    model.checkIfHasPreviousCustomSelection()
    expect(setHasCustomSelectionSpy).not.toHaveBeenCalled()
  })

  it('should set hasCustomSelection to false if there are less than 20 plots', () => {
    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )
    const setHasCustomSelectionSpy = jest.spyOn(model, 'setHasCustomSelection')
    jest
      .spyOn(model, 'getTerminalNodeStatuses')
      .mockImplementation(() => [
        Status.SELECTED,
        Status.SELECTED,
        Status.SELECTED,
        Status.SELECTED
      ])

    model.checkIfHasPreviousCustomSelection()
    expect(setHasCustomSelectionSpy).toHaveBeenCalledWith(false)
  })

  it('should set hasCustomSelection to false if there are 20 selected plots', () => {
    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )
    const setHasCustomSelectionSpy = jest.spyOn(model, 'setHasCustomSelection')
    const statuses = [Status.UNSELECTED]
    for (let i = 0; i < 20; i++) {
      statuses.push(Status.SELECTED)
    }
    statuses.push(Status.UNSELECTED)
    jest
      .spyOn(model, 'getTerminalNodeStatuses')
      .mockImplementation(() => statuses)

    model.checkIfHasPreviousCustomSelection()
    expect(setHasCustomSelectionSpy).toHaveBeenCalledWith(false)
  })

  it('should set hasCustomSelection to true if there are more than 20 plots and the number of selected plots is not 20', () => {
    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )
    const setHasCustomSelectionSpy = jest.spyOn(model, 'setHasCustomSelection')
    const statuses = [Status.UNSELECTED]
    for (let i = 0; i < 19; i++) {
      statuses.push(Status.SELECTED)
    }
    statuses.push(Status.UNSELECTED)
    jest
      .spyOn(model, 'getTerminalNodeStatuses')
      .mockImplementation(() => statuses)

    model.checkIfHasPreviousCustomSelection()
    expect(setHasCustomSelectionSpy).toHaveBeenCalledWith(true)
  })
})
