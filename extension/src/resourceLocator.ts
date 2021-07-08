import { Disposable } from '@hediet/std/disposable'
import { Uri } from 'vscode'

type Resource = { dark: Uri; light: Uri }

export class ResourceLocator {
  public dispose = Disposable.fn()

  public readonly dvcIcon: Resource
  public readonly selectedCheckbox: Resource
  public readonly unselectedCheckbox: Resource
  public readonly partialSelectedCheckbox: Resource

  private extensionUri: Uri

  constructor(extensionUri: Uri) {
    this.extensionUri = extensionUri

    this.dvcIcon = this.getResourceLocations('dvc-color.svg')
    this.selectedCheckbox = this.getResourceLocations('selected-checkbox.svg')
    this.unselectedCheckbox = this.getResourceLocations(
      'unselected-checkbox.svg'
    )
    this.partialSelectedCheckbox = this.getResourceLocations(
      'partial-selected-checkbox.svg'
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
