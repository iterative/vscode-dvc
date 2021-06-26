import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { window } from 'vscode'
import { restore } from 'sinon'
import { Disposable } from '../../../extension'
import { getGitRepositoryRoots } from '../../../extensions/git'

suite('Git Extension Test Suite', () => {
  window.showInformationMessage('Start all git extension tests.')

  const workspacePath = resolve(__dirname, '..', '..', '..', '..', '..')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('getGitRepositoryRoots', () => {
    it('should be able to return the root path of each open repository', async () => {
      const gitRoots = await getGitRepositoryRoots()
      const [gitRoot] = gitRoots
      expect(gitRoot).to.equal(workspacePath)
    })
  })
})
