import { TopLevelSpec } from 'vega-lite'
import { isMultiViewPlot } from '../../../plots/vega/util'
import {
  EXPERIMENT_WORKSPACE_ID,
  PlotsOutput,
  PlotsType
} from '../../../cli/dvc/contract'
import {
  ComparisonRevisionData,
  TemplatePlotSection,
  TemplatePlotGroup,
  TemplatePlotsData,
  TemplatePlots,
  Revision,
  PlotsComparisonData,
  DEFAULT_PLOT_HEIGHT,
  DEFAULT_NB_ITEMS_PER_ROW,
  DEFAULT_PLOT_WIDTH,
  ComparisonPlotImg
} from '../../../plots/webview/contract'
import { join } from '../../util/path'
import { copyOriginalColors } from '../../../experiments/model/status/colors'
import { ColumnType } from '../../../experiments/webview/contract'

const basicVega = {
  [join('logs', 'loss.tsv')]: [
    {
      type: PlotsType.VEGA,
      revisions: [
        EXPERIMENT_WORKSPACE_ID,
        'main',
        'test-branch',
        'exp-83425',
        'exp-e7a67'
      ],
      anchor_definitions: {
        '<DVC_METRIC_DATA>': JSON.stringify([
          {
            loss: '2.298783302307129',
            step: '0',
            timestamp: '1641966224600',
            rev: EXPERIMENT_WORKSPACE_ID
          },
          {
            loss: '2.2779736518859863',
            step: '1',
            timestamp: '1641966239108',
            rev: EXPERIMENT_WORKSPACE_ID
          },
          {
            loss: '2.2572131156921387',
            step: '2',
            timestamp: '1641966253176',
            rev: EXPERIMENT_WORKSPACE_ID
          },
          {
            loss: '2.238112688064575',
            step: '3',
            timestamp: '1641966267354',
            rev: EXPERIMENT_WORKSPACE_ID
          },
          {
            loss: '2.212251901626587',
            step: '4',
            timestamp: '1641966285745',
            rev: EXPERIMENT_WORKSPACE_ID
          },
          {
            loss: '2.1894900798797607',
            step: '5',
            timestamp: '1641966303339',
            rev: EXPERIMENT_WORKSPACE_ID
          },
          {
            loss: '2.165510654449463',
            step: '6',
            timestamp: '1641966320693',
            rev: EXPERIMENT_WORKSPACE_ID
          },
          {
            loss: '2.135964870452881',
            step: '7',
            timestamp: '1641966335781',
            rev: EXPERIMENT_WORKSPACE_ID
          },
          {
            loss: '2.114135265350342',
            step: '8',
            timestamp: '1641966351758',
            rev: EXPERIMENT_WORKSPACE_ID
          },
          {
            loss: '2.298783302307129',
            step: '0',
            timestamp: '1641966224600',
            rev: 'main'
          },
          {
            loss: '2.2779736518859863',
            step: '1',
            timestamp: '1641966239108',
            rev: 'main'
          },
          {
            loss: '2.2572131156921387',
            step: '2',
            timestamp: '1641966253176',
            rev: 'main'
          },
          {
            loss: '2.238112688064575',
            step: '3',
            timestamp: '1641966267354',
            rev: 'main'
          },
          {
            loss: '2.212251901626587',
            step: '4',
            timestamp: '1641966285745',
            rev: 'main'
          },
          {
            loss: '2.1894900798797607',
            step: '5',
            timestamp: '1641966303339',
            rev: 'main'
          },
          {
            loss: '2.165510654449463',
            step: '6',
            timestamp: '1641966320693',
            rev: 'main'
          },
          {
            loss: '2.135964870452881',
            step: '7',
            timestamp: '1641966335781',
            rev: 'main'
          },
          {
            loss: '2.114135265350342',
            step: '8',
            timestamp: '1641966351758',
            rev: 'main'
          },
          {
            loss: '1.6454246044158936',
            step: '0',
            timestamp: '1642041785966',
            rev: 'test-branch'
          },
          {
            loss: '1.6063436269760132',
            step: '1',
            timestamp: '1642041804111',
            rev: 'test-branch'
          },
          {
            loss: '1.5570942163467407',
            step: '2',
            timestamp: '1642041820386',
            rev: 'test-branch'
          },
          {
            loss: '1.5230435132980347',
            step: '3',
            timestamp: '1642041836358',
            rev: 'test-branch'
          },
          {
            loss: '1.473145842552185',
            step: '4',
            timestamp: '1642041851764',
            rev: 'test-branch'
          },
          {
            loss: '1.444159984588623',
            step: '5',
            timestamp: '1642041866838',
            rev: 'test-branch'
          },
          {
            loss: '1.3941730260849',
            step: '6',
            timestamp: '1642041881837',
            rev: 'test-branch'
          },
          {
            loss: '1.370380163192749',
            step: '7',
            timestamp: '1642041897483',
            rev: 'test-branch'
          },
          {
            loss: '1.3217320442199707',
            step: '8',
            timestamp: '1642041912764',
            rev: 'test-branch'
          },
          {
            loss: '2.273470401763916',
            step: '0',
            timestamp: '1642041482186',
            rev: 'exp-83425'
          },
          {
            loss: '2.20936918258667',
            step: '1',
            timestamp: '1642041500577',
            rev: 'exp-83425'
          },
          {
            loss: '2.153379201889038',
            step: '2',
            timestamp: '1642041519065',
            rev: 'exp-83425'
          },
          {
            loss: '2.0221104621887207',
            step: '3',
            timestamp: '1642041543481',
            rev: 'exp-83425'
          },
          {
            loss: '2.024623155593872',
            step: '4',
            timestamp: '1642041565772',
            rev: 'exp-83425'
          },
          {
            loss: '1.8110722303390503',
            step: '5',
            timestamp: '1642041586986',
            rev: 'exp-83425'
          },
          {
            loss: '1.7324824333190918',
            step: '6',
            timestamp: '1642041609569',
            rev: 'exp-83425'
          },
          {
            loss: '1.6054636240005493',
            step: '7',
            timestamp: '1642041631783',
            rev: 'exp-83425'
          },
          {
            loss: '1.5145071744918823',
            step: '8',
            timestamp: '1642041648829',
            rev: 'exp-83425'
          },
          {
            loss: '2.0380799770355225',
            step: '0',
            timestamp: '1642041230991',
            rev: 'exp-e7a67'
          },
          {
            loss: '2.0002100467681885',
            step: '1',
            timestamp: '1642041244696',
            rev: 'exp-e7a67'
          },
          {
            loss: '1.9573605060577393',
            step: '2',
            timestamp: '1642041257185',
            rev: 'exp-e7a67'
          },
          {
            loss: '1.91573965549469',
            step: '3',
            timestamp: '1642041270652',
            rev: 'exp-e7a67'
          },
          {
            loss: '1.8714964389801025',
            step: '4',
            timestamp: '1642041284801',
            rev: 'exp-e7a67'
          },
          {
            loss: '1.8267308473587036',
            step: '5',
            timestamp: '1642041301919',
            rev: 'exp-e7a67'
          },
          {
            loss: '1.7825157642364502',
            step: '6',
            timestamp: '1642041318814',
            rev: 'exp-e7a67'
          },
          {
            loss: '1.7360031604766846',
            step: '7',
            timestamp: '1642041335775',
            rev: 'exp-e7a67'
          },
          {
            loss: '1.6929490566253662',
            step: '8',
            timestamp: '1642041350855',
            rev: 'exp-e7a67'
          }
        ]),
        '<DVC_METRIC_TITLE>': '',
        '<DVC_METRIC_X_LABEL>': 'step',
        '<DVC_METRIC_Y_LABEL>': 'loss'
      },
      content: JSON.stringify({
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        data: {
          values: '<DVC_METRIC_DATA>'
        },
        title: '<DVC_METRIC_TITLE>',
        width: 300,
        height: 300,
        layer: [
          {
            encoding: {
              x: {
                field: 'step',
                type: 'quantitative',
                title: '<DVC_METRIC_X_LABEL>'
              },
              y: {
                field: 'loss',
                type: 'quantitative',
                title: '<DVC_METRIC_Y_LABEL>',
                scale: { zero: false }
              },
              color: { field: 'rev', type: 'nominal' }
            },
            layer: [
              { mark: 'line' },
              {
                selection: {
                  label: {
                    type: 'single',
                    nearest: true,
                    on: 'mouseover',
                    encodings: ['x'],
                    empty: 'none',
                    clear: 'mouseout'
                  }
                },
                mark: 'point',
                encoding: {
                  opacity: {
                    condition: { selection: 'label', value: 1 },
                    value: 0
                  }
                }
              }
            ]
          },
          {
            transform: [{ filter: { selection: 'label' } }],
            layer: [
              {
                mark: { type: 'rule', color: 'gray' },
                encoding: { x: { field: 'step', type: 'quantitative' } }
              },
              {
                encoding: {
                  text: { type: 'quantitative', field: 'loss' },
                  x: { field: 'step', type: 'quantitative' },
                  y: { field: 'loss', type: 'quantitative' }
                },
                layer: [
                  {
                    mark: {
                      type: 'text',
                      align: 'left',
                      dx: 5,
                      dy: -5
                    },
                    encoding: {
                      color: { type: 'nominal', field: 'rev' }
                    }
                  }
                ]
              }
            ]
          }
        ]
      }),
      multiView: false
    }
  ]
}

const basicVegaContent = basicVega[join('logs', 'loss.tsv')][0]

const multipleVega = (length: number) => {
  if (length === 0) {
    return {}
  }
  const plots = {
    ...basicVega
  }
  for (let i = 1; i < length; i++) {
    plots[join('logs', `${i}-loss.tsv`)] = [{ ...basicVegaContent }]
  }
  return plots
}

const getMultiImageData = (
  baseUrl: string,
  joinFunc: (...segments: string[]) => string,
  revisions: string[]
) => {
  const data: {
    [path: string]: {
      type: PlotsType
      revisions: string[]
      url: string
    }[]
  } = {}

  for (let i = 0; i < 15; i++) {
    const key = joinFunc('plots', 'image', `${i}.jpg`)
    const values = []
    for (const revision of revisions) {
      if (revision === 'exp-83425' && i % 2 === 0) {
        continue
      }
      values.push({
        type: PlotsType.IMAGE,
        revisions: [revision],
        url: joinFunc(baseUrl, 'image', `${i}.jpg`)
      })
    }
    data[key] = values
  }
  return data
}

const getImageData = (baseUrl: string, joinFunc = join) => ({
  [join('plots', 'acc.png')]: [
    {
      type: PlotsType.IMAGE,
      revisions: [EXPERIMENT_WORKSPACE_ID],
      url: joinFunc(baseUrl, 'workspace_plots_acc.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['main'],
      url: joinFunc(baseUrl, '53c3851_plots_acc.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['exp-e7a67'],
      url: joinFunc(baseUrl, '4fb124a_plots_acc.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['test-branch'],
      url: joinFunc(baseUrl, '42b8736_plots_acc.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['exp-83425'],
      url: joinFunc(baseUrl, '1ba7bcd_plots_acc.png')
    }
  ],
  [join('plots', 'heatmap.png')]: [
    {
      type: PlotsType.IMAGE,
      revisions: [EXPERIMENT_WORKSPACE_ID],
      url: joinFunc(baseUrl, 'workspace_plots_heatmap.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['main'],
      url: joinFunc(baseUrl, '53c3851_plots_heatmap.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['exp-e7a67'],
      url: joinFunc(baseUrl, '4fb124a_plots_heatmap.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['test-branch'],
      url: joinFunc(baseUrl, '42b8736_plots_heatmap.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['exp-83425'],
      url: joinFunc(baseUrl, '1ba7bcd_plots_heatmap.png')
    }
  ],
  [join('plots', 'loss.png')]: [
    {
      type: PlotsType.IMAGE,
      revisions: [EXPERIMENT_WORKSPACE_ID],
      url: joinFunc(baseUrl, 'workspace_plots_loss.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['main'],
      url: joinFunc(baseUrl, '53c3851_plots_loss.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['exp-e7a67'],
      url: joinFunc(baseUrl, '4fb124a_plots_loss.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['test-branch'],
      url: joinFunc(baseUrl, '42b8736_plots_loss.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['exp-83425'],
      url: joinFunc(baseUrl, '1ba7bcd_plots_loss.png')
    }
  ],
  ...getMultiImageData(baseUrl, joinFunc, [
    EXPERIMENT_WORKSPACE_ID,
    'main',
    'exp-e7a67',
    'test-branch',
    'exp-83425'
  ])
})

export const getOutput = (baseUrl: string): PlotsOutput => ({
  data: {
    ...getImageData(baseUrl),
    ...basicVega,
    ...require('./vega').default
  }
})

export const getMinimalOutput = (): PlotsOutput => ({ data: { ...basicVega } })

export const getMultiSourceOutput = (): PlotsOutput => ({
  ...require('./multiSource').default
})

export const REVISIONS = [
  EXPERIMENT_WORKSPACE_ID,
  'main',
  'exp-e7a67',
  'test-branch',
  'exp-83425'
]

const extendedSpecs = (plotsOutput: TemplatePlots): TemplatePlotSection[] => {
  const singleViewPlots: TemplatePlotSection = {
    group: TemplatePlotGroup.SINGLE_VIEW,
    entries: []
  }
  const multiViewPlots: TemplatePlotSection = {
    group: TemplatePlotGroup.MULTI_VIEW,
    entries: []
  }

  for (const [path, plots] of Object.entries(plotsOutput)) {
    for (const originalPlot of plots) {
      const plot = {
        anchor_definitions: {
          ...originalPlot.anchor_definitions,
          '<DVC_METRIC_COLOR>': JSON.stringify({
            scale: {
              domain: REVISIONS,
              range: copyOriginalColors().slice(0, 5)
            }
          })
        },
        content: originalPlot.content,
        id: path,
        revisions: REVISIONS,
        type: PlotsType.VEGA
      }
      if (isMultiViewPlot(JSON.parse(originalPlot.content) as TopLevelSpec)) {
        multiViewPlots.entries.push(plot)
        continue
      }
      singleViewPlots.entries.push(plot)
    }
  }

  return [singleViewPlots, multiViewPlots]
}

export const getRevisions = (): Revision[] => {
  const [workspace, main, _4fb124a, _42b8736, _1ba7bcd] = copyOriginalColors()
  return [
    {
      id: EXPERIMENT_WORKSPACE_ID,
      label: EXPERIMENT_WORKSPACE_ID,
      description: undefined,
      displayColor: workspace,
      errors: undefined,
      fetched: true,
      summaryColumns: [
        {
          path: join('nested', 'params.yaml:test'),
          type: ColumnType.PARAMS,
          value: 'true'
        },
        {
          path: 'params.yaml:code_names',
          type: ColumnType.PARAMS,
          value: '[0,1]'
        },
        { path: 'params.yaml:dropout', type: ColumnType.PARAMS, value: 0.124 },
        {
          path: 'summary.json:accuracy',
          type: ColumnType.METRICS,
          value: 0.5926499962806702
        },
        {
          path: 'summary.json:loss',
          type: ColumnType.METRICS,
          value: 1.775016188621521
        },
        {
          path: 'summary.json:val_accuracy',
          type: ColumnType.METRICS,
          value: 0.6704000234603882
        }
      ]
    },
    {
      commit: 'Update version and CHANGELOG for release (#4022) ...',
      errors: undefined,
      fetched: true,
      summaryColumns: [
        {
          path: join('nested', 'params.yaml:test'),
          type: ColumnType.PARAMS,
          value: 'true'
        },
        {
          path: 'params.yaml:code_names',
          type: ColumnType.PARAMS,
          value: '[0,1]'
        },
        { path: 'params.yaml:dropout', type: ColumnType.PARAMS, value: 0.122 },
        {
          path: 'summary.json:accuracy',
          type: ColumnType.METRICS,
          value: 0.3484833240509033
        },
        {
          path: 'summary.json:loss',
          type: ColumnType.METRICS,
          value: 2.048856019973755
        },
        {
          path: 'summary.json:val_accuracy',
          type: ColumnType.METRICS,
          value: 0.4277999997138977
        }
      ],
      id: 'main',
      label: 'main',
      displayColor: main,
      description: undefined
    },
    {
      errors: undefined,
      fetched: true,
      summaryColumns: [
        {
          path: join('nested', 'params.yaml:test'),
          type: ColumnType.PARAMS,
          value: 'true'
        },
        {
          path: 'params.yaml:code_names',
          type: ColumnType.PARAMS,
          value: '[0,1]'
        },
        { path: 'params.yaml:dropout', type: ColumnType.PARAMS, value: 0.15 },
        {
          path: 'summary.json:accuracy',
          type: ColumnType.METRICS,
          value: 0.3724166750907898
        },
        {
          path: 'summary.json:loss',
          type: ColumnType.METRICS,
          value: 2.0205044746398926
        },
        {
          path: 'summary.json:val_accuracy',
          type: ColumnType.METRICS,
          value: 0.4277999997138977
        }
      ],
      id: 'exp-e7a67',
      label: '4fb124a',
      displayColor: _4fb124a,
      description: '[exp-e7a67]'
    },
    {
      errors: undefined,
      fetched: true,
      summaryColumns: [
        {
          path: join('nested', 'params.yaml:test'),
          type: ColumnType.PARAMS,
          value: 'true'
        },
        {
          path: 'params.yaml:code_names',
          type: ColumnType.PARAMS,
          value: '[0,1]'
        },
        { path: 'params.yaml:dropout', type: ColumnType.PARAMS, value: 0.122 },
        {
          path: 'summary.json:accuracy',
          type: ColumnType.METRICS,
          value: 0.4668000042438507
        },
        {
          path: 'summary.json:loss',
          type: ColumnType.METRICS,
          value: 1.9293040037155151
        },
        {
          path: 'summary.json:val_accuracy',
          type: ColumnType.METRICS,
          value: 0.5608000159263611
        }
      ],
      id: 'test-branch',
      label: '42b8736',
      displayColor: _42b8736,
      description: '[test-branch]'
    },
    {
      errors: undefined,
      fetched: true,
      summaryColumns: [
        {
          path: join('nested', 'params.yaml:test'),
          type: ColumnType.PARAMS,
          value: 'true'
        },
        {
          path: 'params.yaml:code_names',
          type: ColumnType.PARAMS,
          value: '[0,1]'
        },
        { path: 'params.yaml:dropout', type: ColumnType.PARAMS, value: 0.124 },
        {
          path: 'summary.json:accuracy',
          type: ColumnType.METRICS,
          value: 0.5926499962806702
        },
        {
          path: 'summary.json:loss',
          type: ColumnType.METRICS,
          value: 1.775016188621521
        },
        {
          path: 'summary.json:val_accuracy',
          type: ColumnType.METRICS,
          value: 0.6704000234603882
        }
      ],
      id: 'exp-83425',
      label: EXPERIMENT_WORKSPACE_ID,
      displayColor: _1ba7bcd,
      description: '[exp-83425]'
    }
  ]
}

export const getMinimalWebviewMessage = () => ({
  plots: extendedSpecs(basicVega),
  nbItemsPerRow: DEFAULT_NB_ITEMS_PER_ROW,
  height: DEFAULT_PLOT_HEIGHT,
  revisions: getRevisions(),
  smoothPlotValues: {}
})

export const getTemplateWebviewMessage = (): TemplatePlotsData => ({
  plots: extendedSpecs({ ...basicVega, ...require('./vega').default }),
  nbItemsPerRow: DEFAULT_NB_ITEMS_PER_ROW,
  height: DEFAULT_PLOT_HEIGHT,
  smoothPlotValues: {}
})

export const getManyTemplatePlotsWebviewMessage = (
  length: number
): TemplatePlotsData => ({
  plots: extendedSpecs({
    ...multipleVega(length)
  }),
  nbItemsPerRow: DEFAULT_NB_ITEMS_PER_ROW,
  height: DEFAULT_PLOT_HEIGHT,
  smoothPlotValues: {}
})

export const MOCK_IMAGE_MTIME = 946684800000

const getIndFromComparisonMultiImgPath = (path: string) => {
  const pathIndMatches = path.match(/(\d+)\.jpg$/)
  return Number((pathIndMatches as string[])[1])
}

export const getComparisonWebviewMessage = (
  baseUrl: string,
  joinFunc: (...args: string[]) => string = join
): PlotsComparisonData => {
  const plotAcc: {
    [path: string]: { path: string; revisions: ComparisonRevisionData }
  } = {}

  for (const [path, plots] of Object.entries(getImageData(baseUrl, joinFunc))) {
    const isMulti = path.includes('image')
    const pathLabel = isMulti ? join('plots', 'image') : path

    if (!plotAcc[pathLabel]) {
      plotAcc[pathLabel] = {
        path: pathLabel,
        revisions: {}
      }
    }

    for (const { url, revisions } of plots) {
      const id = revisions?.[0]
      if (!id) {
        continue
      }

      if (!plotAcc[pathLabel].revisions[id]) {
        plotAcc[pathLabel].revisions[id] = {
          id,
          imgs: []
        }
      }

      const img: ComparisonPlotImg = {
        url: `${url}?${MOCK_IMAGE_MTIME}`,
        errors: undefined,
        loading: false
      }

      if (isMulti) {
        img.ind = getIndFromComparisonMultiImgPath(path)
      }

      plotAcc[pathLabel].revisions[id].imgs.push(img)
    }
  }

  return {
    revisions: getRevisions(),
    multiPlotValues: {},
    plots: Object.values(plotAcc),
    width: DEFAULT_PLOT_WIDTH,
    height: DEFAULT_PLOT_HEIGHT
  }
}
