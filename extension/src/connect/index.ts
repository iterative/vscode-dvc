import { Resource } from '../resourceLocator'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'

export class Connect extends BaseRepository<undefined> {
  public readonly viewKey = ViewKey.CONNECT

  constructor(webviewIcon: Resource) {
    super('', webviewIcon)
  }

  public sendInitialWebviewData(): void {}
}
