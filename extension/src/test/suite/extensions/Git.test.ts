import { after, describe, it } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { ensureFile, accessSync, remove } from 'fs-extra'
import { window } from 'vscode'
import { Disposable } from '../../../extension'
import { join, resolve } from 'path'
import { Git, GitRepository } from '../../../extensions/Git'

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

  describe('Git', () => {
    it('should return a list of untracked paths', async () => {
      const disposable = Disposable.fn()
      const git = disposable.track(new Git())
      await git.ready

      const gitRepository = disposable.track(
        new GitRepository(git.repositories[0])
      )

      const untrackedFile = join(dvcDemoPath, 'folder-with-stuff', 'text.txt')

      const repositoryChangeEvent = (): Promise<string[]> => {
        return new Promise(resolve => {
          const listener: Disposable = gitRepository.onDidChange(
            (event: string[]) => {
              return resolve(event)
            }
          )
          disposable.track(listener)
        })
      }

      const changes = repositoryChangeEvent()

      await ensureFile(untrackedFile)
      expect(accessSync(untrackedFile)).not.to.throw

      const untrackedChanges = await changes
      expect(untrackedChanges).to.have.lengthOf.at.least(1)
      expect(untrackedChanges.find(path => path === untrackedFile)).not.to.be
        .undefined
      disposable.dispose()
    }).timeout(10000)

    it('should return the root path of each open repository', async () => {
      const disposable = Disposable.fn()
      const git = disposable.track(new Git())
      await git.ready
      const gitRepository = disposable.track(
        new GitRepository(git.repositories[0])
      )
      expect(gitRepository.getRepositoryRoot()).to.equal(workspacePath)
      disposable.dispose()
    })
  })
})
