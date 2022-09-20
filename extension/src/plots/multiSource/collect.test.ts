import { join } from 'path'
import { collectMultiSourceData } from './collect'

describe('collectMultiSourceData', () => {
  it('should return an empty object given no multi source data', () => {
    const multiSourceKeys = collectMultiSourceData({
      path: [{ field: 'x', filename: 'path' }]
    })
    expect(multiSourceKeys).toStrictEqual({})
  })

  it('should return an object containing a filename strokeDash given data with varying filenames', () => {
    const otherPath = join('other', 'path')
    const multiSourceKeys = collectMultiSourceData({
      combined: [
        { field: 'x', filename: 'path' },
        { field: 'x', filename: otherPath }
      ]
    })
    expect(multiSourceKeys).toStrictEqual({
      combined: {
        strokeDash: {
          field: 'filename',
          scale: {
            domain: [otherPath, 'path'],
            range: [
              [1, 0],
              [8, 8]
            ]
          }
        }
      }
    })
  })

  it('should return an object containing a field strokeDash given data with varying fields', () => {
    const multiSourceKeys = collectMultiSourceData({
      path: [
        { field: 'x', filename: 'path' },
        { field: 'z', filename: 'path' }
      ]
    })
    expect(multiSourceKeys).toStrictEqual({
      path: {
        strokeDash: {
          field: 'field',
          scale: {
            domain: ['x', 'z'],
            range: [
              [1, 0],
              [8, 8]
            ]
          }
        }
      }
    })
  })

  it('should return an object containing a filename::field strokeDash given data with varying filename and fields', () => {
    const otherPath = join('other', 'path')
    const multiSourceKeys = collectMultiSourceData({
      combined: [
        { field: 'x', filename: 'path' },
        { field: 'z', filename: otherPath }
      ]
    })
    expect(multiSourceKeys).toStrictEqual({
      combined: {
        strokeDash: {
          field: 'filename::field',
          scale: {
            domain: [`${otherPath}::z`, 'path::x'],
            range: [
              [1, 0],
              [8, 8]
            ]
          }
        }
      }
    })
  })

  it('should return an object containing a filename::field strokeDash given data with varying filename and similar field', () => {
    const multiSourceKeys = collectMultiSourceData({
      combined: [
        { field: 'x', filename: join('first', 'path') },
        { field: 'z', filename: join('second', 'path') },
        { field: 'z', filename: join('third', 'path') }
      ]
    })
    expect(multiSourceKeys).toStrictEqual({
      combined: {
        strokeDash: {
          field: 'filename::field',
          scale: {
            domain: [
              `${join('first', 'path')}::x`,
              `${join('second', 'path')}::z`,
              `${join('third', 'path')}::z`
            ],
            range: [
              [1, 0],
              [8, 8],
              [8, 4]
            ]
          }
        }
      }
    })
  })

  it('should return an object containing a filename::field strokeDash given data with different filename and field for each variation', () => {
    const multiSourceKeys = collectMultiSourceData({
      combined: [
        { field: 'x', filename: join('first', 'path') },
        { field: 'z', filename: join('second', 'path') },
        { field: 'q', filename: join('third', 'path') }
      ]
    })
    expect(multiSourceKeys).toStrictEqual({
      combined: {
        strokeDash: {
          field: 'filename::field',
          scale: {
            domain: [
              `${join('first', 'path')}::x`,
              `${join('second', 'path')}::z`,
              `${join('third', 'path')}::q`
            ],
            range: [
              [1, 0],
              [8, 8],
              [8, 4]
            ]
          }
        }
      }
    })
  })

  it('should return an object containing a filename strokeDash and field shape given data with differently varying filename and field', () => {
    const multiSourceKeys = collectMultiSourceData({
      combined: [
        { field: 'x', filename: 'path' },
        { field: 'z', filename: 'path' },
        { field: 'z', filename: join('other', 'path') }
      ]
    })
    expect(multiSourceKeys).toStrictEqual({
      combined: {
        shape: {
          field: 'field',
          scale: { domain: ['x', 'z'], range: ['square', 'circle'] }
        },
        strokeDash: {
          field: 'filename',
          scale: {
            domain: [join('other', 'path'), 'path'],
            range: [
              [1, 0],
              [8, 8]
            ]
          }
        }
      }
    })
  })
})
