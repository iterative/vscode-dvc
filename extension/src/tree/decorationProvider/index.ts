import {
  CancellationToken,
  Event,
  EventEmitter,
  FileDecoration,
  FileDecorationProvider,
  ProviderResult,
  ThemeColor,
  Uri,
  window
} from 'vscode'
import { DecoratableTreeItemScheme } from '..'
import { Disposable } from '../../class/dispose'

export abstract class BaseDecorationProvider
  extends Disposable
  implements FileDecorationProvider
{
  protected static DecorationError: FileDecoration = {
    badge: '!',
    color: new ThemeColor('errorForeground')
  }

  public readonly onDidChangeFileDecorations: Event<Uri[]>
  protected readonly scheme: DecoratableTreeItemScheme
  protected readonly decorationsChanged: EventEmitter<Uri[]>

  constructor(
    scheme: DecoratableTreeItemScheme,
    decorationsChanged?: EventEmitter<Uri[]>
  ) {
    super()

    this.scheme = scheme

    this.decorationsChanged = this.dispose.track(
      decorationsChanged || new EventEmitter()
    )
    this.onDidChangeFileDecorations = this.decorationsChanged.event

    this.dispose.track(window.registerFileDecorationProvider(this))
  }

  abstract setState(...args: unknown[]): void

  abstract provideFileDecoration(
    uri: Uri,
    token: CancellationToken
  ): ProviderResult<FileDecoration>
}
