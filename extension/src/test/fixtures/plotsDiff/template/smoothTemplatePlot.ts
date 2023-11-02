import { Title } from 'vega'
import { EXPERIMENT_WORKSPACE_ID } from '../../../../cli/dvc/contract'

const smoothTemplatePlotContent = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: [
      {
        timestamp: '1651815999735',
        step: '0',
        acc: '0.2712',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816000510',
        step: '1',
        acc: '0.4104',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816001808',
        step: '2',
        acc: '0.5052',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816003335',
        step: '3',
        acc: '0.6678',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816005282',
        step: '4',
        acc: '0.5457',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816006730',
        step: '5',
        acc: '0.6654',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816008092',
        step: '6',
        acc: '0.6689',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816009423',
        step: '7',
        acc: '0.6841',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816010848',
        step: '8',
        acc: '0.7325',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816012290',
        step: '9',
        acc: '0.6935',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816013666',
        step: '10',
        acc: '0.7514',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816014874',
        step: '11',
        acc: '0.691',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816016290',
        step: '12',
        acc: '0.7712',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816017814',
        step: '13',
        acc: '0.7105',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651816018919',
        step: '14',
        acc: '0.7735',
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        timestamp: '1651815999735',
        step: '0',
        acc: '0.2712',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816000510',
        step: '1',
        acc: '0.4104',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816001808',
        step: '2',
        acc: '0.5052',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816003335',
        step: '3',
        acc: '0.6678',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816005282',
        step: '4',
        acc: '0.5457',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816006730',
        step: '5',
        acc: '0.6654',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816008092',
        step: '6',
        acc: '0.6689',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816009423',
        step: '7',
        acc: '0.6841',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816010848',
        step: '8',
        acc: '0.7325',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816012290',
        step: '9',
        acc: '0.6935',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816013666',
        step: '10',
        acc: '0.7514',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816014874',
        step: '11',
        acc: '0.691',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816016290',
        step: '12',
        acc: '0.7712',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816017814',
        step: '13',
        acc: '0.7105',
        rev: 'smooth-plots'
      },
      {
        timestamp: '1651816018919',
        step: '14',
        acc: '0.7735',
        rev: 'smooth-plots'
      }
    ]
  },
  title: 'training_metrics/scalars/acc.tsv',
  width: 300,
  height: 300,
  params: [
    {
      name: 'smooth',
      value: 0.2,
      bind: { input: 'range', min: 0.001, max: 1, step: 0.01 }
    }
  ],
  transform: [
    {
      loess: 'acc',
      on: 'step',
      groupby: ['rev'],
      bandwidth: { signal: 'smooth' }
    }
  ],
  layer: [
    {
      encoding: {
        x: { field: 'step', type: 'quantitative', title: 'step' },
        y: {
          field: 'acc',
          type: 'quantitative',
          title: 'acc',
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
            text: { type: 'quantitative', field: 'acc' },
            x: { field: 'step', type: 'quantitative' },
            y: { field: 'acc', type: 'quantitative' }
          },
          layer: [
            {
              mark: { type: 'text', align: 'left', dx: 5, dy: -5 },
              encoding: { color: { type: 'nominal', field: 'rev' } }
            }
          ]
        }
      ]
    }
  ],
  encoding: {
    color: {
      legend: { disable: true },
      scale: {
        domain: [EXPERIMENT_WORKSPACE_ID, 'smooth-plots'],
        range: ['#945dd6', '#13adc7']
      }
    }
  },
  titles: {
    main: { normal: '' as unknown as Title, truncated: '' },
    x: { normal: '' as unknown as Title, truncated: '' },
    y: { normal: '' as unknown as Title, truncated: '' }
  }
}

export default smoothTemplatePlotContent
