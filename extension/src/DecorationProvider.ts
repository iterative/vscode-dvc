import { Disposable } from '@hediet/std/disposable'
import {
  window,
  Event,
  EventEmitter,
  FileDecorationProvider,
  FileDecoration,
  Uri
} from 'vscode'

export interface DecorationState {
  deleted: Set<string>
  modified: Set<string>
  new: Set<string>
  notInCache: Set<string>
  tracked: Set<string>
}
export class DecorationProvider implements FileDecorationProvider {
  private static DecorationTracked: FileDecoration = {
    tooltip: 'DVC tracked'
  }

  public readonly dispose = Disposable.fn()

  private state: DecorationState

  readonly onDidChangeFileDecorations: Event<Uri[]>
  private readonly onDidChangeDecorations: EventEmitter<Uri[]>

  public setState = (state: DecorationState) => {
    this.state = state
    this.onDidChangeDecorations.fire(
      [
        ...this.state.deleted,
        ...this.state.modified,
        ...this.state.new,
        ...this.state.notInCache,
        ...this.state.tracked
      ].map(value => Uri.file(value))
    )
  }

  constructor() {
    this.onDidChangeDecorations = new EventEmitter<Uri[]>()
    this.onDidChangeFileDecorations = this.onDidChangeDecorations.event

    this.state = {} as DecorationState

    this.dispose.track(window.registerFileDecorationProvider(this))
  }

  async provideFileDecoration(uri: Uri): Promise<FileDecoration | undefined> {
    if (this.state?.deleted?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
    if (this.state?.modified?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
    if (this.state?.new?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
    if (this.state?.notInCache?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
    if (this.state?.tracked?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
  }
}
