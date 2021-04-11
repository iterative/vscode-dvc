import { getAllUntracked } from './git'
import { ensureFile, remove } from 'fs-extra'
import { join, resolve } from 'path'
import { URI } from 'vscode-uri'
import { Uri } from 'vscode'
import { mapPaths } from './util/testHelpers'
import { mocked } from 'ts-jest/utils'

const mockedUriFile = mocked(Uri.file)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getAllUntracked', () => {
  it('should return a list of all untracked paths', async () => {
    mockedUriFile.mockImplementation(URI.file)
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

    const gitUntrackedPaths = mapPaths(await getAllUntracked(repositoryRoot))
    const dvcUntrackedPaths = mapPaths(await getAllUntracked(dvcRoot))

    await Promise.all([remove(untrackedDir), remove(untrackedPython)])

    expect(gitUntrackedPaths).toEqual(
      expect.arrayContaining([
        untrackedDir,
        untrackedPerl,
        untrackedText,
        untrackedPython
      ])
    )

    expect(dvcUntrackedPaths).toEqual(
      expect.arrayContaining([untrackedDir, untrackedPerl, untrackedText])
    )
    expect(dvcUntrackedPaths).not.toEqual(
      expect.arrayContaining([untrackedPython])
    )
  })
})
