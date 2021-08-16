import { resolve } from 'path'
import { SinonSpy, SinonStub } from 'sinon'
import { commands, ConfigurationChangeEvent, Memento, workspace } from 'vscode'
import { ExperimentsRepository } from '../../experiments/repository'
import { Disposable, Disposer } from '../../extension'

export const dvcDemoPath = resolve(__dirname, '..', '..', '..', '..', 'demo')
export const resourcePath = resolve(__dirname, '..', '..', '..', 'resources')

export const buildMockMemento = (values: Record<string, unknown> = {}) =>
  ({
    get: (key: string, defaultValue: unknown) => values[key] || defaultValue,
    keys: () => [],
    update: (key: string, value: unknown) =>
      new Promise(() => {
        values[key] = value
      })
  } as unknown as Memento)

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

export const experimentsUpdatedEvent = (
  experimentsRepository: ExperimentsRepository
) =>
  new Promise(resolve => {
    experimentsRepository.onDidChangeExperiments(resolve)
  })

export const getFirstArgOfCall = (spy: SinonSpy, call: number) =>
  spy.getCall(call).args[0]
