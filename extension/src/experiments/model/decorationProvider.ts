import {
  EventEmitter,
  FileDecoration,
  FileDecorationProvider,
  ThemeColor,
  Uri,
  window
} from 'vscode'
import { DecoratableLabelScheme, getDecoratableUri } from '../../tree'
import { ErrorDecorationProvider } from '../../tree/errorDecorationProvider'

export class DecorationProvider
  extends ErrorDecorationProvider
  implements FileDecorationProvider
{
  private static DecorationFiltered: FileDecoration = {
    color: new ThemeColor('gitDecoration.ignoredResourceForeground'),
    tooltip: 'Filtered'
  }

  private errors = new Set<string>()
  private filtered = new Set<string>()

  constructor(decorationsChanged?: EventEmitter<Uri[]>) {
    super(DecoratableLabelScheme.EXPERIMENTS, decorationsChanged)

    this.dispose.track(window.registerFileDecorationProvider(this))
  }

  public provideFileDecoration(uri: Uri): FileDecoration | undefined {
    if (this.errors.has(uri.fsPath)) {
      return DecorationProvider.DecorationError
    }
    if (this.filtered.has(uri.fsPath)) {
      return DecorationProvider.DecorationFiltered
    }
  }

  public setState(
    labels: string[],
    filtered: Set<string>,
    errors: Set<string>
  ) {
    const urisToUpdate: Uri[] = []

    for (const label of labels) {
      urisToUpdate.push(
        getDecoratableUri(label, DecoratableLabelScheme.EXPERIMENTS)
      )
    }

    this.filtered = filtered
    this.errors = errors
    this.decorationsChanged.fire(urisToUpdate)
  }
}
