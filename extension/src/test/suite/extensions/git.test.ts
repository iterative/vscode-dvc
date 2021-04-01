import { describe, it } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { ensureFile, accessSync, remove } from 'fs-extra'
import { Uri, window } from 'vscode'
import { Disposable } from '../../../extension'
import { join, resolve } from 'path'
import { GitExtensionInterface } from '../../../extensions/git'

chai.use(sinonChai)
const { expect } = chai

suite('Git Extension Test Suite', () => {
  window.showInformationMessage('Start all git extension tests.')

  describe('git extension', () => {
    const demoFolderLocation = resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      'demo'
    )

    it('should return Uris of untracked files', async () => {
      const disposable = Disposable.fn()
      const untrackedDir = join(demoFolderLocation, 'folder-with-stuff')
      const untrackedFile = join(
        demoFolderLocation,
        'folder-with-stuff',
        'text.txt'
      )

      const gitExtensionWrapper = new GitExtensionInterface()
      await gitExtensionWrapper.ready
      const gitRepoRoot = gitExtensionWrapper.repositories.map(
        repository => repository.rootUri.fsPath
      )
      expect(gitRepoRoot).to.deep.equal([
        resolve(__dirname, '..', '..', '..', '..', '..')
      ])

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
  })
})
