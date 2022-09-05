import {
  EventEmitter,
  FileDecoration,
  FileDecorationProvider,
  Uri,
  window
} from 'vscode'
import { DecoratableLabelScheme, getDecoratableUri } from '../../tree'
import { ErrorDecorationProvider } from '../../tree/errorDecorationProvider'

export class DecorationProvider
  extends ErrorDecorationProvider
  implements FileDecorationProvider
{
  private errors = new Set<string>()

  constructor(decorationsChanged?: EventEmitter<Uri[]>) {
    super(DecoratableLabelScheme.TRACKED, decorationsChanged)

    this.dispose.track(window.registerFileDecorationProvider(this))
  }

  public provideFileDecoration(uri: Uri): FileDecoration | undefined {
    if (this.errors.has(uri.fsPath)) {
      return DecorationProvider.DecorationError
    }
  }

  public setState(errors: Set<string>) {
    const urisToUpdate: Uri[] = []

    for (const label of errors) {
      urisToUpdate.push(getDecoratableUri(label, this.scheme))
    }
    this.errors = errors
    this.decorationsChanged.fire(urisToUpdate)
  }
}
