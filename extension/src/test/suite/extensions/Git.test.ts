import { after, afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { ensureFile, accessSync, remove } from 'fs-extra'
import { window } from 'vscode'
import { Disposable } from '../../../extension'
import { join, resolve } from 'path'
import { GitExtension } from '../../../extensions/Git'
import { getAllUntracked } from '../../../git'
import { restore } from 'sinon'

chai.use(sinonChai)
const { expect } = chai

suite('Git Extension Test Suite', () => {
  window.showInformationMessage('Start all git extension tests.')

  const workspacePath = resolve(__dirname, '..', '..', '..', '..', '..')
  const dvcDemoPath = join(workspacePath, 'demo')
  const untrackedDir = join(dvcDemoPath, 'folder-with-stuff')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  after(() => {
    remove(untrackedDir)
  })

  describe('GitExtension', () => {
    it("should provide an onDidUntrackedChange callback for each of it's repositories", async () => {
      const gitExtension = disposable.track(new GitExtension())
      await gitExtension.isReady()

      const [gitExtensionRepository] = gitExtension.repositories
      const gitRoot = gitExtensionRepository.getRepositoryRoot()

      const untrackedFile = join(dvcDemoPath, 'folder-with-stuff', 'text.txt')

      const repositoryUntrackedChangeEvent = (): Promise<void> => {
        return new Promise(resolve => {
          const listener: Disposable = gitExtensionRepository.onDidChange(
            (event: void) => {
              return resolve(event)
            }
          )
          disposable.track(listener)
        })
      }

      const change = repositoryUntrackedChangeEvent()

      await ensureFile(untrackedFile)
      expect(accessSync(untrackedFile)).not.to.throw

      await change
      const untrackedChanges = await getAllUntracked(gitRoot)
      expect(untrackedChanges).to.have.lengthOf.at.least(2)
      expect(untrackedChanges).to.include(untrackedFile, untrackedDir)
    }).timeout(10000)

    it('should be able to return the root path of each open repository', async () => {
      const gitExtension = disposable.track(new GitExtension())
      await gitExtension.isReady()
      const [gitExtensionRepository] = gitExtension.repositories
      expect(gitExtensionRepository.getRepositoryRoot()).to.equal(workspacePath)
    })
  })
})
