import { join } from 'path'
import { Event, EventEmitter } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import isEmpty from 'lodash.isempty'
import {
  DvcCliDetails,
  SetupSection,
  SetupData as TSetupData
} from './webview/contract'
import {
  collectRemoteList,
  collectSectionCollapsed,
  collectSubProjects
} from './collect'
import { WebviewMessages } from './webview/messages'
import { validateTokenInput } from './inputBox'
import { findPythonBinForInstall } from './autoInstall'
import { run, runWithRecheck, runWorkspace } from './runner'
import { Studio } from './studio'
import {
  PYTHON_EXTENSION_ACTION,
  pickFocusedProjects,
  pickPythonExtensionAction
} from './quickPick'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Resource } from '../resourceLocator'
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
import { ContextKey, setContextValue } from '../vscode/context'
import { RegisteredCommands } from '../commands/external'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { Status } from '../status'
import { WorkspaceExperiments } from '../experiments/workspace'
import { sendTelemetryEvent, sendTelemetryEventAndThrow } from '../telemetry'
import { StopWatch } from '../util/time'
import { getRelativePattern } from '../fileSystem/relativePattern'
import { createFileSystemWatcher } from '../fileSystem/watcher'
import { EventName } from '../telemetry/constants'
import { WorkspaceScale } from '../telemetry/collect'
import { gitPath } from '../cli/git/constants'
import { DOT_DVC, Args, SubCommand } from '../cli/dvc/constants'
import { GLOBAL_WEBVIEW_DVCROOT } from '../webview/factory'
import { getValidInput } from '../vscode/inputBox'
import { Title } from '../vscode/title'
import { getDVCAppDir } from '../util/appdirs'
import { getOptions } from '../cli/dvc/options'
import { isAboveLatestTestedVersion } from '../cli/dvc/version'
import {
  createPythonEnv,
  isActivePythonEnvGlobal,
  selectPythonInterpreter
} from '../extensions/python'

export class Setup
  extends BaseRepository<TSetupData>
  implements IExtensionSetup
{
  public readonly viewKey = ViewKey.SETUP

  public readonly initialize: () => Promise<void[]>
  public readonly resetMembers: () => void

  public readonly onDidChangeStudioConnection: Event<void>

  private dvcRoots: string[] = []
  private subProjects: { [dvcRoot: string]: string[] } = {}

  private readonly config: Config
  private readonly status: Status
  private readonly internalCommands: InternalCommands
  private readonly studio: Studio

  private readonly webviewMessages: WebviewMessages
  private readonly getHasData: () => boolean | undefined
  private readonly getExpShowError: () => string | undefined
  private readonly collectWorkspaceScale: () => Promise<WorkspaceScale>

  private readonly setupRun: EventEmitter<void> = this.dispose.track(
    new EventEmitter<void>()
  )

  private readonly onDidRunSetup: Event<void> = this.setupRun.event

  private readonly workspaceChanged: EventEmitter<void> = this.dispose.track(
    new EventEmitter()
  )

  private readonly onDidChangeWorkspace: Event<void> =
    this.workspaceChanged.event

  private cliAccessible = false
  private cliCompatible: boolean | undefined
  private cliVersion: string | undefined

  private gitAccessible: boolean | undefined

  private dotFolderWatcher?: Disposer

  private focusedSection: SetupSection | undefined = undefined

  constructor(
    config: Config,
    internalCommands: InternalCommands,
    experiments: WorkspaceExperiments,
    status: Status,
    webviewIcon: Resource,
    stopWatch: StopWatch,
    initialize: () => Promise<void[]>,
    resetMembers: () => void,
    collectWorkspaceScale: () => Promise<WorkspaceScale>
  ) {
    super(GLOBAL_WEBVIEW_DVCROOT, webviewIcon)

    this.config = config

    this.internalCommands = internalCommands

    this.status = status

    this.initialize = async () => {
      const result = initialize()
      await experiments.isReady()
      this.setupRun.fire()
      return result
    }
    this.resetMembers = () => {
      const result = resetMembers()
      this.setupRun.fire()
      return result
    }

    this.collectWorkspaceScale = collectWorkspaceScale

    this.setCommandsAvailability(false)
    this.setProjectAvailability()

    this.studio = new Studio(internalCommands, () => this.getCwd())
    this.onDidChangeStudioConnection = this.studio.onDidChangeStudioConnection

    this.webviewMessages = this.createWebviewMessageHandler()

    void this.sendDataToWebview()

    this.getHasData = () => experiments.getHasData()
    this.getExpShowError = () => experiments.getCliError()
    const onDidChangeHasData = experiments.columnsChanged.event
    this.dispose.track(onDidChangeHasData(() => this.updateProjectHasData()))

    this.watchSetupRun()
    this.dispose.track(this.onDidChangeWorkspace(() => run(this)))
    this.watchForVenvChanges()
    this.watchConfigurationDetailsForChanges()
    this.watchDotFolderForChanges()
    this.watchPathForChanges(stopWatch)
    this.watchDvcConfigs()
  }

  public getRoots() {
    return this.dvcRoots
  }

  public getSubProjects() {
    return this.subProjects
  }

  public async getCliVersion(cwd: string, tryGlobalCli?: true) {
    await this.config.isReady()
    try {
      if (tryGlobalCli) {
        return await this.internalCommands.executeCommand(
          AvailableCommands.GLOBAL_VERSION,
          cwd
        )
      }
      return await this.internalCommands.executeCommand(
        AvailableCommands.VERSION,
        cwd
      )
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

  public async showSetup(focusSection?: SetupSection) {
    this.focusedSection = focusSection
    void this.sendDataToWebview()

    return await this.showWebview()
  }

  public shouldWarnUserIfCLIUnavailable() {
    return this.hasRoots() && !this.isFocused()
  }

  public async setRoots() {
    const nestedRoots = await this.findWorkspaceDvcRoots()
    this.dvcRoots = this.config.getFocusedProjects() || nestedRoots.flat()
    this.dvcRoots.sort()
    this.subProjects = collectSubProjects(this.dvcRoots)

    void this.sendDataToWebview()
    return this.setProjectAvailability()
  }

  public setAvailable(available: boolean) {
    void this.status.setAvailability(available)
    this.setCommandsAvailability(available)
    this.cliAccessible = available
    void this.sendDataToWebview()
    return available
  }

  public setCliCompatibleAndVersion(
    compatible: boolean | undefined,
    version: string | undefined
  ) {
    this.cliCompatible = compatible
    this.cliVersion = version
    void this.updateStudioAndSend()
    const incompatible = compatible === undefined ? undefined : !compatible
    void setContextValue(ContextKey.CLI_INCOMPATIBLE, incompatible)
  }

  public getAvailable() {
    return this.cliAccessible
  }

  public isFocused() {
    return !!this.getWebview()?.isActive
  }

  public shouldBeShown(): { dvc: boolean; experiments: boolean } {
    return {
      dvc: !!this.getCliCompatible() && this.hasRoots(),
      experiments: !!(this.getExpShowError() || this.getHasData())
    }
  }

  public async selectFocusedProjects() {
    const dvcRoots = await this.findWorkspaceDvcRoots()
    const focusedProjects = await pickFocusedProjects(dvcRoots, this.getRoots())
    if (focusedProjects) {
      this.config.setFocusedProjectsOption(focusedProjects)
    }
  }

  public async setupWorkspace() {
    const stopWatch = new StopWatch()
    try {
      const previousCliPath = this.config.getCliPath()
      const previousPythonPath = this.config.getPythonBinPath()

      const completed = await this.runWorkspace()
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

  public removeStudioAccessToken() {
    if (!this.getCliCompatible()) {
      return
    }

    return this.studio.removeStudioAccessToken(this.dvcRoots)
  }

  public async saveStudioAccessToken() {
    const cwd = this.dvcRoots[0] || getFirstWorkspaceFolder()

    if (!cwd) {
      return
    }

    const token = await getValidInput(
      Title.ENTER_STUDIO_TOKEN,
      validateTokenInput,
      { password: true }
    )
    if (!token) {
      return
    }

    await this.studio.saveStudioAccessTokenInConfig(cwd, token)
    return this.updateStudioAndSend()
  }

  public getStudioAccessToken() {
    return this.studio.getStudioAccessToken()
  }

  public sendInitialWebviewData() {
    return this.sendDataToWebview()
  }

  private async getDvcCliDetails(): Promise<DvcCliDetails> {
    await this.config.isReady()
    const dvcPath = this.config.getCliPath()
    const pythonBinPath = this.config.getPythonBinPath()
    const cwd = getFirstWorkspaceFolder()

    const { args, executable } = getOptions({
      PYTHONPATH: this.config.getPYTHONPATH(),
      cliPath: dvcPath,
      cwd: cwd || '',
      pythonBinPath
    })
    const commandArgs = args.length === 0 ? '' : ` ${args.join(' ')}`
    const command = executable + commandArgs

    return {
      command,
      version: this.cliVersion
    }
  }

  private async getRemoteList() {
    await this.config.isReady()

    if (!this.hasRoots()) {
      return undefined
    }

    return collectRemoteList(this.dvcRoots, (cwd: string) =>
      this.accessRemote(cwd, SubCommand.LIST)
    )
  }

  private async sendDataToWebview() {
    if (!this.getWebview()) {
      return
    }

    const projectInitialized = this.hasRoots()
    const hasData = this.getHasData()

    const [isPythonExtensionUsed, dvcCliDetails, remoteList] =
      await Promise.all([
        this.isPythonExtensionUsed(),
        this.getDvcCliDetails(),
        this.getRemoteList()
      ])

    const needsGitInitialized =
      !projectInitialized && !!(await this.needsGitInit())

    const canGitInitialize = await this.canGitInitialize(needsGitInitialized)

    const needsGitCommit = await this.needsGitCommit(needsGitInitialized)

    const pythonBinPath = await findPythonBinForInstall()

    const isPythonEnvironmentGlobal =
      isPythonExtensionUsed && (await isActivePythonEnvGlobal())

    this.webviewMessages.sendWebviewMessage({
      canGitInitialize,
      cliCompatible: this.getCliCompatible(),
      dvcCliDetails,
      hasData,
      isAboveLatestTestedVersion: isAboveLatestTestedVersion(this.cliVersion),
      isPythonEnvironmentGlobal,
      isPythonExtensionInstalled: this.config.isPythonExtensionInstalled(),
      isPythonExtensionUsed,
      isStudioConnected: this.studio.getStudioIsConnected(),
      needsGitCommit,
      needsGitInitialized,
      projectInitialized,
      pythonBinPath: getBinDisplayText(pythonBinPath),
      remoteList,
      sectionCollapsed: collectSectionCollapsed(this.focusedSection),
      shareLiveToStudio: !!this.studio.getShareLiveToStudio()
    })
    this.focusedSection = undefined
  }

  private createWebviewMessageHandler() {
    const webviewMessages = new WebviewMessages(
      () => this.getWebview(),
      () => this.initializeGit(),
      (offline: boolean) => this.studio.updateStudioOffline(offline),
      () => this.isPythonExtensionUsed(),
      () => this.updatePythonEnvironment()
    )
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        webviewMessages.handleMessageFromWebview(message)
      )
    )
    return webviewMessages
  }

  private async findWorkspaceDvcRoots() {
    const dvcRoots: Set<string> = await findDvcRootPaths()

    for (const workspaceFolder of getWorkspaceFolders()) {
      if ([...dvcRoots].filter(root => root.includes(workspaceFolder))) {
        continue
      }

      await this.config.isReady()
      const absoluteRoot = await findAbsoluteDvcRootPath(
        workspaceFolder,
        this.internalCommands.executeCommand(
          AvailableCommands.ROOT,
          workspaceFolder
        )
      )
      if (absoluteRoot) {
        dvcRoots.add(absoluteRoot)
      }
    }

    const hasMultipleRoots = dvcRoots.size > 1
    void setContextValue(ContextKey.MULTIPLE_PROJECTS, hasMultipleRoots)

    return [...dvcRoots]
  }

  private setCommandsAvailability(available: boolean) {
    void setContextValue(ContextKey.COMMANDS_AVAILABLE, available)
  }

  private setProjectAvailability() {
    const available = this.hasRoots()
    void setContextValue(ContextKey.PROJECT_AVAILABLE, available)
    if (available && this.dotFolderWatcher && !this.dotFolderWatcher.disposed) {
      this.dispose.untrack(this.dotFolderWatcher)
      this.dotFolderWatcher.dispose()
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

    if (!isEmpty(nestedRoots.flat())) {
      return false
    }

    return this.getIsGitAccessible()
  }

  private async needsGitInit() {
    if (this.hasRoots()) {
      return false
    }

    const cwd = getFirstWorkspaceFolder()
    if (!cwd) {
      return undefined
    }

    return !(await this.internalCommands.executeCommand<string | undefined>(
      AvailableCommands.GIT_GET_REPOSITORY_ROOT,
      cwd
    ))
  }

  private async getIsGitAccessible() {
    if (this.gitAccessible) {
      return true
    }

    this.gitAccessible = !!(await this.internalCommands.executeCommand<boolean>(
      AvailableCommands.GIT_VERSION
    ))
    return this.gitAccessible
  }

  private initializeGit() {
    const cwd = getFirstWorkspaceFolder()
    if (cwd) {
      void this.internalCommands.executeCommand(AvailableCommands.GIT_INIT, cwd)
    }
  }

  private async updatePythonEnvironment() {
    const value = await pickPythonExtensionAction()

    if (!value) {
      return
    }

    return value === PYTHON_EXTENSION_ACTION.CREATE_ENV
      ? createPythonEnv()
      : selectPythonInterpreter()
  }

  private async needsGitCommit(needsGitInit: boolean) {
    if (needsGitInit) {
      return true
    }

    const cwd = getFirstWorkspaceFolder()
    if (!cwd) {
      return true
    }
    return !!(await this.internalCommands.executeCommand<boolean | undefined>(
      AvailableCommands.GIT_HAS_NO_COMMITS,
      cwd
    ))
  }

  private runWorkspace() {
    return runWorkspace(() => this.config.setPythonAndNotifyIfChanged())
  }

  private watchConfigurationDetailsForChanges() {
    this.dispose.track(
      this.config.onDidChangeConfigurationDetails(async () => {
        const stopWatch = new StopWatch()
        try {
          void this.sendDataToWebview()
          await runWithRecheck(this)

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
    runWithRecheck(this)
      .then(async () => {
        sendTelemetryEvent(
          EventName.EXTENSION_LOAD,
          await this.getEventProperties(),
          { duration: stopWatch.getElapsedTime() }
        )
      })
      .catch(async (error: Error) =>
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

        if (
          !this.cliAccessible ||
          !this.getCliCompatible() ||
          trySetupWithVenv
        ) {
          this.workspaceChanged.fire()
        }
      }
    )
  }

  private watchDotFolderForChanges() {
    const disposer = Disposable.fn()
    this.dotFolderWatcher = disposer
    this.dispose.track(this.dotFolderWatcher)

    for (const workspaceFolder of getWorkspaceFolders()) {
      createFileSystemWatcher(
        disposable => disposer.track(disposable),
        getRelativePattern(workspaceFolder, '**'),
        path => this.dotFolderListener(disposer, path)
      )
    }
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

  private getCliCompatible() {
    return this.cliCompatible
  }

  private async getEventProperties() {
    return {
      ...(this.cliAccessible ? await this.collectWorkspaceScale() : {}),
      cliAccessible: this.cliAccessible,
      dvcPathUsed: !!this.config.getCliPath(),
      dvcRootCount: this.getRoots().length,
      msPythonInstalled: this.config.isPythonExtensionInstalled(),
      msPythonUsed: await this.isPythonExtensionUsed(),
      pythonPathUsed: !!this.config.getPythonBinPath(),
      workspaceFolderCount: getWorkspaceFolderCount()
    }
  }

  private async updateStudioAndSend() {
    await this.studio.updateIsStudioConnected()
    return this.sendDataToWebview()
  }

  private watchDvcConfigs() {
    const createWatcher = (watchedPath: string) =>
      createFileSystemWatcher(
        disposable => this.dispose.track(disposable),
        getRelativePattern(watchedPath, '**'),
        path => {
          if (
            path.endsWith(join('dvc', 'config')) ||
            path.endsWith(join('dvc', 'config.local'))
          ) {
            void this.updateStudioAndSend()
          }
        }
      )

    const globalConfigPath = getDVCAppDir()

    createWatcher(globalConfigPath)

    for (const workspaceFolder of getWorkspaceFolders()) {
      createWatcher(workspaceFolder)
    }
  }

  private watchSetupRun() {
    const onDidRunSetup = this.setupRun.event
    this.dispose.track(
      onDidRunSetup(() => {
        this.deferred.resolve()
        return this.updateProjectHasData()
      })
    )
  }

  private updateProjectHasData() {
    return Promise.all([
      this.sendDataToWebview(),
      setContextValue(ContextKey.PROJECT_HAS_DATA, this.getHasData())
    ])
  }

  private getCwd() {
    if (!this.getCliCompatible()) {
      return
    }
    return this.dvcRoots.length === 1
      ? this.dvcRoots[0]
      : getFirstWorkspaceFolder()
  }

  private accessRemote(cwd: string, ...args: Args) {
    return this.internalCommands.executeCommand(
      AvailableCommands.REMOTE,
      cwd,
      ...args
    )
  }
}
