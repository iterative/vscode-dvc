import { resolve } from 'path'
import { SinonSpy, SinonStub } from 'sinon'
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

export const dvcDemoPath = Uri.file(
  resolve(__dirname, '..', '..', '..', '..', 'demo')
).fsPath
export const resourcePath = Uri.file(
  resolve(__dirname, '..', '..', '..', 'resources')
).fsPath

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

export const experimentsUpdatedEvent = (experimentsRepository: Experiments) =>
  new Promise(resolve => {
    experimentsRepository.dispose.track(
      experimentsRepository.onDidChangeExperiments(resolve)
    )
  })

export const getFirstArgOfCall = (spy: SinonSpy, call: number) =>
  spy.getCall(call).args[0]

export const activeTextEditorChangedEvent = (): Promise<
  TextEditor | undefined
> =>
  new Promise(resolve =>
    window.onDidChangeActiveTextEditor(editor => resolve(editor))
  )

export const getActiveTextEditorFilename = (): string | undefined =>
  window.activeTextEditor?.document.fileName
