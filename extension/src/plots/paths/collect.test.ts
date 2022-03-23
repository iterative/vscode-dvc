import { join } from 'path'
import { VisualizationSpec } from 'react-vega'
import { collectPaths, collectTemplateOrder } from './collect'
import { PlotsGroup, PlotsType } from '../webview/contract'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'

describe('collectPath', () => {
  it('should return the expected data from the test fixture', () => {
    expect(collectPaths(plotsDiffFixture)).toStrictEqual([
      {
        hasChildren: false,
        parentPath: 'plots',
        path: join('plots', 'acc.png'),
        type: new Set(['comparison'])
      },
      { hasChildren: true, parentPath: undefined, path: 'plots' },
      {
        hasChildren: false,
        parentPath: 'plots',
        path: join('plots', 'heatmap.png'),
        type: new Set(['comparison'])
      },
      {
        hasChildren: false,
        parentPath: 'plots',
        path: join('plots', 'loss.png'),
        type: new Set(['comparison'])
      },
      {
        hasChildren: false,
        parentPath: 'logs',
        path: join('logs', 'loss.tsv'),
        type: new Set(['template-single'])
      },
      { hasChildren: true, parentPath: undefined, path: 'logs' },
      {
        hasChildren: false,
        parentPath: 'logs',
        path: join('logs', 'acc.tsv'),
        type: new Set(['template-single'])
      },
      {
        hasChildren: false,
        parentPath: undefined,
        path: 'predictions.json',
        type: new Set(['template-multi'])
      }
    ])
  })

  it('should handle more complex paths', () => {
    const mockPlotsDiff = {
      [join('logs', 'scalars', 'acc.tsv')]: [
        {
          content: {},
          revisions: ['workspace'],
          type: PlotsType.VEGA
        }
      ],
      [join('logs', 'scalars', 'loss.tsv')]: [
        {
          content: {},
          revisions: ['workspace'],
          type: PlotsType.VEGA
        }
      ],
      [join('plots', 'heatmap.png')]: [
        {
          revisions: ['workspace'],
          type: PlotsType.IMAGE,
          url: join('plots', 'heatmap.png')
        }
      ],
      'predictions.json': [
        {
          content: {
            facet: { field: 'rev', type: 'nominal' }
          } as VisualizationSpec,
          revisions: ['workspace'],
          type: PlotsType.VEGA
        }
      ]
    }

    expect(collectPaths(mockPlotsDiff)).toStrictEqual([
      {
        hasChildren: false,
        parentPath: join('logs', 'scalars'),
        path: join('logs', 'scalars', 'acc.tsv'),
        type: new Set(['template-single'])
      },
      { hasChildren: true, parentPath: 'logs', path: join('logs', 'scalars') },
      { hasChildren: true, parentPath: undefined, path: 'logs' },
      {
        hasChildren: false,
        parentPath: join('logs', 'scalars'),
        path: join('logs', 'scalars', 'loss.tsv'),
        type: new Set(['template-single'])
      },
      {
        hasChildren: false,
        parentPath: 'plots',
        path: join('plots', 'heatmap.png'),
        type: new Set(['comparison'])
      },
      { hasChildren: true, parentPath: undefined, path: 'plots' },
      {
        hasChildren: false,
        parentPath: undefined,
        path: 'predictions.json',
        type: new Set(['template-multi'])
      }
    ])
  })
})

describe('collectTemplateOrder', () => {
  it('should collect the expected data structure when only single view paths as provided', () => {
    const singleViewPaths = [
      join('plots', 'acc.tsv'),
      join('plots', 'loss.tsv')
    ]
    const multiViewPaths: string[] = []

    const plotSections = collectTemplateOrder(
      singleViewPaths,
      multiViewPaths,
      []
    )

    expect(plotSections).toStrictEqual([
      { group: PlotsGroup.SINGLE_VIEW, paths: singleViewPaths }
    ])
  })

  it('should collect the expected data structure when only multi view paths as provided', () => {
    const singleViewPaths: string[] = []
    const multiViewPaths: string[] = [
      join('plots', 'predictions.json'),
      join('plots', 'inferred.json')
    ]

    const plotSections = collectTemplateOrder(
      singleViewPaths,
      multiViewPaths,
      []
    )

    expect(plotSections).toStrictEqual([
      { group: PlotsGroup.MULTI_VIEW, paths: multiViewPaths }
    ])
  })

  it('should retain the given order when given only single view paths', () => {
    const firstPlot = join('plots', 'acc.tsv')
    const lastPlot = join('plots', 'loss.tsv')
    const plotOrder = [firstPlot, lastPlot]

    const singleViewPaths: string[] = [lastPlot, firstPlot]
    const multiViewPaths: string[] = []

    const plotSections = collectTemplateOrder(singleViewPaths, multiViewPaths, [
      { group: PlotsGroup.SINGLE_VIEW, paths: plotOrder }
    ])

    expect(singleViewPaths).not.toStrictEqual(plotOrder)

    expect(plotSections).toStrictEqual([
      { group: PlotsGroup.SINGLE_VIEW, paths: plotOrder }
    ])
  })

  it('should retain the given order of the paths', () => {
    const firstSingleViewPlot = join('plots', 'acc.tsv')
    const lastSingleViewPlot = join('plots', 'loss.tsv')
    const singleViewOrder = [firstSingleViewPlot, lastSingleViewPlot]

    const singleViewPaths: string[] = [lastSingleViewPlot, firstSingleViewPlot]

    const firstMultiViewPlot = join('plots', 'confusion-matrix.json')
    const middleMultiViewPlot = join(
      'plots',
      'confusion-matrix-normalized.json'
    )
    const lastMultiViewPlot = join('plots', 'losses.json')
    const multiViewOrder = [
      firstMultiViewPlot,
      middleMultiViewPlot,
      lastMultiViewPlot
    ]

    const multiViewPaths: string[] = [
      middleMultiViewPlot,
      lastMultiViewPlot,
      firstMultiViewPlot
    ]

    const plotSections = collectTemplateOrder(singleViewPaths, multiViewPaths, [
      { group: PlotsGroup.SINGLE_VIEW, paths: singleViewOrder },
      { group: PlotsGroup.MULTI_VIEW, paths: multiViewOrder }
    ])

    expect(singleViewPaths).not.toStrictEqual(singleViewOrder)
    expect(multiViewPaths).not.toStrictEqual(multiViewOrder)

    expect(plotSections).toStrictEqual([
      { group: PlotsGroup.SINGLE_VIEW, paths: singleViewOrder },
      { group: PlotsGroup.MULTI_VIEW, paths: multiViewOrder }
    ])
  })

  it('should drop paths that are not provided from the order', () => {
    const includedSingleViewPlot = join('plots', 'acc.tsv')
    const excludedSingleViewPlot = join('plots', 'loss.tsv')
    const singleViewOrder = [includedSingleViewPlot, excludedSingleViewPlot]

    const singleViewPaths: string[] = [includedSingleViewPlot]

    const includedMultiViewPlot = join('plots', 'confusion-matrix.json')
    const excludedMultiViewPlot = join(
      'plots',
      'confusion-matrix-normalized.json'
    )
    const otherExcludedMultiViewPlot = join('plots', 'losses.json')
    const multiViewOrder = [
      includedMultiViewPlot,
      excludedMultiViewPlot,
      otherExcludedMultiViewPlot
    ]

    const multiViewPaths: string[] = [includedMultiViewPlot]

    const plotSections = collectTemplateOrder(singleViewPaths, multiViewPaths, [
      { group: PlotsGroup.SINGLE_VIEW, paths: singleViewOrder },
      { group: PlotsGroup.MULTI_VIEW, paths: multiViewOrder }
    ])

    expect(singleViewPaths).not.toStrictEqual(singleViewOrder)
    expect(multiViewPaths).not.toStrictEqual(multiViewOrder)

    expect(plotSections).toStrictEqual([
      { group: PlotsGroup.SINGLE_VIEW, paths: singleViewPaths },
      { group: PlotsGroup.MULTI_VIEW, paths: multiViewPaths }
    ])
  })

  it('should add plots that do not exist in the order to the end', () => {
    const existingSingleViewPlot = join('plots', 'acc.tsv')
    const newSingleViewPlot = join('plots', 'loss.tsv')
    const singleViewOrder = [existingSingleViewPlot]

    const singleViewPaths: string[] = [
      newSingleViewPlot,
      existingSingleViewPlot
    ]

    const firstNewMultiViewPlot = join('plots', 'confusion-matrix.json')
    const secondNewMultiViewPlot = join(
      'plots',
      'confusion-matrix-normalized.json'
    )
    const existingMultiViewPlot = join('plots', 'losses.json')
    const multiViewOrder = [existingMultiViewPlot]

    const multiViewPaths: string[] = [
      existingMultiViewPlot,
      firstNewMultiViewPlot,
      secondNewMultiViewPlot
    ]

    const plotSections = collectTemplateOrder(singleViewPaths, multiViewPaths, [
      { group: PlotsGroup.SINGLE_VIEW, paths: singleViewOrder },
      { group: PlotsGroup.MULTI_VIEW, paths: multiViewOrder }
    ])

    expect(singleViewPaths).not.toStrictEqual(singleViewOrder)
    expect(multiViewPaths).not.toStrictEqual(multiViewOrder)

    expect(plotSections).toStrictEqual([
      { group: PlotsGroup.SINGLE_VIEW, paths: singleViewOrder },
      { group: PlotsGroup.MULTI_VIEW, paths: multiViewOrder },
      { group: PlotsGroup.SINGLE_VIEW, paths: [newSingleViewPlot] },
      {
        group: PlotsGroup.MULTI_VIEW,
        paths: [firstNewMultiViewPlot, secondNewMultiViewPlot]
      }
    ])
  })
})
