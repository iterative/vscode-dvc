import { join, resolve } from 'path'
import { isExcluded } from '.'

describe('isExcluded', () => {
  it('should exclude empty paths', () => {
    const mockedDvcRoot = resolve('some', 'dvc', 'root')
    const excluded = isExcluded(mockedDvcRoot, '')

    expect(excluded).toBe(true)
  })

  it('should exclude experiments git refs paths', () => {
    const mockedDvcRoot = __dirname
    const path = join(mockedDvcRoot, '.git', 'refs', 'exps', '0F')

    const excluded = isExcluded(mockedDvcRoot, path)

    expect(excluded).toBe(true)
  })

  it('should not exclude paths from inside the repo', () => {
    const mockedDvcRoot = resolve('some', 'dvc', 'repo')
    const path = join(mockedDvcRoot, 'data', 'placeholder.dvc')

    const excluded = isExcluded(mockedDvcRoot, path)

    expect(excluded).toBe(false)
  })

  it('should not exclude .git/index (that is above the dvc root)', () => {
    const path = resolve(__dirname, '..', '..', '.git', 'index')

    const excluded = isExcluded(__dirname, path)

    expect(excluded).toBe(false)
  })

  it('should not exclude .git/ORIG_HEAD (that is above the dvc root)', () => {
    const path = resolve(__dirname, '..', '..', '.git', 'ORIG_HEAD')

    const excluded = isExcluded(__dirname, path)

    expect(excluded).toBe(false)
  })

  it('should exclude paths in the .git folder that do not contain index or HEAD', () => {
    const path = resolve(
      __dirname,
      '..',
      '..',
      '.git',
      'any',
      'other',
      'file',
      'or',
      'ref'
    )

    const excluded = isExcluded(__dirname, path)

    expect(excluded).toBe(true)
  })

  it('should exclude paths that are above the dvc root and not in the .git folder', () => {
    const path = resolve(__dirname, '..', '..', 'other', 'refs')

    const excluded = isExcluded(__dirname, path)

    expect(excluded).toBe(true)
  })
})
