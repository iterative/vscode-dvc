import { join, sep } from 'path'
import { VisualizationSpec } from 'react-vega'
import isEqual from 'lodash.isequal'
import {
  collectEncodingElements,
  collectPaths,
  collectTemplateOrder,
  EncodingType,
  PathType
} from './collect'
import { TemplatePlotGroup, PlotsType } from '../webview/contract'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'
import { Shape, StrokeDash } from '../multiSource/constants'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'

describe('collectPath', () => {
  const revisions = [
    EXPERIMENT_WORKSPACE_ID,
    '53c3851',
    '4fb124a',
    '42b8736',
    '1ba7bcd'
  ]
  it('should return the expected data from the test fixture', () => {
    expect(collectPaths([], plotsDiffFixture, revisions, {})).toStrictEqual([
      {
        hasChildren: false,
        label: 'acc.png',
        parentPath: 'plots',
        path: join('plots', 'acc.png'),
        revisions: new Set(revisions),
        type: new Set(['comparison'])
      },
      {
        hasChildren: true,
        label: 'plots',
        parentPath: undefined,
        path: 'plots',
        revisions: new Set(revisions)
      },
      {
        hasChildren: false,
        label: 'heatmap.png',
        parentPath: 'plots',
        path: join('plots', 'heatmap.png'),
        revisions: new Set(revisions),
        type: new Set(['comparison'])
      },
      {
        hasChildren: false,
        label: 'loss.png',
        parentPath: 'plots',
        path: join('plots', 'loss.png'),
        revisions: new Set(revisions),
        type: new Set(['comparison'])
      },
      {
        hasChildren: false,
        label: 'loss.tsv',
        parentPath: 'logs',
        path: join('logs', 'loss.tsv'),
        revisions: new Set(revisions),
        type: new Set(['template-single'])
      },
      {
        hasChildren: true,
        label: 'logs',
        parentPath: undefined,
        path: 'logs',
        revisions: new Set(revisions)
      },
      {
        hasChildren: false,
        label: 'acc.tsv',
        parentPath: 'logs',
        path: join('logs', 'acc.tsv'),
        revisions: new Set(revisions),
        type: new Set(['template-single'])
      },
      {
        hasChildren: false,
        label: 'predictions.json',
        parentPath: undefined,
        path: 'predictions.json',
        revisions: new Set(revisions),
        type: new Set(['template-multi'])
      }
    ])
  })

  it('should update the revision details when the workspace is recollected (plots in workspace changed)', () => {
    const [remainingPath] = Object.keys(plotsDiffFixture)
    const collectedPaths = collectPaths([], plotsDiffFixture, revisions, {})
    expect(
      collectedPaths.filter(path => path.revisions.has(EXPERIMENT_WORKSPACE_ID))
    ).toHaveLength(collectedPaths.length)

    const updatedPaths = collectPaths(
      collectedPaths,
      {
        [remainingPath]: [
          {
            content: {},
            datapoints: {
              [EXPERIMENT_WORKSPACE_ID]: [
                {
                  loss: '2.43323',
                  step: '0'
                }
              ]
            },
            revisions: [EXPERIMENT_WORKSPACE_ID],
            type: PlotsType.VEGA
          }
        ]
      },
      [EXPERIMENT_WORKSPACE_ID],
      {}
    )

    expect(
      updatedPaths.filter(path => path.revisions.has(EXPERIMENT_WORKSPACE_ID))
    ).toHaveLength(remainingPath.split(sep).length)
  })

  it('should not drop already collected paths', () => {
    const mockPath = 'completely:madeup:path'
    const mockPlotPath = {
      hasChildren: false,
      label: mockPath,
      parentPath: undefined,
      path: mockPath,
      revisions: new Set(['bfc7f64']),
      type: new Set([PathType.TEMPLATE_SINGLE])
    }

    const paths = collectPaths(
      [mockPlotPath],
      plotsDiffFixture,
      ['bfc7f64'],
      {}
    )

    expect(paths.some(plotPath => isEqual(plotPath, mockPlotPath))).toBeTruthy()
  })

  it('should handle more complex paths', () => {
    const revisions = [EXPERIMENT_WORKSPACE_ID]
    const mockPlotsDiff = {
      [join('logs', 'scalars', 'acc.tsv')]: [
        {
          content: {},
          datapoints: { [EXPERIMENT_WORKSPACE_ID]: [{}] },
          revisions,
          type: PlotsType.VEGA
        }
      ],
      [join('logs', 'scalars', 'loss.tsv')]: [
        {
          content: {},
          datapoints: { [EXPERIMENT_WORKSPACE_ID]: [{}] },
          revisions,
          type: PlotsType.VEGA
        }
      ],
      [join('plots', 'heatmap.png')]: [
        {
          revisions,
          type: PlotsType.IMAGE,
          url: join('plots', 'heatmap.png')
        }
      ],
      'predictions.json': [
        {
          content: {
            facet: { field: 'rev', type: 'nominal' }
          } as VisualizationSpec,
          datapoints: { [EXPERIMENT_WORKSPACE_ID]: [{}] },
          revisions,
          type: PlotsType.VEGA
        }
      ]
    }

    expect(collectPaths([], mockPlotsDiff, revisions, {})).toStrictEqual([
      {
        hasChildren: false,
        label: 'acc.tsv',
        parentPath: join('logs', 'scalars'),
        path: join('logs', 'scalars', 'acc.tsv'),
        revisions: new Set(revisions),
        type: new Set(['template-single'])
      },
      {
        hasChildren: true,
        label: 'scalars',
        parentPath: 'logs',
        path: join('logs', 'scalars'),
        revisions: new Set(revisions)
      },
      {
        hasChildren: true,
        label: 'logs',
        parentPath: undefined,
        path: 'logs',
        revisions: new Set(revisions)
      },
      {
        hasChildren: false,
        label: 'loss.tsv',
        parentPath: join('logs', 'scalars'),
        path: join('logs', 'scalars', 'loss.tsv'),
        revisions: new Set(revisions),
        type: new Set(['template-single'])
      },
      {
        hasChildren: false,
        label: 'heatmap.png',
        parentPath: 'plots',
        path: join('plots', 'heatmap.png'),
        revisions: new Set(revisions),
        type: new Set(['comparison'])
      },
      {
        hasChildren: true,
        label: 'plots',
        parentPath: undefined,
        path: 'plots',
        revisions: new Set(revisions)
      },
      {
        hasChildren: false,
        label: 'predictions.json',
        parentPath: undefined,
        path: 'predictions.json',
        revisions: new Set(revisions),
        type: new Set(['template-multi'])
      }
    ])
  })
})

describe('collectTemplateOrder', () => {
  it('should return an empty array if no paths are provided', () => {
    const templateOrder = collectTemplateOrder([], [], [])
    expect(templateOrder).toStrictEqual([])
  })

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
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: singleViewPaths }
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
      { group: TemplatePlotGroup.MULTI_VIEW, paths: multiViewPaths }
    ])
  })

  it('should retain the given order when given only single view paths', () => {
    const firstPlot = join('plots', 'acc.tsv')
    const lastPlot = join('plots', 'loss.tsv')
    const plotOrder = [firstPlot, lastPlot]

    const singleViewPaths: string[] = [lastPlot, firstPlot]
    const multiViewPaths: string[] = []

    const plotSections = collectTemplateOrder(singleViewPaths, multiViewPaths, [
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: plotOrder }
    ])

    expect(singleViewPaths).not.toStrictEqual(plotOrder)

    expect(plotSections).toStrictEqual([
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: plotOrder }
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
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: singleViewOrder },
      { group: TemplatePlotGroup.MULTI_VIEW, paths: multiViewOrder }
    ])

    expect(singleViewPaths).not.toStrictEqual(singleViewOrder)
    expect(multiViewPaths).not.toStrictEqual(multiViewOrder)

    expect(plotSections).toStrictEqual([
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: singleViewOrder },
      { group: TemplatePlotGroup.MULTI_VIEW, paths: multiViewOrder }
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
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: singleViewOrder },
      { group: TemplatePlotGroup.MULTI_VIEW, paths: multiViewOrder }
    ])

    expect(singleViewPaths).not.toStrictEqual(singleViewOrder)
    expect(multiViewPaths).not.toStrictEqual(multiViewOrder)

    expect(plotSections).toStrictEqual([
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: singleViewPaths },
      { group: TemplatePlotGroup.MULTI_VIEW, paths: multiViewPaths }
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
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: singleViewOrder },
      { group: TemplatePlotGroup.MULTI_VIEW, paths: multiViewOrder }
    ])

    expect(singleViewPaths).not.toStrictEqual(singleViewOrder)
    expect(multiViewPaths).not.toStrictEqual(multiViewOrder)

    expect(plotSections).toStrictEqual([
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: singleViewOrder },
      { group: TemplatePlotGroup.MULTI_VIEW, paths: multiViewOrder },
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: [newSingleViewPlot] },
      {
        group: TemplatePlotGroup.MULTI_VIEW,
        paths: [firstNewMultiViewPlot, secondNewMultiViewPlot]
      }
    ])
  })

  it('should add a newly selected plot to the last section if the groups match', () => {
    const existingSingleViewPlot = join('plots', 'acc.tsv')
    const singleViewOrder = [existingSingleViewPlot]

    const singleViewPaths: string[] = [existingSingleViewPlot]

    const existingMultiViewPlot = join('plots', 'losses.json')
    const newMultiViewPlot = join('plots', 'confusion-matrix.json')
    const multiViewOrder = [existingMultiViewPlot, newMultiViewPlot]

    const multiViewPaths: string[] = [newMultiViewPlot, existingMultiViewPlot]

    const plotSections = collectTemplateOrder(singleViewPaths, multiViewPaths, [
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: singleViewOrder },
      { group: TemplatePlotGroup.MULTI_VIEW, paths: [existingMultiViewPlot] }
    ])

    expect(multiViewPaths).not.toStrictEqual(multiViewOrder)

    expect(plotSections).toStrictEqual([
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: singleViewOrder },
      { group: TemplatePlotGroup.MULTI_VIEW, paths: multiViewOrder }
    ])
  })

  it('should merge adjacent matching sections', () => {
    const firstSingleViewPlot = join('plots', 'acc.tsv')
    const secondSingleViewPlot = join('plots', 'loss.tsv')
    const singleViewOrder = [firstSingleViewPlot, secondSingleViewPlot]

    const plotSections = collectTemplateOrder(
      singleViewOrder,
      [],
      [
        { group: TemplatePlotGroup.SINGLE_VIEW, paths: [firstSingleViewPlot] },
        {
          group: TemplatePlotGroup.MULTI_VIEW,
          paths: [join('plots', 'predictions.json')]
        },
        { group: TemplatePlotGroup.SINGLE_VIEW, paths: [secondSingleViewPlot] }
      ]
    )

    expect(plotSections).toStrictEqual([
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: singleViewOrder }
    ])
  })

  it('should remove empty groups from the existing order', () => {
    const firstMultiViewPlot = join('plots', 'losses.json')
    const secondMultiViewPlot = join('plots', 'confusion-matrix.json')
    const multiViewOrder = [firstMultiViewPlot, secondMultiViewPlot]

    const plotSections = collectTemplateOrder([], multiViewOrder, [
      { group: TemplatePlotGroup.SINGLE_VIEW, paths: [] },
      { group: TemplatePlotGroup.MULTI_VIEW, paths: multiViewOrder }
    ])

    expect(plotSections).toStrictEqual([
      { group: TemplatePlotGroup.MULTI_VIEW, paths: multiViewOrder }
    ])
  })
})

describe('collectEncodingElements', () => {
  it('should return an empty array if there is no multi source encoding for a path', () => {
    const elements = collectEncodingElements(__filename, {})
    expect(elements).toStrictEqual([])
  })

  it('should collect encoding elements from multi source encoding', () => {
    const elements = collectEncodingElements(__filename, {
      [__filename]: {
        shape: {
          field: 'filename',
          scale: { domain: ['X', 'Y'], range: [Shape[0], Shape[1]] }
        },
        strokeDash: {
          field: 'field',
          scale: {
            domain: ['A', 'B', 'C'],
            range: [StrokeDash[0], StrokeDash[1], StrokeDash[2]]
          }
        }
      }
    })
    expect(elements).toStrictEqual([
      {
        label: 'A',
        type: EncodingType.STROKE_DASH,
        value: StrokeDash[0]
      },
      {
        label: 'B',
        type: EncodingType.STROKE_DASH,
        value: StrokeDash[1]
      },
      {
        label: 'C',
        type: EncodingType.STROKE_DASH,
        value: StrokeDash[2]
      },
      {
        label: 'X',
        type: EncodingType.SHAPE,
        value: Shape[0]
      },
      {
        label: 'Y',
        type: EncodingType.SHAPE,
        value: Shape[1]
      }
    ])
  })
})
