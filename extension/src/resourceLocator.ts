import { Disposable } from '@hediet/std/disposable'
import { Uri } from 'vscode'

type Resource = { dark: Uri; light: Uri }

export class ResourceLocator {
  public dispose = Disposable.fn()

  public readonly dvcIcon: Resource
  public readonly checkedCheckbox: Resource
  public readonly emptyCheckbox: Resource
  public readonly indeterminateCheckbox: Resource

  private extensionUri: Uri

  constructor(extensionUri: Uri) {
    this.extensionUri = extensionUri

    this.dvcIcon = this.getResourceLocations('dvc-color.svg')
    this.checkedCheckbox = this.getResourceLocations('checkbox-checked.svg')
    this.emptyCheckbox = this.getResourceLocations('checkbox-empty.svg')
    this.indeterminateCheckbox = this.getResourceLocations(
      'checkbox-indeterminate.svg'
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
