import { EventEmitter } from 'vscode'
import { isStudioAccessToken } from './token'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'
import { Args, ConfigKey, Flag } from '../cli/dvc/constants'
import { ContextKey, setContextValue } from '../vscode/context'

export class Studio {
  protected studioConnectionChanged: EventEmitter<void>
  private studioAccessToken: string | undefined = undefined
  private studioIsConnected = false
  private shareLiveToStudio: boolean | undefined = undefined
  private readonly getCwd: () => string | undefined
  private readonly internalCommands: InternalCommands

  constructor(
    internalCommands: InternalCommands,
    studioConnectionChanged: EventEmitter<void>,
    getCwd: () => string | undefined
  ) {
    this.internalCommands = internalCommands
    this.studioConnectionChanged = studioConnectionChanged
    this.getCwd = getCwd
  }

  public getStudioAccessToken() {
    return this.studioAccessToken
  }

  public getStudioIsConnected() {
    return this.studioIsConnected
  }

  public getShareLiveToStudio() {
    return this.shareLiveToStudio
  }

  public async removeStudioAccessToken(dvcRoots: string[]) {
    if (dvcRoots.length !== 1) {
      const cwd = getFirstWorkspaceFolder()
      if (!cwd) {
        return
      }

      return await this.accessConfig(
        cwd,
        Flag.GLOBAL,
        Flag.UNSET,
        ConfigKey.STUDIO_TOKEN
      )
    }

    const cwd = dvcRoots[0]

    await this.accessConfig(cwd, Flag.LOCAL, Flag.UNSET, ConfigKey.STUDIO_TOKEN)

    return await this.accessConfig(
      cwd,
      Flag.GLOBAL,
      Flag.UNSET,
      ConfigKey.STUDIO_TOKEN
    )
  }

  public saveStudioAccessTokenInConfig(cwd: string, token: string) {
    return this.accessConfig(cwd, Flag.GLOBAL, ConfigKey.STUDIO_TOKEN, token)
  }

  public async updateIsStudioConnected() {
    await this.setStudioValues()
    const storedToken = this.getStudioAccessToken()
    const isConnected = isStudioAccessToken(storedToken)
    this.studioIsConnected = isConnected
    return setContextValue(ContextKey.STUDIO_CONNECTED, isConnected)
  }

  public async updateStudioOffline(shareLive: boolean) {
    const offline = !shareLive

    const cwd = this.getCwd()

    if (!cwd) {
      return
    }

    await this.accessConfig(
      cwd,
      Flag.GLOBAL,
      ConfigKey.STUDIO_OFFLINE,
      String(offline)
    )
  }

  private async setStudioValues() {
    const cwd = this.getCwd()

    const previousStudioAccessToken = this.studioAccessToken

    if (!cwd) {
      this.studioAccessToken = undefined
      this.shareLiveToStudio = undefined

      if (previousStudioAccessToken) {
        this.studioConnectionChanged.fire()
      }
      return
    }

    const [studioAccessToken, shareLiveToStudio] = await Promise.all([
      this.accessConfig(cwd, ConfigKey.STUDIO_TOKEN),
      (await this.accessConfig(cwd, ConfigKey.STUDIO_OFFLINE)) !== 'true'
    ])

    this.studioAccessToken = studioAccessToken
    this.shareLiveToStudio = shareLiveToStudio

    if (previousStudioAccessToken !== this.studioAccessToken) {
      this.studioConnectionChanged.fire()
    }
  }

  private accessConfig(cwd: string, ...args: Args) {
    return this.internalCommands.executeCommand(
      AvailableCommands.CONFIG,
      cwd,
      ...args
    )
  }
}
