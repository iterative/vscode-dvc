/* eslint-disable sort-keys-fix/sort-keys-fix */
import { collectPaths } from './collect'
import { PlotsType, Plot } from '../webview/contract'

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
