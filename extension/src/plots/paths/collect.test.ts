/* eslint-disable sort-keys-fix/sort-keys-fix */
import { join } from 'path'
import { collectPaths } from './collect'
import { PlotsType } from '../webview/contract'
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
        type: new Set(['template'])
      },
      { hasChildren: true, parentPath: undefined, path: 'logs' },
      {
        hasChildren: false,
        parentPath: 'logs',
        path: join('logs', 'acc.tsv'),
        type: new Set(['template'])
      },
      {
        hasChildren: false,
        parentPath: undefined,
        path: 'predictions.json',
        type: new Set(['template'])
      }
    ])
  })

  it('should handle more complex paths', () => {
    const mockPlotsDiff = {
      [join('logs', 'scalars', 'acc.tsv')]: [
        {
          type: PlotsType.VEGA,
          revisions: ['workspace'],
          content: {}
        }
      ],
      [join('logs', 'scalars', 'loss.tsv')]: [
        {
          type: PlotsType.VEGA,
          revisions: ['workspace'],
          content: {}
        }
      ],
      [join('plots', 'heatmap.png')]: [
        {
          type: PlotsType.IMAGE,
          revisions: ['workspace'],
          url: join('plots', 'heatmap.png')
        }
      ],
      'predictions.json': [
        {
          type: PlotsType.VEGA,
          revisions: ['workspace'],
          content: {}
        }
      ]
    }

    expect(collectPaths(mockPlotsDiff)).toStrictEqual([
      {
        hasChildren: false,
        parentPath: join('logs', 'scalars'),
        path: join('logs', 'scalars', 'acc.tsv'),
        type: new Set(['template'])
      },
      { hasChildren: true, parentPath: 'logs', path: join('logs', 'scalars') },
      { hasChildren: true, parentPath: undefined, path: 'logs' },
      {
        hasChildren: false,
        parentPath: join('logs', 'scalars'),
        path: join('logs', 'scalars', 'loss.tsv'),
        type: new Set(['template'])
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
        type: new Set(['template'])
      }
    ])
  })
})
