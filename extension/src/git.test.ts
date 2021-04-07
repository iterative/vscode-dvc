import { getAllUntracked } from './git'
import { ensureFile, remove } from 'fs-extra'
import { join, resolve } from 'path'
import { mapPaths } from './test/util'

describe('getAllUntracked', () => {
  it('should return a list of all untracked paths', async () => {
    const repositoryRoot = resolve(__dirname, '..', '..')

    const untrackedPython = join(
      repositoryRoot,
      'extension',
      'src',
      'views',
      'y.py'
    )

    const dvcRoot = join(repositoryRoot, 'demo')
    const untrackedDir = join(dvcRoot, 'data', 'weeeee')
    const untrackedPerl = join(untrackedDir, 'fun.pl')
    const untrackedText = join(untrackedDir, 'text.txt')

    await ensureFile(untrackedPerl)
    await ensureFile(untrackedPython)
    await ensureFile(untrackedText)

    const gitUntracked = await getAllUntracked(repositoryRoot)
    const dvcUntracked = await getAllUntracked(dvcRoot)

    await Promise.all([remove(untrackedDir), remove(untrackedPython)])

    expect(mapPaths(gitUntracked)).toEqual(
      expect.arrayContaining([
        untrackedDir,
        untrackedPerl,
        untrackedText,
        untrackedPython
      ])
    )

    expect(mapPaths(dvcUntracked)).toEqual(
      expect.arrayContaining([untrackedDir, untrackedPerl, untrackedText])
    )
    expect(mapPaths(dvcUntracked)).not.toEqual(
      expect.arrayContaining([untrackedPython])
    )
  })
})
