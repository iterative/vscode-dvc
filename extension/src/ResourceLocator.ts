import { URI, Utils } from 'vscode-uri'

export class ResourceLocator {
  public dvcIconPath: { dark: URI; light: URI }

  constructor(extensionUri: URI) {
    this.dvcIconPath = {
      // placeholders for different svgs
      dark: Utils.joinPath(extensionUri, 'media', 'dvc-color.svg'),
      light: Utils.joinPath(extensionUri, 'media', 'dvc-color.svg')
    }
  }
}
