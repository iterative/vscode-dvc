import { Uri } from 'vscode'

export class ResourceLocator {
  public dvcIconPath: { dark: Uri; light: Uri }

  constructor(extensionUri: Uri) {
    this.dvcIconPath = {
      // placeholders for different svgs
      dark: Uri.joinPath(extensionUri, 'resources', 'dvc-color.svg'),
      light: Uri.joinPath(extensionUri, 'resources', 'dvc-color.svg')
    }
  }
}
