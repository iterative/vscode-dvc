import { getRepoPathCore } from './git'
import { lstatSync } from 'fs-extra'
import { resolve } from 'path'

describe('getRepoPathCore', () => {
  it('should find the root directory given a directory in this project', async () => {
    const repoRoot = await getRepoPathCore(__dirname)

    expect(repoRoot).toBeDefined()
    if (repoRoot) {
      const gitDir = resolve(repoRoot, '.git')
      expect(lstatSync(gitDir).isDirectory).toBeTruthy()
    }
  })

  it('should return undefined given a non-existent path', async () => {
    const repoRoot = await getRepoPathCore('/some/path/that/does/not/exist')
    expect(repoRoot).toBeUndefined()
  })
})
