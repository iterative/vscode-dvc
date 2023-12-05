import { StudioLinkType } from './webview/contract'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { DeferredDisposable } from '../class/deferred'
import { DEFAULT_STUDIO_URL } from '../setup/webview/contract'

export class Studio extends DeferredDisposable {
  private readonly dvcRoot: string
  private readonly internalCommands: InternalCommands

  private instanceUrl: string = DEFAULT_STUDIO_URL
  private viewUrl: string | undefined = undefined
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

  public getInstanceUrl() {
    return this.instanceUrl
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
    return !!this.viewUrl
  }

  public getAccessToken() {
    return this.studioAccessToken
  }

  public setViewUrl(viewUrl: string | undefined) {
    this.viewUrl = viewUrl
  }

  public setInstanceUrl(instanceUrl: string) {
    this.instanceUrl = instanceUrl
  }

  public getLink(
    studioLinkType: StudioLinkType,
    sha: string,
    name: string,
    baselineSha: string
  ) {
    if (!this.viewUrl) {
      return ''
    }
    return (
      `${this.viewUrl}?showOnlySelected=1&` +
      (studioLinkType === StudioLinkType.PUSHED
        ? `experimentReferences=${sha}`
        : `liveExperiments=${baselineSha}%3A${name}`)
    )
  }
}
