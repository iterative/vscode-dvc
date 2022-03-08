/* eslint-disable sort-keys-fix/sort-keys-fix */
import { join } from 'path'
import { collectPaths, collectPathsWithParents } from './collect'
import { PlotsType, Plot } from '../webview/contract'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'

describe('collectPaths', () => {
  it('should always return the paths in order', () => {
    const { comparison, templates } = collectPaths({
      z: [{ type: PlotsType.IMAGE } as Plot],
      b: [{ type: PlotsType.IMAGE } as Plot],
      a: [{ type: PlotsType.IMAGE } as Plot],
      y: [{ type: PlotsType.VEGA } as Plot],
      c: [{ type: PlotsType.VEGA } as Plot],
      f: [{ type: PlotsType.VEGA } as Plot]
    })

    expect(comparison).toStrictEqual(['a', 'b', 'z'])
    expect(templates).toStrictEqual(['c', 'f', 'y'])
  })
})

describe('collectPath', () => {
  it('should return the expected data from the test fixture', () => {
    expect(collectPathsWithParents(plotsDiffFixture)).toStrictEqual([
      {
        hasChildren: false,
        parentPath: 'plots',
        path: 'plots/acc.png'
      },
      { hasChildren: true, parentPath: undefined, path: 'plots' },
      {
        hasChildren: false,
        parentPath: 'plots',
        path: 'plots/heatmap.png'
      },
      {
        hasChildren: false,
        parentPath: 'plots',
        path: 'plots/loss.png'
      },
      {
        hasChildren: false,
        parentPath: 'logs',
        path: 'logs/loss.tsv'
      },
      { hasChildren: true, parentPath: undefined, path: 'logs' },
      { hasChildren: false, parentPath: 'logs', path: 'logs/acc.tsv' },
      { hasChildren: false, parentPath: undefined, path: 'predictions.json' }
    ])
  })

  it('should handle more complex paths', () => {
    const mockPlotsDiff = {
      [join('logs', 'scalars', 'acc.tsv')]: [],
      [join('logs', 'scalars', 'loss.tsv')]: [],
      [join('plots', 'heatmap.png')]: [],
      'predictions.json': []
    }

    expect(collectPathsWithParents(mockPlotsDiff)).toStrictEqual([
      {
        hasChildren: false,
        parentPath: join('logs', 'scalars'),
        path: join('logs', 'scalars', 'acc.tsv')
      },
      { hasChildren: true, parentPath: 'logs', path: join('logs', 'scalars') },
      { hasChildren: true, parentPath: undefined, path: 'logs' },
      {
        hasChildren: false,
        parentPath: join('logs', 'scalars'),
        path: join('logs', 'scalars', 'loss.tsv')
      },
      {
        hasChildren: false,
        parentPath: 'plots',
        path: join('plots', 'heatmap.png')
      },
      { hasChildren: true, parentPath: undefined, path: 'plots' },
      { hasChildren: false, parentPath: undefined, path: 'predictions.json' }
    ])
  })
})
