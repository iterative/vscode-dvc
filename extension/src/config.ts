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
import { WebviewColorTheme } from './experiments/webview/contract'
import {
  getOnDidChangePythonExecutionDetails,
  getPythonBinPath
} from './extensions/python'
import { QuickPickItemWithValue } from './vscode/quickPick'
import { getConfigValue, setConfigValue } from './vscode/config'
import { definedAndNonEmpty } from './util/array'

export class Config {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise
  private dvcRoots: string[] = []

  public setDvcRoots(dvcRoots: string[]): void {
    this.dvcRoots = dvcRoots
  }

  public isReady() {
    return this.initialized
  }

  public readonly firstWorkspaceFolderRoot: string

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

  @observable
  private dvcPathStatusBarItem: StatusBarItem

  private getFirstWorkspaceFolderRoot = (): string => {
    const { workspaceFolders } = workspace
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('There are no folders in the Workspace to operate on!')
    }

    return workspaceFolders[0].uri.fsPath
  }

  private dvcPathOption = 'dvc.dvcPath'

  public getCliPath(): string {
    return getConfigValue(this.dvcPathOption)
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
      description: 'Use Python Extension virtual environment if available',
      label: 'Default',
      picked: true,
      value: undefined
    },
    {
      description: 'Browse the filesystem for a DVC executable',
      label: 'Find',
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
    return getConfigValue(this.defaultProjectOption)
  }

  public deselectDefaultProject = (): Thenable<void> =>
    this.setDefaultProject(undefined)

  private getDefaultProjectOptions(
    dvcRoots: string[]
  ): QuickPickItemWithValue[] {
    return [
      {
        description: 'Choose project each time a command is run',
        label: 'Always prompt',
        picked: true,
        value: 'remove-default'
      },
      ...dvcRoots.map(dvcRoot => ({
        description: dvcRoot,
        label: 'Project',
        value: dvcRoot
      }))
    ]
  }

  private async pickDefaultProject(): Promise<string | undefined> {
    if (definedAndNonEmpty(this.dvcRoots)) {
      const selected = await window.showQuickPick(
        this.getDefaultProjectOptions(this.dvcRoots),
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
    statusBarItem.text = path
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

    this.firstWorkspaceFolderRoot = this.getFirstWorkspaceFolderRoot()

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
