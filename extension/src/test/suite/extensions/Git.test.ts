import { after, describe, it } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { ensureFile, accessSync, remove } from 'fs-extra'
import { window } from 'vscode'
import { Disposable } from '../../../extension'
import { join, resolve } from 'path'
import { GitExtension } from '../../../extensions/Git'
import { getAllUntracked } from '../../../git'

chai.use(sinonChai)
const { expect } = chai

suite('Git Extension Test Suite', () => {
  window.showInformationMessage('Start all git extension tests.')

  const workspacePath = resolve(__dirname, '..', '..', '..', '..', '..')
  const dvcDemoPath = join(workspacePath, 'demo')
  const untrackedDir = join(dvcDemoPath, 'folder-with-stuff')

  after(() => {
    remove(untrackedDir)
  })

  describe('GitExtension', () => {
    it("should provide an onDidUntrackedChange callback for each of it's repositories", async () => {
      const disposable = Disposable.fn()
      const gitExtension = disposable.track(new GitExtension())
      await gitExtension.ready

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
      disposable.dispose()
    }).timeout(10000)

    it('should be able to return the root path of each open repository', async () => {
      const disposable = Disposable.fn()
      const gitExtension = disposable.track(new GitExtension())
      await gitExtension.ready
      const [gitExtensionRepository] = gitExtension.repositories
      expect(gitExtensionRepository.getRepositoryRoot()).to.equal(workspacePath)
      disposable.dispose()
    })
  })
})
