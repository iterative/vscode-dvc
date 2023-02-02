import { join, resolve } from 'path'
import process from 'process'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { Disposable } from '@hediet/std/disposable'
import { restore } from 'sinon'
import { ensureFileSync, removeSync, writeFileSync } from 'fs-extra'
import { dvcDemoPath } from '../../util'
import {
  checkSignalFile,
  exists,
  getGitPath,
  isDirectory,
  isFile
} from '../../../fileSystem'
import { gitPath } from '../../../cli/git/constants'
import { GitReader } from '../../../cli/git/reader'
import { standardizePath } from '../../../fileSystem/path'
import { EXPERIMENTS_GIT_REFS } from '../../../experiments/data/constants'

suite('File System Test Suite', () => {
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
      )

      const dotGitPath = getGitPath(dvcDemoPath, gitPath.DOT_GIT)
      expect(dotGitPath).to.equal(submoduleDotGit)

      const expRefPaths = getGitPath(dvcDemoPath, EXPERIMENTS_GIT_REFS)
      expect(expRefPaths).to.equal(join(submoduleDotGit, EXPERIMENTS_GIT_REFS))
    })

    it('should get the expected paths for this project', async () => {
      const reader = disposable.track(new GitReader())
      const root = await reader.getGitRepositoryRoot(__dirname)
      const rootDotGit = standardizePath(resolve(root, gitPath.DOT_GIT))

      const dotGitPath = getGitPath(root, gitPath.DOT_GIT)
      expect(dotGitPath).to.equal(rootDotGit)

      const expRefPaths = getGitPath(root, EXPERIMENTS_GIT_REFS)
      expect(expRefPaths).to.equal(join(rootDotGit, EXPERIMENTS_GIT_REFS))
    })
  })

  describe('checkSignalFile', () => {
    it('should check the appropriate file and remove if necessary', async () => {
      const mockSignalFilePath = join(__dirname, 'MOCK_SIGNAL_FILE')

      if (exists(mockSignalFilePath)) {
        removeSync(mockSignalFilePath)
      }

      expect(
        await checkSignalFile(mockSignalFilePath),
        'should return false if the file does not exist'
      ).to.be.false

      ensureFileSync(mockSignalFilePath)
      expect(exists(mockSignalFilePath)).to.be.true

      expect(
        await checkSignalFile(mockSignalFilePath),
        'should return false and remove the file if it does not contain a pid'
      ).to.be.false

      expect(exists(mockSignalFilePath)).to.be.false

      writeFileSync(mockSignalFilePath, `${process.pid}`)

      expect(
        await checkSignalFile(mockSignalFilePath),
        'should return true and not remove the file if it contains a valid pid'
      ).to.be.true

      expect(exists(mockSignalFilePath)).to.be.true

      writeFileSync(mockSignalFilePath, 'not a pid')

      expect(
        await checkSignalFile(mockSignalFilePath),
        'should return false and remove the file if it contains a pid that can not be found'
      ).to.be.false

      expect(exists(mockSignalFilePath)).to.be.false
    })
  })

  describe('isFile', () => {
    it('should return true when the path is a file', () => {
      const path = standardizePath(join(dvcDemoPath, 'train.py'))

      const result = isFile(path)
      expect(result).to.be.true
    })

    it('should return false when the file cannot be found', () => {
      const path = standardizePath(join('some', 'fun', 'file.txt'))

      const result = isFile(path)
      expect(result).to.be.false
    })

    it('should return false for a directory', () => {
      const path = standardizePath(join(dvcDemoPath, 'training'))

      expect(isDirectory(path)).to.be.true

      const result = isFile(path)
      expect(result).to.be.false
    })
  })
})
