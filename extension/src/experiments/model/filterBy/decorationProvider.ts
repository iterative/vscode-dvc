import {
  Event,
  EventEmitter,
  FileDecoration,
  FileDecorationProvider,
  ThemeColor,
  Uri,
  window
} from 'vscode'
import { Disposable } from '../../../class/dispose'

export const getDecoratableUri = (label: string): Uri =>
  Uri.from({ path: label, scheme: 'dvc.experiments' })

export class DecorationProvider
  extends Disposable
  implements FileDecorationProvider
{
  private static DecorationFiltered: FileDecoration = {
    color: new ThemeColor('gitDecoration.ignoredResourceForeground'),
    tooltip: 'Filtered'
  }

  public readonly onDidChangeFileDecorations: Event<Uri[]>
  private readonly decorationsChanged: EventEmitter<Uri[]>

  private filtered = new Set<string>()

  constructor(decorationsChanged?: EventEmitter<Uri[]>) {
    super()

    this.decorationsChanged = this.dispose.track(
      decorationsChanged || new EventEmitter()
    )
    this.onDidChangeFileDecorations = this.decorationsChanged.event

    this.dispose.track(window.registerFileDecorationProvider(this))
  }

  public provideFileDecoration(uri: Uri): FileDecoration | undefined {
    if (this.filtered.has(uri.fsPath)) {
      return DecorationProvider.DecorationFiltered
    }
  }

  public setState(labels: string[], filtered: Set<string>) {
    const urisToUpdate: Uri[] = []

    for (const label of labels) {
      urisToUpdate.push(getDecoratableUri(label))
    }

    this.filtered = filtered
    this.decorationsChanged.fire(urisToUpdate)
  }
}
