import { getRepoRootPath } from './git'
import { lstatSync } from 'fs-extra'
import { resolve } from 'path'

describe('getRepoRootPath', () => {
  it('should find the root directory given a directory in this project', async () => {
    const gitRoot = await getRepoRootPath(__dirname)

    expect(gitRoot).toBeDefined()
    if (gitRoot) {
      const gitDir = resolve(gitRoot, '.git')
      expect(lstatSync(gitDir).isDirectory).toBeTruthy()
    }
  })

  it('should return undefined given a non-existent path', async () => {
    const gitRoot = await getRepoRootPath('/some/path/that/does/not/exist')
    expect(gitRoot).toBeUndefined()
  })
})
