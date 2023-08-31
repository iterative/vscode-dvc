import { getPathArray } from './util'

describe('getPathArray', () => {
  it('should split both unix and windows style paths', () => {
    expect(getPathArray('windows\\style\\path')).toStrictEqual([
      'windows',
      'style',
      'path'
    ])

    expect(getPathArray('unix/style/path')).toStrictEqual([
      'unix',
      'style',
      'path'
    ])
  })
})
