import { Uri } from 'vscode'
import { Disposable } from './class/dispose'

export type Resource = { dark: Uri; light: Uri }

export enum IconName {
  CIRCLE_FILLED = 'circle-filled',
  CIRCLE_OUTLINE = 'circle-outline',
  LOADING_SPIN = 'loading-spin'
}

export class ResourceLocator extends Disposable {
  public readonly dvcIcon: Resource
  public readonly beaker: Resource
  public readonly checkedCheckbox: Resource
  public readonly emptyCheckbox: Resource
  public readonly indeterminateCheckbox: Resource
  public readonly scatterGraph: Resource
  public readonly clock: Resource

  private readonly extensionUri: Uri

  constructor(extensionUri: Uri) {
    super()

    this.extensionUri = extensionUri

    this.dvcIcon = this.getResourceLocations('dvc-color.svg')
    this.beaker = this.getResourceLocations('beaker.svg')
    this.scatterGraph = this.getResourceLocations('scatter-graph.svg')
    this.checkedCheckbox = this.getResourceLocations('checkbox-checked.svg')
    this.emptyCheckbox = this.getResourceLocations('checkbox-empty.svg')
    this.indeterminateCheckbox = this.getResourceLocations(
      'checkbox-indeterminate.svg'
    )
    this.clock = this.getResourceLocations('clock.svg')
  }

  public getExperimentsResource(name: IconName, color: string): Uri {
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
