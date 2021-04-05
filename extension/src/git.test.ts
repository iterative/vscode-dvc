import { getAllUntracked, getExperimentsRefsPath, getRepoRootPath } from './git'
import { ensureDir, ensureFile, lstatSync } from 'fs-extra'
import { join, resolve } from 'path'

describe('getExperimentsRefsPath', () => {
  it('should find the path of the custom experiments refs given a directory in this project', async () => {
    const refsPath = (await getExperimentsRefsPath(__dirname)) as string
    expect(refsPath).toBeDefined()
    const isValidPath = await ensureDir(refsPath)
    const existing = undefined
    const created = refsPath

    expect([existing, created]).toContain(isValidPath)
    expect(lstatSync(refsPath).isDirectory).toBeTruthy()
  })

  it('should return undefined given a non-existent path', async () => {
    const refsPath = await getExperimentsRefsPath(
      '/some/path/that/does/not/exist'
    )
    expect(refsPath).toBeUndefined()
  })
})

describe('getRepoRootPath', () => {
  it('should find the root directory given a directory in this project', async () => {
    const gitRoot = (await getRepoRootPath(__dirname)) as string

    expect(gitRoot).toBeDefined()
    const gitDir = resolve(gitRoot, '.git')
    expect(lstatSync(gitDir).isDirectory).toBeTruthy()
  })

  it('should return undefined given a non-existent path', async () => {
    const gitRoot = await getRepoRootPath('/some/path/that/does/not/exist')
    expect(gitRoot).toBeUndefined()
  })
})

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

    const untrackedDir = join(repositoryRoot, 'demo', 'data', 'weeeee')
    const untrackedPerl = join(untrackedDir, 'fun.pl')
    const untrackedText = join(untrackedDir, 'text.txt')

    await ensureFile(untrackedPerl)
    await ensureFile(untrackedPython)
    await ensureFile(untrackedText)

    expect(await getAllUntracked(repositoryRoot)).toEqual(
      expect.arrayContaining([
        resolve(repositoryRoot, 'demo/data/weeeee/'),
        untrackedPerl,
        untrackedText,
        untrackedPython
      ])
    )
  })
})
