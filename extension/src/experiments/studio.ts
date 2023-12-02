import { StudioLinkType } from './webview/contract'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { DeferredDisposable } from '../class/deferred'
import { DEFAULT_STUDIO_URL } from '../setup/webview/contract'

export class Studio extends DeferredDisposable {
  private readonly dvcRoot: string
  private readonly internalCommands: InternalCommands

  private baseUrl: string = DEFAULT_STUDIO_URL
  private baseViewUrl: string | undefined = undefined
  private studioAccessToken: string | undefined
  private gitRemoteUrl?: string

  private accessTokenSet = false

  constructor(dvcRoot: string, internalCommands: InternalCommands) {
    super()
    this.dvcRoot = dvcRoot
    this.internalCommands = internalCommands

    void this.internalCommands
      .executeCommand(AvailableCommands.GIT_GET_REMOTE_URL, this.dvcRoot)
      .then(gitRemoteUrl => (this.gitRemoteUrl = gitRemoteUrl))
  }

  public getGitRemoteUrl() {
    return this.gitRemoteUrl
  }

  public getUrl() {
    return this.baseUrl
  }

  public setAccessToken(studioAccessToken: string | undefined) {
    this.studioAccessToken = studioAccessToken
    this.accessTokenSet = true
    this.deferred.resolve()
  }

  public isAccessTokenSet() {
    return this.accessTokenSet
  }

  public isConnected() {
    return !!this.baseViewUrl
  }

  public getAccessToken() {
    return this.studioAccessToken
  }

  public setBaseViewUrl(baseUrl: string | undefined) {
    this.baseViewUrl = baseUrl
  }

  public setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  public getLink(
    studioLinkType: StudioLinkType,
    sha: string,
    name: string,
    baselineSha: string
  ) {
    if (!this.baseViewUrl) {
      return ''
    }
    return (
      `${this.baseViewUrl}?showOnlySelected=1&` +
      (studioLinkType === StudioLinkType.PUSHED
        ? `experimentReferences=${sha}`
        : `liveExperiments=${baselineSha}%3A${name}`)
    )
  }
}
