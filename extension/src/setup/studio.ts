import { Event, EventEmitter } from 'vscode'
import { STUDIO_URL } from './webview/contract'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'
import { Args, ConfigKey, Flag } from '../cli/dvc/constants'
import { ContextKey, setContextValue } from '../vscode/context'
import { Disposable } from '../class/dispose'
import { getCallBackUrl, openUrl, waitForUriResponse } from '../vscode/external'

export const isStudioAccessToken = (text?: string): boolean => {
  if (!text) {
    return false
  }
  return text.startsWith('isat_') && text.length >= 53
}

export class Studio extends Disposable {
  public readonly onDidChangeStudioConnection: Event<void>
  private readonly studioConnectionChanged: EventEmitter<void> =
    this.dispose.track(new EventEmitter())

  private readonly getCwd: () => string | undefined
  private readonly internalCommands: InternalCommands
  private studioAccessToken: string | undefined = undefined
  private studioIsConnected = false
  private shareLiveToStudio: boolean | undefined = undefined
  private studioVerifyUserUrl: string | undefined = undefined
  private studioVerifyUserCode: string | null = null

  constructor(
    internalCommands: InternalCommands,
    getCwd: () => string | undefined
  ) {
    super()

    this.internalCommands = internalCommands
    this.getCwd = getCwd
    this.onDidChangeStudioConnection = this.studioConnectionChanged.event
  }

  public getStudioAccessToken() {
    return this.studioAccessToken
  }

  public getStudioIsConnected() {
    return this.studioIsConnected
  }

  public getStudioVerifyUserUrl() {
    return this.studioVerifyUserUrl
  }

  public getStudioVerifyUserCode() {
    return this.studioVerifyUserCode
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

  public openStudioVerifyUserUrl() {
    const url = this.getStudioVerifyUserUrl()
    if (!url) {
      return
    }
    void openUrl(url)
  }

  public async requestStudioAuthentication() {
    const response = await fetch(`${STUDIO_URL}/api/device-login`, {
      body: JSON.stringify({
        client_name: 'VS Code'
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })

    const {
      token_uri: tokenUri,
      verification_uri: verificationUri,
      user_code: userCode,
      device_code: deviceCode
    } = (await response.json()) as {
      token_uri: string
      verification_uri: string
      user_code: string
      device_code: string
    }

    const callbackUrl = await getCallBackUrl('/studio-complete-auth')
    const verificationUrlWithCallback = new URL(verificationUri)

    verificationUrlWithCallback.searchParams.append('redirect_uri', callbackUrl)
    verificationUrlWithCallback.searchParams.append('code', userCode)
    this.updateStudioUserVerifyDetails(
      userCode,
      verificationUrlWithCallback.toString()
    )
    void waitForUriResponse('/studio-complete-auth', () =>
      this.requestStudioToken(deviceCode, tokenUri)
    )
  }

  private updateStudioUserVerifyDetails(
    userCode: string | null,
    verifyUrl: string | undefined
  ) {
    this.studioVerifyUserCode = userCode
    this.studioVerifyUserUrl = verifyUrl
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

  private async requestStudioToken(deviceCode: string, tokenUri: string) {
    const response = await fetch(tokenUri, {
      body: JSON.stringify({
        code: deviceCode
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })

    if (response.status !== 200) {
      return
    }

    const { access_token: accessToken } = (await response.json()) as {
      access_token: string
    }

    this.updateStudioUserVerifyDetails(null, undefined)

    const cwd = this.getCwd()

    if (!cwd) {
      return
    }

    return this.saveStudioAccessTokenInConfig(cwd, accessToken)
  }

  private accessConfig(cwd: string, ...args: Args) {
    return this.internalCommands.executeCommand(
      AvailableCommands.CONFIG,
      cwd,
      ...args
    )
  }
}
