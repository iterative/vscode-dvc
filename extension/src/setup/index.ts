import { Event, EventEmitter, ViewColumn, commands } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import isEmpty from 'lodash.isempty'
import { SetupData as TSetupData } from './webview/contract'
import { WebviewMessages } from './webview/messages'
import { findPythonBinForInstall } from './autoInstall'
import { run, runWithGlobalRecheck, runWorkspace } from './runner'
import { pickFocusedProjects } from './quickPick'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Resource } from '../resourceLocator'
import { isPythonExtensionInstalled } from '../extensions/python'
import {
  findAbsoluteDvcRootPath,
  findDvcRootPaths,
  findSubRootPaths,
  getBinDisplayText
} from '../fileSystem'
import { IExtensionSetup } from '../interfaces'
import { definedAndNonEmpty } from '../util/array'
import { Config } from '../config'
import {
  getFirstWorkspaceFolder,
  getWorkspaceFolderCount,
  getWorkspaceFolders
} from '../vscode/workspaceFolders'
import { DvcReader } from '../cli/dvc/reader'
import { setContextValue } from '../vscode/context'
import { DvcExecutor } from '../cli/dvc/executor'
import { GitReader } from '../cli/git/reader'
import { GitExecutor } from '../cli/git/executor'
import { RegisteredCliCommands, RegisteredCommands } from '../commands/external'
import { InternalCommands } from '../commands/internal'
import { Status } from '../status'
import { WorkspaceExperiments } from '../experiments/workspace'
import { DvcRunner } from '../cli/dvc/runner'
import { sendTelemetryEvent, sendTelemetryEventAndThrow } from '../telemetry'
import { StopWatch } from '../util/time'
import {
  createFileSystemWatcher,
  getRelativePattern
} from '../fileSystem/watcher'
import { EventName } from '../telemetry/constants'
import { WorkspaceScale } from '../telemetry/collect'
import { gitPath } from '../cli/git/constants'
import { DOT_DVC } from '../cli/dvc/constants'
import { ConfigKey, setConfigValue } from '../vscode/config'

export type SetupWebviewWebview = BaseWebview<TSetupData>

export class Setup
  extends BaseRepository<TSetupData>
  implements IExtensionSetup
{
  public readonly viewKey = ViewKey.SETUP

  public readonly initialize: () => Promise<void[]>
  public readonly resetMembers: () => void

  private dvcRoots: string[] = []

  private readonly config: Config
  private readonly dvcReader: DvcReader
  private readonly dvcExecutor: DvcExecutor
  private readonly gitReader: GitReader
  private readonly gitExecutor: GitExecutor
  private readonly status: Status

  private readonly webviewMessages: WebviewMessages
  private readonly showExperiments: () => void
  private readonly getHasData: () => boolean | undefined
  private readonly collectWorkspaceScale: () => Promise<WorkspaceScale>

  private readonly workspaceChanged: EventEmitter<void> = this.dispose.track(
    new EventEmitter()
  )

  private readonly onDidChangeWorkspace: Event<void> =
    this.workspaceChanged.event

  private cliAccessible = false
  private cliCompatible: boolean | undefined

  private dotFolderWatcher?: Disposer

  constructor(
    stopWatch: StopWatch,
    config: Config,
    dvcExecutor: DvcExecutor,
    dvcReader: DvcReader,
    dvcRunner: DvcRunner,
    gitExecutor: GitExecutor,
    gitReader: GitReader,
    initialize: () => Promise<void[]>,
    resetMembers: () => void,
    experiments: WorkspaceExperiments,
    internalCommands: InternalCommands,
    webviewIcon: Resource,
    collectWorkspaceScale: () => Promise<WorkspaceScale>
  ) {
    super('', webviewIcon)

    this.config = config
    this.dvcExecutor = dvcExecutor
    this.dvcReader = dvcReader
    this.gitExecutor = gitExecutor
    this.gitReader = gitReader

    this.status = this.dispose.track(
      new Status(
        this.config,
        this.dvcExecutor,
        this.dvcReader,
        dvcRunner,
        this.gitExecutor,
        this.gitReader
      )
    )

    this.initialize = initialize
    this.resetMembers = resetMembers

    this.collectWorkspaceScale = collectWorkspaceScale

    this.setCommandsAvailability(false)
    this.setProjectAvailability()

    this.webviewMessages = this.createWebviewMessageHandler()

    if (this.webview) {
      this.sendDataToWebview()
    }

    this.showExperiments = () =>
      experiments.showWebview(this.dvcRoots[0], ViewColumn.Active)

    this.registerCommands(internalCommands)

    this.getHasData = () => experiments.getHasData()
    const onDidChangeHasData = experiments.columnsChanged.event
    this.dispose.track(
      onDidChangeHasData(() => {
        this.sendDataToWebview()
        setContextValue('dvc.project.hasData', this.getHasData())
      })
    )

    this.dispose.track(
      this.onDidChangeWorkspace(() => {
        run(this)
      })
    )
    this.watchForVenvChanges()
    this.watchConfigurationDetailsForChanges()
    this.watchDotFolderForChanges()
    this.watchPathForChanges(stopWatch)
  }

  public getRoots() {
    return this.dvcRoots
  }

  public async getCliVersion(cwd: string, tryGlobalCli?: true) {
    await this.config.isReady()
    try {
      return await this.dvcReader.version(cwd, tryGlobalCli)
    } catch {}
  }

  public hasRoots() {
    return definedAndNonEmpty(this.getRoots())
  }

  public async isPythonExtensionUsed() {
    await this.config.isReady()
    return !!this.config.isPythonExtensionUsed()
  }

  public unsetPythonBinPath() {
    this.config.unsetPythonBinPath()
  }

  public async showSetup() {
    return await this.showWebview()
  }

  public shouldWarnUserIfCLIUnavailable() {
    return this.hasRoots() && !this.isFocused()
  }

  public async setRoots() {
    const nestedRoots = await this.findWorkspaceDvcRoots()
    this.dvcRoots =
      this.config.getFocusedProjects() || nestedRoots.flat().sort()

    this.sendDataToWebview()
    return this.setProjectAvailability()
  }

  public setAvailable(available: boolean) {
    this.status.setAvailability(available)
    this.setCommandsAvailability(available)
    this.cliAccessible = available
    this.sendDataToWebview()
    return available
  }

  public setCliCompatible(compatible: boolean | undefined) {
    this.cliCompatible = compatible
    const incompatible = compatible === undefined ? undefined : !compatible
    setContextValue('dvc.cli.incompatible', incompatible)
  }

  public getAvailable() {
    return this.cliAccessible
  }

  public isFocused() {
    return !!this.webview?.isActive
  }

  public sendInitialWebviewData() {
    return this.sendDataToWebview()
  }

  public async sendDataToWebview() {
    const projectInitialized = this.hasRoots()
    const hasData = this.getHasData()

    if (
      this.webview?.isVisible &&
      this.cliCompatible &&
      projectInitialized &&
      hasData
    ) {
      this.getWebview()?.dispose()
      this.showExperiments()
      return
    }

    const needsGitInitialized =
      !projectInitialized && !!(await this.needsGitInit())

    const canGitInitialize = await this.canGitInitialize(needsGitInitialized)

    const pythonBinPath = await findPythonBinForInstall()

    this.webviewMessages.sendWebviewMessage(
      this.cliCompatible,
      needsGitInitialized,
      canGitInitialize,
      projectInitialized,
      isPythonExtensionInstalled(),
      getBinDisplayText(pythonBinPath),
      hasData
    )
  }

  private createWebviewMessageHandler() {
    const webviewMessages = new WebviewMessages(
      () => this.getWebview(),
      () => this.initializeDvc(),
      () => this.initializeGit()
    )
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        webviewMessages.handleMessageFromWebview(message)
      )
    )
    return webviewMessages
  }

  private async findWorkspaceDvcRoots(): Promise<string[]> {
    const dvcRoots: string[] = []

    for (const workspaceFolder of getWorkspaceFolders()) {
      const workspaceFolderRoots = await findDvcRootPaths(workspaceFolder)
      if (definedAndNonEmpty(workspaceFolderRoots)) {
        dvcRoots.push(...workspaceFolderRoots)
        continue
      }

      await this.config.isReady()
      const absoluteRoot = await findAbsoluteDvcRootPath(
        workspaceFolder,
        this.dvcReader.root(workspaceFolder)
      )
      if (absoluteRoot) {
        dvcRoots.push(...absoluteRoot)
      }
    }

    const hasMultipleRoots = dvcRoots.length > 1
    setContextValue('dvc.multiple.projects', hasMultipleRoots)

    return dvcRoots
  }

  private setCommandsAvailability(available: boolean) {
    setContextValue('dvc.commands.available', available)
  }

  private setProjectAvailability() {
    const available = this.hasRoots()
    setContextValue('dvc.project.available', available)
    if (available && this.dotFolderWatcher && !this.dotFolderWatcher.disposed) {
      this.dispose.untrack(this.dotFolderWatcher)
      this.dotFolderWatcher.dispose()
    }
  }

  private async initializeDvc() {
    const root = getFirstWorkspaceFolder()
    if (root) {
      await this.dvcExecutor.init(root)
    }
  }

  private async canGitInitialize(needsGitInit: boolean) {
    if (!needsGitInit) {
      return false
    }
    const nestedRoots = await Promise.all(
      getWorkspaceFolders().map(workspaceFolder =>
        findSubRootPaths(workspaceFolder, '.git')
      )
    )

    return isEmpty(nestedRoots.flat())
  }

  private async needsGitInit() {
    if (this.hasRoots()) {
      return false
    }

    const cwd = getFirstWorkspaceFolder()
    if (!cwd) {
      return undefined
    }

    try {
      return !(await this.gitReader.getGitRepositoryRoot(cwd))
    } catch {
      return true
    }
  }

  private initializeGit() {
    const cwd = getFirstWorkspaceFolder()
    if (cwd) {
      this.gitExecutor.init(cwd)
    }
  }

  private registerCommands(internalCommands: InternalCommands) {
    internalCommands.registerExternalCliCommand(
      RegisteredCliCommands.INIT,
      () => this.initializeDvc()
    )

    internalCommands.registerExternalCommand(
      RegisteredCommands.EXTENSION_CHECK_CLI_COMPATIBLE,
      () => run(this)
    )

    this.dispose.track(
      commands.registerCommand(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
        () => this.setupWorkspace()
      )
    )

    internalCommands.registerExternalCommand(
      RegisteredCommands.SETUP_SHOW,
      async () => {
        await this.showSetup()
      }
    )

    internalCommands.registerExternalCommand(
      RegisteredCommands.SELECT_FOCUSED_PROJECTS,
      async () => {
        const dvcRoots = await this.findWorkspaceDvcRoots()
        const focusedProjects = await pickFocusedProjects(
          dvcRoots,
          this.dvcRoots
        )
        if (focusedProjects) {
          setConfigValue(ConfigKey.FOCUSED_PROJECTS, focusedProjects)
        }
      }
    )
  }

  private async setupWorkspace() {
    const stopWatch = new StopWatch()
    try {
      const previousCliPath = this.config.getCliPath()
      const previousPythonPath = this.config.getPythonBinPath()

      const completed = await runWorkspace(() =>
        this.config.setPythonAndNotifyIfChanged()
      )
      sendTelemetryEvent(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
        { completed },
        {
          duration: stopWatch.getElapsedTime()
        }
      )

      const executionDetailsUnchanged =
        this.config.getCliPath() === previousPythonPath &&
        this.config.getPythonBinPath() === previousCliPath

      if (completed && !this.cliAccessible && executionDetailsUnchanged) {
        this.workspaceChanged.fire()
      }

      return completed
    } catch (error: unknown) {
      return sendTelemetryEventAndThrow(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
        error as Error,
        stopWatch.getElapsedTime()
      )
    }
  }

  private watchConfigurationDetailsForChanges() {
    this.dispose.track(
      this.config.onDidChangeConfigurationDetails(async () => {
        const stopWatch = new StopWatch()
        try {
          this.sendDataToWebview()
          await run(this)

          return sendTelemetryEvent(
            EventName.EXTENSION_EXECUTION_DETAILS_CHANGED,
            await this.getEventProperties(),
            { duration: stopWatch.getElapsedTime() }
          )
        } catch (error: unknown) {
          return sendTelemetryEventAndThrow(
            EventName.EXTENSION_EXECUTION_DETAILS_CHANGED,
            error as Error,
            stopWatch.getElapsedTime(),
            await this.getEventProperties()
          )
        }
      })
    )
  }

  private watchPathForChanges(stopWatch: StopWatch) {
    runWithGlobalRecheck(this)
      .then(async () => {
        sendTelemetryEvent(
          EventName.EXTENSION_LOAD,
          await this.getEventProperties(),
          { duration: stopWatch.getElapsedTime() }
        )
      })
      .catch(async error =>
        sendTelemetryEventAndThrow(
          EventName.EXTENSION_LOAD,
          error,
          stopWatch.getElapsedTime(),
          await this.getEventProperties()
        )
      )
  }

  private watchForVenvChanges() {
    return createFileSystemWatcher(
      disposable => this.dispose.track(disposable),
      '**/dvc{,.exe}',
      async path => {
        if (!path) {
          return
        }

        const previousPythonBinPath = this.config.getPythonBinPath()
        await this.config.setPythonBinPath()

        const trySetupWithVenv =
          previousPythonBinPath !== this.config.getPythonBinPath()

        if (!this.cliAccessible || !this.cliCompatible || trySetupWithVenv) {
          this.workspaceChanged.fire()
        }
      }
    )
  }

  private watchDotFolderForChanges() {
    const cwd = getFirstWorkspaceFolder()

    if (!cwd) {
      return
    }

    const disposer = Disposable.fn()
    this.dotFolderWatcher = disposer
    this.dispose.track(this.dotFolderWatcher)

    return createFileSystemWatcher(
      disposable => disposer.track(disposable),
      getRelativePattern(cwd, '**'),
      path => this.dotFolderListener(disposer, path)
    )
  }

  private dotFolderListener(disposer: Disposer, path: string) {
    if (
      !(path && (path.endsWith(gitPath.DOT_GIT) || path.includes(DOT_DVC))) ||
      disposer.disposed
    ) {
      return
    }

    if (path.includes(DOT_DVC)) {
      this.dispose.untrack(disposer)
      disposer.dispose()
    }

    return this.workspaceChanged.fire()
  }

  private async getEventProperties() {
    return {
      ...(this.cliAccessible ? await this.collectWorkspaceScale() : {}),
      cliAccessible: this.cliAccessible,
      dvcPathUsed: !!this.config.getCliPath(),
      dvcRootCount: this.getRoots().length,
      msPythonInstalled: isPythonExtensionInstalled(),
      msPythonUsed: await this.isPythonExtensionUsed(),
      pythonPathUsed: !!this.config.getPythonBinPath(),
      workspaceFolderCount: getWorkspaceFolderCount()
    }
  }
}
