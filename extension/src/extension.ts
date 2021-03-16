/* eslint-disable no-console */
import { workspace, window, commands, scm, Uri, ExtensionContext } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import {
  enableHotReload,
  hotRequireExportedFn,
  registerUpdateReconciler,
  getReloadCount
} from '@hediet/node-reload'
import {
  add,
  checkout,
  commit,
  destroy,
  fetch,
  gc,
  initialize,
  install,
  IntegratedTerminal,
  list,
  pull,
  push,
  runExperiment,
  status
} from './IntegratedTerminal'

import { Config } from './Config'
import { DvcWebviewManager } from './DvcWebviewManager'
import { getExperiments, inferDefaultOptions } from './dvcReader'

import { DVCPathStatusBarItem, selectDvcPath } from './DvcPath'
import { addFileChangeHandler } from './fileSystem'
import { getExperimentsRefsPath } from './git'
import { ResourceLocator } from './ResouceLocator'

export { Disposable }

if (process.env.HOT_RELOAD) {
  enableHotReload({ entryModule: module, loggingEnabled: true })
}

registerUpdateReconciler(module)

export class Extension {
  public readonly dispose = Disposable.fn()

  private readonly resourceLocator: ResourceLocator
  private readonly config: Config
  private readonly manager: DvcWebviewManager

  private getDefaultCwd = (): string => {
    const { workspaceFolders } = workspace
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('There are no folders in the Workspace to operate on!')
    }

    return workspaceFolders[0].uri.fsPath
  }

  private dvcPathStatusBarItem: DVCPathStatusBarItem

  private lastExperimentsOutputHash = ''

  private onChangeExperimentsUpdateWebview = async (): Promise<Disposable> => {
    const cwd = this.getDefaultCwd()
    const refsPath = await getExperimentsRefsPath(cwd)
    if (!refsPath) {
      throw new Error(
        'Live updates for the experiment table are not possible as the Git repo root was not found!'
      )
    }
    return addFileChangeHandler(refsPath, this.refreshWebviews)
  }

  private refreshWebviews = async () => {
    const { experiments, outputHash } = await this.getExperimentsTableData()
    if (outputHash !== this.lastExperimentsOutputHash) {
      this.lastExperimentsOutputHash = outputHash
      this.manager.refreshAll(experiments)
    }
  }

  private async getExperimentsTableData() {
    const dvcReaderOptions = await inferDefaultOptions(this.getDefaultCwd())
    return getExperiments(dvcReaderOptions)
  }

  constructor(context: ExtensionContext) {
    if (getReloadCount(module) > 0) {
      const i = this.dispose.track(window.createStatusBarItem())
      i.text = `reload${getReloadCount(module)}`
      i.show()
    }

    this.resourceLocator = new ResourceLocator(context.extensionPath)

    this.config = new Config()

    this.manager = this.dispose.track(
      new DvcWebviewManager(this.config, this.resourceLocator)
    )

    this.onChangeExperimentsUpdateWebview().then(disposable =>
      this.dispose.track(disposable)
    )

    this.dispose.track(IntegratedTerminal)

    this.dispose.track((this.dvcPathStatusBarItem = new DVCPathStatusBarItem()))

    // When hot-reload is active, make sure that you dispose everything when the extension is disposed!
    this.dispose.track(
      workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('dvc.dvcPath')) {
          this.dvcPathStatusBarItem.update()
        }
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.selectDvcPath', async () => selectDvcPath())
    )

    this.dispose.track(
      commands.registerCommand('dvc.showExperiments', async () => {
        const dvcWebview = this.dispose.track(await this.manager.findOrCreate())
        try {
          const { experiments } = await this.getExperimentsTableData()
          dvcWebview.showExperiments({ tableData: experiments })
        } catch (e) {
          dvcWebview.showExperiments({ errors: [e.toString()] })
        }
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.add', item => {
        item.rootUri && add(item.rootUri.path)
        item.path && add(item.path)
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.checkout', item => {
        item.rootUri && checkout(item.rootUri.path)
        item.path && checkout(item.path)
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.checkoutRecursive', item => {
        item.rootUri && checkout(item.rootUri.path)
        item.path && checkout(item.path, ['-R'])
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.commit', () => {
        commit()
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.destroy', () => {
        destroy()
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.fetch', item => {
        item.rootUri && fetch(item.rootUri.path)
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.fetchAllBranches', item => {
        fetch(item, ['-a'])
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.gc', item => {
        item.rootUri && gc(item.rootUri.path, ['-w'])
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.init', item => {
        item.rootUri && initialize(item.rootUri.path)
        item.path && initialize(item.path, ['--subdir']) 
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.initNoScm', item => {
        item.rootUri && initialize(item.rootUri.path, ['--no-scm'])
        item.path && initialize(item.path, ['--subdir', '--no-scm'])
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.install', () => {
        install()
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.list', () => {
        list()
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.pull', () => {
        pull()
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.push', item => {
        item.rootUri && push(item.rootUri.path)
        item.uri && push(item.uri.path)
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.runExperiment',() => {
        runExperiment()
        commands.executeCommand('dvc.showExperiments')
      })
    )

    this.dispose.track(
      commands.registerCommand('dvc.status', () => {
        status()
      })
    )

    this.dvcScmFilesView()
  }

  dvcScmFilesView(): void {
    const { workspaceFolders } = workspace
    if (!workspaceFolders) return

    workspaceFolders.forEach(folder => {
      const uri = `${folder.uri.fsPath}/`

      const c = this.dispose.track(
        scm.createSourceControl('dvc', 'DVC', Uri.file(uri))
      )
      c.acceptInputCommand = {
        command: 'workbench.action.output.toggleOutput',
        title: 'foo'
      }

      c.inputBox.placeholder = "Message (Ctrl+Enter to commit on 'master')"
      // ic.commitTemplate = "templatea";

      c.statusBarCommands = [
        {
          command: 'test',
          title: 'DVC'
        }
      ]

      const resourceGroup = this.dispose.track(
        c.createResourceGroup('group1', 'Unchanged')
      )

      resourceGroup.resourceStates = [
        {
          resourceUri: Uri.file(`${uri}path/file.ts`),
          command: {
            command: 'workbench.action.output.toggleOutput',
            title: 'group1-file1'
          },

          decorations: {
            strikeThrough: false
          }
        },
        {
          resourceUri: Uri.file(`${uri}path/file2.txt`),
          command: {
            command: 'workbench.action.output.toggleOutput',
            title: 'group1-file1'
          },
          decorations: {
            strikeThrough: false
          }
        },
        {
          resourceUri: Uri.file(`${uri}path/sub/file.txt`),
          command: {
            command: 'workbench.action.output.toggleOutput',
            title: 'group1-file1'
          },
          decorations: {
            strikeThrough: false
          }
        }
      ]
    })
  }
}

export function activate(context: ExtensionContext): void {
  context.subscriptions.push(
    hotRequireExportedFn(
      module,
      Extension,
      HotExtension => new HotExtension(context)
    )
  )
}

// export function deactivate(): void {}
