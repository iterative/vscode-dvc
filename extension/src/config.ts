import { EventEmitter, Event, workspace } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import isEqual from 'lodash.isequal'
import {
  getOnDidChangePythonEnvironmentVariables,
  getOnDidChangePythonExecutionDetails,
  getPythonBinPath,
  getPYTHONPATH,
  isPythonExtensionInstalled
} from './extensions/python'
import { ConfigKey, getConfigValue, setConfigValue } from './vscode/config'
import { DeferredDisposable } from './class/deferred'
import { getOnDidChangeExtensions } from './vscode/extensions'
import { standardizePath } from './fileSystem/path'
import { getWorkspaceFolders } from './vscode/workspaceFolders'
import { isSameOrChild } from './fileSystem'

export class Config extends DeferredDisposable {
  public readonly onDidChangeConfigurationDetails: Event<void>

  private pythonBinPath: string | undefined

  private dvcPath = this.getCliPath()

  private PYTHONPATH: string | undefined

  private focusedProjects: string[] | undefined

  private readonly configurationDetailsChanged: EventEmitter<void>

  private pythonExecutionDetailsListener?: Disposable
  private readonly onDidChangeExtensionsEvent: Event<void>

  constructor(onDidChangeExtensionsEvent = getOnDidChangeExtensions()) {
    super()

    this.configurationDetailsChanged = this.dispose.track(new EventEmitter())
    this.onDidChangeConfigurationDetails =
      this.configurationDetailsChanged.event
    this.onDidChangeExtensionsEvent = onDidChangeExtensionsEvent

    void this.setPythonBinPath()
    this.setFocusedProjects()

    void this.onDidChangePythonExecutionDetails()
    this.onDidChangeExtensions()

    void this.watchPYTHONPATH()

    this.onDidConfigurationChange()
  }

  public getCliPath(): string {
    return getConfigValue(ConfigKey.DVC_PATH)
  }

  public getPythonBinPath() {
    return this.pythonBinPath
  }

  public getFocusedProjects() {
    return this.focusedProjects
  }

  public async setPythonBinPath() {
    const pythonBinPath = await this.getConfigOrExtensionPythonBinPath()
    this.pythonBinPath = pythonBinPath
    this.deferred.resolve()
  }

  public async setPythonAndNotifyIfChanged() {
    const oldPath = this.pythonBinPath
    await this.setPythonBinPath()
    this.notifyIfChanged(oldPath, this.pythonBinPath)
  }

  public unsetPythonBinPath() {
    this.pythonBinPath = undefined
  }

  public setFocusedProjectsOption(focusedProjects: string[]) {
    void setConfigValue(ConfigKey.FOCUSED_PROJECTS, focusedProjects)
  }

  public getPYTHONPATH() {
    return this.PYTHONPATH
  }

  public isPythonExtensionUsed() {
    return !getConfigValue(ConfigKey.PYTHON_PATH) && !!this.pythonBinPath
  }

  public isPythonExtensionInstalled() {
    return isPythonExtensionInstalled()
  }

  private async getConfigOrExtensionPythonBinPath() {
    return getConfigValue(ConfigKey.PYTHON_PATH) || (await getPythonBinPath())
  }

  private async onDidChangePythonExecutionDetails() {
    this.pythonExecutionDetailsListener?.dispose()
    const onDidChangePythonExecutionDetails =
      await getOnDidChangePythonExecutionDetails()
    this.pythonExecutionDetailsListener = this.dispose.track(
      onDidChangePythonExecutionDetails?.(() => {
        void this.setPythonAndNotifyIfChanged()
      })
    )
  }

  private async watchPYTHONPATH() {
    this.PYTHONPATH = await getPYTHONPATH()
    const onDidChangePythonEnvironmentVariables =
      await getOnDidChangePythonEnvironmentVariables()
    this.pythonExecutionDetailsListener = this.dispose.track(
      onDidChangePythonEnvironmentVariables?.(({ env }) => {
        this.PYTHONPATH = env.PYTHONPATH
      })
    )
  }

  private onDidChangeExtensions() {
    this.dispose.track(
      this.onDidChangeExtensionsEvent(() => {
        void this.onDidChangePythonExecutionDetails()
        void this.setPythonAndNotifyIfChanged()
      })
    )
  }

  private onDidConfigurationChange() {
    this.dispose.track(
      workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(ConfigKey.DVC_PATH)) {
          const oldPath = this.dvcPath
          this.dvcPath = this.getCliPath()
          this.notifyIfChanged(oldPath, this.dvcPath)
        }
        if (e.affectsConfiguration(ConfigKey.PYTHON_PATH)) {
          void this.setPythonAndNotifyIfChanged()
        }
        if (e.affectsConfiguration(ConfigKey.FOCUSED_PROJECTS)) {
          this.setFocusedProjectsAndNotifyIfChanged()
        }
      })
    )
  }

  private setFocusedProjectsAndNotifyIfChanged() {
    const oldFocusedProjects = this.focusedProjects
    this.setFocusedProjects()
    if (!isEqual(oldFocusedProjects, this.focusedProjects)) {
      this.configurationDetailsChanged.fire()
    }
  }

  private setFocusedProjects() {
    this.focusedProjects = this.validateFocusedProjects()
  }

  private validateFocusedProjects() {
    const focusedProjects = getConfigValue<string | string[] | undefined>(
      ConfigKey.FOCUSED_PROJECTS
    )

    if (!focusedProjects) {
      return undefined
    }
    const workspaceFolders = getWorkspaceFolders()

    const validatedFocusedProjects = new Set<string>()

    const paths = Array.isArray(focusedProjects)
      ? focusedProjects
      : [focusedProjects].filter(Boolean)
    for (const path of paths) {
      this.collectValidFocusedProject(
        validatedFocusedProjects,
        path,
        workspaceFolders
      )
    }
    return validatedFocusedProjects.size > 0
      ? [...validatedFocusedProjects].sort()
      : undefined
  }

  private collectValidFocusedProject(
    validatedFocusedProjects: Set<string>,
    path: string,
    workspaceFolders: string[]
  ) {
    const standardizedPath = standardizePath(path)
    for (const workspaceFolder of workspaceFolders) {
      if (isSameOrChild(workspaceFolder, standardizedPath)) {
        validatedFocusedProjects.add(standardizedPath)
      }
    }
  }

  private notifyIfChanged(
    oldPath: string | undefined,
    newPath: string | undefined
  ) {
    if (oldPath !== newPath) {
      this.configurationDetailsChanged.fire()
    }
  }
}
