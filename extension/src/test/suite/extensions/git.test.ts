import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { window } from 'vscode'
import { Disposable } from '../../../extension'
import { resolve } from 'path'
import { getGitRepositoryRoots } from '../../../extensions/git'
import { restore } from 'sinon'

chai.use(sinonChai)
const { expect } = chai

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
