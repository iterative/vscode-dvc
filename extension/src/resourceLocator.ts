import { Disposable } from '@hediet/std/disposable'
import { Uri } from 'vscode'

export type Resource = { dark: Uri; light: Uri }

export class ResourceLocator {
  public dispose = Disposable.fn()

  public readonly dvcIcon: Resource
  public readonly beaker: Resource
  public readonly checkedCheckbox: Resource
  public readonly emptyCheckbox: Resource
  public readonly indeterminateCheckbox: Resource
  public readonly scatterGraph: Resource

  private extensionUri: Uri

  constructor(extensionUri: Uri) {
    this.extensionUri = extensionUri

    this.dvcIcon = this.getResourceLocations('dvc-color.svg')
    this.beaker = this.getResourceLocations('beaker.svg')
    this.scatterGraph = this.getResourceLocations('scatter-graph.svg')
    this.checkedCheckbox = this.getResourceLocations('checkbox-checked.svg')
    this.emptyCheckbox = this.getResourceLocations('checkbox-empty.svg')
    this.indeterminateCheckbox = this.getResourceLocations(
      'checkbox-indeterminate.svg'
    )
  }

  public getExperimentsResource(
    name:
      | 'circle-filled'
      | 'circle-outline'
      | 'debug-stackframe-dot'
      | 'loading-spin',
    color: string
  ): Uri {
    return Uri.joinPath(
      this.extensionUri,
      'resources',
      'experiments',
      `${name}-${color}.svg`
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
