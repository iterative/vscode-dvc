import { Disposable } from '@hediet/std/disposable'
import { Uri } from 'vscode'

export class ResourceLocator {
  public dispose = Disposable.fn()

  public dvcIconPath: { dark: Uri; light: Uri }
  public selectedCheckbox: { dark: Uri; light: Uri }
  public unselectedCheckbox: { dark: Uri; light: Uri }

  constructor(extensionUri: Uri) {
    this.dvcIconPath = {
      // placeholders for different svgs
      dark: Uri.joinPath(extensionUri, 'resources', 'dvc-color.svg'),
      light: Uri.joinPath(extensionUri, 'resources', 'dvc-color.svg')
    }

    this.selectedCheckbox = {
      dark: Uri.joinPath(
        extensionUri,
        'resources',
        'dark',
        'selected-checkbox.svg'
      ),
      light: Uri.joinPath(
        extensionUri,
        'resources',
        'light',
        'selected-checkbox.svg'
      )
    }

    this.unselectedCheckbox = {
      dark: Uri.joinPath(
        extensionUri,
        'resources',
        'dark',
        'unselected-checkbox.svg'
      ),
      light: Uri.joinPath(
        extensionUri,
        'resources',
        'light',
        'unselected-checkbox.svg'
      )
    }
  }
}
