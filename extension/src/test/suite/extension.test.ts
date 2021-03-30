import { before, beforeEach, describe, it } from 'mocha'
import chai from 'chai'
import { stub, spy } from 'sinon'
import sinonChai from 'sinon-chai'
import { ensureFile, remove } from 'fs-extra'
import {
  window,
  commands,
  workspace,
  Uri,
  extensions,
  Extension,
  Event,
  ConfigurationChangeEvent
} from 'vscode'
import { Disposable } from '../../extension'
import { join, resolve } from 'path'
import * as DvcReader from '../../cli/reader'
import complexExperimentsOutput from '../../webviews/experiments/complex-output-example.json'
import { ExperimentsWebview } from '../../webviews/experiments/ExperimentsWebview'
import { delay } from '../../util'

chai.use(sinonChai)
const { expect } = chai

const configChangePromise = () => {
  return new Promise(resolve => {
    const listener: Disposable = workspace.onDidChangeConfiguration(
      (event: ConfigurationChangeEvent) => {
        listener.dispose()
        return resolve(event)
      }
    )
  })
}

suite('Extension Test Suite', () => {
  window.showInformationMessage('Start all extension tests.')

  const demoFolderLocation = resolve(__dirname, '..', '..', '..', '..', 'demo')

  before(async () => {
    stub(DvcReader, 'listDvcOnlyRecursive').resolves([
      join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte'),
      join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz'),
      join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte'),
      join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz'),
      join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte'),
      join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz'),
      join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte'),
      join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte.gz'),
      join('logs', 'acc.tsv'),
      join('logs', 'loss.tsv'),
      'model.pt'
    ])
  })

  beforeEach(async () => {
    await workspace.getConfiguration().update('dvc.dvcPath', undefined, false)
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('dvc.showExperiments', () => {
    it('should be able to make the experiments webview visible', async () => {
      const mockReader = stub(DvcReader, 'getExperiments').resolves(
        complexExperimentsOutput
      )

      const experimentsWebview = (await commands.executeCommand(
        'dvc.showExperiments'
      )) as ExperimentsWebview

      expect(experimentsWebview.isActive()).to.be.true
      expect(experimentsWebview.isVisible()).to.be.true

      mockReader.restore()
      experimentsWebview.dispose()
    })

    it('should only be able to open a single experiments webview', async () => {
      const windowSpy = spy(window, 'createWebviewPanel')
      const uri = Uri.file(resolve(demoFolderLocation, 'train.py'))

      const mockReader = stub(DvcReader, 'getExperiments').resolves(
        complexExperimentsOutput
      )

      const document = await workspace.openTextDocument(uri)
      await window.showTextDocument(document)

      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const experimentsWebview = (await commands.executeCommand(
        'dvc.showExperiments'
      )) as ExperimentsWebview

      expect(windowSpy).to.have.been.calledOnce
      expect(mockReader).to.have.been.calledOnce

      windowSpy.resetHistory()
      mockReader.resetHistory()

      await commands.executeCommand('workbench.action.previousEditor')
      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const sameWebview = await commands.executeCommand('dvc.showExperiments')

      expect(experimentsWebview === sameWebview).to.be.true

      expect(windowSpy).not.to.have.been.called
      expect(mockReader).to.have.been.calledOnce

      windowSpy.restore()
      mockReader.restore()
      experimentsWebview.dispose()
    })
  })

  describe('dvc.selectDvcPath', () => {
    const selectDvcPathItem = async (selection: number) => {
      const selectionPromise = commands.executeCommand('dvc.selectDvcPath')

      for (let i = 0; i <= selection; i++) {
        await commands.executeCommand('workbench.action.quickOpenSelectNext')
      }
      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )
      await selectionPromise
    }

    it('should set dvc.dvcPath to blank on the first option', async () => {
      const mockShowInputBox = stub(window, 'showInputBox')
      await selectDvcPathItem(0)

      expect(await workspace.getConfiguration().get('dvc.dvcPath')).to.equal('')

      expect(mockShowInputBox).not.to.have.been.called

      mockShowInputBox.restore()
    })

    it('should invoke the file picker with the second option', async () => {
      const testUri = Uri.file('/file/picked/path/to/dvc')
      const fileResolve = [testUri]
      const mockShowOpenDialog = stub(window, 'showOpenDialog').resolves(
        fileResolve
      )

      await selectDvcPathItem(1)

      expect(mockShowOpenDialog).to.have.been.called

      await configChangePromise()

      expect(await workspace.getConfiguration().get('dvc.dvcPath')).to.equal(
        testUri.fsPath
      )

      mockShowOpenDialog.restore()
    })
  })

  describe('git extension', () => {
    it('should return a usable API', async () => {
      const untrackedDir = join(demoFolderLocation, 'folder-with-stuff')
      const untrackedFile = join(
        demoFolderLocation,
        'folder-with-stuff',
        'text.txt'
      )

      await ensureFile(untrackedFile)
      await delay(5000)

      const enum Status {
        INDEX_MODIFIED,
        INDEX_ADDED,
        INDEX_DELETED,
        INDEX_RENAMED,
        INDEX_COPIED,

        MODIFIED,
        DELETED,
        UNTRACKED,
        IGNORED,
        INTENT_TO_ADD,

        ADDED_BY_US,
        ADDED_BY_THEM,
        DELETED_BY_US,
        DELETED_BY_THEM,
        BOTH_ADDED,
        BOTH_DELETED,
        BOTH_MODIFIED
      }

      interface Change {
        /**
         * Returns either `originalUri` or `renameUri`, depending
         * on whether this change is a rename change. When
         * in doubt always use `uri` over the other two alternatives.
         */
        readonly uri: Uri
        readonly originalUri: Uri
        readonly renameUri: Uri | undefined
        readonly status: Status
      }

      interface RepositoryState {
        // readonly HEAD: Branch | undefined
        // readonly refs: Ref[]
        // readonly remotes: Remote[]
        // readonly submodules: Submodule[]
        // readonly rebaseCommit: Commit | undefined

        readonly mergeChanges: Change[]
        readonly indexChanges: Change[]
        readonly workingTreeChanges: Change[]

        readonly onDidChange: Event<void>
      }

      interface Repository {
        // readonly rootUri: Uri
        // readonly inputBox: InputBox
        readonly state: RepositoryState
        // readonly ui: RepositoryUIState

        // getConfigs(): Promise<{ key: string; value: string }[]>
        // getConfig(key: string): Promise<string>
        // setConfig(key: string, value: string): Promise<string>
        // getGlobalConfig(key: string): Promise<string>

        // getObjectDetails(
        //   treeish: string,
        //   path: string
        // ): Promise<{ mode: string; object: string; size: number }>
        // detectObjectType(
        //   object: string
        // ): Promise<{ mimetype: string; encoding?: string }>
        // buffer(ref: string, path: string): Promise<Buffer>
        // show(ref: string, path: string): Promise<string>
        // getCommit(ref: string): Promise<Commit>

        // clean(paths: string[]): Promise<void>

        // apply(patch: string, reverse?: boolean): Promise<void>
        // diff(cached?: boolean): Promise<string>
        // diffWithHEAD(): Promise<Change[]>
        // diffWithHEAD(path: string): Promise<string>
        // diffWith(ref: string): Promise<Change[]>
        // diffWith(ref: string, path: string): Promise<string>
        // diffIndexWithHEAD(): Promise<Change[]>
        // diffIndexWithHEAD(path: string): Promise<string>
        // diffIndexWith(ref: string): Promise<Change[]>
        // diffIndexWith(ref: string, path: string): Promise<string>
        // diffBlobs(object1: string, object2: string): Promise<string>
        // diffBetween(ref1: string, ref2: string): Promise<Change[]>
        // diffBetween(ref1: string, ref2: string, path: string): Promise<string>

        // hashObject(data: string): Promise<string>

        // createBranch(
        //   name: string,
        //   checkout: boolean,
        //   ref?: string
        // ): Promise<void>
        // deleteBranch(name: string, force?: boolean): Promise<void>
        // getBranch(name: string): Promise<Branch>
        // getBranches(query: BranchQuery): Promise<Ref[]>
        // setBranchUpstream(name: string, upstream: string): Promise<void>

        // getMergeBase(ref1: string, ref2: string): Promise<string>

        // status(): Promise<void>
        // checkout(treeish: string): Promise<void>

        // addRemote(name: string, url: string): Promise<void>
        // removeRemote(name: string): Promise<void>
        // renameRemote(name: string, newName: string): Promise<void>

        // fetch(options?: FetchOptions): Promise<void>
        // fetch(remote?: string, ref?: string, depth?: number): Promise<void>
        // pull(unshallow?: boolean): Promise<void>
        // push(
        //   remoteName?: string,
        //   branchName?: string,
        //   setUpstream?: boolean,
        //   force?: ForcePushMode
        // ): Promise<void>

        // blame(path: string): Promise<string>
        // log(options?: LogOptions): Promise<Commit[]>

        // commit(message: string, opts?: CommitOptions): Promise<void>
      }

      interface API {
        // readonly state: APIState
        // readonly onDidChangeState: Event<APIState>
        // readonly onDidPublish: Event<PublishEvent>
        // readonly git: Git
        readonly repositories: Repository[]
        // readonly onDidOpenRepository: Event<Repository>
        // readonly onDidCloseRepository: Event<Repository>
        toGitUri(uri: Uri, ref: string): Uri
        // getRepository(uri: Uri): Repository | null
        // init(root: Uri): Promise<Repository | null>
        // openRepository(root: Uri): Promise<Repository | null>
        // registerRemoteSourceProvider(provider: RemoteSourceProvider): Disposable
        // registerCredentialsProvider(provider: CredentialsProvider): Disposable
        // registerPushErrorHandler(handler: PushErrorHandler): Disposable
      }

      interface GitExtensionAPI {
        getAPI(version: number): Thenable<API>
      }

      type GitExtension = Extension<GitExtensionAPI>
      const gitExtension = extensions.getExtension('vscode.git') as GitExtension
      expect(gitExtension).not.to.be.undefined
      const api = await (await gitExtension.activate()).getAPI(1)

      const gitUri = api.toGitUri(Uri.file(__filename), 'HEAD')
      expect(gitUri).not.to.be.undefined

      expect(gitUri.scheme).to.equal('git')

      const query = JSON.parse(gitUri.query)
      expect(query.path).to.equal(__filename)
      expect(query.ref).to.equal('HEAD')

      const repositories = api.repositories
      const repository = repositories[0]

      try {
        remove(untrackedDir)
      } catch {}

      expect(repositories.length).to.equal(1)

      const untrackedChanges = repository.state.workingTreeChanges.filter(
        c => c.status === Status.UNTRACKED
      )

      expect(untrackedChanges).to.have.lengthOf.at.least(1)
      expect(untrackedChanges.find(c => c.uri.fsPath === untrackedFile)).not.to
        .be.undefined
    }).timeout(6000)
  })
})
