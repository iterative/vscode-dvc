import { Disposable } from '@hediet/std/disposable'
import { Uri } from 'vscode'

export class ResourceLocator {
  public dispose = Disposable.fn()

  public readonly dvcIconPath: { dark: Uri; light: Uri }
  public readonly selectedCheckbox: { dark: Uri; light: Uri }
  public readonly unselectedCheckbox: { dark: Uri; light: Uri }

  private extensionUri: Uri

  constructor(extensionUri: Uri) {
    this.extensionUri = extensionUri

    this.dvcIconPath = this.getIconDetails('dvc-color.svg')
    this.selectedCheckbox = this.getIconDetails('selected-checkbox.svg')
    this.unselectedCheckbox = this.getIconDetails('unselected-checkbox.svg')
  }

  private getIconDetails(...path: string[]): { dark: Uri; light: Uri } {
    return {
      dark: this.getDarkResourceLocation(...path),
      light: this.getLightResourceLocation(...path)
    }
  }

  private getDarkResourceLocation(...path: string[]): Uri {
    return this.getResourceLocation('dark', ...path)
  }

  private getLightResourceLocation(...path: string[]): Uri {
    return this.getResourceLocation('light', ...path)
  }

  private getResourceLocation(...path: string[]): Uri {
    return Uri.joinPath(this.extensionUri, 'resources', ...path)
  }
}
