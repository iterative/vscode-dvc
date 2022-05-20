import { TopLevelSpec } from 'vega-lite'
import { VisualizationSpec } from 'react-vega'
import { extendVegaSpec, isMultiViewPlot } from '../../../plots/vega/util'
import { PlotsOutput } from '../../../cli/reader'
import {
  ComparisonPlots,
  ComparisonRevisionData,
  DEFAULT_SECTION_NAMES,
  TemplatePlotSection,
  PlotSize,
  PlotsType,
  Section,
  TemplatePlotGroup,
  TemplatePlotsData,
  TemplatePlots
} from '../../../plots/webview/contract'
import { join } from '../../util/path'
import { copyOriginalColors } from '../../../experiments/model/status/colors'

const basicVega = {
  [join('logs', 'loss.tsv')]: [
    {
      type: PlotsType.VEGA,
      revisions: ['workspace', 'main', '42b8736', '1ba7bcd', '4fb124a'],
      datapoints: {
        workspace: [
          {
            loss: '2.298783302307129',
            step: '0',
            timestamp: '1641966224600'
          },
          {
            loss: '2.2779736518859863',
            step: '1',
            timestamp: '1641966239108'
          },
          {
            loss: '2.2572131156921387',
            step: '2',
            timestamp: '1641966253176'
          },
          {
            loss: '2.238112688064575',
            step: '3',
            timestamp: '1641966267354'
          },
          {
            loss: '2.212251901626587',
            step: '4',
            timestamp: '1641966285745'
          },
          {
            loss: '2.1894900798797607',
            step: '5',
            timestamp: '1641966303339'
          },
          {
            loss: '2.165510654449463',
            step: '6',
            timestamp: '1641966320693'
          },
          {
            loss: '2.135964870452881',
            step: '7',
            timestamp: '1641966335781'
          },
          {
            loss: '2.114135265350342',
            step: '8',
            timestamp: '1641966351758'
          }
        ],
        main: [
          {
            loss: '2.298783302307129',
            step: '0',
            timestamp: '1641966224600'
          },
          {
            loss: '2.2779736518859863',
            step: '1',
            timestamp: '1641966239108'
          },
          {
            loss: '2.2572131156921387',
            step: '2',
            timestamp: '1641966253176'
          },
          {
            loss: '2.238112688064575',
            step: '3',
            timestamp: '1641966267354'
          },
          {
            loss: '2.212251901626587',
            step: '4',
            timestamp: '1641966285745'
          },
          {
            loss: '2.1894900798797607',
            step: '5',
            timestamp: '1641966303339'
          },
          {
            loss: '2.165510654449463',
            step: '6',
            timestamp: '1641966320693'
          },
          {
            loss: '2.135964870452881',
            step: '7',
            timestamp: '1641966335781'
          },
          {
            loss: '2.114135265350342',
            step: '8',
            timestamp: '1641966351758'
          }
        ],
        '42b8736': [
          {
            loss: '1.6454246044158936',
            step: '0',
            timestamp: '1642041785966'
          },
          {
            loss: '1.6063436269760132',
            step: '1',
            timestamp: '1642041804111'
          },
          {
            loss: '1.5570942163467407',
            step: '2',
            timestamp: '1642041820386'
          },
          {
            loss: '1.5230435132980347',
            step: '3',
            timestamp: '1642041836358'
          },
          {
            loss: '1.473145842552185',
            step: '4',
            timestamp: '1642041851764'
          },
          {
            loss: '1.444159984588623',
            step: '5',
            timestamp: '1642041866838'
          },
          {
            loss: '1.3941730260849',
            step: '6',
            timestamp: '1642041881837'
          },
          {
            loss: '1.370380163192749',
            step: '7',
            timestamp: '1642041897483'
          },
          {
            loss: '1.3217320442199707',
            step: '8',
            timestamp: '1642041912764'
          }
        ],
        '1ba7bcd': [
          {
            loss: '2.273470401763916',
            step: '0',
            timestamp: '1642041482186'
          },
          {
            loss: '2.20936918258667',
            step: '1',
            timestamp: '1642041500577'
          },
          {
            loss: '2.153379201889038',

            step: '2',
            timestamp: '1642041519065'
          },
          {
            loss: '2.0221104621887207',
            step: '3',
            timestamp: '1642041543481'
          },
          {
            loss: '2.024623155593872',
            step: '4',
            timestamp: '1642041565772'
          },
          {
            loss: '1.8110722303390503',
            step: '5',
            timestamp: '1642041586986'
          },
          {
            loss: '1.7324824333190918',
            step: '6',
            timestamp: '1642041609569'
          },
          {
            loss: '1.6054636240005493',
            step: '7',
            timestamp: '1642041631783'
          },
          {
            loss: '1.5145071744918823',
            step: '8',
            timestamp: '1642041648829'
          }
        ],
        '4fb124a': [
          {
            loss: '2.0380799770355225',
            step: '0',
            timestamp: '1642041230991'
          },
          {
            loss: '2.0002100467681885',
            step: '1',
            timestamp: '1642041244696'
          },
          {
            loss: '1.9573605060577393',
            step: '2',
            timestamp: '1642041257185'
          },
          {
            loss: '1.91573965549469',
            step: '3',
            timestamp: '1642041270652'
          },
          {
            loss: '1.8714964389801025',
            step: '4',
            timestamp: '1642041284801'
          },
          {
            loss: '1.8267308473587036',
            step: '5',
            timestamp: '1642041301919'
          },
          {
            loss: '1.7825157642364502',
            step: '6',
            timestamp: '1642041318814'
          },
          {
            loss: '1.7360031604766846',
            step: '7',
            timestamp: '1642041335775'
          },
          {
            loss: '1.6929490566253662',
            step: '8',
            timestamp: '1642041350855'
          }
        ]
      },
      content: {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        data: {
          values: '<DVC_METRIC_DATA>'
        },
        title: '',
        width: 300,
        height: 300,
        layer: [
          {
            encoding: {
              x: { field: 'step', type: 'quantitative', title: 'step' },
              y: {
                field: 'loss',
                type: 'quantitative',
                title: 'loss',
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
      } as VisualizationSpec,
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

const getImageData = (baseUrl: string, joinFunc = join) => ({
  [join('plots', 'acc.png')]: [
    {
      type: PlotsType.IMAGE,
      revisions: ['workspace'],
      url: joinFunc(baseUrl, 'workspace_plots_acc.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['main'],
      url: joinFunc(baseUrl, 'main_plots_acc.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['4fb124a'],
      url: joinFunc(baseUrl, '4fb124a_plots_acc.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['42b8736'],
      url: joinFunc(baseUrl, '42b8736_plots_acc.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['1ba7bcd'],
      url: joinFunc(baseUrl, '1ba7bcd_plots_acc.png')
    }
  ],
  [join('plots', 'heatmap.png')]: [
    {
      type: PlotsType.IMAGE,
      revisions: ['workspace'],
      url: joinFunc(baseUrl, 'workspace_plots_heatmap.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['main'],
      url: joinFunc(baseUrl, 'main_plots_heatmap.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['4fb124a'],
      url: joinFunc(baseUrl, '4fb124a_plots_heatmap.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['42b8736'],
      url: joinFunc(baseUrl, '42b8736_plots_heatmap.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['1ba7bcd'],
      url: joinFunc(baseUrl, '1ba7bcd_plots_heatmap.png')
    }
  ],
  [join('plots', 'loss.png')]: [
    {
      type: PlotsType.IMAGE,
      revisions: ['workspace'],
      url: joinFunc(baseUrl, 'workspace_plots_loss.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['main'],
      url: joinFunc(baseUrl, 'main_plots_loss.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['4fb124a'],
      url: joinFunc(baseUrl, '4fb124a_plots_loss.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['42b8736'],
      url: joinFunc(baseUrl, '42b8736_plots_loss.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['1ba7bcd'],
      url: joinFunc(baseUrl, '1ba7bcd_plots_loss.png')
    }
  ]
})

export const getOutput = (
  baseUrl: string,
  joinFunc?: (...args: string[]) => string
): PlotsOutput => ({
  ...getImageData(baseUrl, joinFunc),
  ...basicVega,
  ...require('./vega').default
})

export const getMinimalOutput = (): PlotsOutput => ({ ...basicVega })

const expectedRevisions = ['workspace', 'main', '4fb124a', '42b8736', '1ba7bcd']

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
        content: extendVegaSpec(
          {
            ...originalPlot.content,
            data: {
              values:
                expectedRevisions.flatMap(revision =>
                  originalPlot.datapoints?.[revision].map(values => ({
                    ...values,
                    rev: revision
                  }))
                ) || []
            }
          } as TopLevelSpec,
          {
            domain: expectedRevisions,
            range: copyOriginalColors().slice(0, 5)
          }
        ) as VisualizationSpec,
        id: path,
        multiView: isMultiViewPlot(originalPlot.content as TopLevelSpec),
        revisions: expectedRevisions,
        type: PlotsType.VEGA
      }
      if (plot.multiView) {
        multiViewPlots.entries.push(plot)
        continue
      }
      singleViewPlots.entries.push(plot)
    }
  }

  return [singleViewPlots, multiViewPlots]
}

export const getMinimalWebviewMessage = () => ({
  plots: extendedSpecs(basicVega),
  sectionName: DEFAULT_SECTION_NAMES[Section.TEMPLATE_PLOTS],
  size: PlotSize.REGULAR
})

export const getTemplateWebviewMessage = (): TemplatePlotsData => ({
  plots: extendedSpecs({ ...basicVega, ...require('./vega').default }),
  sectionName: DEFAULT_SECTION_NAMES[Section.TEMPLATE_PLOTS],
  size: PlotSize.REGULAR
})

export const getManyTemplatePlotsWebviewMessage = (
  length: number
): TemplatePlotsData => ({
  plots: extendedSpecs({
    ...multipleVega(length)
  }),
  sectionName: DEFAULT_SECTION_NAMES[Section.TEMPLATE_PLOTS],
  size: PlotSize.REGULAR
})

export const MOCK_IMAGE_MTIME = 946684800000

export const getComparisonWebviewMessage = (
  baseUrl: string,
  joinFunc?: (...args: string[]) => string
) => {
  const plotAcc = [] as ComparisonPlots
  for (const [path, plots] of Object.entries(getImageData(baseUrl, joinFunc))) {
    const revisionsAcc: ComparisonRevisionData = {}
    for (const { url, revisions } of plots) {
      const revision = revisions?.[0]
      if (!revision) {
        continue
      }
      revisionsAcc[revision] = { url: `${url}?${MOCK_IMAGE_MTIME}`, revision }
    }

    plotAcc.push({ path, revisions: revisionsAcc })
  }

  const [workspace, main, _4fb124a, _42b8735, _1ba7bcd] = copyOriginalColors()

  return {
    plots: plotAcc,
    revisions: [
      {
        revision: 'workspace',
        displayColor: workspace,
        group: undefined
      },
      { revision: 'main', displayColor: main, group: undefined },
      {
        revision: '4fb124a',
        displayColor: _4fb124a,
        group: '[exp-e7a67]'
      },
      {
        revision: '42b8736',
        displayColor: _42b8735,
        group: '[test-branch]'
      },
      {
        revision: '1ba7bcd',
        displayColor: _1ba7bcd,
        group: '[exp-83425]'
      }
    ],
    sectionName: DEFAULT_SECTION_NAMES[Section.COMPARISON_TABLE],
    size: PlotSize.REGULAR
  }
}
