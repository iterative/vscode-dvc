import { Disposable } from '@hediet/std/disposable'
import { Uri } from 'vscode'

export class ResourceLocator {
  public dispose = Disposable.fn()

  public readonly dvcIcon: { dark: Uri; light: Uri }
  public readonly selectedCheckbox: { dark: Uri; light: Uri }
  public readonly unselectedCheckbox: { dark: Uri; light: Uri }

  private extensionUri: Uri

  constructor(extensionUri: Uri) {
    this.extensionUri = extensionUri

    this.dvcIcon = this.getResourceLocations('dvc-color.svg')
    this.selectedCheckbox = this.getResourceLocations('selected-checkbox.svg')
    this.unselectedCheckbox = this.getResourceLocations(
      'unselected-checkbox.svg'
    )
  }

  private getResourceLocations(...path: string[]): { dark: Uri; light: Uri } {
    return {
      dark: this.getResourceLocation('dark', ...path),
      light: this.getResourceLocation('light', ...path)
    }
  }

  private getResourceLocation(...path: string[]): Uri {
    return Uri.joinPath(this.extensionUri, 'resources', ...path)
  }
}
