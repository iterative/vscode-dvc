import { resolve } from 'path'
import { SinonSpy, SinonStub, useFakeTimers } from 'sinon'
import {
  commands,
  ConfigurationChangeEvent,
  TextEditor,
  Uri,
  window,
  workspace
} from 'vscode'
import { Experiments } from '../../experiments'
import { Disposable, Disposer } from '../../extension'
import { definedAndNonEmpty } from '../../util/array'

export const dvcDemoPath = Uri.file(
  resolve(__dirname, '..', '..', '..', '..', 'demo')
).fsPath

export const extensionUri = Uri.file(resolve(__dirname, '..', '..', '..'))

export const configurationChangeEvent = (
  option: string,
  disposable: Disposer
) =>
  new Promise(resolve => {
    const listener: Disposable = workspace.onDidChangeConfiguration(
      (event: ConfigurationChangeEvent) => {
        if (event.affectsConfiguration(option)) {
          resolve(event)
        }
      }
    )
    disposable.track(listener)
  })

export const quickPickInitialized = (
  mockShowQuickPick: SinonStub,
  call: number
) =>
  new Promise(resolve => {
    mockShowQuickPick.onCall(call).callsFake((items, options) =>
      mockShowQuickPick.wrappedMethod(items, {
        ...options,
        onDidSelectItem: (item: unknown) => {
          resolve(item)
          options?.onDidSelectItem
        }
      })
    )
  })

export const selectQuickPickItem = async (number: number) => {
  for (let i = 1; i < number; i++) {
    await commands.executeCommand('workbench.action.quickOpenSelectNext')
  }
  return commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem')
}

export const experimentsUpdatedEvent = (experiments: Experiments) =>
  new Promise(resolve => {
    experiments.dispose.track(experiments.onDidChangeExperiments(resolve))
  })

export const getFirstArgOfCall = (spy: SinonSpy, call: number) =>
  spy.getCall(call).args[0]

export const activeTextEditorChangedEvent = (
  disposable: Disposer
): Promise<TextEditor | undefined> =>
  new Promise(resolve =>
    disposable.track(
      window.onDidChangeActiveTextEditor(editor => resolve(editor))
    )
  )

export const getActiveTextEditorFilename = (): string | undefined =>
  window.activeTextEditor?.document.fileName

export const closeAllEditors = async () => {
  if (definedAndNonEmpty(window.visibleTextEditors)) {
    await commands.executeCommand('workbench.action.closeAllEditors')
  }
}

class FakeTimersDisposable {
  clock = useFakeTimers({
    now: new Date(),
    toFake: ['setTimeout', 'Date']
  })

  public advance(ms: number) {
    this.clock.tick(ms)
    this.clock.runAll()
  }

  public dispose() {
    this.clock.runAll()
    this.clock.restore()
  }
}

export const mockTime = (disposer: Disposer): FakeTimersDisposable =>
  disposer.track(new FakeTimersDisposable())

export type FakeTimers = InstanceType<typeof FakeTimersDisposable>
