import { join } from 'path'
import { collectMultiSourceEncoding } from './collect'

describe('collectMultiSourceEncoding', () => {
  it('should return an empty object given a single variation collected from the datapoints', () => {
    const multiSourceEncoding = collectMultiSourceEncoding({
      path: [{ field: 'x', filename: 'path' }]
    })
    expect(multiSourceEncoding).toStrictEqual({})
  })

  it('should return an object containing a filename strokeDash given variations with differing filenames', () => {
    const otherPath = join('other', 'path')
    const multiSourceEncoding = collectMultiSourceEncoding({
      combined: [
        { field: 'x', filename: 'path' },
        { field: 'x', filename: otherPath }
      ]
    })
    expect(multiSourceEncoding).toStrictEqual({
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

  it('should return an object containing a field strokeDash given variations with differing fields', () => {
    const multiSourceEncoding = collectMultiSourceEncoding({
      path: [
        { field: 'x', filename: 'path' },
        { field: 'z', filename: 'path' }
      ]
    })
    expect(multiSourceEncoding).toStrictEqual({
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

  it('should return an object containing a merged filename::field strokeDash given variations with differing filename and fields', () => {
    const otherPath = join('other', 'path')
    const multiSourceEncoding = collectMultiSourceEncoding({
      combined: [
        { field: 'x', filename: 'path' },
        { field: 'z', filename: otherPath }
      ]
    })
    expect(multiSourceEncoding).toStrictEqual({
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

  it('should return an object containing a merged filename::field strokeDash given variations with differing filename and similar field', () => {
    const multiSourceEncoding = collectMultiSourceEncoding({
      combined: [
        { field: 'x', filename: join('first', 'path') },
        { field: 'z', filename: join('second', 'path') },
        { field: 'z', filename: join('third', 'path') }
      ]
    })
    expect(multiSourceEncoding).toStrictEqual({
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

  it('should return an object containing a merged filename::field strokeDash given variations with differing filename and field for each variation', () => {
    const multiSourceEncoding = collectMultiSourceEncoding({
      combined: [
        { field: 'x', filename: join('first', 'path') },
        { field: 'z', filename: join('second', 'path') },
        { field: 'q', filename: join('third', 'path') }
      ]
    })
    expect(multiSourceEncoding).toStrictEqual({
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

  it('should return an object containing a filename strokeDash and field shape given variations with unmergable combinations of filename and field', () => {
    const multiSourceEncoding = collectMultiSourceEncoding({
      combined: [
        { field: 'x', filename: 'path' },
        { field: 'z', filename: 'path' },
        { field: 'z', filename: join('other', 'path') }
      ]
    })
    expect(multiSourceEncoding).toStrictEqual({
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
