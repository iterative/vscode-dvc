import { TopLevelSpec } from 'vega-lite'
import { VisualizationSpec } from 'react-vega'
import { extendVegaSpec, isMultiViewPlot } from '../../../plots/vega/util'
import { PlotsOutput } from '../../../cli/reader'
import {
  ComparisonRevisionData,
  ComparisonPlots,
  DEFAULT_SECTION_NAMES,
  PlotSize,
  PlotsType,
  Section,
  StaticPlotsData,
  VegaPlots
} from '../../../plots/webview/contract'
import { join } from '../../util/path'
import { getWorkspaceColor } from '../../../experiments/model/colors'

const basicVega = {
  'logs/loss.tsv': [
    {
      type: PlotsType.VEGA,
      revisions: ['workspace', 'main', '42b8736', '1ba7bcd', '4fb124a'],
      content: {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        data: {
          values: [
            {
              loss: '2.298783302307129',
              rev: 'workspace',
              step: '0',
              timestamp: '1641966224600'
            },
            {
              loss: '2.2779736518859863',
              rev: 'workspace',
              step: '1',
              timestamp: '1641966239108'
            },
            {
              loss: '2.2572131156921387',
              rev: 'workspace',
              step: '2',
              timestamp: '1641966253176'
            },
            {
              loss: '2.238112688064575',
              rev: 'workspace',
              step: '3',
              timestamp: '1641966267354'
            },
            {
              loss: '2.212251901626587',
              rev: 'workspace',
              step: '4',
              timestamp: '1641966285745'
            },
            {
              loss: '2.1894900798797607',
              rev: 'workspace',
              step: '5',
              timestamp: '1641966303339'
            },
            {
              loss: '2.165510654449463',
              rev: 'workspace',
              step: '6',
              timestamp: '1641966320693'
            },
            {
              loss: '2.135964870452881',
              rev: 'workspace',
              step: '7',
              timestamp: '1641966335781'
            },
            {
              loss: '2.114135265350342',
              rev: 'workspace',
              step: '8',
              timestamp: '1641966351758'
            },
            {
              loss: '2.298783302307129',
              rev: 'main',
              step: '0',
              timestamp: '1641966224600'
            },
            {
              loss: '2.2779736518859863',
              rev: 'main',
              step: '1',
              timestamp: '1641966239108'
            },
            {
              loss: '2.2572131156921387',
              rev: 'main',
              step: '2',
              timestamp: '1641966253176'
            },
            {
              loss: '2.238112688064575',
              rev: 'main',
              step: '3',
              timestamp: '1641966267354'
            },
            {
              loss: '2.212251901626587',
              rev: 'main',
              step: '4',
              timestamp: '1641966285745'
            },
            {
              loss: '2.1894900798797607',
              rev: 'main',
              step: '5',
              timestamp: '1641966303339'
            },
            {
              loss: '2.165510654449463',
              rev: 'main',
              step: '6',
              timestamp: '1641966320693'
            },
            {
              loss: '2.135964870452881',
              rev: 'main',
              step: '7',
              timestamp: '1641966335781'
            },
            {
              loss: '2.114135265350342',
              rev: 'main',
              step: '8',
              timestamp: '1641966351758'
            },
            {
              loss: '2.298783302307129',
              rev: 'workspace',
              step: '0',
              timestamp: '1641966224600'
            },
            {
              loss: '2.2779736518859863',
              rev: 'workspace',
              step: '1',
              timestamp: '1641966239108'
            },
            {
              loss: '2.2572131156921387',
              rev: 'workspace',
              step: '2',
              timestamp: '1641966253176'
            },
            {
              loss: '2.238112688064575',
              rev: 'workspace',
              step: '3',
              timestamp: '1641966267354'
            },
            {
              loss: '2.212251901626587',
              rev: 'workspace',
              step: '4',
              timestamp: '1641966285745'
            },
            {
              loss: '2.1894900798797607',
              rev: 'workspace',
              step: '5',
              timestamp: '1641966303339'
            },
            {
              loss: '2.165510654449463',
              rev: 'workspace',
              step: '6',
              timestamp: '1641966320693'
            },
            {
              loss: '2.135964870452881',
              rev: 'workspace',
              step: '7',
              timestamp: '1641966335781'
            },
            {
              loss: '2.114135265350342',
              rev: 'workspace',
              step: '8',
              timestamp: '1641966351758'
            },
            {
              loss: '1.6454246044158936',
              rev: '42b8736',
              step: '0',
              timestamp: '1642041785966'
            },
            {
              loss: '1.6063436269760132',
              rev: '42b8736',
              step: '1',
              timestamp: '1642041804111'
            },
            {
              loss: '1.5570942163467407',
              rev: '42b8736',
              step: '2',
              timestamp: '1642041820386'
            },
            {
              loss: '1.5230435132980347',
              rev: '42b8736',
              step: '3',
              timestamp: '1642041836358'
            },
            {
              loss: '1.473145842552185',
              rev: '42b8736',
              step: '4',
              timestamp: '1642041851764'
            },
            {
              loss: '1.444159984588623',
              rev: '42b8736',
              step: '5',
              timestamp: '1642041866838'
            },
            {
              loss: '1.3941730260849',
              rev: '42b8736',
              step: '6',
              timestamp: '1642041881837'
            },
            {
              loss: '1.370380163192749',
              rev: '42b8736',
              step: '7',
              timestamp: '1642041897483'
            },
            {
              loss: '1.3217320442199707',
              rev: '42b8736',
              step: '8',
              timestamp: '1642041912764'
            },
            {
              loss: '2.273470401763916',
              rev: '1ba7bcd',
              step: '0',
              timestamp: '1642041482186'
            },
            {
              loss: '2.20936918258667',
              rev: '1ba7bcd',
              step: '1',
              timestamp: '1642041500577'
            },
            {
              loss: '2.153379201889038',
              rev: '1ba7bcd',
              step: '2',
              timestamp: '1642041519065'
            },
            {
              loss: '2.0221104621887207',
              rev: '1ba7bcd',
              step: '3',
              timestamp: '1642041543481'
            },
            {
              loss: '2.024623155593872',
              rev: '1ba7bcd',
              step: '4',
              timestamp: '1642041565772'
            },
            {
              loss: '1.8110722303390503',
              rev: '1ba7bcd',
              step: '5',
              timestamp: '1642041586986'
            },
            {
              loss: '1.7324824333190918',
              rev: '1ba7bcd',
              step: '6',
              timestamp: '1642041609569'
            },
            {
              loss: '1.6054636240005493',
              rev: '1ba7bcd',
              step: '7',
              timestamp: '1642041631783'
            },
            {
              loss: '1.5145071744918823',
              rev: '1ba7bcd',
              step: '8',
              timestamp: '1642041648829'
            },
            {
              loss: '2.0380799770355225',
              rev: '4fb124a',
              step: '0',
              timestamp: '1642041230991'
            },
            {
              loss: '2.0002100467681885',
              rev: '4fb124a',
              step: '1',
              timestamp: '1642041244696'
            },
            {
              loss: '1.9573605060577393',
              rev: '4fb124a',
              step: '2',
              timestamp: '1642041257185'
            },
            {
              loss: '1.91573965549469',
              rev: '4fb124a',
              step: '3',
              timestamp: '1642041270652'
            },
            {
              loss: '1.8714964389801025',
              rev: '4fb124a',
              step: '4',
              timestamp: '1642041284801'
            },
            {
              loss: '1.8267308473587036',
              rev: '4fb124a',
              step: '5',
              timestamp: '1642041301919'
            },
            {
              loss: '1.7825157642364502',
              rev: '4fb124a',
              step: '6',
              timestamp: '1642041318814'
            },
            {
              loss: '1.7360031604766846',
              rev: '4fb124a',
              step: '7',
              timestamp: '1642041335775'
            },
            {
              loss: '1.6929490566253662',
              rev: '4fb124a',
              step: '8',
              timestamp: '1642041350855'
            }
          ]
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

export const getImageData = (baseUrl: string, joinFunc = join) => ({
  'plots/acc.png': [
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
      revisions: ['1ba7bcd'],
      url: joinFunc(baseUrl, '1ba7bcd_plots_acc.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['42b8736'],
      url: joinFunc(baseUrl, '42b8736_plots_acc.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['4fb124a'],
      url: joinFunc(baseUrl, '4fb124a_plots_acc.png')
    }
  ],
  'plots/heatmap.png': [
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
      revisions: ['1ba7bcd'],
      url: joinFunc(baseUrl, '1ba7bcd_plots_heatmap.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['42b8736'],
      url: joinFunc(baseUrl, '42b8736_plots_heatmap.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['4fb124a'],
      url: joinFunc(baseUrl, '4fb124a_plots_heatmap.png')
    }
  ],
  'plots/loss.png': [
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
      revisions: ['1ba7bcd'],
      url: joinFunc(baseUrl, '1ba7bcd_plots_loss.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['42b8736'],
      url: joinFunc(baseUrl, '42b8736_plots_loss.png')
    },
    {
      type: PlotsType.IMAGE,
      revisions: ['4fb124a'],
      url: joinFunc(baseUrl, '4fb124a_plots_loss.png')
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

const extendedSpecs = (plotsOutput: VegaPlots): VegaPlots =>
  Object.entries(plotsOutput).reduce((acc, [id, plots]) => {
    acc[id] = plots.map(plot => ({
      content: extendVegaSpec(
        {
          ...plot.content,
          data: {
            values:
              (plot.content.data as { values: { rev: string }[] }).values.sort(
                function ({ rev: a }, { rev: b }) {
                  return (
                    expectedRevisions.indexOf(a) - expectedRevisions.indexOf(b)
                  )
                }
              ) || []
          }
        } as TopLevelSpec,
        {
          domain: expectedRevisions,
          range: [
            getWorkspaceColor(),
            '#13adc7',
            '#f14c4c',
            '#3794ff',
            '#cca700'
          ]
        }
      ) as VisualizationSpec,
      multiView: isMultiViewPlot(plot.content as TopLevelSpec),
      revisions: expectedRevisions,
      type: PlotsType.VEGA
    }))

    return acc
  }, {} as VegaPlots)

export const getMinimalWebviewMessage = () => ({
  plots: {
    ...basicVega
  },
  sectionName: DEFAULT_SECTION_NAMES[Section.STATIC_PLOTS],
  size: PlotSize.REGULAR
})

export const getStaticWebviewMessage = (): StaticPlotsData => ({
  plots: {
    ...extendedSpecs({ ...basicVega, ...require('./vega').default })
  },
  sectionName: DEFAULT_SECTION_NAMES[Section.STATIC_PLOTS],
  size: PlotSize.REGULAR
})

export const getComparisonWebviewMessage = (
  baseUrl: string,
  joinFunc?: (...args: string[]) => string
) => ({
  plots: Object.entries({
    ...getImageData(baseUrl, joinFunc)
  }).reduce((acc, [path, plots]) => {
    const revisions = plots.reduce((acc, { url, revisions }) => {
      const revision = revisions?.[0]
      if (revision) {
        acc[revision] = { url, revision }
      }
      return acc
    }, {} as ComparisonRevisionData)

    acc.push({ path, revisions })
    return acc
  }, [] as ComparisonPlots),
  revisions: {
    '4fb124a': { color: '#f14c4c' },
    '42b8736': { color: '#3794ff' },
    '1ba7bcd': { color: '#cca700' },
    main: { color: '#13adc7' },
    workspace: { color: getWorkspaceColor() }
  },
  sectionName: DEFAULT_SECTION_NAMES[Section.COMPARISON_TABLE],
  size: PlotSize.REGULAR
})
