import { StudioLinkType } from './webview/contract'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { DeferredDisposable } from '../class/deferred'

export class Studio extends DeferredDisposable {
  private readonly dvcRoot: string
  private readonly internalCommands: InternalCommands

  private baseUrl: string | null = null
  private studioAccessToken: string | undefined
  private gitRemoteUrl?: string

  constructor(dvcRoot: string, internalCommands: InternalCommands) {
    super()
    this.dvcRoot = dvcRoot
    this.internalCommands = internalCommands

    void this.internalCommands
      .executeCommand(AvailableCommands.GIT_GET_REMOTE_URL, this.dvcRoot)
      .then(gitRemoteUrl => {
        this.gitRemoteUrl = gitRemoteUrl
        this.deferred.resolve()
      })
  }

  public getGitRemoteUrl() {
    return this.gitRemoteUrl
  }

  public setAccessToken(studioAccessToken: string | undefined) {
    this.studioAccessToken = studioAccessToken
  }

  public getAccessToken() {
    return this.studioAccessToken
  }

  public setBaseUrl(baseUrl?: string | null) {
    if (baseUrl === undefined) {
      return
    }
    this.baseUrl = baseUrl
  }

  public getLink(
    studioLinkType: StudioLinkType,
    sha: string,
    name: string,
    baselineSha: string
  ) {
    if (!this.baseUrl) {
      return ''
    }
    return (
      `${this.baseUrl}?showOnlySelected=1&` +
      (studioLinkType === StudioLinkType.PUSHED
        ? `experimentReferences=${sha}`
        : `liveExperiments=${baselineSha}%3A${name}`)
    )
  }
}
