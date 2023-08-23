import fetch from 'node-fetch'
import { STUDIO_URL } from '../setup/webview/contract'
import { Disposable } from '../class/dispose'
import { AvailableCommands, InternalCommands } from '../commands/internal'

export class Studio extends Disposable {
  private readonly dvcRoot: string
  private readonly internalCommands: InternalCommands

  private baseUrl?: string

  constructor(dvcRoot: string, internalCommands: InternalCommands) {
    super()
    this.dvcRoot = dvcRoot
    this.internalCommands = internalCommands
  }

  public isConnected() {
    return !!this.baseUrl
  }

  public async setBaseUrl(studioToken: string | undefined) {
    if (!studioToken) {
      this.baseUrl = undefined
      return
    }

    const gitRemote = await this.internalCommands.executeCommand(
      AvailableCommands.GIT_GET_REMOTE_URL,
      this.dvcRoot
    )

    this.baseUrl = await this.getBaseUrl(studioToken, gitRemote)
  }

  public getLink(sha: string) {
    if (!this.baseUrl) {
      return ''
    }
    return `${this.baseUrl}?showOnlySelected=1&experimentReferences=${sha}&activeExperimentReferences=${sha}%3Aprimary`
  }

  private async getBaseUrl(studioToken: string, gitRemoteUrl: string) {
    try {
      const response = await fetch(`${STUDIO_URL}/webhook/dvc`, {
        body: JSON.stringify({
          client: 'vscode',
          refs: ['ref'], // to be removed after https://github.com/iterative/studio/pull/7196 is shipped (before merge)
          repo_url: gitRemoteUrl
        }),
        headers: {
          Authorization: `token ${studioToken}`,
          'Content-Type': 'application/json'
        },
        method: 'POST'
      })

      const { url } = (await response.json()) as { url: string }
      return url
    } catch {}
  }
}
