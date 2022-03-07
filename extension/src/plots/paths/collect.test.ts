/* eslint-disable sort-keys-fix/sort-keys-fix */
import { collectPaths } from './collect'
import { PlotsType, StaticPlot } from '../webview/contract'

describe('collectPaths', () => {
  it('should always return the paths in order', () => {
    const { comparison, plots } = collectPaths({
      z: [{ type: PlotsType.IMAGE } as StaticPlot],
      b: [{ type: PlotsType.IMAGE } as StaticPlot],
      a: [{ type: PlotsType.IMAGE } as StaticPlot],
      y: [{ type: PlotsType.VEGA } as StaticPlot],
      c: [{ type: PlotsType.VEGA } as StaticPlot],
      f: [{ type: PlotsType.VEGA } as StaticPlot]
    })

    expect(comparison).toStrictEqual(['a', 'b', 'z'])
    expect(plots).toStrictEqual(['c', 'f', 'y'])
  })
})
