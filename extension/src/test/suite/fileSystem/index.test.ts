import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { Disposable } from '@hediet/std/disposable'
import { restore } from 'sinon'
import { dvcDemoPath } from '../../util'
import { getGitPath } from '../../../fileSystem'
import { gitPath } from '../../../cli/git/constants'
import { GitReader } from '../../../cli/git/reader'
import { standardizePath } from '../../../fileSystem/path'
import { EXPERIMENTS_GIT_REFS } from '../../../experiments/data/constants'

suite('File System Watcher Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('getGitPath', () => {
    it('should get the expected paths for the demo repository (submodule)', async () => {
      const reader = disposable.track(new GitReader())
      const root = await reader.getGitRepositoryRoot(__dirname)
      const submoduleDotGit = standardizePath(
        resolve(root, gitPath.DOT_GIT, 'modules', 'demo')
      ) as string

      const dotGitPath = getGitPath(dvcDemoPath, gitPath.DOT_GIT)
      expect(dotGitPath).to.equal(submoduleDotGit)

      const expRefPaths = getGitPath(dvcDemoPath, EXPERIMENTS_GIT_REFS)
      expect(expRefPaths).to.equal(join(submoduleDotGit, EXPERIMENTS_GIT_REFS))
    })

    it('should get the expected paths for this project', async () => {
      const reader = disposable.track(new GitReader())
      const root = await reader.getGitRepositoryRoot(__dirname)
      const rootDotGit = standardizePath(
        resolve(root, gitPath.DOT_GIT)
      ) as string

      const dotGitPath = getGitPath(root, gitPath.DOT_GIT)
      expect(dotGitPath).to.equal(rootDotGit)

      const expRefPaths = getGitPath(rootDotGit, EXPERIMENTS_GIT_REFS)
      expect(expRefPaths).to.equal(join(rootDotGit, EXPERIMENTS_GIT_REFS))
    })
  })
})
