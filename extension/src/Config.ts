import {
  ColorTheme,
  ColorThemeKind,
  EventEmitter,
  Event,
  StatusBarItem,
  window,
  workspace
} from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { makeObservable, observable } from 'mobx'
import { WebviewColorTheme } from './Experiments/Webview/contract'
import {
  getOnDidChangePythonExecutionDetails,
  getPythonBinPath
} from './extensions/python'
import { ExecutionOptions } from './cli/execution'
import { findDvcRootPaths } from './fileSystem'
import { relative } from 'path'
import { QuickPickItemWithValue } from './vscode/quickPick'
import { setConfigValue } from './vscode/config'

export class Config {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  public isReady() {
    return this.initialized
  }

  public readonly workspaceRoot: string

  private readonly executionDetailsChanged: EventEmitter<
    void
  > = this.dispose.track(new EventEmitter())

  public readonly onDidChangeExecutionDetails: Event<void> = this
    .executionDetailsChanged.event

  @observable
  public pythonBinPath: string | undefined

  @observable
  private vsCodeTheme: ColorTheme

  public getTheme(): WebviewColorTheme {
    if (this.vsCodeTheme.kind === ColorThemeKind.Dark) {
      return WebviewColorTheme.dark
    }
    return WebviewColorTheme.light
  }

  public getExecutionOptions(): ExecutionOptions {
    return {
      cliPath: this.getCliPath(),
      cwd: this.workspaceRoot,
      pythonBinPath: this.pythonBinPath
    }
  }

  @observable
  private dvcPathStatusBarItem: StatusBarItem

  private getWorkspaceRoot = (): string => {
    const { workspaceFolders } = workspace
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('There are no folders in the Workspace to operate on!')
    }

    return workspaceFolders[0].uri.fsPath
  }

  private dvcPathOption = 'dvc.dvcPath'

  public getCliPath(): string {
    return this.getConfigValue(this.dvcPathOption)
  }

  private notifyIfChanged(
    oldPath: string | undefined,
    newPath: string | undefined
  ) {
    if (oldPath !== newPath) {
      this.executionDetailsChanged.fire()
    }
  }

  private setDvcPath(path?: string): Thenable<void> {
    this.notifyIfChanged(this.getCliPath(), path)
    return setConfigValue(this.dvcPathOption, path)
  }

  private dvcPathQuickPickItems = [
    {
      label: 'Default',
      description: 'Use Python Extension virtual environment if available',
      picked: true,
      value: undefined
    },
    {
      label: 'Find',
      description: 'Browse the filesystem for a DVC executable',
      value: async () => {
        const result = await window.showOpenDialog({
          title: 'Select a DVC executable'
        })
        if (result) {
          const [input] = result
          const { fsPath } = input
          this.setDvcPath(fsPath)
          return fsPath
        } else {
          return undefined
        }
      }
    }
  ]

  public selectDvcPath = async (): Promise<void> => {
    const result = await window.showQuickPick(this.dvcPathQuickPickItems, {
      placeHolder: 'Please choose...'
    })
    if (result) {
      const { value } = result
      if (typeof value === 'function') {
        await value()
      } else {
        this.setDvcPath(value)
      }
    }
  }

  @observable
  private defaultProjectStatusBarItem: StatusBarItem

  private defaultProjectOption = 'dvc.defaultProject'

  public getDefaultProject(): string {
    return this.getConfigValue(this.defaultProjectOption)
  }

  public deselectDefaultProject = (): Thenable<void> =>
    this.setDefaultProject(undefined)

  private getDefaultProjectOptions(
    dvcRoots: string[]
  ): QuickPickItemWithValue[] {
    return [
      {
        label: 'Always prompt',
        description: 'Choose project each time a command is run',
        picked: true,
        value: 'remove-default'
      },
      ...dvcRoots.map(dvcRoot => ({
        label: 'Project',
        description: dvcRoot,
        value: dvcRoot
      }))
    ]
  }

  private async pickDefaultProject(): Promise<string | undefined> {
    const options = this.getExecutionOptions()
    const dvcRoots = await findDvcRootPaths(options)

    if (dvcRoots) {
      const selected = await window.showQuickPick(
        this.getDefaultProjectOptions(dvcRoots),
        {
          canPickMany: false,
          placeHolder: 'Select a default project to run all commands against'
        }
      )

      if (selected?.value === 'remove-default') {
        this.deselectDefaultProject()
        return
      }

      return selected?.value
    }
  }

  public selectDefaultProject = async (): Promise<void> => {
    const dvcRoot = await this.pickDefaultProject()
    if (dvcRoot) {
      this.setDefaultProject(dvcRoot)
    }
  }

  private setDefaultProject(path?: string): Thenable<void> {
    return setConfigValue(this.defaultProjectOption, path)
  }

  private createStatusBarItem = (
    command: string,
    tooltip: string,
    text: string
  ) => {
    const dvcPathStatusBarItem = window.createStatusBarItem()

    dvcPathStatusBarItem.tooltip = tooltip
    dvcPathStatusBarItem.command = command
    dvcPathStatusBarItem.text = text
    dvcPathStatusBarItem.show()

    return dvcPathStatusBarItem
  }

  private setStatusBarItemText(
    statusBarItem: StatusBarItem,
    path: string
  ): void {
    statusBarItem.text = this.getRelativePathText(path)
  }

  private getRelativePathText(path?: string): string {
    if (!path) {
      return ''
    }
    return relative(this.getWorkspaceRoot(), path) || '.'
  }

  private getConfigValue(key: string): string {
    return workspace.getConfiguration().get(key, '')
  }

  constructor() {
    makeObservable(this)

    getPythonBinPath().then(path => {
      this.pythonBinPath = path
      return this.deferred.resolve()
    })

    getOnDidChangePythonExecutionDetails().then(
      onDidChangePythonExecutionDetails =>
        this.dispose.track(
          onDidChangePythonExecutionDetails?.(async () => {
            const oldPath = this.pythonBinPath
            this.pythonBinPath = await getPythonBinPath()
            this.notifyIfChanged(oldPath, this.pythonBinPath)
          })
        )
    )

    this.workspaceRoot = this.getWorkspaceRoot()

    this.vsCodeTheme = window.activeColorTheme

    this.dispose.track(
      window.onDidChangeActiveColorTheme(() => {
        this.vsCodeTheme = window.activeColorTheme
      })
    )

    this.dvcPathStatusBarItem = this.dispose.track(
      this.createStatusBarItem(
        'dvc.selectDvcPath',
        'Current DVC path.',
        this.getCliPath()
      )
    )

    this.defaultProjectStatusBarItem = this.dispose.track(
      this.createStatusBarItem(
        'dvc.selectDefaultProject',
        'Current default project.',
        this.getDefaultProject()
      )
    )

    this.dispose.track(
      workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(this.dvcPathOption)) {
          this.setStatusBarItemText(
            this.dvcPathStatusBarItem,
            this.getCliPath()
          )
        }
        if (e.affectsConfiguration(this.defaultProjectOption)) {
          this.setStatusBarItemText(
            this.defaultProjectStatusBarItem,
            this.getDefaultProject()
          )
        }
      })
    )
  }
}
