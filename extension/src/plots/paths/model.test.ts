import { join } from 'path'
import { PathsModel } from './model'
import { PathType } from './collect'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'
import { buildMockMemento } from '../../test/util'
import { TemplatePlotGroup } from '../webview/contract'

describe('PathsModel', () => {
  const mockDvcRoot = 'test'

  const logsAcc = join('logs', 'acc.tsv')
  const logsLoss = join('logs', 'loss.tsv')
  const plotsAcc = join('plots', 'acc.png')

  it('should return the expected columns when given the default output fixture', () => {
    const comparisonType = new Set([PathType.COMPARISON])
    const singleType = new Set([PathType.TEMPLATE_SINGLE])
    const multiType = new Set([PathType.TEMPLATE_MULTI])

    const model = new PathsModel(mockDvcRoot, buildMockMemento())
    model.transformAndSet(plotsDiffFixture)
    expect(model.getTerminalNodes()).toStrictEqual([
      {
        hasChildren: false,
        label: 'acc.png',
        parentPath: 'plots',
        path: plotsAcc,
        selected: true,
        type: comparisonType
      },
      {
        hasChildren: false,
        label: 'heatmap.png',
        parentPath: 'plots',
        path: join('plots', 'heatmap.png'),
        selected: true,
        type: comparisonType
      },
      {
        hasChildren: false,
        label: 'loss.png',
        parentPath: 'plots',
        path: join('plots', 'loss.png'),
        selected: true,
        type: comparisonType
      },
      {
        hasChildren: false,
        label: 'loss.tsv',
        parentPath: 'logs',
        path: logsLoss,
        selected: true,
        type: singleType
      },
      {
        hasChildren: false,
        label: 'acc.tsv',
        parentPath: 'logs',
        path: logsAcc,
        selected: true,
        type: singleType
      },
      {
        hasChildren: false,
        label: 'predictions.json',
        parentPath: undefined,
        path: 'predictions.json',
        selected: true,
        type: multiType
      }
    ])
  })

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
    const model = new PathsModel(mockDvcRoot, buildMockMemento())
    model.transformAndSet(plotsDiffFixture)

    expect(model.getTemplateOrder()).toStrictEqual(originalTemplateOrder)

    model.toggleStatus(logsAcc)

    const newOrder = model.getTemplateOrder()

    expect(newOrder).toStrictEqual([logsLossGroup, multiViewGroup])

    model.toggleStatus(logsAcc)

    expect(model.getTemplateOrder()).toStrictEqual(originalTemplateOrder)
  })

  it('should move unselected plots to the end when a reordering occurs', () => {
    const model = new PathsModel(mockDvcRoot, buildMockMemento())
    model.transformAndSet(plotsDiffFixture)

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

  it('should merge template plots groups when a path is unselected', () => {
    const model = new PathsModel(mockDvcRoot, buildMockMemento())
    model.transformAndSet(plotsDiffFixture)

    model.setTemplateOrder([logsLossGroup, logsAccGroup, multiViewGroup])

    model.toggleStatus('predictions.json')

    expect(model.getTemplateOrder()).toStrictEqual([originalSingleViewGroup])
  })

  it('should retain the order of the comparison paths when changed', () => {
    const model = new PathsModel(mockDvcRoot, buildMockMemento())
    model.transformAndSet(plotsDiffFixture)

    expect(model.getComparisonPaths()).toStrictEqual([
      join('plots', 'acc.png'),
      join('plots', 'heatmap.png'),
      join('plots', 'loss.png')
    ])

    const newOrder = ['plots/heatmap.png', 'plots/acc.png', 'plots/loss.png']

    model.setComparisonPathsOrder(newOrder)

    expect(model.getComparisonPaths()).toStrictEqual(newOrder)
  })
})
