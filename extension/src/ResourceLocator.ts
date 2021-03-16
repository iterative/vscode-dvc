import { resolve } from 'path'
import { Uri } from 'vscode'

export class ResourceLocator {
  public dvcIconPath: { dark: Uri; light: Uri }

  constructor(extensionPath: string) {
    this.dvcIconPath = {
      // placeholders for different svgs
      dark: Uri.file(resolve(extensionPath, 'media', 'dvc-color.svg')),
      light: Uri.file(resolve(extensionPath, 'media', 'dvc-color.svg'))
    }
  }
}
