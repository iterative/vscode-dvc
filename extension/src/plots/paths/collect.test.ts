import { join, sep } from 'path'
import type { TopLevelSpec } from 'vega-lite'
import isEqual from 'lodash.isequal'
import {
  collectEncodingElements,
  collectPathErrorsTable,
  collectPaths,
  collectTemplateOrder,
  EncodingType,
  PathType,
  PlotPath
} from './collect'
import { TemplatePlotGroup } from '../webview/contract'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'
import {
  PLOT_ANCHORS,
  EXPERIMENT_WORKSPACE_ID,
  PlotsOutput,
  PlotsType,
  PLOT_STROKE_DASH
} from '../../cli/dvc/contract'
import { REVISIONS } from '../../test/fixtures/plotsDiff'
import { FIELD_SEPARATOR } from '../../cli/dvc/constants'

const mockTopLevelSpec = {} as TopLevelSpec

const plotsDiffFixturePaths: PlotPath[] = [
  {
    hasChildren: false,
    label: 'acc.png',
    parentPath: 'plots',
    path: join('plots', 'acc.png'),
    revisions: new Set(REVISIONS),
    type: new Set<PathType>([PathType.COMPARISON])
  },
  {
    hasChildren: true,
    label: 'plots',
    parentPath: undefined,
    path: 'plots',
    revisions: new Set(REVISIONS)
  },
  {
    hasChildren: false,
    label: 'heatmap.png',
    parentPath: 'plots',
    path: join('plots', 'heatmap.png'),
    revisions: new Set(REVISIONS),
    type: new Set<PathType>([PathType.COMPARISON])
  },
  {
    hasChildren: false,
    label: 'loss.png',
    parentPath: 'plots',
    path: join('plots', 'loss.png'),
    revisions: new Set(REVISIONS),
    type: new Set<PathType>([PathType.COMPARISON])
  },
  {
    hasChildren: false,
    label: 'image',
    parentPath: 'plots',
    path: join('plots', 'image'),
    revisions: new Set(REVISIONS),
    type: new Set<PathType>([PathType.COMPARISON])
  },
  {
    hasChildren: false,
    label: 'loss.tsv',
    parentPath: 'logs',
    path: join('logs', 'loss.tsv'),
    revisions: new Set(REVISIONS),
    type: new Set<PathType>([PathType.TEMPLATE_SINGLE])
  },
  {
    hasChildren: true,
    label: 'logs',
    parentPath: undefined,
    path: 'logs',
    revisions: new Set(REVISIONS)
  },
  {
    hasChildren: false,
    label: 'acc.tsv',
    parentPath: 'logs',
    path: join('logs', 'acc.tsv'),
    revisions: new Set(REVISIONS),
    type: new Set<PathType>([PathType.TEMPLATE_SINGLE])
  },
  {
    hasChildren: false,
    label: 'predictions.json',
    parentPath: undefined,
    path: 'predictions.json',
    revisions: new Set(REVISIONS),
    type: new Set<PathType>([PathType.TEMPLATE_MULTI])
  }
]

describe('collectPaths', () => {
  it('should return the expected data from the test fixture', () => {
    expect(collectPaths([], plotsDiffFixture, REVISIONS)).toStrictEqual(
      plotsDiffFixturePaths
    )
  })

  it('should update the revision details when any revision is recollected', () => {
    const [remainingPath] = Object.keys(plotsDiffFixture)
    const collectedPaths = collectPaths([], plotsDiffFixture, REVISIONS)
    expect(
      collectedPaths.filter(path => path.revisions.has(EXPERIMENT_WORKSPACE_ID))
    ).toHaveLength(collectedPaths.length)

    const fetchedRevs = REVISIONS.slice(0, 3)

    const updatedPaths = collectPaths(
      collectedPaths,
      {
        data: {
          [remainingPath]: [
            {
              anchor_definitions: {
                [PLOT_ANCHORS.DATA]: [
                  {
                    loss: '2.43323',
                    rev: fetchedRevs[0],
                    step: '0'
                  },
                  {
                    loss: '2.43323',
                    rev: fetchedRevs[1],
                    step: '0'
                  },
                  {
                    loss: '2.43323',
                    rev: fetchedRevs[2],
                    step: '0'
                  }
                ]
              },
              content: mockTopLevelSpec,
              revisions: fetchedRevs,
              type: PlotsType.VEGA
            }
          ]
        }
      },
      fetchedRevs
    )

    for (const rev of fetchedRevs) {
      expect(updatedPaths.filter(path => path.revisions.has(rev))).toHaveLength(
        remainingPath.split(sep).length
      )
    }
  })

  it('should collect path types after an error is returned for a new path', () => {
    const errorFixture: PlotsOutput = { data: {}, errors: [] }
    const plotPathNames = [
      join('plots', 'acc.png'),
      join('plots', 'heatmap.png'),
      join('plots', 'loss.png'),
      join('plots', 'image'),
      join('logs', 'loss.tsv'),
      join('logs', 'acc.tsv'),
      'predictions.json'
    ]
    for (const path of plotPathNames) {
      errorFixture.data[path] = []

      errorFixture.errors?.push({
        msg: 'No such file or directory',
        name: path,
        rev: 'workspace',
        type: 'FileNotFoundError'
      })
    }

    const pathsWithNoTypes: PlotPath[] = plotsDiffFixturePaths.map(
      plotPath => ({
        hasChildren: plotPath.hasChildren,
        label: plotPath.label,
        parentPath: plotPath.parentPath,
        path: plotPath.path,
        revisions: new Set(['workspace'])
      })
    )

    expect(collectPaths([], errorFixture, ['workspace'])).toStrictEqual(
      pathsWithNoTypes
    )

    expect(
      collectPaths(pathsWithNoTypes, plotsDiffFixture, REVISIONS)
    ).toStrictEqual(plotsDiffFixturePaths)
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

    const paths = collectPaths([mockPlotPath], plotsDiffFixture, ['bfc7f64'])

    expect(paths.some(plotPath => isEqual(plotPath, mockPlotPath))).toBeTruthy()
  })

  it('should handle more complex paths', () => {
    const revisions = [EXPERIMENT_WORKSPACE_ID]
    const mockPlotsDiff = {
      data: {
        [join('logs', 'scalars', 'acc.tsv')]: [
          {
            anchor_definitions: { [PLOT_ANCHORS.DATA]: [] },
            content: mockTopLevelSpec,
            revisions,
            type: PlotsType.VEGA
          }
        ],
        [join('logs', 'scalars', 'loss.tsv')]: [
          {
            anchor_definitions: { [PLOT_ANCHORS.DATA]: [] },
            content: mockTopLevelSpec,
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
            anchor_definitions: { [PLOT_ANCHORS.DATA]: [] },
            content: {
              facet: { field: 'rev', type: 'nominal' }
            } as TopLevelSpec,
            revisions,
            type: PlotsType.VEGA
          }
        ],
        [join(`dvc.yaml${FIELD_SEPARATOR}logs`, 'acc.tsv')]: [
          {
            anchor_definitions: { [PLOT_ANCHORS.DATA]: [] },
            content: mockTopLevelSpec,
            revisions,
            type: PlotsType.VEGA
          }
        ],
        [join(
          'nested',
          'dvclive',
          `dvc.yaml${FIELD_SEPARATOR}logs`,
          'acc.tsv'
        )]: [
          {
            anchor_definitions: { [PLOT_ANCHORS.DATA]: [] },
            content: mockTopLevelSpec,
            revisions,
            type: PlotsType.VEGA
          }
        ]
      }
    }

    expect(collectPaths([], mockPlotsDiff, revisions)).toStrictEqual([
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
      },
      {
        hasChildren: false,
        label: 'acc.tsv',
        parentPath: join(`dvc.yaml${FIELD_SEPARATOR}logs`),
        path: join(`dvc.yaml${FIELD_SEPARATOR}logs`, 'acc.tsv'),
        revisions: new Set(revisions),
        type: new Set(['template-single'])
      },
      {
        hasChildren: true,
        label: 'logs',
        parentPath: join('dvc.yaml'),
        path: join(`dvc.yaml${FIELD_SEPARATOR}logs`),
        revisions: new Set(revisions)
      },
      {
        hasChildren: true,
        label: 'dvc.yaml',
        parentPath: undefined,
        path: 'dvc.yaml',
        revisions: new Set(revisions)
      },
      {
        hasChildren: false,
        label: 'acc.tsv',
        parentPath: join('nested', 'dvclive', `dvc.yaml${FIELD_SEPARATOR}logs`),
        path: join(
          'nested',
          'dvclive',
          `dvc.yaml${FIELD_SEPARATOR}logs`,
          'acc.tsv'
        ),
        revisions: new Set(revisions),
        type: new Set(['template-single'])
      },
      {
        hasChildren: true,
        label: 'logs',
        parentPath: join('nested', 'dvclive', 'dvc.yaml'),
        path: join('nested', 'dvclive', `dvc.yaml${FIELD_SEPARATOR}logs`),
        revisions: new Set(revisions)
      },
      {
        hasChildren: true,
        label: join('nested', 'dvclive', 'dvc.yaml'),
        parentPath: undefined,
        path: join('nested', 'dvclive', 'dvc.yaml'),
        revisions: new Set(revisions)
      }
    ])
  })

  it('should correctly collect error paths', () => {
    const misspeltJpg = join('training', 'plots', 'images', 'mip.jpg')
    const revisions = new Set([EXPERIMENT_WORKSPACE_ID])

    const paths = collectPaths(
      [],
      {
        data: {},
        errors: [
          {
            msg: '',
            name: misspeltJpg,
            rev: EXPERIMENT_WORKSPACE_ID,
            source: misspeltJpg,
            type: 'FileNotFoundError'
          }
        ]
      },
      []
    )
    expect(paths).toHaveLength(4)
    expect(paths).toStrictEqual([
      {
        hasChildren: false,
        label: 'mip.jpg',
        parentPath: join('training', 'plots', 'images'),
        path: misspeltJpg,
        revisions
      },
      {
        hasChildren: true,
        label: 'images',
        parentPath: join('training', 'plots'),
        path: join('training', 'plots', 'images'),
        revisions
      },
      {
        hasChildren: true,
        label: 'plots',
        parentPath: 'training',
        path: join('training', 'plots'),
        revisions
      },
      {
        hasChildren: true,
        label: 'training',
        parentPath: undefined,
        path: 'training',
        revisions
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
        strokeDash: {
          field: 'field',
          scale: {
            domain: ['A', 'B', 'C'],
            range: [
              PLOT_STROKE_DASH[0],
              PLOT_STROKE_DASH[1],
              PLOT_STROKE_DASH[2]
            ]
          }
        }
      }
    })
    expect(elements).toStrictEqual([
      {
        label: 'A',
        type: EncodingType.STROKE_DASH,
        value: PLOT_STROKE_DASH[0]
      },
      {
        label: 'B',
        type: EncodingType.STROKE_DASH,
        value: PLOT_STROKE_DASH[1]
      },
      {
        label: 'C',
        type: EncodingType.STROKE_DASH,
        value: PLOT_STROKE_DASH[2]
      }
    ])
  })
})

describe('collectPathErrorsTable', () => {
  it('should construct a markdown table with the error if they relate to the select revision and provided path', () => {
    const rev = 'a-really-long-branch-name'
    const path = 'wat'
    const markdownTable = collectPathErrorsTable([
      {
        msg: `${path} not found.`,
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        msg: 'catastrophic error',
        rev
      },
      {
        msg: 'UNEXPECTEDERRRRROR',
        rev
      }
    ])
    expect(markdownTable).toStrictEqual(
      'Errors\n' +
        '|||\n' +
        '|--|--|\n' +
        '| a-really... | UNEXPECTEDERRRRROR |\n' +
        '| a-really... | catastrophic error |\n' +
        '| workspace | wat not found. |'
    )
  })
})
