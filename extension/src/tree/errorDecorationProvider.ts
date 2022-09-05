import { Event, EventEmitter, FileDecoration, ThemeColor, Uri } from 'vscode'
import { DecoratableLabelScheme } from '.'
import { Disposable } from '../class/dispose'

export abstract class ErrorDecorationProvider extends Disposable {
  protected static DecorationError: FileDecoration = {
    color: new ThemeColor('errorForeground')
  }

  public readonly onDidChangeFileDecorations: Event<Uri[]>
  protected readonly scheme: DecoratableLabelScheme
  protected readonly decorationsChanged: EventEmitter<Uri[]>

  constructor(
    scheme: DecoratableLabelScheme,
    decorationsChanged?: EventEmitter<Uri[]>
  ) {
    super()

    this.scheme = scheme

    this.decorationsChanged = this.dispose.track(
      decorationsChanged || new EventEmitter()
    )
    this.onDidChangeFileDecorations = this.decorationsChanged.event
  }

  abstract setState(...args: unknown[]): void
}
