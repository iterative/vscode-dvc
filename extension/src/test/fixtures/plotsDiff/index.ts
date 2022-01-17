import { VisualizationSpec } from 'react-vega'
import { DefaultSectionNames } from '../../../plots/model'
import { PlotSize, PlotsType, Section } from '../../../plots/webview/contract'
import { join } from '../../util/path'

const basicVega = {
  'logs/loss.tsv': [
    {
      type: PlotsType.VEGA,
      revisions: ['6220556', 'a9eb4fd', '7ee8096', 'e36f8a9'],
      content: {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        data: {
          values: [
            {
              loss: '2.298783302307129',
              rev: '6220556',
              step: '0',
              timestamp: '1641966224600'
            },
            {
              loss: '2.2779736518859863',
              rev: '6220556',
              step: '1',
              timestamp: '1641966239108'
            },
            {
              loss: '2.2572131156921387',
              rev: '6220556',
              step: '2',
              timestamp: '1641966253176'
            },
            {
              loss: '2.238112688064575',
              rev: '6220556',
              step: '3',
              timestamp: '1641966267354'
            },
            {
              loss: '2.212251901626587',
              rev: '6220556',
              step: '4',
              timestamp: '1641966285745'
            },
            {
              loss: '2.1894900798797607',
              rev: '6220556',
              step: '5',
              timestamp: '1641966303339'
            },
            {
              loss: '2.165510654449463',
              rev: '6220556',
              step: '6',
              timestamp: '1641966320693'
            },
            {
              loss: '2.135964870452881',
              rev: '6220556',
              step: '7',
              timestamp: '1641966335781'
            },
            {
              loss: '2.114135265350342',
              rev: '6220556',
              step: '8',
              timestamp: '1641966351758'
            },
            {
              loss: '1.6454246044158936',
              rev: 'a9eb4fd',
              step: '0',
              timestamp: '1642041785966'
            },
            {
              loss: '1.6063436269760132',
              rev: 'a9eb4fd',
              step: '1',
              timestamp: '1642041804111'
            },
            {
              loss: '1.5570942163467407',
              rev: 'a9eb4fd',
              step: '2',
              timestamp: '1642041820386'
            },
            {
              loss: '1.5230435132980347',
              rev: 'a9eb4fd',
              step: '3',
              timestamp: '1642041836358'
            },
            {
              loss: '1.473145842552185',
              rev: 'a9eb4fd',
              step: '4',
              timestamp: '1642041851764'
            },
            {
              loss: '1.444159984588623',
              rev: 'a9eb4fd',
              step: '5',
              timestamp: '1642041866838'
            },
            {
              loss: '1.3941730260849',
              rev: 'a9eb4fd',
              step: '6',
              timestamp: '1642041881837'
            },
            {
              loss: '1.370380163192749',
              rev: 'a9eb4fd',
              step: '7',
              timestamp: '1642041897483'
            },
            {
              loss: '1.3217320442199707',
              rev: 'a9eb4fd',
              step: '8',
              timestamp: '1642041912764'
            },
            {
              loss: '2.273470401763916',
              rev: '7ee8096',
              step: '0',
              timestamp: '1642041482186'
            },
            {
              loss: '2.20936918258667',
              rev: '7ee8096',
              step: '1',
              timestamp: '1642041500577'
            },
            {
              loss: '2.153379201889038',
              rev: '7ee8096',
              step: '2',
              timestamp: '1642041519065'
            },
            {
              loss: '2.0221104621887207',
              rev: '7ee8096',
              step: '3',
              timestamp: '1642041543481'
            },
            {
              loss: '2.024623155593872',
              rev: '7ee8096',
              step: '4',
              timestamp: '1642041565772'
            },
            {
              loss: '1.8110722303390503',
              rev: '7ee8096',
              step: '5',
              timestamp: '1642041586986'
            },
            {
              loss: '1.7324824333190918',
              rev: '7ee8096',
              step: '6',
              timestamp: '1642041609569'
            },
            {
              loss: '1.6054636240005493',
              rev: '7ee8096',
              step: '7',
              timestamp: '1642041631783'
            },
            {
              loss: '1.5145071744918823',
              rev: '7ee8096',
              step: '8',
              timestamp: '1642041648829'
            },
            {
              loss: '2.0380799770355225',
              rev: 'e36f8a9',
              step: '0',
              timestamp: '1642041230991'
            },
            {
              loss: '2.0002100467681885',
              rev: 'e36f8a9',
              step: '1',
              timestamp: '1642041244696'
            },
            {
              loss: '1.9573605060577393',
              rev: 'e36f8a9',
              step: '2',
              timestamp: '1642041257185'
            },
            {
              loss: '1.91573965549469',
              rev: 'e36f8a9',
              step: '3',
              timestamp: '1642041270652'
            },
            {
              loss: '1.8714964389801025',
              rev: 'e36f8a9',
              step: '4',
              timestamp: '1642041284801'
            },
            {
              loss: '1.8267308473587036',
              rev: 'e36f8a9',
              step: '5',
              timestamp: '1642041301919'
            },
            {
              loss: '1.7825157642364502',
              rev: 'e36f8a9',
              step: '6',
              timestamp: '1642041318814'
            },
            {
              loss: '1.7360031604766846',
              rev: 'e36f8a9',
              step: '7',
              timestamp: '1642041335775'
            },
            {
              loss: '1.6929490566253662',
              rev: 'e36f8a9',
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
      } as VisualizationSpec
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
      revisions: ['HEAD'],
      url: joinFunc(baseUrl, 'HEAD_plots_acc.png')
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
      revisions: ['HEAD'],
      url: joinFunc(baseUrl, 'HEAD_plots_loss.png')
    }
  ]
})

export const getSmallMemoryFootprintFixture = (
  baseUrl: string,
  joinFunc?: (...args: string[]) => string
) => ({
  plots: {
    ...getImageData(baseUrl, joinFunc),
    ...basicVega
  },
  sectionName: DefaultSectionNames[Section.STATIC_PLOTS],
  size: PlotSize.REGULAR
})

export const getFixture = (
  baseUrl: string,
  joinFunc?: (...args: string[]) => string
) => ({
  ...getImageData(baseUrl, joinFunc),
  ...basicVega,
  ...require('./vega').default
})

export const getWebviewMessageFixture = (
  baseUrl: string,
  joinFunc?: (...args: string[]) => string
) => ({
  plots: getFixture(baseUrl, joinFunc),
  sectionName: DefaultSectionNames[Section.STATIC_PLOTS],
  size: PlotSize.REGULAR
})
