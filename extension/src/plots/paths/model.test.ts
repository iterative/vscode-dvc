import { join } from 'path'
import { PathsModel } from './model'
import { PathType } from './collect'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'
import { buildMockMemento } from '../../test/util'
import { PlotsType, TemplatePlotGroup } from '../webview/contract'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'
import { ErrorsModel } from '../errors/model'

describe('PathsModel', () => {
  const mockDvcRoot = 'test'

  const logsAcc = join('logs', 'acc.tsv')
  const logsLoss = join('logs', 'loss.tsv')
  const plotsAcc = join('plots', 'acc.png')
  const revisions = [
    EXPERIMENT_WORKSPACE_ID,
    '53c3851',
    '4fb124a',
    '42b8736',
    '1ba7bcd'
  ]

  const buildMockErrorsModel = () =>
    ({ getPathErrors: () => undefined } as unknown as ErrorsModel)

  it('should return the expected paths when given the default output fixture', () => {
    const comparisonType = new Set([PathType.COMPARISON])
    const singleType = new Set([PathType.TEMPLATE_SINGLE])
    const multiType = new Set([PathType.TEMPLATE_MULTI])

    const model = new PathsModel(
      mockDvcRoot,
      buildMockErrorsModel(),
      buildMockMemento()
    )
    model.transformAndSet(plotsDiffFixture, revisions, {})
    model.setSelectedRevisions(revisions)
    expect(model.getTerminalNodes()).toStrictEqual([
      {
        hasChildren: false,
        parentPath: 'plots',
        path: plotsAcc,
        revisions: new Set(revisions),
        selected: true,
        type: comparisonType
      },
      {
        hasChildren: false,
        parentPath: 'plots',
        path: join('plots', 'heatmap.png'),
        revisions: new Set(revisions),
        selected: true,
        type: comparisonType
      },
      {
        hasChildren: false,
        parentPath: 'plots',
        path: join('plots', 'loss.png'),
        revisions: new Set(revisions),
        selected: true,
        type: comparisonType
      },
      {
        hasChildren: false,
        parentPath: 'logs',
        path: logsLoss,
        revisions: new Set(revisions),
        selected: true,
        type: singleType
      },
      {
        hasChildren: false,
        parentPath: 'logs',
        path: logsAcc,
        revisions: new Set(revisions),
        selected: true,
        type: singleType
      },
      {
        hasChildren: false,
        parentPath: undefined,
        path: 'predictions.json',
        revisions: new Set(revisions),
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
          content: {},
          datapoints: {
            [commitBeforePlots]: [
              {
                loss: '2.29',
                step: '0'
              },
              {
                loss: '2.27',
                step: '1'
              },
              {
                loss: '2.25',
                step: '2'
              }
            ]
          },
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
    model.transformAndSet(plotsDiffFixture, revisions, {})
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
    model.transformAndSet(plotsDiffFixture, revisions, {})
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
    model.transformAndSet(plotsDiffFixture, revisions, {})
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
      [...revisions, commitBeforePlots],
      {}
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
      [...revisions, commitBeforePlots],
      {}
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

    model.transformAndSet(plotsDiffFixture, revisions, {})
    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    expect(model.getTemplateOrder()).toStrictEqual(originalTemplateOrder)

    model.transformAndSet(previousPlotFixture, [commitBeforePlots], {})
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
    model.transformAndSet(plotsDiffFixture, revisions, {})
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
    model.transformAndSet(plotsDiffFixture, revisions, {})
    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    expect(model.getComparisonPaths()).toStrictEqual([
      join('plots', 'acc.png'),
      join('plots', 'heatmap.png'),
      join('plots', 'loss.png')
    ])

    const newOrder = [
      join('plots', 'heatmap.png'),
      join('plots', 'acc.png'),
      join('plots', 'loss.png')
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
    model.transformAndSet(plotsDiffFixture, revisions, {})
    model.setSelectedRevisions([EXPERIMENT_WORKSPACE_ID])

    const rootChildren = model.getChildren(undefined, {
      'predictions.json': {
        strokeDash: { field: '', scale: { domain: [], range: [] } }
      }
    })

    expect(rootChildren).toStrictEqual([
      {
        descendantStatuses: [2, 2, 2],
        hasChildren: true,
        parentPath: undefined,
        path: 'plots',
        revisions: new Set(revisions),
        status: 2,
        tooltip: undefined
      },
      {
        descendantStatuses: [2, 2],
        hasChildren: true,
        parentPath: undefined,
        path: 'logs',
        revisions: new Set(revisions),
        status: 2,
        tooltip: undefined
      },
      {
        descendantStatuses: [],
        hasChildren: false,
        parentPath: undefined,
        path: 'predictions.json',
        revisions: new Set(revisions),
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
        parentPath: 'logs',
        path: logsLoss,
        revisions: new Set(revisions),
        status: 2,
        tooltip: undefined,
        type: new Set([PathType.TEMPLATE_SINGLE])
      },
      {
        descendantStatuses: [],
        hasChildren: false,
        parentPath: 'logs',
        path: logsAcc,
        revisions: new Set(revisions),
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
        parentPath: 'logs',
        path: logsLoss,
        revisions: new Set(revisions),
        status: 2,
        tooltip: undefined,
        type: new Set([PathType.TEMPLATE_SINGLE])
      },
      {
        descendantStatuses: [],
        hasChildren: true,
        parentPath: 'logs',
        path: logsAcc,
        revisions: new Set(revisions),
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
      [EXPERIMENT_WORKSPACE_ID],
      {}
    )

    expect(model.getTerminalNodes()).toStrictEqual([])
  })
})
