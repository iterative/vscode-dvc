import { describe, it } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { ensureFile, accessSync, remove } from 'fs-extra'
import { Uri, window } from 'vscode'
import { Disposable } from '../../../extension'
import { join, resolve } from 'path'
import { Git } from '../../../extensions/Git'

chai.use(sinonChai)
const { expect } = chai

suite('Git Extension Test Suite', () => {
  window.showInformationMessage('Start all git extension tests.')

  describe('Git', () => {
    const workspacePath = resolve(__dirname, '..', '..', '..', '..', '..')
    const dvcDemoPath = join(workspacePath, 'demo')

    it('should return Uris of untracked files', async () => {
      const disposable = Disposable.fn()
      const gitExtensionWrapper = disposable.track(new Git())
      await gitExtensionWrapper.ready

      const untrackedDir = join(dvcDemoPath, 'folder-with-stuff')
      const untrackedFile = join(dvcDemoPath, 'folder-with-stuff', 'text.txt')

      const untrackedChangeEvent = (): Promise<Uri[]> => {
        return new Promise(resolve => {
          const listener: Disposable = gitExtensionWrapper.onDidChange(
            (event: Uri[]) => {
              return resolve(event)
            }
          )
          disposable.track(listener)
        })
      }

      const untrackedChanges = untrackedChangeEvent()

      await ensureFile(untrackedFile)
      expect(accessSync(untrackedFile)).not.to.throw

      expect(await untrackedChanges).to.have.lengthOf.at.least(1)
      expect((await untrackedChanges).find(uri => uri.fsPath === untrackedFile))
        .not.to.be.undefined
      remove(untrackedDir)
      disposable.dispose()
    }).timeout(10000)

    it('should return the rootUri of each open repository', async () => {
      const disposable = Disposable.fn()
      const gitExtensionWrapper = disposable.track(new Git())
      await gitExtensionWrapper.ready
      const gitRepoRoot = gitExtensionWrapper.repositories.map(
        repository => repository.rootUri.fsPath
      )
      expect(gitRepoRoot).to.deep.equal([workspacePath])
      disposable.dispose()
    })
  })
})
