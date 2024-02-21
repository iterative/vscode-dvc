import { Event, EventEmitter, Disposable as VSCodeDisposable } from 'vscode'
import fetch from 'node-fetch'
import { DEFAULT_STUDIO_URL } from './webview/contract'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'
import { Args, ConfigKey, Flag } from '../cli/dvc/constants'
import { ContextKey, setContextValue } from '../vscode/context'
import { Disposable } from '../class/dispose'
import { getCallBackUrl, openUrl, waitForUriResponse } from '../vscode/external'
import { Modal } from '../vscode/modal'
import { Toast } from '../vscode/toast'

export const isStudioAccessToken = (text?: string): boolean => {
  if (!text) {
    return false
  }
  return (
    (text.startsWith('isat_') || text.startsWith('dsat_')) && text.length >= 53
  )
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
  private accessTokenUriHandler: VSCodeDisposable | undefined = undefined
  private accessTokenUriHandlerTimeout: NodeJS.Timeout | undefined = undefined
  private studioUrl: string = DEFAULT_STUDIO_URL

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

  public getShareLiveToStudio() {
    return this.shareLiveToStudio
  }

  public getStudioUrl() {
    return this.studioUrl
  }

  public getSelfHostedStudioUrl() {
    const url = this.getStudioUrl()
    return url === DEFAULT_STUDIO_URL ? null : url
  }

  public removeStudioAccessToken(dvcRoots: string[]) {
    return this.removeKeyFromConfig(dvcRoots, ConfigKey.STUDIO_TOKEN)
  }

  public saveStudioAccessTokenInConfig(cwd: string, token: string) {
    return this.accessConfig(cwd, Flag.GLOBAL, ConfigKey.STUDIO_TOKEN, token)
  }

  public removeStudioUrl(dvcRoots: string[]) {
    return this.removeKeyFromConfig(dvcRoots, ConfigKey.STUDIO_URL)
  }

  public saveStudioUrlInConfig(cwd: string, url: string) {
    return this.accessConfig(cwd, Flag.GLOBAL, ConfigKey.STUDIO_URL, url)
  }

  public async updateIsStudioConnected() {
    await this.setStudioValues()
    const storedToken = this.getStudioAccessToken()
    const isConnected = isStudioAccessToken(storedToken)
    const isSelfHosted = this.getStudioUrl() !== DEFAULT_STUDIO_URL
    this.studioIsConnected = isConnected
    await setContextValue(ContextKey.STUDIO_CONNECTED, isConnected)
    await setContextValue(ContextKey.STUDIO_SELFHOSTED, isSelfHosted)
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

  public async requestStudioTokenAuthentication() {
    this.resetAccessTokenUriHandler()

    const response = await this.fetchFromStudio(
      `${this.getStudioUrl()}/api/device-login`,
      {
        client_name: 'VS Code'
      }
    )

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
    const verificationUrlWithParams = new URL(verificationUri)

    verificationUrlWithParams.searchParams.append('redirect_uri', callbackUrl)
    verificationUrlWithParams.searchParams.append('code', userCode)

    await openUrl(verificationUrlWithParams.toString())
    this.accessTokenUriHandler = waitForUriResponse(
      '/studio-complete-auth',
      () => {
        void this.requestStudioToken(deviceCode, tokenUri)
      }
    )
    this.cancelUriHandlerAfterTimeout()
  }

  private resetAccessTokenUriHandler() {
    if (this.accessTokenUriHandlerTimeout) {
      clearTimeout(this.accessTokenUriHandlerTimeout)
    }
    this.accessTokenUriHandlerTimeout = undefined

    this.accessTokenUriHandler?.dispose()
    this.accessTokenUriHandler = undefined
  }

  private cancelUriHandlerAfterTimeout() {
    const waitTime = 5 * 60000
    this.accessTokenUriHandlerTimeout = setTimeout(
      () => this.resetAccessTokenUriHandler(),
      waitTime
    )
  }

  private fetchFromStudio(reqUri: string, body: Record<string, unknown>) {
    return fetch(reqUri, {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
  }

  private async fetchStudioToken(deviceCode: string, tokenUri: string) {
    const response = await this.fetchFromStudio(tokenUri, {
      code: deviceCode
    })

    if (response.status !== 200) {
      const { detail } = (await response.json()) as {
        detail: string
      }
      return Modal.errorWithOptions(
        `Unable to get token. Failed with "${detail}"`
      )
    }

    const { access_token: accessToken } = (await response.json()) as {
      access_token: string
    }

    return accessToken
  }

  private requestStudioToken(deviceCode: string, tokenUri: string) {
    this.resetAccessTokenUriHandler()
    return Toast.showProgress('Connecting to Studio', async progress => {
      progress.report({ increment: 0 })
      progress.report({ increment: 25, message: 'Fetching token...' })
      const token = await this.fetchStudioToken(deviceCode, tokenUri)
      const cwd = this.getCwd()

      if (!token || !cwd) {
        const error = new Error('Connection failed')
        return Toast.reportProgressError(error, progress)
      }

      await this.saveStudioAccessTokenInConfig(cwd, token)

      progress.report({
        increment: 75,
        message: 'Token saved'
      })

      return Toast.delayProgressClosing(15000)
    })
  }

  private resetStudioValues(
    previousStudioUrl: string,
    previousStudioAccessToken: string | undefined,
    previousShareLiveToStudio: boolean | undefined
  ) {
    this.studioAccessToken = undefined
    this.shareLiveToStudio = undefined
    this.studioUrl = DEFAULT_STUDIO_URL

    if (
      previousStudioAccessToken ||
      previousStudioUrl !== DEFAULT_STUDIO_URL ||
      previousShareLiveToStudio
    ) {
      this.studioConnectionChanged.fire()
    }
  }

  private async setStudioValues() {
    const cwd = this.getCwd()

    const previousStudioAccessToken = this.studioAccessToken
    const previousStudioUrl = this.studioUrl
    const previousShareLiveToStudio = this.shareLiveToStudio

    if (!cwd) {
      this.resetStudioValues(
        previousStudioUrl,
        previousStudioAccessToken,
        previousShareLiveToStudio
      )
      return
    }

    const [studioAccessToken, shareLiveToStudio, studioUrl] = await Promise.all(
      [
        this.accessConfig(cwd, ConfigKey.STUDIO_TOKEN),
        (await this.accessConfig(cwd, ConfigKey.STUDIO_OFFLINE)) !== 'true',
        (await this.accessConfig(cwd, ConfigKey.STUDIO_URL)) ||
          DEFAULT_STUDIO_URL
      ]
    )

    this.studioAccessToken = studioAccessToken
    this.shareLiveToStudio = shareLiveToStudio
    this.studioUrl = studioUrl

    if (
      previousStudioAccessToken !== this.studioAccessToken ||
      previousStudioUrl !== this.studioUrl
    ) {
      this.studioConnectionChanged.fire()
    }
  }

  private async removeKeyFromConfig(dvcRoots: string[], key: ConfigKey) {
    if (dvcRoots.length !== 1) {
      const cwd = getFirstWorkspaceFolder()
      if (!cwd) {
        return
      }

      return await this.accessConfig(cwd, Flag.GLOBAL, Flag.UNSET, key)
    }

    const cwd = dvcRoots[0]

    await this.accessConfig(cwd, Flag.LOCAL, Flag.UNSET, key)

    return this.accessConfig(cwd, Flag.GLOBAL, Flag.UNSET, key)
  }

  private accessConfig(cwd: string, ...args: Args) {
    return this.internalCommands.executeCommand(
      AvailableCommands.CONFIG,
      cwd,
      ...args
    )
  }
}
