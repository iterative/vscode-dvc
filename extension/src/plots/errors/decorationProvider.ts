import { EventEmitter, FileDecoration, Uri } from 'vscode'
import { DecoratableTreeItemScheme, getDecoratableUri } from '../../tree'
import { ErrorDecorationProvider } from '../../tree/errorDecorationProvider'
import { uniqueValues } from '../../util/array'

export class DecorationProvider extends ErrorDecorationProvider {
  private errors = new Set<string>()

  constructor(decorationsChanged?: EventEmitter<Uri[]>) {
    super(DecoratableTreeItemScheme.PLOTS, decorationsChanged)
  }

  public provideFileDecoration(uri: Uri): FileDecoration | undefined {
    if (this.errors.has(uri.fsPath)) {
      return DecorationProvider.DecorationError
    }
  }

  public setState(errors: Set<string> = new Set()) {
    const urisToUpdate: Uri[] = []

    for (const label of uniqueValues([...errors, ...this.errors])) {
      urisToUpdate.push(getDecoratableUri(label, this.scheme))
    }
    this.errors = errors
    this.decorationsChanged.fire(urisToUpdate)
  }
}
